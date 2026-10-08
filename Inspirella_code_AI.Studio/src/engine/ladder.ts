import type { LanguageCode, LearningPath, LearningPathStep, Profession, ProfessionFacts, RouteBackground, TrainingCompany, UserProfile } from "../types";
import { deriveEntry, languageOfCanton } from "./pathPlanner";
import { INTEREST_CATEGORIES } from "./routeSignals";

/** Code of the detailed Lehre-to-Fachhochschule ladder template (learning_paths.code). */
export const LADDER_CODE = "lehre_leiter";

/** Profession types the ladder is written for. */
const LADDER_PROFESSION_TYPES = new Set(["apprenticeship_efz"]);

const title = (de: string, en: string, fr: string, it: string): Partial<Record<LanguageCode, string>> => ({ de, en, fr, it });

/**
 * The ladder fits someone who still has to find an apprenticeship: school
 * leavers (and people whose entry we could not derive), not someone who already
 * holds an EFZ or a higher qualification.
 */
export function ladderApplies(
  profession: Pick<Profession, "professionType"> | undefined,
  route: RouteBackground | undefined,
  profile: UserProfile | null
): boolean {
  if (!profession?.professionType || !LADDER_PROFESSION_TYPES.has(profession.professionType)) return false;
  const { entry } = deriveEntry(route, profile);
  return entry === "sek1" || entry === "unknown";
}

const fillBeruf = (text: string | undefined, beruf: string) => (text ? text.replace(/\{beruf\}/g, beruf) : text);

function fillStep(step: LearningPathStep, beruf: string): LearningPathStep {
  const fillMap = (m?: Partial<Record<LanguageCode, string>>) =>
    m ? (Object.fromEntries(Object.entries(m).map(([k, v]) => [k, fillBeruf(v, beruf)])) as Partial<Record<LanguageCode, string>>) : m;
  return {
    ...step,
    title: fillMap(step.title) ?? step.title,
    description: fillMap(step.description),
    substeps: step.substeps?.map(s => fillStep(s, beruf))
  };
}

/**
 * Turns the generic ladder template into the ladder of one profession: the
 * profession name is filled into the texts and the path gets its own id, so a
 * tracker goal belongs to this profession and not to the template.
 */
export function instantiateLadder(template: LearningPath, profession: Profession, language: LanguageCode): LearningPath {
  const beruf = profession.title[language] ?? profession.title.de ?? profession.title.en ?? "";
  const berufDe = profession.title.de ?? beruf;
  return {
    ...template,
    id: `${template.id}:${profession.id}`,
    // Name only: the card prefixes it with "Dein Weg zu ...".
    title: title(berufDe, profession.title.en ?? berufDe, profession.title.fr ?? berufDe, profession.title.it ?? berufDe),
    targetProfessionId: profession.id,
    steps: template.steps.map(s => fillStep(s, beruf))
  };
}

export interface RankedFirm {
  firm: TrainingCompany;
  reasons: Array<"canton" | "language" | "interest" | "schnupperlehre">;
  score: number;
}

/**
 * Firms that name the profession on their own apprenticeship page, ranked by
 * the user's canton, language, interests and whether they offer a Schnupperlehre.
 * A firm that does not name the profession is never suggested.
 */
