import { useEffect, useState } from "react";
import { Clock3, Sparkles, UserCheck, Shuffle } from "lucide-react";
import { DataRepository } from "../data/Repository";
import { localizedText } from "../lib/localized";
import type { LanguageCode, Profession, ProfessionDetails, ProfessionTrait } from "../types";

/**
 * What the profession asks of you and what it is for: requirements and interests (a controlled vocabulary,
 * translated), the typical duration, and similar professions you can open with one tap.
 */

const UI: Record<LanguageCode, { duration: string; requirements: string; interests: string; similar: string; year: (n: number) => string; month: (n: number) => string; flexible: string; source: string }> = {
  de: { duration: "Dauer", requirements: "Das solltest du mitbringen", interests: "Das passt zu dir, wenn du gern …", similar: "Ähnliche Berufe", year: n => (n === 1 ? "1 Jahr" : `${n} Jahre`), month: n => `${n} Monate`, flexible: "individuell gestaltbar", source: "Quelle: berufsberatung.ch" },
  en: { duration: "Duration", requirements: "What you should bring", interests: "A good fit if you like …", similar: "Similar professions", year: n => (n === 1 ? "1 year" : `${n} years`), month: n => `${n} months`, flexible: "can be arranged individually", source: "Source: berufsberatung.ch" },
  fr: { duration: "Durée", requirements: "Ce qu'il faut avoir", interests: "Ça te convient si tu aimes …", similar: "Métiers proches", year: n => (n === 1 ? "1 an" : `${n} ans`), month: n => `${n} mois`, flexible: "organisable individuellement", source: "Source : berufsberatung.ch" },
  it: { duration: "Durata", requirements: "Cosa serve", interests: "Fa per te se ti piace …", similar: "Professioni simili", year: n => (n === 1 ? "1 anno" : `${n} anni`), month: n => `${n} mesi`, flexible: "organizzabile individualmente", source: "Fonte: berufsberatung.ch" },
  uk: { duration: "Тривалість", requirements: "Що тобі знадобиться", interests: "Підійде, якщо тобі подобається …", similar: "Схожі професії", year: n => (n === 1 ? "1 рік" : n >= 2 && n <= 4 ? `${n} роки` : `${n} років`), month: n => (n === 1 ? "1 місяць" : n >= 2 && n <= 4 ? `${n} місяці` : `${n} місяців`), flexible: "за індивідуальним планом", source: "Джерело: berufsberatung.ch" }
};

/** Whole years as years, everything else in months (18 months reads clearer than 1.5 years in every language). */
function formatMonths(months: number, ui: (typeof UI)[LanguageCode]): string {
  return months % 12 === 0 ? ui.year(months / 12) : ui.month(months);
}

interface Props {
  profession: Profession;
  professions: Profession[];
  language: LanguageCode;
  isDark: boolean;
  onSelect: (p: Profession) => void;
}

export default function ProfessionDetailsBlock({ profession, professions, language, isDark, onSelect }: Props) {
  const ui = UI[language] ?? UI.en;
  const [details, setDetails] = useState<ProfessionDetails | null>(null);
  const [traits, setTraits] = useState<Map<number, ProfessionTrait>>(new Map());

  useEffect(() => {
    let active = true;
    setDetails(null);
    DataRepository.getProfessionDetails(profession.id).then(d => active && setDetails(d)).catch(() => undefined);
    return () => { active = false; };
  }, [profession.id]);

  useEffect(() => {
    let active = true;
    DataRepository.getProfessionTraits().then(m => active && setTraits(m)).catch(() => undefined);
    return () => { active = false; };
  }, []);

  if (!details) return null;
  const phrase = (id: number) => traits.get(id)?.text[language] ?? traits.get(id)?.text.de;
  const reqs = details.requirementIds.map(phrase).filter((x): x is string => !!x);
  const ints = details.interestIds.map(phrase).filter((x): x is string => !!x);
  const similar = details.similarCodes
    .map(code => professions.find(p => p.code === code))
    .filter((p): p is Profession => !!p && p.id !== profession.id);
  const duration =
    details.durationMinMonths != null && details.durationMaxMonths != null
      ? details.durationMinMonths === details.durationMaxMonths
        ? formatMonths(details.durationMinMonths, ui)
        : `${formatMonths(details.durationMinMonths, ui)} – ${formatMonths(details.durationMaxMonths, ui)}`
      : details.durationNote
        ? ui.flexible
        : null;

  if (!duration && reqs.length === 0 && ints.length === 0 && similar.length === 0) return null;

  const label = `text-[11px] font-mono uppercase tracking-wider text-violet-400 flex items-center gap-1.5`;
  const chip = `rounded-full border px-2.5 py-1 text-[11.5px] font-semibold ${isDark ? "border-white/10 bg-white/[0.04] text-zinc-200" : "border-purple-200 bg-white text-violet-950"}`;

  return (
    <div className="card-premium space-y-3 p-3.5 text-left">
      {duration && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={label}><Clock3 className="h-3.5 w-3.5" /> {ui.duration}</span>
          <span className={`font-bold ${isDark ? "text-white" : "text-violet-950"}`}>{duration}</span>
        </div>
      )}
      {reqs.length > 0 && (
        <div className="space-y-1.5">
          <span className={label}><UserCheck className="h-3.5 w-3.5" /> {ui.requirements}</span>
          <div className="flex flex-wrap gap-1.5">{reqs.map((r, i) => <span key={i} className={chip}>{r}</span>)}</div>
        </div>
      )}
      {ints.length > 0 && (
        <div className="space-y-1.5">
          <span className={label}><Sparkles className="h-3.5 w-3.5" /> {ui.interests}</span>
          <div className="flex flex-wrap gap-1.5">{ints.map((r, i) => <span key={i} className={chip}>{r}</span>)}</div>
        </div>
      )}
      {similar.length > 0 && (
        <div className="space-y-1.5">
          <span className={label}><Shuffle className="h-3.5 w-3.5" /> {ui.similar}</span>
          <div className="flex flex-wrap gap-1.5">
            {similar.map(p => (
              <button key={p.id} type="button" onClick={() => onSelect(p)} className={`${chip} cursor-pointer transition-colors ${isDark ? "hover:border-violet-400/60" : "hover:border-violet-500"}`}>
                {localizedText(p.title, language)}
              </button>
            ))}
          </div>
        </div>
      )}
      {details.sourceUrl && (
        <a href={details.sourceUrl} target="_blank" rel="noopener noreferrer" className={`block text-[11px] underline ${isDark ? "text-zinc-400" : "text-violet-950/70"}`}>{ui.source}</a>
      )}
    </div>
  );
}
