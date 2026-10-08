import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type { Institution, LanguageCode, Profession, RouteBackground } from "../types";
import { DataRepository } from "../data/Repository";
import { localizedText } from "../lib/localized";
import { getOnboardingCopy } from "../features/onboardingCopy";

/**
 * Lets the user change what My Path leads to: a profession, a specific school,
 * or just a level (Gymnasium, Fachhochschule, university, ...). Writes the route
 * answers; everything else (ladder, recommendations) follows from them.
 */

type Goal = NonNullable<RouteBackground["targetLevel"]>;
type Patch = Partial<RouteBackground>;

const LEVEL_CHOICES: Goal[] = ["apprenticeship", "gymnasium", "berufsmatura", "university_of_applied_sciences", "university", "higher_vocational"];

/** Level that fits a profession type (professions.profession_type). */
export function levelOfProfessionType(type?: string): Goal | undefined {
  if (!type) return undefined;
  if (type.startsWith("apprenticeship")) return "apprenticeship";
  if (["fachausweis", "diplom", "hf_diploma"].includes(type)) return "higher_vocational";
  if (type === "fh_bachelor") return "university_of_applied_sciences";
  if (type === "university") return "university";
  return undefined;
}

/** Level that fits a school type (institutions.institution_subgroup). */
export function levelOfSubgroup(subgroup?: string): Goal | undefined {
  switch (subgroup) {
    case "gymnasium":
      return "gymnasium";
    case "university":
    case "federal_institute_of_technology":
      return "university";
    case "university_of_applied_sciences":
    case "teacher_education":
    case "fachmittelschule":
      return "university_of_applied_sciences";
    case "vocational_school":
      return "apprenticeship";
    case "continuing_education_center":
      return "higher_vocational";
    default:
      return undefined;
  }
}

const UI: Record<LanguageCode, Record<string, string>> = {
  de: { title: "Wohin soll dein Weg führen?", tabProf: "Beruf", tabSchool: "Schule", tabLevel: "Ziel", searchProf: "Beruf suchen (mind. 2 Buchstaben)", searchSchool: "Schule suchen, zum Beispiel Gymnasium Neufeld", levelHint: "Oder wähle nur ein Ziel, ohne Beruf oder Schule:", none: "Nichts gefunden.", close: "Schliessen", browse: "Alle Berufe ansehen" },
  en: { title: "Where should your path lead?", tabProf: "Profession", tabSchool: "School", tabLevel: "Goal", searchProf: "Search a profession (2+ letters)", searchSchool: "Search a school, for example Gymnasium Neufeld", levelHint: "Or pick just a goal, without a profession or school:", none: "Nothing found.", close: "Close", browse: "Browse all professions" },
  fr: { title: "Où ton parcours doit-il mener ?", tabProf: "Métier", tabSchool: "École", tabLevel: "Objectif", searchProf: "Chercher un métier (2 lettres min.)", searchSchool: "Chercher une école, par exemple Gymnasium Neufeld", levelHint: "Ou choisis seulement un objectif, sans métier ni école :", none: "Rien trouvé.", close: "Fermer", browse: "Voir tous les métiers" },
  it: { title: "Dove deve portare il tuo percorso?", tabProf: "Professione", tabSchool: "Scuola", tabLevel: "Obiettivo", searchProf: "Cerca una professione (min. 2 lettere)", searchSchool: "Cerca una scuola, ad esempio Gymnasium Neufeld", levelHint: "Oppure scegli solo un obiettivo, senza professione o scuola:", none: "Nulla trovato.", close: "Chiudi", browse: "Vedi tutte le professioni" }
};

interface Props {
  language: LanguageCode;
  isDark: boolean;
  route: RouteBackground | undefined;
  onChange: (patch: Patch) => void;
  onClose: () => void;
  onBrowse?: () => void;
}

