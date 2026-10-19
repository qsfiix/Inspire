import { useEffect, useState, type ComponentProps } from "react";
import { Map as MapIcon, Search } from "lucide-react";
import MapboxMap from "./MapboxMap";
import type { LanguageCode } from "../types";

/**
 * On a phone the live 3D map is heavy: it stutters, is hard to steer with a thumb and has been seen to crash the
 * browser tab. Phones therefore start with a light page that leads to the searchable list of schools; the 3D map
 * stays one tap away for anyone who wants it. Larger screens get the map straight away.
 */

const PHONE_QUERY = "(max-width: 767px)";

const UI: Record<LanguageCode, { title: string; text: string; browse: string; load: string }> = {
  de: {
    title: "Die 3D-Karte ist am Computer am besten",
    text: "Auf dem Handy ist sie schwer zu bedienen und belastet das Gerät. Schneller findest du Schulen in der Liste mit Suche und Filtern.",
    browse: "Schulen in der Liste ansehen",
    load: "3D-Karte trotzdem öffnen"
  },
  en: {
    title: "The 3D map works best on a computer",
    text: "On a phone it is hard to steer and heavy for the device. You will find schools faster in the list with search and filters.",
    browse: "Browse schools in the list",
    load: "Open the 3D map anyway"
  },
  fr: {
    title: "La carte 3D est plus agréable sur ordinateur",
    text: "Sur téléphone, elle est difficile à manier et lourde pour l'appareil. Tu trouveras plus vite des écoles dans la liste, avec recherche et filtres.",
    browse: "Voir les écoles dans la liste",
    load: "Ouvrir quand même la carte 3D"
  },
  it: {
    title: "La mappa 3D funziona meglio su un computer",
    text: "Sul telefono è difficile da usare e pesante per il dispositivo. Trovi le scuole più in fretta nell'elenco, con ricerca e filtri.",
    browse: "Vedi le scuole nell'elenco",
    load: "Apri comunque la mappa 3D"
  },
  uk: {
    title: "3D-карта найкраще працює на комп'ютері",
    text: "На телефоні нею важко керувати, і вона вантажить пристрій. Школи швидше знайти в списку з пошуком і фільтрами.",
    browse: "Переглянути школи у списку",
    load: "Усе одно відкрити 3D-карту"
  }
};

type MapProps = ComponentProps<typeof MapboxMap>;

export default function MapboxMapGate({ onOpenSchools, ...mapProps }: MapProps & { onOpenSchools: () => void }) {
  const [isPhone, setIsPhone] = useState<boolean>(() => typeof window !== "undefined" && window.matchMedia(PHONE_QUERY).matches);
  const [forceMap, setForceMap] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(PHONE_QUERY);
    const update = () => setIsPhone(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (!isPhone || forceMap) return <MapboxMap {...mapProps} />;

  const ui = UI[mapProps.currentLanguage] ?? UI.en;
  const isDark = mapProps.theme !== "light";
  return (
    <div className="card-premium flex flex-col items-center gap-4 p-6 text-center">
      <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${isDark ? "bg-violet-500/15 text-violet-300" : "bg-violet-100 text-violet-800"}`}>
        <MapIcon className="h-6 w-6" />
      </span>
      <h2 className={`text-base font-bold ${isDark ? "text-white" : "text-black font-black"}`}>{ui.title}</h2>
      <p className={`text-sm leading-relaxed ${isDark ? "text-zinc-300" : "text-black/80 font-semibold"}`}>{ui.text}</p>
      <button type="button" onClick={onOpenSchools} className="btn-primary flex w-full items-center justify-center gap-2 px-4 py-3 text-sm">
        <Search className="h-4 w-4" /> {ui.browse}
      </button>
      <button
        type="button"
        onClick={() => setForceMap(true)}
        className={`text-xs underline ${isDark ? "text-zinc-400 hover:text-zinc-200" : "text-violet-950/70 hover:text-violet-950"}`}
      >
        {ui.load}
      </button>
    </div>
  );
}
