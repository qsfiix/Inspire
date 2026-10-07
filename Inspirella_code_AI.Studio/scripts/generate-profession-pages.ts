/**
 * Pre-renders one static HTML page per active profession (/beruf/<slug>/) plus
 * a full sitemap.xml, straight into dist/ after `vite build`.
 *
 * Why static files: Inspirella is a single-page app whose content lives in
 * Supabase, so crawlers (search engines, AI assistants) that do not run
 * JavaScript saw an empty shell. Pre-rendered pages give every profession its
 * own address with the text already in the HTML - and because they are plain
 * files, a bot request costs no database query and no server code.
 *
 * Only the public anon key is used (same read access the browser app has).
 * A failure here must never break a deploy: it logs and exits 0, and the app
 * itself keeps working without the pages.
 */
import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const SITE = (process.env.SITE_URL || "https://inspirella.ch").replace(/\/+$/, "");
const DIST = path.join(process.cwd(), "dist");
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const MAX_SCHOOLS_SHOWN = 12;

type Row = Record<string, any>;

const TYPE_LABELS: Record<string, string> = {
  apprenticeship_efz: "Lehrberuf EFZ",
  apprenticeship_eba: "Lehrberuf EBA",
  fachausweis: "Eidg. Fachausweis",
  diplom: "Eidg. Diplom",
  hf_diploma: "Höhere Fachschule HF",
  fh_bachelor: "Fachhochschule (Bachelor)",
  university: "Universität / ETH"
};

const REGULATED_LABELS: Record<string, string> = {
  regulated: "Reglementierter Beruf",
  not_regulated: "Nicht reglementiert"
};

