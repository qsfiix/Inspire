// translate-missing: fills empty _en/_fr/_it translation columns from the
// German (_de) source via DeepL, for Inspirella's catalog tables.
//
// - Only German is written by hand; this function keeps EN/FR/IT in sync.
// - A machine translation is recorded in the row's `translation_meta`
//   ({"<field>_<lang>": {"by": "deepl", "src": <sha-256 of the German>, "at": ISO}}),
//   so it is refreshed when the German source changes, and a translation a
//   human wrote (no meta entry) is never overwritten - unless it is just a
//   verbatim copy of the German, which older imports left in some columns.
// - Idempotent: once everything is translated a run does nothing, so being
//   triggered more often than needed never spends extra DeepL quota.
// - `maxChars` (default 15000, capped) bounds how much one run translates,
//   so a nightly run stays inside DeepL Free's 500k characters/month.
//
// Secrets: DEEPL_API_KEY (keys ending in ":fx" use the DeepL Free endpoint).
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are provided by Supabase.
// Query params: langs=<en,fr,it,uk>, maxChars=<n>, dryRun=1 (count what's missing, translate nothing),
// maxTier=<1-4> (stop after this priority tier; default all).

import { createClient } from "npm:@supabase/supabase-js@2";

// All languages with a translated column. Which of them one run fills is chosen by ?langs=en,fr,it,uk
// (default en,fr,it: the nightly cron). Ukrainian is started by hand so it does not eat the nightly quota.
const LANGS = ["en", "fr", "it", "uk"] as const;
type Lang = (typeof LANGS)[number];

// What to translate, in priority order. Each chain mirrors a
// pickLocalizedText(...) call in src/data/Repository.ts: the site shows the
// FIRST field in the chain that has text in any language, so only that
// "winning" field is translated - the hidden fallbacks behind it would just
// burn DeepL quota. Tiers run in order, so the quota goes to what visitors see
// first:
//   1 = names/titles and the short line on cards and map pins
//   2 = the main description of an item
//   3 = detail-panel sections (profession + institution deep dives)
//   4 = stored but not displayed anywhere yet
// Institution titles are deliberately absent: they are proper names, and the
// site prefers the English column, so a translation would rename
// "Universität Zürich" to "University of Zurich" in every language.
type Chain = { tier: number; fields: string[] };
const PLAN: Record<string, Chain[]> = {
  professions: [
    { tier: 1, fields: ["title", "name"] },
    { tier: 2, fields: ["summary", "description"] },
    { tier: 3, fields: ["education_notes"] },
    { tier: 3, fields: ["target_group"] },
    { tier: 3, fields: ["daily_work_context"] },
    { tier: 3, fields: ["typical_workplace"] },
    { tier: 3, fields: ["admission_reality"] },
    { tier: 3, fields: ["progression_notes"] },
    ...["core_tools", "long_description", "mission", "recognition_notes", "role_summary", "salary_notes",
        "short_description", "swiss_context_notes"].map(f => ({ tier: 4, fields: [f] }))
  ],
  learning_paths: [
    { tier: 1, fields: ["outcome_title", "title", "name"] },
    { tier: 2, fields: ["summary", "description", "short_description", "long_description"] }
  ],
  learning_path_steps: [
    { tier: 1, fields: ["title"] },
    { tier: 1, fields: ["recommended_timeline"] },
    { tier: 2, fields: ["summary", "description", "long_description", "details"] }
  ],
  resources: [
    { tier: 1, fields: ["title", "name"] },
    { tier: 1, fields: ["summary", "description"] },
    ...["short_description", "long_description", "ideal_for", "practical_use", "usage_context", "language_notes",
        "quality_notes", "swiss_relevance", "trust_notes"].map(f => ({ tier: 4, fields: [f] }))
  ],
  institutions: [
    { tier: 1, fields: ["summary", "description", "overview"] },
    { tier: 2, fields: ["admissions_summary"] },
    { tier: 3, fields: ["institution_profile"] },
    { tier: 3, fields: ["language_environment"] },
    { tier: 3, fields: ["student_life"] },
    { tier: 3, fields: ["housing_notes"] },
    { tier: 3, fields: ["application_notes"] },
    { tier: 4, fields: ["short_description"] }
  ]
};
const MAX_TIER = 4;

const DEEPL_TARGET: Record<Lang, string> = { en: "EN-GB", fr: "FR", it: "IT", uk: "UK" };
// Match the site's voice: French formal ("vous"), Italian informal ("tu").
const FORMALITY: Partial<Record<Lang, string>> = { fr: "prefer_more", it: "prefer_less" };
const BATCH_TEXTS = 40;
const BATCH_CHARS = 25000;
const PAGE = 200;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

type Job = { row: Record<string, any>; field: string; text: string; src: string };