export function rankFirms(
  firms: TrainingCompany[],
  profession: Pick<Profession, "id" | "category">,
  profile: UserProfile | null,
  opts: { schnupperlehre?: boolean; limit?: number } = {}
): RankedFirm[] {
  const canton = profile?.preferredCanton?.toUpperCase();
  const lang = languageOfCanton(canton) ?? (profile?.targetLanguageRegion || undefined);
  const interestCats = new Set((profile?.interests ?? []).flatMap(i => INTEREST_CATEGORIES[i] ?? []));
  if (profession.category) interestCats.add(profession.category);

  const ranked = firms
    .filter(f => f.professionIds.includes(profession.id))
    .map<RankedFirm>(f => {
      const reasons: RankedFirm["reasons"] = [];
      let score = 0;
      if (canton && f.canton?.toUpperCase() === canton) {
        reasons.push("canton");
        score += 40;
      }
      if (lang && f.languages.includes(lang)) {
        reasons.push("language");
        score += 20;
      }
      if (f.sectorCodes.some(c => interestCats.has(c))) {
        reasons.push("interest");
        score += 10;
      }
      if (f.schnupperlehre === true) {
        reasons.push("schnupperlehre");
        score += opts.schnupperlehre ? 25 : 5;
      }
      return { firm: f, reasons, score };
    })
    .sort((a, b) => b.score - a.score || a.firm.name.localeCompare(b.firm.name));
  return opts.limit ? ranked.slice(0, opts.limit) : ranked;
}

/** Plain, short fact lines for the "requirements" hook; empty when we know nothing. */
export function factLines(facts: ProfessionFacts | undefined, topic?: string | null): string[] {
  if (!facts) return [];
  const years = facts.durationYears ? `Lehrdauer: ${facts.durationYears} Jahre` : undefined;
  if (topic === "duration") return years ? [years] : [];
  if (topic === "requirements") {
    const out: string[] = [];
    if (facts.schoolLevel) out.push(`Schulniveau: ${facts.schoolLevel}`);
    if (facts.aptitudeTests.length) out.push(`Eignungstests: ${facts.aptitudeTests.join(", ")}`);
    return out;
  }
  // The profession overview: length, where people work, how it can continue.
  const out: string[] = [];
  if (years) out.push(years);
  if (facts.typicalWorkplaces) out.push(`Arbeitsorte: ${facts.typicalWorkplaces}`);
  if (facts.weiterbildung.length) out.push(`Danach zum Beispiel: ${facts.weiterbildung.slice(0, 3).join("; ")}`);
  return out;
}

// ---------------------------------------------------------------------------
// Time windows: when each phase usually happens, counted back from the start
// of the apprenticeship (August of year Y). A rough guide, not a deadline: many
// popular professions fill their places earlier, and cantons differ.
// ---------------------------------------------------------------------------

export type PhaseKey = "orient" | "schnuppern" | "dossier" | "bewerben" | "gespraech" | "entscheid" | "lehre" | "fh";

/** learning_path_steps.step_order of the phases of the ladder template. */
export const PHASE_BY_ORDER: Record<number, PhaseKey> = {
  100: "orient",
  200: "schnuppern",
  300: "dossier",
  400: "bewerben",
  500: "gespraech",
  600: "entscheid",
  700: "lehre",
  800: "fh"
};

/** [year offset from Y, month 1-12] of the start and end of each phase; null end = open. */
const WINDOWS: Partial<Record<PhaseKey, { from: [number, number]; to: [number, number] | null }>> = {
  orient: { from: [-2, 8], to: [-1, 1] },
  schnuppern: { from: [-1, 1], to: [-1, 9] },
  dossier: { from: [-1, 6], to: [-1, 9] },
  bewerben: { from: [-1, 8], to: [0, 2] },
  gespraech: { from: [-1, 9], to: [0, 3] },
  entscheid: { from: [-1, 11], to: [0, 4] },
  lehre: { from: [0, 8], to: null }
};

export interface LehrbeginnYear {
  year: number;
  /** True when we had to guess it (no start year and no birth year given). */
  assumed: boolean;
}

/** Year in which the apprenticeship should start (August). */
export function lehrbeginnYear(route: RouteBackground | undefined, now: Date = new Date()): LehrbeginnYear {
  const thisYear = now.getFullYear();
  const augustPassed = now.getMonth() >= 7;
  const earliest = augustPassed ? thisYear + 1 : thisYear;
  if (route?.targetStartYear && route.targetStartYear >= earliest) return { year: route.targetStartYear, assumed: false };
  if (route?.birthYear) {
    // Most people start an apprenticeship at about 16.
    const y = route.birthYear + 16;
    return { year: Math.max(y, earliest), assumed: y < earliest };
  }
  return { year: earliest, assumed: true };
}