/** URL-safe form of a DB slug (umlauts transliterated; DB data stays untouched). */
function pageSlug(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss");
}

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Trimmed, non-empty text or undefined. */
function txt(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  return t || undefined;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

/** Only http(s) links reach the HTML; anything else (javascript:, data:) is dropped. */
function safeUrl(value: unknown): string | undefined {
  const t = txt(value);
  if (!t) return undefined;
  try {
    const u = new URL(t);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

async function fetchAll(build: (from: number, to: number) => PromiseLike<{ data: Row[] | null; error: any }>): Promise<Row[]> {
  const out: Row[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await build(from, from + page - 1);
    if (error) throw new Error(error.message || String(error));
    out.push(...(data ?? []));
    if (!data || data.length < page) break;
  }
  return out;
}

const CSS = `
:root{--bg:#030008;--fg:#e8e4f5;--muted:#a39bc2;--card:rgba(255,255,255,.05);--card-b:rgba(255,255,255,.10);--accent:#a78bfa;--grain:196,181,253}
body.light{--bg:#f5f3ff;--fg:#1e1b4b;--muted:#5b5280;--card:#fff;--card-b:#e9d5ff;--accent:#6d28d9;--grain:109,40,217}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font-family:Inter,system-ui,sans-serif;line-height:1.6;transition:background .4s,color .4s;overflow-x:hidden}
h1,h2{font-family:"Space Grotesk",sans-serif;margin:0;line-height:1.15}
a{color:inherit}
.ambient{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0}
.blob{position:absolute;border-radius:50%;filter:blur(110px);animation:drift 22s ease-in-out infinite}
.b1{width:28rem;height:28rem;top:-2rem;left:-2rem;background:radial-gradient(circle,rgba(139,92,246,.28),rgba(99,102,241,0) 70%)}
.b2{width:26rem;height:26rem;top:35%;right:-5rem;background:radial-gradient(circle,rgba(99,102,241,.25),rgba(79,70,229,0) 70%);animation-duration:26s;animation-direction:reverse}
.b3{width:24rem;height:24rem;bottom:-7rem;left:25%;background:radial-gradient(circle,rgba(192,132,252,.2),rgba(168,85,247,0) 70%);animation-duration:19s}
.b4{width:22rem;height:22rem;top:8%;left:42%;background:radial-gradient(circle,rgba(251,146,60,.14),rgba(139,92,246,.1) 45%,transparent 75%);animation-duration:14s}
body.light .blob{opacity:.75}
@keyframes drift{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(4%,-6%) scale(1.08)}}
canvas#sand{position:absolute;inset:0;width:100%;height:100%}
.grain{position:absolute;inset:0;opacity:.05;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.vignette{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 40%,rgba(6,4,10,.5) 100%)}
body.light .vignette{background:radial-gradient(ellipse at center,transparent 40%,rgba(245,243,255,.7) 100%)}
body.light .grain{mix-blend-mode:multiply;opacity:.025}
nav{position:relative;z-index:3;display:flex;align-items:center;justify-content:space-between;max-width:1080px;margin:0 auto;padding:18px 20px}
.logo{display:flex;align-items:center;gap:10px;font:700 20px "Space Grotesk",sans-serif;text-decoration:none}
.logo img{width:30px;height:30px;object-fit:contain}
.nav-r{display:flex;gap:12px;align-items:center;font-size:14px}
.nav-r a{color:var(--muted);text-decoration:none}.nav-r a:hover{color:var(--accent)}
.tgl{background:var(--card);border:1px solid var(--card-b);color:var(--fg);border-radius:10px;padding:6px 12px;cursor:pointer;font:500 13px Inter,sans-serif}
main{position:relative;z-index:2;max-width:1080px;margin:0 auto;padding:8px 20px 70px}
.crumbs{font-size:13px;color:var(--muted);margin:10px 0 28px}
.crumbs a{text-decoration:none}.crumbs a:hover{color:var(--accent)}
.hero{display:grid;gap:18px;margin-bottom:34px}
.badges{display:flex;gap:8px;flex-wrap:wrap}
.badge{font:600 12px Inter,sans-serif;letter-spacing:.04em;text-transform:uppercase;padding:5px 12px;border-radius:99px;border:1px solid var(--card-b);background:var(--card);color:var(--accent)}
.badge.warm{color:#fdba74;border-color:rgba(251,146,60,.35)}
body.light .badge.warm{color:#c2410c}
h1{font-size:clamp(30px,5vw,52px);font-weight:700;letter-spacing:-.01em}
.lead{font-size:clamp(17px,2vw,20px);color:var(--muted);max-width:62ch;margin:0}
.cta-row{display:flex;gap:12px;flex-wrap:wrap;margin-top:6px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:13px 22px;border-radius:14px;font:600 15px Inter,sans-serif;text-decoration:none;border:1px solid transparent;transition:transform .15s}
.btn:active{transform:scale(.96)}
.btn-primary{color:#fff;background:linear-gradient(90deg,#7c3aed,#4f46e5,#9333ea);box-shadow:0 8px 24px -8px rgba(124,58,237,.7);position:relative;overflow:hidden;isolation:isolate}
.btn-primary::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,.45) 50%,transparent 65%);transform:translateX(-120%);animation:shine 4.5s ease-in-out 1s 3}
.btn-primary:hover::after{animation:shine1 .9s ease-out}
@keyframes shine{0%,55%{transform:translateX(-120%)}85%,100%{transform:translateX(120%)}}
@keyframes shine1{from{transform:translateX(-120%)}to{transform:translateX(120%)}}
.facts{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-bottom:34px}
.fact{padding:16px 18px}
.fact small{display:block;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
.fact b{font:600 17px "Space Grotesk",sans-serif}
.card{border-radius:18px;border:1px solid var(--card-b);background-color:var(--card);backdrop-filter:blur(14px);transition:border-color .3s,box-shadow .3s;background-image:radial-gradient(420px circle at var(--sx,50%) var(--sy,50%),rgba(139,92,246,calc(.12*var(--so,0))),transparent 70%)}
.card:hover{--so:1;border-color:rgba(139,92,246,.4);box-shadow:0 0 28px -8px rgba(139,92,246,.35)}
body.light .card{box-shadow:0 4px 25px rgba(46,16,101,.06)}
.grid{display:grid;grid-template-columns:1.55fr 1fr;gap:22px}
@media(max-width:860px){.grid{grid-template-columns:1fr}}
section.card{padding:26px 28px}
section.card+section.card{margin-top:22px}
h2{font-size:22px;margin-bottom:14px;display:flex;align-items:center;gap:10px}
h2::before{content:"";flex:none;width:8px;height:8px;border-radius:50%;background:radial-gradient(circle,#fff,#a78bfa);box-shadow:0 0 12px #a78bfa}
.dl{display:grid;gap:16px;margin:0}
.dl dt{font:600 13px Inter,sans-serif;text-transform:uppercase;letter-spacing:.06em;color:var(--accent);margin-bottom:2px}
.dl dd{margin:0}
.schools{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.school{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:12px 14px;border-radius:12px;border:1px solid var(--card-b);background:rgba(139,92,246,.06)}
.school span{font-size:13px;color:var(--muted)}
.cant{font:600 12px "Space Grotesk",sans-serif;font-style:normal;padding:3px 9px;border-radius:99px;border:1px solid rgba(167,139,250,.4);color:var(--accent)}
.more{margin:12px 0 0;color:var(--muted);font-size:14px}
.source{margin-top:30px;padding:16px 20px;font-size:14px;color:var(--muted);border-radius:14px;border:1px dashed var(--card-b)}
.source a{color:var(--accent)}
.foot{position:relative;z-index:2;text-align:center;color:var(--muted);font-size:13px;padding:0 20px 40px}
.foot a{text-decoration:none}
@media(prefers-reduced-motion:reduce){.blob,.btn-primary::after{animation:none!important}}
`;

const SCRIPT = `
(function(){
  var b=document.body,t=null;
  try{t=localStorage.getItem("inspirella_theme")}catch(e){}
  if(t?t==="light":(window.matchMedia&&matchMedia("(prefers-color-scheme: light)").matches))b.classList.add("light");
  var g=document.getElementById("tgl");
  if(g)g.onclick=function(){b.classList.toggle("light");try{localStorage.setItem("inspirella_theme",b.classList.contains("light")?"light":"dark")}catch(e){}};
  document.addEventListener("pointermove",function(e){var c=e.target.closest&&e.target.closest(".card");if(!c)return;var r=c.getBoundingClientRect();c.style.setProperty("--sx",(e.clientX-r.left)+"px");c.style.setProperty("--sy",(e.clientY-r.top)+"px")});
  var cv=document.getElementById("sand");if(!cv||!cv.getContext)return;
  var ctx=cv.getContext("2d"),reduce=matchMedia("(prefers-reduced-motion: reduce)").matches,W,H,dpr=Math.min(devicePixelRatio||1,2),P=[];
  function size(){W=cv.clientWidth;H=cv.clientHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)}
  function mk(){return{x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.6+.3,vx:Math.random()*.25+.05,vy:-(Math.random()*.18+.03),a:Math.random()*.6+.2,t:Math.random()*6.28,w:Math.random()<.14}}
  size();var n=Math.round(Math.min(160,W*H/9000));for(var i=0;i<n;i++)P.push(mk());
  addEventListener("resize",size);
  function frame(){
    ctx.clearRect(0,0,W,H);
    var rgb=getComputedStyle(b).getPropertyValue("--grain");
    for(var i=0;i<P.length;i++){var p=P[i];
      if(!reduce){p.t+=.012;p.x+=p.vx+Math.sin(p.t)*.12;p.y+=p.vy}
      if(p.x>W+5)p.x=-5;if(p.y<-5){p.y=H+5;p.x=Math.random()*W}
      var tw=.65+.35*Math.sin(p.t*1.7);
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,6.283);
      ctx.fillStyle=p.w?"rgba(251,146,60,"+(p.a*tw*.8)+")":"rgba("+rgb+","+(p.a*tw*.75)+")";
      ctx.shadowBlur=p.r*5;ctx.shadowColor=p.w?"rgba(251,146,60,.8)":"rgba("+rgb+",.8)";
      ctx.fill()}
    if(!reduce)requestAnimationFrame(frame)
  }
  frame()
})();
`;

interface School {
  title: string;
  city?: string;
  canton?: string;
}

function renderPage(p: Row, schools: School[]): { html: string; indexable: boolean } {
  const slug = pageSlug(p.slug);
  const title = txt(p.title_de) || txt(p.name_de) || slug;
  const url = `${SITE}/beruf/${slug}/`;

  const short = txt(p.short_description_de) || txt(p.role_summary_de) || txt(p.summary_de);
  const longText = txt(p.long_description_de);
  const sections: [string, string | undefined][] = [
    ["Aufgaben", txt(p.role_summary_de) && txt(p.role_summary_de) !== short ? txt(p.role_summary_de) : longText],
    ["Alltag", txt(p.daily_work_context_de)],
    ["Arbeitsorte", txt(p.typical_workplace_de)],
    ["Werkzeuge", txt(p.core_tools_de)],
    ["Wer passt dazu?", txt(p.target_group_de)],
    ["Zugang", txt(p.admission_reality_de)],
    ["Bildungsweg", txt(p.education_notes_de)]
  ];
  const detail = sections.filter((s): s is [string, string] => !!s[1]);
  const progression = txt(p.progression_notes_de);
  const salary = txt(p.salary_notes_de);

  const totalText = [short, ...detail.map(d => d[1]), progression, salary].filter(Boolean).join(" ");
  // Pages with almost no text would look thin to Google: keep them out of the index.
  const indexable = totalText.length >= 120;

  const description = truncate(short || totalText || title, 155);
  const typeLabel = TYPE_LABELS[p.profession_type as string];
  const regLabel = REGULATED_LABELS[p.regulated_status as string];
  const guidance = safeUrl(p.official_guidance_url) || "https://www.berufsberatung.ch/";

  const facts: [string, string][] = [];
  if (typeLabel) facts.push(["Abschluss", typeLabel]);
  if (regLabel) facts.push(["Reglementierung", regLabel]);
  if (schools.length) facts.push(["Schulen in Inspirella", `${schools.length} ${schools.length === 1 ? "Schule" : "Schulen"}`]);
  facts.push(["Offizielle Infos", "berufsberatung.ch"]);

  const ld = {
    "@context": "https://schema.org",
    "@type": "Occupation",
    name: title,
    description,
    url,
    ...(txt(p.sector) ? { occupationalCategory: txt(p.sector) } : {})
  };

  const shown = schools.slice(0, MAX_SCHOOLS_SHOWN);
  const schoolHtml = shown.length
    ? `<section class="card"><h2>Wo lernt man das?</h2><ul class="schools">${shown
        .map(
          s =>
            `<li class="school"><div>${esc(s.title)}${s.city ? `<br><span>${esc(s.city)}</span>` : ""}</div>${
              s.canton ? `<i class="cant">${esc(s.canton)}</i>` : ""
            }</li>`
        )
        .join("")}</ul>${
        schools.length > shown.length ? `<p class="more">und ${schools.length - shown.length} weitere in Inspirella</p>` : ""
      }</section>`
    : "";

  const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} – Ausbildung &amp; Beruf in der Schweiz | Inspirella</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
${indexable ? "" : '<meta name="robots" content="noindex, follow">\n'}<meta name="theme-color" content="#0d0618">
<link rel="icon" type="image/png" href="/logo-mark.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Inspirella">
<meta property="og:title" content="${esc(title)} | Inspirella">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${SITE}/logo-mark.png">
<meta name="twitter:card" content="summary">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>
<style>${CSS}</style>
</head>
<body>
<div class="ambient" aria-hidden="true"><div class="blob b1"></div><div class="blob b2"></div><div class="blob b3"></div><div class="blob b4"></div><canvas id="sand"></canvas><div class="grain"></div><div class="vignette"></div></div>
<nav>
  <a class="logo" href="/"><img src="/logo-mark.png" alt="">Inspirella</a>
  <div class="nav-r"><a href="/">Alle Berufe &amp; Schulen</a><button class="tgl" id="tgl" type="button" aria-label="Design wechseln">☀ / ☾</button></div>
</nav>
<main>
  <div class="crumbs"><a href="/">Inspirella</a> › Berufe › ${esc(title)}</div>
  <header class="hero">
    <div class="badges">${typeLabel ? `<span class="badge">${esc(typeLabel)}</span>` : ""}${
      regLabel ? `<span class="badge warm">${esc(regLabel)}</span>` : ""
    }</div>
    <h1>${esc(title)}</h1>
    ${short ? `<p class="lead">${esc(short)}</p>` : ""}
    <div class="cta-row"><a class="btn btn-primary" href="/">Beruf in Inspirella erkunden →</a></div>
  </header>
  <div class="facts">${facts.map(([k, v]) => `<div class="card fact"><small>${esc(k)}</small><b>${esc(v)}</b></div>`).join("")}</div>
  <div class="grid">
    <div>
      ${
        detail.length
          ? `<section class="card"><h2>Was macht man in diesem Beruf?</h2><dl class="dl">${detail
              .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`)
              .join("")}</dl></section>`
          : ""
      }
      ${progression ? `<section class="card"><h2>Wie geht es weiter?</h2><p style="margin:0">${esc(progression)}</p></section>` : ""}
    </div>
    <aside>
      ${schoolHtml}
      ${salary ? `<section class="card"><h2>Lohn</h2><p style="margin:0">${esc(salary)}</p></section>` : ""}
    </aside>
  </div>
  <div class="source">Quelle &amp; Orientierung: Inspirella ist ein Orientierungswerkzeug. Verbindliche Informationen findest du bei <a href="${esc(
    guidance
  )}" rel="noopener">berufsberatung.ch</a> und beim kantonalen Berufsinformationszentrum (BIZ).</div>
</main>
<div class="foot">© Inspirella · <a href="/">inspirella.ch</a></div>
<script>${SCRIPT}</script>
</body>
</html>
`;
  return { html, indexable };
}

async function main() {
  try {
    await fs.access(DIST);
  } catch {
    console.warn("[pages] dist/ not found - run after `vite build`. Skipping.");
    return;
  }

  const rawUrl = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || "";
  if (!rawUrl || !key) {
    console.warn("[pages] SUPABASE_URL / SUPABASE_ANON_KEY not set at build time. Skipping page generation.");
    return;
  }
  // Tolerate a pasted REST endpoint (".../rest/v1") - the client wants the bare project URL.
  const supabase = createClient(rawUrl.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, ""), key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const professions = await fetchAll((from, to) =>
    supabase.from("professions").select("*").eq("is_active", true).eq("is_public", true).order("id", { ascending: true }).range(from, to)
  );
  const links = await fetchAll((from, to) =>
    supabase.from("profession_institutions").select("profession_id, institution_id").eq("is_active", true).order("id", { ascending: true }).range(from, to)
  );
  const institutions = await fetchAll((from, to) =>
    supabase.from("institutions").select("id, title_de, name, city, canton").eq("is_active", true).order("id", { ascending: true }).range(from, to)
  );

  if (!professions.length) {
    console.warn("[pages] No professions returned - leaving dist/ untouched.");
    return;
  }

  const instById = new Map<string, Row>(institutions.map(i => [String(i.id), i]));
  const schoolsByProfession = new Map<string, School[]>();
  for (const l of links) {
    const inst = instById.get(String(l.institution_id));
    if (!inst) continue;
    const title = txt(inst.title_de) || txt(inst.name);
    if (!title) continue;
    const list = schoolsByProfession.get(String(l.profession_id)) ?? [];
    list.push({ title, city: txt(inst.city), canton: txt(inst.canton) });
    schoolsByProfession.set(String(l.profession_id), list);
  }

  const urls: { loc: string; lastmod?: string }[] = [{ loc: `${SITE}/` }];
  let written = 0;
  let skipped = 0;
  let noindexed = 0;

  for (const p of professions) {
    const slug = pageSlug(p.slug);
    if (!SLUG_RE.test(slug)) {
      skipped++;
      continue;
    }
    const schools = (schoolsByProfession.get(String(p.id)) ?? []).sort((a, b) => a.title.localeCompare(b.title, "de"));
    const { html, indexable } = renderPage(p, schools);
    const dir = path.join(DIST, "beruf", slug);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "index.html"), html, "utf8");
    written++;
    if (!indexable) {
      noindexed++;
      continue;
    }
    const lastmod = typeof p.updated_at === "string" ? p.updated_at.slice(0, 10) : undefined;
    urls.push({ loc: `${SITE}/beruf/${slug}/`, lastmod });
  }

  const sitemap =
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(u => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`).join("\n") +
    `\n</urlset>\n`;
  await fs.writeFile(path.join(DIST, "sitemap.xml"), sitemap, "utf8");

  console.log(`[pages] ${written} profession pages written (${noindexed} noindex, ${skipped} skipped for bad slug); sitemap has ${urls.length} URLs.`);
}

main().catch(err => {
  // Never fail the deploy over SEO pages.
  console.error("[pages] Generation failed, continuing without pre-rendered pages:", err?.message || err);
});
