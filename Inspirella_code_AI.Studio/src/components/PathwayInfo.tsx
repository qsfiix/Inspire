import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { DataRepository } from "../data/Repository";
import type { AdmissionCondition, EducationProgram, EducationTransition, LanguageCode } from "../types";
import { admissionsFor, kindLabel, nodeLabel, programsFor, routeLabel, transitionsFrom } from "../lib/pathwayInfo";

/**
 * Admission rules, bridge offers and ways onward, read from the pathway tables
 * (admission_conditions, education_programs, education_transitions). The source
 * texts are German; the labels around them are translated.
 */

interface PathwayData {
  admissions: AdmissionCondition[];
  programs: EducationProgram[];
  transitions: EducationTransition[];
}

// Small reference tables: one fetch per page load, shared by every box on screen.
let cache: Promise<PathwayData> | null = null;
function loadPathwayData(): Promise<PathwayData> {
  if (!cache) {
    cache = Promise.all([
      DataRepository.getAdmissionConditions(),
      DataRepository.getEducationPrograms(),
      DataRepository.getEducationTransitions()
    ]).then(([admissions, programs, transitions]) => {
      // Do not pin an empty result (offline, hiccup): the next mount tries again.
      if (admissions.length + programs.length + transitions.length === 0) cache = null;
      return { admissions, programs, transitions };
    });
  }
  return cache;
}

function usePathwayData(): PathwayData | null {
  const [data, setData] = useState<PathwayData | null>(null);
  useEffect(() => {
    let active = true;
    loadPathwayData().then(d => {
      if (active) setData(d);
    });
    return () => {
      active = false;
    };
  }, []);
  return data;
}

type Ui = {
  admissionTitle: (canton: string) => string;
  requirements: string;
  exam: string;
  deadline: string;
  cost: string;
  source: string;
  germanNote: string;
  verified: string;
  bridgeTitle: (canton: string) => string;
  bridgeHint: string;
  duration: string;
  target: string;
  more: (n: number) => string;
  nextTitle: string;
  nextHint: string;
  conditions: string;
  typicalAge: string;
};

const UI: Record<LanguageCode, Ui> = {
  de: {
    admissionTitle: c => `So kommst du rein (Kanton ${c})`,
    requirements: "Voraussetzungen",
    exam: "Aufnahmeprüfung",
    deadline: "Anmeldung",
    cost: "Kosten",
    source: "Quelle",
    germanNote: "Fristen ändern sich jedes Jahr: prüfe sie auf der Quellseite.",
    verified: "Geprüft",
    bridgeTitle: c => `Plan B: Brückenangebote im Kanton ${c}`,
    bridgeHint: "Wenn es mit der Lehrstelle oder der Schule nicht gleich klappt, gibt es Angebote, die dich vorbereiten und die Zeit sinnvoll nutzen.",
    duration: "Dauer",
    target: "Für wen",
    more: n => `und ${n} weitere`,
    nextTitle: "Und danach? Wege, wie es weitergeht",
    nextHint: "Die Schweiz ist durchlässig: von fast jedem Abschluss geht es weiter.",
    conditions: "Bedingungen",
    typicalAge: "Typisches Alter"
  },
  en: {
    admissionTitle: c => `How to get in (canton ${c})`,
    requirements: "Requirements",
    exam: "Entrance exam",
    deadline: "Registration",
    cost: "Cost",
    source: "Source",
    germanNote: "Texts are in German. Deadlines change every year: check them on the source page.",
    verified: "Checked",
    bridgeTitle: c => `Plan B: bridge programmes in canton ${c}`,
    bridgeHint: "If the apprenticeship or school does not work out right away, there are programmes that prepare you and make good use of the time.",
    duration: "Duration",
    target: "Who it is for",
    more: n => `and ${n} more`,
    nextTitle: "And after this? Ways it can continue",
    nextHint: "Switzerland is permeable: almost every qualification leads on.",
    conditions: "Conditions",
    typicalAge: "Typical age"
  },
  fr: {
    admissionTitle: c => `Comment y entrer (canton ${c})`,
    requirements: "Conditions",
    exam: "Examen d'admission",
    deadline: "Inscription",
    cost: "Coût",
    source: "Source",
    germanNote: "Textes en allemand. Les délais changent chaque année : vérifie-les sur la page source.",
    verified: "Vérifié",
    bridgeTitle: c => `Plan B : offres transitoires dans le canton ${c}`,
    bridgeHint: "Si la place d'apprentissage ou l'école ne vient pas tout de suite, il existe des offres qui te préparent et font bien utiliser le temps.",
    duration: "Durée",
    target: "Pour qui",
    more: n => `et ${n} autres`,
    nextTitle: "Et après ? Les voies pour continuer",
    nextHint: "La Suisse est perméable : presque chaque diplôme mène plus loin.",
    conditions: "Conditions",
    typicalAge: "Âge typique"
  },
  it: {
    admissionTitle: c => `Come entrare (cantone ${c})`,
    requirements: "Requisiti",
    exam: "Esame di ammissione",
    deadline: "Iscrizione",
    cost: "Costi",
    source: "Fonte",
    germanNote: "Testi in tedesco. Le scadenze cambiano ogni anno: verificale sulla pagina della fonte.",
    verified: "Verificato",
    bridgeTitle: c => `Piano B: offerte transitorie nel cantone ${c}`,
    bridgeHint: "Se il posto di tirocinio o la scuola non arrivano subito, ci sono offerte che ti preparano e usano bene il tempo.",
    duration: "Durata",
    target: "Per chi",
    more: n => `e altre ${n}`,
    nextTitle: "E dopo? Come si può continuare",
    nextHint: "La Svizzera è permeabile: quasi ogni titolo porta oltre.",
    conditions: "Condizioni",
    typicalAge: "Età tipica"
  }
};

