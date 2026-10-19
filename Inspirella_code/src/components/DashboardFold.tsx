import { useState, type ReactNode } from "react";
import { ChevronDown, Route } from "lucide-react";
import type { LanguageCode } from "../types";

/**
 * Dashboard decluttering: the first screen shows what to do next and the path ladder; the longer
 * explanations (personal route details, why these recommendations) sit behind one tap, and the
 * education-system overview is a single card that opens the Swiss Path Map.
 */

const UI: Record<LanguageCode, { foldTitle: string; foldHint: string; mapTitle: string; mapText: string; mapButton: string }> = {
  de: {
    foldTitle: "Mehr zu meinem Weg",
    foldHint: "Persönliche Route und warum diese Empfehlungen",
    mapTitle: "Das ganze Schweizer Bildungssystem",
    mapText: "Alle Stufen und Übergänge auf einer Karte, mit Bedingungen für deinen Kanton.",
    mapButton: "Swiss Path Map öffnen"
  },
  en: {
    foldTitle: "More about my path",
    foldHint: "Personal route and why these recommendations",
    mapTitle: "The whole Swiss education system",
    mapText: "Every stage and transition on one map, with the conditions for your canton.",
    mapButton: "Open the Swiss Path Map"
  },
  fr: {
    foldTitle: "En savoir plus sur mon parcours",
    foldHint: "Itinéraire personnel et pourquoi ces recommandations",
    mapTitle: "Tout le système éducatif suisse",
    mapText: "Toutes les étapes et passerelles sur une carte, avec les conditions de ton canton.",
    mapButton: "Ouvrir la Swiss Path Map"
  },
  it: {
    foldTitle: "Di più sul mio percorso",
    foldHint: "Percorso personale e perché queste raccomandazioni",
    mapTitle: "Tutto il sistema formativo svizzero",
    mapText: "Tutte le fasi e i passaggi su una mappa, con le condizioni del tuo cantone.",
    mapButton: "Apri la Swiss Path Map"
  },
  uk: {
    foldTitle: "Докладніше про мій шлях",
    foldHint: "Особистий маршрут і чому саме ці рекомендації",
    mapTitle: "Уся система освіти Швейцарії",
    mapText: "Усі етапи й переходи на одній мапі, з умовами для твого кантону.",
    mapButton: "Відкрити Swiss Path Map"
  }
};

interface FoldProps {
  language: LanguageCode;
  isDark: boolean;
  children: ReactNode;
}

/** Collapsed by default; the content stays mounted so its own state is not lost when folded. */
export function DashboardFold({ language, isDark, children }: FoldProps) {
  const ui = UI[language] ?? UI.en;
  const [open, setOpen] = useState(false);
  return (
    <section className="space-y-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className={`card-premium flex w-full items-center justify-between gap-3 p-4 text-left cursor-pointer`}
      >
        <span>
          <span className={`block text-sm font-bold ${isDark ? "text-white" : "text-black font-black"}`}>{ui.foldTitle}</span>
          <span className={`block text-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-black/70 font-semibold"}`}>{ui.foldHint}</span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""} ${isDark ? "text-violet-300" : "text-violet-900"}`} />
      </button>
      <div className={open ? "space-y-8" : "hidden"}>{children}</div>
    </section>
  );
}

interface MapCardProps {
  language: LanguageCode;
  isDark: boolean;
  onOpen: () => void;
}

export function DashboardMapCard({ language, isDark, onOpen }: MapCardProps) {
  const ui = UI[language] ?? UI.en;
  return (
    <section className="card-premium flex flex-col gap-3 p-5 text-left sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDark ? "bg-violet-500/15 text-violet-300" : "bg-violet-100 text-violet-800"}`}>
          <Route className="h-5 w-5" />
        </span>
        <div>
          <h3 className={`text-sm font-bold ${isDark ? "text-white" : "text-black font-black"}`}>{ui.mapTitle}</h3>
          <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-black/70 font-semibold"}`}>{ui.mapText}</p>
        </div>
      </div>
      <button type="button" onClick={onOpen} className="btn-primary px-4 py-2 text-xs shrink-0">
        {ui.mapButton}
      </button>
    </section>
  );
}
