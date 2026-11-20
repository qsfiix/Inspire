import { useEffect, useState } from "react";
import type { LanguageCode } from "../../types";
import { DataRepository } from "../../data/Repository";
import { Odometer } from "./ProfessionCard";

type Forms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

const LOCALE: Record<LanguageCode, string> = { de: "de-CH", en: "en-GB", fr: "fr-CH", it: "it-CH", uk: "uk-UA" };

/** Labels for professions, schools, learning paths, languages. Ukrainian needs the plural form that matches the number. */
const LABELS: Record<LanguageCode, [Forms, Forms, Forms, Forms]> = {
  de: [{ other: "Berufe" }, { other: "Schulen" }, { other: "Bildungswege" }, { other: "Sprachen" }],
  en: [{ other: "careers" }, { other: "schools" }, { other: "learning paths" }, { other: "languages" }],
  fr: [{ other: "métiers" }, { other: "écoles" }, { other: "parcours" }, { other: "langues" }],
  it: [{ other: "professioni" }, { other: "scuole" }, { other: "percorsi formativi" }, { other: "lingue" }],
  uk: [
    { one: "професія", few: "професії", many: "професій", other: "професії" },
    { one: "школа", few: "школи", many: "шкіл", other: "школи" },
    { one: "освітній шлях", few: "освітні шляхи", many: "освітніх шляхів", other: "освітнього шляху" },
    { one: "мова", few: "мови", many: "мов", other: "мови" }
  ]
};

/**
 * The hero's proof row: real counts from the database (never rounded or guessed), digits roll once
 * like the profession card's numbers. Renders nothing if the database can't be reached, rather than
 * showing zeros or an invented figure.
 */
export default function HeroStats({ language }: { language: LanguageCode }) {
  const [counts, setCounts] = useState<number[] | null>(null);
  const [go, setGo] = useState(false);

  useEffect(() => {
    let alive = true;
    DataRepository.getPlatformStats().then(s => {
      if (!alive || !s || !s.professions) return;
      setCounts([s.professions, s.institutions, s.learningPaths, 5]);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!counts) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { setGo(true); return; }
    const t = window.setTimeout(() => setGo(true), 450);
    return () => window.clearTimeout(t);
  }, [counts]);

  if (!counts) return null;
  const fmt = new Intl.NumberFormat(LOCALE[language]);
  const plural = new Intl.PluralRules(LOCALE[language]);

  return (
    <ul className="alp-stats">
      {counts.map((n, i) => {
        const text = fmt.format(n).replace(/[’‘]/g, "'");
        const forms = LABELS[language][i];
        const label = forms[plural.select(n)] ?? forms.other;
        return (
          <li key={i}>
            <span aria-hidden="true"><Odometer text={go ? text : text.replace(/\d/g, "0")} /></span>
            <span className="l" aria-hidden="true">{label}</span>
            <span className="sr-only">{text} {label}</span>
          </li>
        );
      })}
    </ul>
  );
}
