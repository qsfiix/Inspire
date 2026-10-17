import { Route } from "lucide-react";
import type { LanguageCode } from "../types";

/**
 * The way back to the Swiss Path Map: wherever a profession, a school or the personal path is shown,
 * this opens the map at the matching stage. It renders nothing without a stage or a handler.
 */

const UI: Record<LanguageCode, { stage: string; route: string }> = {
  de: { stage: "Auf der Swiss Path Map zeigen", route: "Meinen Weg auf der Swiss Path Map ansehen" },
  en: { stage: "Show on the Swiss Path Map", route: "See my path on the Swiss Path Map" },
  fr: { stage: "Voir sur la Swiss Path Map", route: "Voir mon parcours sur la Swiss Path Map" },
  it: { stage: "Mostra sulla Swiss Path Map", route: "Vedi il mio percorso sulla Swiss Path Map" },
  uk: { stage: "Показати на Swiss Path Map", route: "Переглянути мій шлях на Swiss Path Map" }
};

interface Props {
  /** Stage code of the Swiss Path Map; without it the button opens the map as a whole (personal route). */
  node?: string;
  language: LanguageCode;
  isDark: boolean;
  onOpen?: (node?: string) => void;
  className?: string;
}

export default function PathMapLink({ node, language, isDark, onOpen, className = "" }: Props) {
  if (!onOpen) return null;
  const ui = UI[language] ?? UI.de;
  return (
    <button
      type="button"
      onClick={() => onOpen(node)}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors cursor-pointer ${
        isDark ? "border-violet-300/40 bg-violet-400/10 text-violet-100 hover:bg-violet-400/20" : "border-violet-400 bg-violet-50 text-violet-900 hover:bg-violet-100"
      } ${className}`}
    >
      <Route className="h-3.5 w-3.5" /> {node ? ui.stage : ui.route}
    </button>
  );
}