interface BoxProps {
  language: LanguageCode;
  isDark: boolean;
}

const boxClass = (isDark: boolean) =>
  `rounded-xl border p-3 space-y-2 ${isDark ? "border-violet-400/20 bg-violet-500/[0.06]" : "border-violet-200 bg-violet-50/70"}`;
const labelClass = "block text-[10px] font-mono uppercase tracking-wider text-violet-400";
const textClass = (isDark: boolean) => `text-[11.5px] leading-relaxed ${isDark ? "text-zinc-200" : "text-violet-950"}`;
const linkClass = (isDark: boolean) =>
  `inline-flex items-center gap-1 text-[11px] font-semibold underline-offset-2 hover:underline ${isDark ? "text-violet-300" : "text-violet-700"}`;

function Field({ label, value, isDark }: { label: string; value?: string; isDark: boolean }) {
  if (!value) return null;
  return (
    <div>
      <span className={labelClass}>{label}</span>
      <p className={textClass(isDark)}>{value}</p>
    </div>
  );
}

/** Admission rules for the school's routes in the school's canton. Renders nothing when there are none. */
export function AdmissionBox({ canton, routes, language, isDark }: BoxProps & { canton?: string; routes: string[] }) {
  const data = usePathwayData();
  if (!data || !canton) return null;
  const list = admissionsFor(data.admissions, canton, routes);
  if (list.length === 0) return null;
  const ui = UI[language] ?? UI.de;
  return (
    <div className="space-y-2 text-left">
      <span className={labelClass}>{ui.admissionTitle(canton.toUpperCase())}</span>
      {list.map(a => (
        <div key={a.id} className={boxClass(isDark)}>
          <div className="flex items-start justify-between gap-2">
            <b className={`text-xs ${isDark ? "text-white" : "text-violet-950"}`}>{routeLabel(a.route, language)}</b>
            {a.verified && (
              <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{ui.verified}</span>
            )}
          </div>
          {a.headline && <p className={textClass(isDark)}>{a.headline}</p>}
          <Field label={ui.requirements} value={a.requirements} isDark={isDark} />
          <Field label={ui.exam} value={a.examInfo} isDark={isDark} />
          <Field label={ui.deadline} value={a.deadline} isDark={isDark} />
          <Field label={ui.cost} value={a.costNote} isDark={isDark} />
          {a.url && (
            <a href={a.url} target="_blank" rel="noopener noreferrer" className={linkClass(isDark)}>
              {ui.source} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      ))}
      <p className={`text-[11px] ${isDark ? "text-zinc-400" : "text-violet-950/70"}`}>{ui.germanNote}</p>
    </div>
  );
}

/** Bridge offers of a canton: the content of "Plan B". Renders nothing when the canton has none. */
export function BridgeBox({ canton, language, isDark, max = 4 }: BoxProps & { canton?: string; max?: number }) {
  const data = usePathwayData();
  const [all, setAll] = useState(false);
  if (!data || !canton) return null;
  const list = programsFor(data.programs, canton);
  if (list.length === 0) return null;
  const ui = UI[language] ?? UI.de;
  const shown = all ? list : list.slice(0, max);
  return (
    <div className={boxClass(isDark)}>
      <span className={labelClass}>{ui.bridgeTitle(canton.toUpperCase())}</span>
      <p className={`text-[11px] ${isDark ? "text-zinc-400" : "text-violet-950/70"}`}>{ui.bridgeHint}</p>
      <ul className="space-y-2">
        {shown.map(p => (
          <li key={p.id} className={`rounded-lg border px-2.5 py-2 space-y-0.5 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-violet-200 bg-white"}`}>
            <div className="flex items-start justify-between gap-2">
              <b className={`text-[12px] ${isDark ? "text-white" : "text-violet-950"}`}>{p.title}</b>
              <span className="shrink-0 text-[10px] font-mono text-violet-400">{kindLabel(p.kind, language)}</span>
            </div>
            {p.provider && <p className={`text-[11px] ${isDark ? "text-zinc-400" : "text-violet-950/70"}`}>{p.provider}</p>}
            {p.duration && <p className={textClass(isDark)}><span className="text-violet-400">{ui.duration}:</span> {p.duration}</p>}
            {p.targetGroup && <p className={textClass(isDark)}><span className="text-violet-400">{ui.target}:</span> {p.targetGroup}</p>}
            {p.url && (
              <a href={p.url} target="_blank" rel="noopener noreferrer" className={linkClass(isDark)}>
                {ui.source} <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </li>
        ))}
      </ul>
      {list.length > max && (
        <button type="button" onClick={() => setAll(v => !v)} className={`${linkClass(isDark)} cursor-pointer`}>
          {all ? "−" : ui.more(list.length - max)}
        </button>
      )}
      <p className={`text-[11px] ${isDark ? "text-zinc-400" : "text-violet-950/70"}`}>{ui.germanNote}</p>
    </div>
  );
}

/** "And after this?": the ways onward from the stage a goal ends at (see nodesForGoal). */
export function NextWaysBox({ nodes, language, isDark }: BoxProps & { nodes: string[] }) {
  const data = usePathwayData();
  if (!data) return null;
  const list = transitionsFrom(data.transitions, nodes);
  if (list.length === 0) return null;
  const ui = UI[language] ?? UI.de;
  return (
    <div className={boxClass(isDark)}>
      <span className={labelClass}>{ui.nextTitle}</span>
      <p className={`text-[11px] ${isDark ? "text-zinc-400" : "text-violet-950/70"}`}>{ui.nextHint}</p>
      <ul className="space-y-2">
        {list.map(t => (
          <li key={t.id} className={`rounded-lg border px-2.5 py-2 space-y-0.5 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-violet-200 bg-white"}`}>
            <div className="flex items-start justify-between gap-2">
              <b className={`text-[12px] ${isDark ? "text-white" : "text-violet-950"}`}>
                {nodeLabel(t.from, language)} → {nodeLabel(t.to, language)}
              </b>
              <span className="shrink-0 text-[10px] font-mono text-violet-400">{kindLabel(t.kind, language)}</span>
            </div>
            <p className={textClass(isDark)}>{t.label}</p>
            <Field label={ui.conditions} value={t.conditions} isDark={isDark} />
            <Field label={ui.duration} value={t.duration} isDark={isDark} />
            {t.url && (
              <a href={t.url} target="_blank" rel="noopener noreferrer" className={linkClass(isDark)}>
                {ui.source} <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className={`text-[11px] ${isDark ? "text-zinc-400" : "text-violet-950/70"}`}>{ui.germanNote}</p>
    </div>
  );
}