Deno.serve(async req => {
  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const budget = Math.max(0, Math.min(Number(url.searchParams.get("maxChars") ?? 15000) || 15000, 450000));
  const maxTier = Math.max(1, Math.min(Number(url.searchParams.get("maxTier") ?? MAX_TIER) || MAX_TIER, MAX_TIER));
  const wanted = (url.searchParams.get("langs") ?? "en,fr,it").split(",").map(s => s.trim());
  const targetLangs = LANGS.filter(l => wanted.includes(l));
  if (targetLangs.length === 0) return json({ ok: false, error: "langs must contain en, fr, it or uk" }, 400);

  const deeplKey = Deno.env.get("DEEPL_API_KEY");
  if (!deeplKey && !dryRun) {
    return json({ ok: false, error: "DEEPL_API_KEY secret is not set in Supabase (Edge Functions > Secrets)." }, 503);
  }
  const endpoint = deeplKey?.endsWith(":fx") ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate";
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  let used = 0;
  let pending = 0;
  let pendingChars = 0;
  const pendingByTier: Record<number, number> = {};
  let translated = 0;
  const errors: string[] = [];

  const translateBatch = async (texts: string[], lang: Lang): Promise<string[]> => {
    const form = new URLSearchParams();
    for (const t of texts) form.append("text", t);
    form.set("source_lang", "DE");
    form.set("target_lang", DEEPL_TARGET[lang]);
    form.set("preserve_formatting", "1");
    if (FORMALITY[lang]) form.set("formality", FORMALITY[lang]!);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `DeepL-Auth-Key ${deeplKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form
    });
    if (res.status === 456) throw new Error("DeepL quota exceeded for this month");
    if (!res.ok) throw new Error(`DeepL ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const body = await res.json();
    return (body.translations ?? []).map((t: { text: string }) => t.text);
  };

  outer: for (let tier = 1; tier <= maxTier; tier++) {
    for (const [table, allChains] of Object.entries(PLAN)) {
      const chains = allChains.filter(c => c.tier === tier);
      if (chains.length === 0) continue;
      const fields = [...new Set(chains.flatMap(c => c.fields))];
      const cols = ["id", "translation_meta", ...fields.flatMap(f => [`${f}_de`, ...LANGS.map(l => `${f}_${l}`)])];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await db.from(table).select(cols.join(",")).order("id").range(from, from + PAGE - 1);
        if (error) {
          errors.push(`${table}: ${error.message}`);
          break;
        }
        if (!data || data.length === 0) break;

        const patches = new Map<string, Record<string, any>>();
        // Set when the budget or an error ends the run: we still save what this
        // page already translated before stopping.
        let stop = false;
        const filled = (v: unknown) => typeof v === "string" && v.trim() !== "";
        for (const lang of targetLangs) {
          const jobs: Job[] = [];
          for (const row of data as Record<string, any>[]) {
            const meta = row.translation_meta ?? {};
            for (const chain of chains) {
              // The field the site displays: first one with text in any language.
              const f = chain.fields.find(c => filled(row[`${c}_de`]) || LANGS.some(l => filled(row[`${c}_${l}`])));
              if (!f) continue;
              const de = filled(row[`${f}_de`]) ? row[`${f}_de`].trim() : "";
              if (!de) continue;
              const current = row[`${f}_${lang}`];
              const entry = meta[`${f}_${lang}`];
              const src = await sha256(de);
              // Older imports copied the German text into the other language
              // columns; an exact copy of the German is not a translation.
              const isCopy = filled(current) && current.trim() === de;
              const hasHuman = filled(current) && !entry && !isCopy;
              const upToDate = filled(current) && entry && entry.src === src;
              if (hasHuman || upToDate) continue;
              jobs.push({ row, field: f, text: de, src });
              pendingChars += de.length;
              pendingByTier[tier] = (pendingByTier[tier] ?? 0) + de.length;
            }
          }
          pending += jobs.length;
          if (dryRun || jobs.length === 0) continue;

          // Batch by count and size, stop when this run's budget is spent.
          let i = 0;
          while (i < jobs.length) {
            const batch: Job[] = [];
            let size = 0;
            while (i < jobs.length && batch.length < BATCH_TEXTS && size + jobs[i].text.length <= BATCH_CHARS) {
              size += jobs[i].text.length;
              batch.push(jobs[i++]);
            }
            if (batch.length === 0) {
              // A single text larger than one batch: send it alone.
              const big = jobs[i++];
              batch.push(big);
              size = big.text.length;
            }
            if (used + size > budget) {
              stop = true;
              break;
            }
            let out: string[];
            try {
              out = await translateBatch(batch.map(b => b.text), lang);
            } catch (e) {
              errors.push(`${table}/${lang}: ${(e as Error).message}`);
              stop = true;
              break;
            }
            used += size;
            const at = new Date().toISOString();
            batch.forEach((job, k) => {
              const text = out[k];
              if (!text) return;
              const patch = patches.get(job.row.id) ?? { translation_meta: { ...(job.row.translation_meta ?? {}) } };
              patch[`${job.field}_${lang}`] = text;
              patch.translation_meta[`${job.field}_${lang}`] = { by: "deepl", src: job.src, at };
              job.row.translation_meta = patch.translation_meta;
              patches.set(job.row.id, patch);
              translated++;
            });
          }
          if (stop) break;
        }

        for (const [id, patch] of patches) {
          const { error: upErr } = await db.from(table).update(patch).eq("id", id);
          if (upErr) errors.push(`${table}#${id}: ${upErr.message}`);
        }
        if (stop) break outer;
        if (data.length < PAGE) break;
      }
    }
  }

  // Anything left untranslated is simply picked up by the next run.
  return json({
    ok: errors.length === 0, dryRun, langs: targetLangs, budget, maxTier, charsUsed: used, translated,
    pendingSeen: pending, pendingChars, pendingCharsByTier: pendingByTier, errors
  });
});
