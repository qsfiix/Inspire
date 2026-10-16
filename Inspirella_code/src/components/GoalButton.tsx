import { useEffect, useState } from "react";
import { Check, Target } from "lucide-react";
import type { Institution, LanguageCode, Profession, RouteBackground } from "../types";
import { DataRepository } from "../data/Repository";
import { ROUTE_CHANGED_EVENT } from "../engine/useEducationEngine";
import { levelOfProfessionType, levelOfSubgroup } from "./GoalPicker";

/**
 * "Make this my goal": the one step that joins browsing to planning. Wherever a
 * profession or a school is shown (recommendations, profession and school cards,
 * the map), this writes it into the route answers; My Path, the recommendations
 * and the tracker steps all follow from there.
 */

type Item = { kind: "profession"; profession: Profession } | { kind: "institution"; institution: Institution };

const UI: Record<LanguageCode, { profession: string; institution: string; isProfession: string; isInstitution: string; updated: string }> = {
  de: { profession: "Zu meinem Ziel machen", institution: "Als Wunschschule wählen", isProfession: "Das ist dein Ziel", isInstitution: "Deine Wunschschule", updated: "Ziel gesetzt: dein Weg ist aktualisiert." },
  en: { profession: "Make this my goal", institution: "Make this my target school", isProfession: "This is your goal", isInstitution: "Your target school", updated: "Goal set: your path is updated." },
  fr: { profession: "En faire mon objectif", institution: "Choisir comme école visée", isProfession: "C'est ton objectif", isInstitution: "Ton école visée", updated: "Objectif défini : ton parcours est mis à jour." },
  it: { profession: "Rendilo il mio obiettivo", institution: "Scegli come scuola obiettivo", isProfession: "È il tuo obiettivo", isInstitution: "La tua scuola obiettivo", updated: "Obiettivo impostato: il tuo percorso è aggiornato." }
};

/**
 * The route answers that make this item the goal; everything else in the route is kept.
 * The level follows the item: when it has none (e.g. a profession of type "other"), the
 * level of the previous goal is cleared instead of being carried over to a path it does not fit.
 */
export function goalPatch(item: Item): Partial<RouteBackground> {
  if (item.kind === "profession") {
    const level = levelOfProfessionType(item.profession.professionType);
    return { targetProfessionId: item.profession.id, targetInstitutionId: undefined, targetLevel: level };
  }
  const level = levelOfSubgroup(item.institution.subgroup);
  return { targetInstitutionId: item.institution.id, targetProfessionId: undefined, targetLevel: level };
}

export async function setGoal(item: Item): Promise<void> {
  const current = await DataRepository.getRouteBackground();
  const next: RouteBackground = { ...(current ?? { languageLevels: [] }), ...goalPatch(item) };
  await DataRepository.saveRouteBackground(next);
}

interface Props {
  item: Item;
  language: LanguageCode;
  isDark: boolean;
  /** Called after the goal was saved, e.g. to scroll to or open My Path. */
  onDone?: () => void;
  className?: string;
}

export default function GoalButton({ item, language, isDark, onDone, className = "" }: Props) {
  const ui = UI[language] ?? UI.de;
  const id = item.kind === "profession" ? item.profession.id : item.institution.id;
  const [route, setRoute] = useState<RouteBackground | undefined>();
  const [justSet, setJustSet] = useState(false);

  useEffect(() => {
    let active = true;
    const load = () => {
      DataRepository.getRouteBackground().then(r => active && setRoute(r ?? undefined)).catch(() => undefined);
    };
    load();
    window.addEventListener(ROUTE_CHANGED_EVENT, load);
    return () => {
      active = false;
      window.removeEventListener(ROUTE_CHANGED_EVENT, load);
    };
  }, []);

  const isGoal = item.kind === "profession" ? route?.targetProfessionId === id : route?.targetInstitutionId === id;

  if (isGoal) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold ${isDark ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-emerald-300 bg-emerald-50 text-emerald-800"} ${className}`}>
        <Check className="h-3.5 w-3.5" aria-hidden="true" />
        {justSet ? ui.updated : item.kind === "profession" ? ui.isProfession : ui.isInstitution}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await setGoal(item);
          setJustSet(true);
          onDone?.();
        } catch {
          // A failed save leaves the button as it was; nothing to roll back.
        }
      }}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition cursor-pointer ${
        isDark ? "border-violet-400/40 bg-violet-500/15 text-violet-100 hover:bg-violet-500/25" : "border-violet-300 bg-violet-50 text-violet-900 hover:bg-violet-100"
      } ${className}`}
    >
      <Target className="h-3.5 w-3.5" aria-hidden="true" />
      {item.kind === "profession" ? ui.profession : ui.institution}
    </button>
  );
}
