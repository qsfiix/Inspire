import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { LanguageCode } from "../../types";
import { fetchSupabaseConfig, getSupabase } from "../../supabaseClient";
import type { HomeCopy } from "./homeCopy";

interface Hit { title: string; href: string; kind: "beruf" | "topic" }
interface Row { title_de: string | null; title_en: string | null; title_fr: string | null; title_it: string | null; title_uk: string | null; page_slug: string | null }

const fold = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Profession titles + their static pages, loaded once on the first focus (not on page load). */
let professionsPromise: Promise<Row[]> | null = null;
function loadProfessions(): Promise<Row[]> {
  if (!professionsPromise) {
    professionsPromise = (async () => {
      await fetchSupabaseConfig();
      const sb = getSupabase();
      if (!sb) return [];
      const out: Row[] = [];
      for (let from = 0; from < 4000; from += 1000) {
        const { data, error } = await sb.from("professions")
          .select("title_de,title_en,title_fr,title_it,title_uk,page_slug")
          .eq("is_public", true).eq("is_active", true).not("page_slug", "is", null)
          .order("title_de", { ascending: true }).range(from, from + 999);
        if (error || !data) break;
        out.push(...(data as Row[]));
        if (data.length < 1000) break;
      }
      return out;
    })().catch(() => []);
  }
  return professionsPromise;
}

export default function HomeSearch({ copy, topics, language }: { copy: HomeCopy["hero"]; topics: [string, string][]; language: LanguageCode }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const hits = useMemo<Hit[]>(() => {
    const needle = fold(q.trim());
    if (needle.length < 2) return [];
    const titleKey = `title_${language}` as keyof Row;
    const prof: Hit[] = [];
    for (const r of rows) {
      const local = (r[titleKey] as string | null) || r.title_de || "";
      if (fold(local).includes(needle) || fold(r.title_de ?? "").includes(needle)) {
        prof.push({ title: local, href: `/beruf/${r.page_slug}/`, kind: "beruf" });
        if (prof.length >= 6) break;
      }
    }
    const top: Hit[] = topics.filter(([t]) => fold(t).includes(needle)).slice(0, 3).map(([t, href]) => ({ title: t, href, kind: "topic" }));
    return [...top, ...prof];
  }, [q, rows, topics, language]);

  const go = (href: string) => { window.location.assign(href); };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (hits[active]) go(hits[active].href);
    else go("/berufe/");
  };

  return (
    <form className="alp-search" role="search" ref={boxRef} onSubmit={submit}>
      <svg className="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M16 16l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      <label htmlFor="alp-q" className="sr-only">{copy.searchLabel}</label>
      <input
        id="alp-q" type="search" autoComplete="off" placeholder={copy.searchPlaceholder} value={q}
        role="combobox" aria-expanded={open && q.trim().length >= 2} aria-controls="alp-q-list" aria-autocomplete="list"
        onFocus={() => { setOpen(true); loadProfessions().then(setRows); }}
        onChange={e => { setQ(e.target.value); setActive(0); setOpen(true); }}
        onKeyDown={e => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a + 1, Math.max(hits.length - 1, 0))); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
          else if (e.key === "Escape") setOpen(false);
        }}
      />
      <button className="alp-btn" type="submit">{copy.searchButton}</button>
      {open && q.trim().length >= 2 && (
        <ul className="alp-results" id="alp-q-list" role="listbox">
          {hits.map((h, i) => (
            <li key={h.href} role="option" aria-selected={i === active}>
              <a href={h.href} onMouseEnter={() => setActive(i)}>
                <span>{h.title}</span>{h.kind === "topic" && <small>{copy.topicLabel}</small>}
              </a>
            </li>
          ))}
          {hits.length === 0 && <li className="none"><a href="/berufe/">{copy.noResults}</a></li>}
          {hits.length > 0 && <li className="all"><a href="/berufe/">{copy.allProfessions}</a></li>}
        </ul>
      )}
    </form>
  );
}