export default function GoalPicker({ language, isDark, route, onChange, onClose, onBrowse }: Props) {
  const ui = UI[language] ?? UI.de;
  const copy = getOnboardingCopy(language);
  const [tab, setTab] = useState<"profession" | "school" | "level">("profession");
  const [query, setQuery] = useState("");
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  useEffect(() => {
    let active = true;
    DataRepository.getProfessions().then(p => active && setProfessions(p)).catch(() => undefined);
    DataRepository.getInstitutions().then(i => active && setInstitutions(i)).catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const profMatches = useMemo(
    () => (q.length < 2 ? [] : professions.filter(p => Object.values(p.title ?? {}).some(t => typeof t === "string" && t.toLowerCase().includes(q))).slice(0, 8)),
    [professions, q]
  );
  const schoolMatches = useMemo(
    () => (q.length < 2 ? [] : institutions.filter(i => i.isPublic !== false && i.title.toLowerCase().includes(q)).slice(0, 8)),
    [institutions, q]
  );

  const muted = isDark ? "text-zinc-400" : "text-zinc-600";
  const tabCls = (on: boolean) =>
    `px-3 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
      on ? (isDark ? "bg-violet-500/25 border-violet-400/50 text-white" : "bg-violet-100 border-violet-300 text-violet-900") : isDark ? "border-white/10 text-zinc-300 hover:bg-white/5" : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
    }`;
  const rowCls = `w-full text-left rounded-lg border px-3 py-2 text-[12px] transition cursor-pointer ${
    isDark ? "border-white/10 bg-white/[0.03] hover:bg-white/10 text-zinc-100" : "border-zinc-200 bg-white hover:bg-violet-50 text-zinc-900"
  }`;

  const pickProfession = (p: Profession) => {
    const level = levelOfProfessionType(p.professionType);
    onChange({ targetProfessionId: p.id, targetInstitutionId: undefined, ...(level ? { targetLevel: level } : {}) });
    onClose();
  };
  const pickSchool = (i: Institution) => {
    const level = levelOfSubgroup(i.subgroup);
    onChange({ targetInstitutionId: i.id, targetProfessionId: undefined, ...(level ? { targetLevel: level } : {}) });
    onClose();
  };
  const pickLevel = (level: Goal) => {
    onChange({ targetLevel: level, targetProfessionId: undefined, targetInstitutionId: undefined });
    onClose();
  };

  return (
    <div className={`mt-3 rounded-xl border p-4 space-y-3 ${isDark ? "border-white/10 bg-white/[0.04]" : "border-purple-200 bg-white"}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className={`text-[13px] font-bold ${isDark ? "text-violet-100" : "text-violet-950"}`}>{ui.title}</h3>
        <button type="button" onClick={onClose} aria-label={ui.close} className={`rounded-md p-1 cursor-pointer ${isDark ? "hover:bg-white/10 text-zinc-300" : "hover:bg-zinc-100 text-zinc-600"}`}>
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "profession"} className={tabCls(tab === "profession")} onClick={() => { setTab("profession"); setQuery(""); }}>{ui.tabProf}</button>
        <button type="button" role="tab" aria-selected={tab === "school"} className={tabCls(tab === "school")} onClick={() => { setTab("school"); setQuery(""); }}>{ui.tabSchool}</button>
        <button type="button" role="tab" aria-selected={tab === "level"} className={tabCls(tab === "level")} onClick={() => { setTab("level"); setQuery(""); }}>{ui.tabLevel}</button>
      </div>

      {tab !== "level" && (
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={tab === "profession" ? ui.searchProf : ui.searchSchool}
          className={`w-full text-[12px] px-3 py-2 rounded-lg border outline-none ${isDark ? "bg-white/5 border-white/10 text-white" : "bg-white border-purple-200 text-black"}`}
        />
      )}

      {tab === "profession" && (
        <div className="space-y-1.5">
          {profMatches.map(p => (
            <button key={p.id} type="button" onClick={() => pickProfession(p)} className={rowCls}>
              {localizedText(p.title, language)}
            </button>
          ))}
          {q.length >= 2 && profMatches.length === 0 && <p className={`text-[11px] ${muted}`}>{ui.none}</p>}
          {onBrowse && (
            <button type="button" onClick={onBrowse} className={`text-[11px] underline cursor-pointer ${isDark ? "text-violet-300" : "text-violet-700"}`}>
              {ui.browse}
            </button>
          )}
        </div>
      )}

      {tab === "school" && (
        <div className="space-y-1.5">
          {schoolMatches.map(i => (
            <button key={i.id} type="button" onClick={() => pickSchool(i)} className={rowCls}>
              {i.title} <span className={muted}>{[i.canton, i.city].filter(Boolean).join(" · ")}</span>
            </button>
          ))}
          {q.length >= 2 && schoolMatches.length === 0 && <p className={`text-[11px] ${muted}`}>{ui.none}</p>}
        </div>
      )}

      {tab === "level" && (
        <div className="space-y-2">
          <p className={`text-[11px] ${muted}`}>{ui.levelHint}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {LEVEL_CHOICES.map(level => (
              <button key={level} type="button" onClick={() => pickLevel(level)} className={`${rowCls} ${route?.targetLevel === level && !route.targetProfessionId && !route.targetInstitutionId ? (isDark ? "ring-1 ring-violet-400" : "ring-1 ring-violet-500") : ""}`}>
                {copy[`tgt_${level}`]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
