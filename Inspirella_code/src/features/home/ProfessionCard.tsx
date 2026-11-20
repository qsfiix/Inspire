import { useEffect, useRef, useState } from "react";
import type { LanguageCode } from "../../types";
import { type HomeCopy, PROFESSION_DESC } from "./homeCopy";
import { CARD_CONTOURS } from "./contours";

type Interest = "tech" | "natur" | "hand" | "buero";

/**
 * Real rows from the Inspirella database (2026-11-13): apprentice wage recommendations (min of year 1 to max
 * of the last year) and the BFS LSE 2024 median of the occupational group (ISCO), all experience levels.
 */
const P: Record<Interest, { slug: string; years: number; wage: string; median: string; t: Record<LanguageCode, string> }[]> = {
  tech: [
    { slug: "informatiker-in-efz", years: 4, wage: "550–1'500", median: "7'859", t: { de: "Informatikerin / Informatiker EFZ", en: "IT Specialist (EFZ)", fr: "Informaticienne / Informaticien CFC", it: "Informatica / Informatico AFC", uk: "Інформатик (EFZ)" } },
    { slug: "polymechaniker-in-efz", years: 4, wage: "570–1'265", median: "6'394", t: { de: "Polymechanikerin / Polymechaniker EFZ", en: "Polymechanic EFZ", fr: "Polymécanicienne / Polymécanicien CFC", it: "Polimeccanica / Polimeccanico AFC", uk: "Полімеханік (EFZ)" } },
    { slug: "elektroinstallateur-in-efz", years: 4, wage: "700–1'462", median: "6'432", t: { de: "Elektroinstallateurin / Elektroinstallateur EFZ", en: "Electrician EFZ", fr: "Électricienne / Électricien CFC", it: "Installatrice / Installatore elettrico AFC", uk: "Електромонтажник (EFZ)" } },
    { slug: "mediamatiker-in-efz", years: 4, wage: "550–1'500", median: "7'859", t: { de: "Mediamatikerin / Mediamatiker EFZ", en: "Media Specialist (EFZ)", fr: "Médiamaticienne / Médiamaticien CFC", it: "Mediamatica / Mediamatico AFC", uk: "Медіаматик (EFZ)" } }
  ],
  natur: [
    { slug: "laborant-in-efz", years: 3, wage: "835–1'520", median: "7'507", t: { de: "Laborantin / Laborant EFZ", en: "Laboratory Technician (EFZ)", fr: "Laborantine / Laborantin CFC", it: "Laboratorista AFC", uk: "Лаборант (EFZ)" } },
    { slug: "gaertner-in-efz", years: 3, wage: "750–1'300", median: "5'622", t: { de: "Gärtnerin / Gärtner EFZ", en: "Gardener (EFZ)", fr: "Jardinière / Jardinier CFC", it: "Giardiniera / Giardiniere AFC", uk: "Садівник (EFZ)" } }
  ],
  hand: [
    { slug: "schreiner-in-efz", years: 4, wage: "700–1'650", median: "5'302", t: { de: "Schreinerin / Schreiner EFZ", en: "Joiner EFZ", fr: "Menuisière / Menuisier CFC", it: "Falegname AFC", uk: "Столяр (EFZ)" } },
    { slug: "zeichner-in-efz", years: 4, wage: "630–1'320", median: "7'507", t: { de: "Zeichnerin / Zeichner EFZ", en: "Draughtsperson EFZ", fr: "Dessinatrice / Dessinateur CFC", it: "Disegnatrice / Disegnatore AFC", uk: "Кресляр (EFZ)" } },
    { slug: "koch-koechin-efz", years: 3, wage: "1'020–1'550", median: "4'927", t: { de: "Köchin / Koch EFZ", en: "Cook (EFZ)", fr: "Cuisinière / Cuisinier CFC", it: "Cuoca / Cuoco AFC", uk: "Кухар (EFZ)" } }
  ],
  buero: [
    { slug: "kaufmann-frau-efz", years: 3, wage: "835–1'520", median: "7'900", t: { de: "Kauffrau / Kaufmann EFZ", en: "Commercial Clerk (EFZ)", fr: "Employée / Employé de commerce CFC", it: "Impiegata / Impiegato di commercio AFC", uk: "Комерційний працівник (EFZ)" } },
    { slug: "detailhandelsfachmann-frau-efz", years: 3, wage: "835–1'520", median: "4'970", t: { de: "Detailhandelsfachfrau / Detailhandelsfachmann EFZ", en: "Retail Specialist (EFZ)", fr: "Gestionnaire du commerce de détail CFC", it: "Impiegata / Impiegato del commercio al dettaglio AFC", uk: "Фахівець з роздрібної торгівлі (EFZ)" } },
    { slug: "logistiker-in-efz", years: 3, wage: "800–1'450", median: "6'035", t: { de: "Logistikerin / Logistiker EFZ", en: "Logistics Specialist (EFZ)", fr: "Logisticienne / Logisticien CFC", it: "Logistica / Logistico AFC", uk: "Логіст (EFZ)" } }
  ]
};