export interface PhaseWindow {
  from: Date;
  to: Date | null;
  state: "ahead" | "now" | "past";
}

export function phaseWindow(key: PhaseKey | undefined, startYear: number, now: Date = new Date()): PhaseWindow | undefined {
  const w = key ? WINDOWS[key] : undefined;
  if (!w) return undefined;
  const from = new Date(startYear + w.from[0], w.from[1] - 1, 1);
  const to = w.to ? new Date(startYear + w.to[0], w.to[1], 0) : null; // last day of the end month
  const state: PhaseWindow["state"] = now < from ? "ahead" : to && now > to ? "past" : "now";
  return { from, to, state };
}

const MONTH_FORMAT = (language: LanguageCode, d: Date) => new Intl.DateTimeFormat(language, { month: "short", year: "numeric" }).format(d);

const WINDOW_TEXT: Record<LanguageCode, { guide: string; open: string; now: string; past: string; ahead: string; assumed: string }> = {
  de: { guide: "Richtwert für einen Lehrbeginn im August {y}: {range}", open: "ab {from}", now: "jetzt aktuell", past: "Zeitfenster vorbei, du kannst trotzdem noch handeln", ahead: "kommt noch", assumed: "Das Jahr haben wir angenommen. Gib in deinen Antworten dein Wunschjahr an." },
  en: { guide: "Rough guide for starting in August {y}: {range}", open: "from {from}", now: "current now", past: "window has passed, you can still act", ahead: "still to come", assumed: "We assumed the year. Enter your preferred year in your answers." },
  fr: { guide: "Repère pour un début en août {y} : {range}", open: "dès {from}", now: "en cours", past: "période passée, tu peux encore agir", ahead: "à venir", assumed: "Nous avons supposé l'année. Indique l'année souhaitée dans tes réponses." },
  it: { guide: "Indicazione per un inizio ad agosto {y}: {range}", open: "da {from}", now: "attuale", past: "periodo passato, puoi comunque agire", ahead: "in arrivo", assumed: "Abbiamo ipotizzato l'anno. Indica l'anno desiderato nelle tue risposte." }
};

export function windowLabel(win: PhaseWindow, startYear: number, assumed: boolean, language: LanguageCode): { text: string; status: string; note?: string } {
  const t = WINDOW_TEXT[language] ?? WINDOW_TEXT.de;
  const range = win.to ? `${MONTH_FORMAT(language, win.from)} – ${MONTH_FORMAT(language, win.to)}` : t.open.replace("{from}", MONTH_FORMAT(language, win.from));
  return {
    text: t.guide.replace("{y}", String(startYear)).replace("{range}", range),
    status: win.state === "now" ? t.now : win.state === "past" ? t.past : t.ahead,
    note: assumed ? t.assumed : undefined
  };
}

/** True from March of the start year until the start: a good moment to point at Plan B. */
export function planBSeason(startYear: number, now: Date = new Date()): boolean {
  return now >= new Date(startYear, 2, 1) && now < new Date(startYear, 7, 1);
}

export const PLAN_B_TEXT: Record<LanguageCode, string> = {
  de: "Falls du jetzt noch keine Lehrstelle hast: Das ist nicht ungewöhnlich. Schau dir Plan B an (Brückenangebote, 10. Schuljahr, Zwischenjahr) und bleib trotzdem in der Suche.",
  en: "If you have no apprenticeship yet: that is not unusual. Look at Plan B (bridge programmes, 10th school year, gap year) and keep searching.",
  fr: "Si tu n'as pas encore de place d'apprentissage : ce n'est pas rare. Regarde le plan B (offres transitoires, 10e année, année intermédiaire) et continue ta recherche.",
  it: "Se non hai ancora un posto di tirocinio: non è raro. Guarda il piano B (offerte transitorie, 10° anno, anno intermedio) e continua a cercare."
};