/** Short label for the "similar careers" chips: first form of the title, without the qualification. */
const short = (title: string) => {
  const core = title.replace(/\s*\((EFZ|CFC|AFC)\)|\s+(EFZ|CFC|AFC)$/, "");
  const [a, b] = core.split(" / ").map(x => x.trim());
  if (!b) return a;
  if (a.startsWith(b) && a.length - b.length <= 3) return `${b}/${a.slice(b.length)}`;
  return `${a} / ${b}`;
};

/** Digits roll to their value like a departure board. */
export function Odometer({ text }: { text: string }) {
  return (
    <b aria-label={text}>
      {text.split("").map((ch, i) =>
        /\d/.test(ch) ? (
          <span className="od" key={`${i}-${text.length}`} aria-hidden="true">
            <i style={{ transform: `translateY(-${Number(ch) * 10}%)`, transitionDelay: `${i * 35}ms` }}>
              {"0123456789".split("").map(d => <u key={d}>{d}</u>)}
            </i>
          </span>
        ) : (
          <span className={ch === "'" ? "sep ap" : "sep"} key={`${i}-${ch}`} aria-hidden="true">{ch}</span>
        )
      )}
    </b>
  );
}

export default function ProfessionCard({ copy, language }: { copy: HomeCopy["prof"]; language: LanguageCode }) {
  const [interest, setInterest] = useState<Interest>("tech");
  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState({ interest: "tech" as Interest, idx: 0 });
  const [phase, setPhase] = useState<"" | "out" | "in">("");
  const timer = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  // title and description swap through a short blur; the numbers roll at the same time
  useEffect(() => {
    if (shown.interest === interest && shown.idx === idx) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setShown({ interest, idx }); return; }
    setPhase("out");
    timer.current = window.setTimeout(() => { setShown({ interest, idx }); setPhase("in"); }, 180);
  }, [interest, idx, shown]);

  const p = P[shown.interest][shown.idx];
  const numbers = P[interest][idx];
  const interests = Object.keys(copy.interests) as Interest[];

  return (
    <div className="alp-pgrid">
      <div>
        <h2><span className="br">{copy.titleA}</span> {copy.titleB}</h2>
        <p className="lead">{copy.lead}</p>
        <div className="alp-interests" role="group">
          {interests.map(k => (
            <button key={k} type="button" className="alp-pill" aria-pressed={interest === k} onClick={() => { setInterest(k); setIdx(0); }}>{copy.interests[k]}</button>
          ))}
        </div>
      </div>
      <article className="alp-pcard" aria-live="polite">
        <svg className="alp-topo" viewBox="0 0 600 420" preserveAspectRatio="xMaxYMin slice" aria-hidden="true">
          {CARD_CONTOURS.map(c => <path key={`${c.d.slice(0, 18)}${c.i}`} className={c.ix ? "ix" : undefined} style={{ ["--i" as string]: c.i }} pathLength={1} d={c.d} />)}
        </svg>
        <div className="pbody">
          <div className={`ptitle ${phase}`} onAnimationEnd={() => phase === "in" && setPhase("")}>
            <span className="ptag">{copy.tag(p.years)}</span>
            <h3 lang={language}>{p.t[language]}</h3>
            <p className="pdesc">{PROFESSION_DESC[p.slug][language]}</p>
          </div>
          <div className="pnums">
            <div><Odometer text={numbers.wage} /><span className="l">{copy.wage}</span></div>
            <div><Odometer text={numbers.median} /><span className="l">{copy.median}</span></div>
          </div>
          <div className="pfoot">
            <p className="psrc">{copy.source}</p>
            <a className="alp-tolink" href={`/beruf/${p.slug}/`}>{copy.toProfession}<svg className="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
          </div>
          {P[interest].length > 1 && (
            <div className="alp-interests more" role="group" aria-label={copy.nextList}>
              {P[interest].map((q, k) => k === idx ? null : (
                <button key={q.slug} type="button" className="alp-pill sm" onClick={() => setIdx(k)}>{short(q.t[language])}</button>
              ))}
            </div>
          )}
        </div>
      </article>
    </div>
  );
}
