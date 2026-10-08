import type { LearningPath, LearningPathStep, RouteBackground, UserProfile } from "../types";
import { bestSwissLanguageRank, STUDY_LEVEL_RANK, TARGET_TYPES } from "./routeSignals";

/**
 * Builds a personal route out of the curated path templates in
 * `learning_paths`. Nothing is invented here: the planner only chooses,
 * orders and annotates template paths from what the user told us.
 * Unanswered questions never block a route; they lower `confidence` and
 * add a hint instead.
 */

export type EntryState = "sek1" | "no_qualification" | "efz" | "matura" | "hf" | "bachelor" | "master" | "unknown";
export type TargetState = NonNullable<RouteBackground["targetLevel"]> | "undecided";

export type StepStatus = "done" | "todo" | "later";

export interface PlannedStep {
  step: LearningPathStep;
  status: StepStatus;
  /** The next thing the user should actually do. */
  isCurrent: boolean;
}

export type SegmentKind = "main" | "language" | "recognition" | "profession" | "alternative";

export interface PlannedSegment {
  code: string;
  kind: SegmentKind;
  path: LearningPath;
  steps: PlannedStep[];
}

export type RouteNote =
  | "entry-assumed"
  | "target-missing"
  | "language-unknown"
  | "language-gap"
  | "recognition-needed"
  | "second-apprenticeship"
  | "matura-no-bm-needed"
  | "profession-level-mismatch";

export interface PersonalRoute {
  entry: EntryState;
  target: TargetState;
  /** Ordered: recognition, language, then the main path(s). */
  segments: PlannedSegment[];
  /** Other realistic ways to the same goal. */
  alternatives: PlannedSegment[];
  notes: RouteNote[];
  /** Language the study language gap was measured against. */
  studyLanguage: string;
  /** CEFR level the language check used, e.g. "C1"; empty when no language is needed. */
  requiredLanguageLevel: string;
  targetStartYear?: number;
  confidence: "low" | "medium" | "high";
}

interface RouteRule {
  main: string[];
  alternatives?: string[][];
}

const BM_TO_FH = "lehre_berufsmatura_fachhochschule";
const EFZ_TO_FH = "efz_ohne_berufsmatura_zur_fachhochschule";
const LEHRE = "start_vocational_training";
const ADULT = "adult_berufsabschluss_nachholen";
const GYM = "gymnasium_quarta_bis_prima";
const MATURA_UNI = "academic_matura_to_university";
const MATURA_FH = "matura_zur_fachhochschule";
const PASSERELLE = "passerelle_to_university";
const HIGHER_VOC = "vet_to_professional_education";
const FMS = "specialized_baccalaureate_to_uas";

const RULES: Record<string, RouteRule> = {
  "sek1|apprenticeship": { main: [LEHRE] },
  "sek1|berufsmatura": { main: [BM_TO_FH] },
  "sek1|gymnasium": { main: [GYM], alternatives: [[BM_TO_FH], [FMS]] },
  "sek1|university_of_applied_sciences": { main: [BM_TO_FH], alternatives: [[GYM, MATURA_FH], [FMS]] },
  "sek1|university": { main: [GYM, MATURA_UNI], alternatives: [[BM_TO_FH, PASSERELLE]] },
  "sek1|higher_vocational": { main: [LEHRE, HIGHER_VOC] },
  "sek1|undecided": { main: [], alternatives: [[LEHRE], [GYM], [FMS]] },
  "no_qualification|apprenticeship": { main: [ADULT] },
  "no_qualification|berufsmatura": { main: [ADULT, EFZ_TO_FH] },
  "no_qualification|university_of_applied_sciences": { main: [ADULT, EFZ_TO_FH] },
  "no_qualification|university": { main: [ADULT, EFZ_TO_FH, PASSERELLE] },
  "no_qualification|higher_vocational": { main: [ADULT, HIGHER_VOC] },
  "no_qualification|undecided": { main: [], alternatives: [[ADULT], [LEHRE]] },
  "efz|apprenticeship": { main: [LEHRE] },
  "efz|berufsmatura": { main: [EFZ_TO_FH] },
  "efz|university_of_applied_sciences": { main: [EFZ_TO_FH] },
  "efz|university": { main: [EFZ_TO_FH, PASSERELLE] },
  "efz|higher_vocational": { main: [HIGHER_VOC] },
  "efz|undecided": { main: [], alternatives: [[EFZ_TO_FH], [HIGHER_VOC]] },
  "matura|apprenticeship": { main: [LEHRE] },
  "matura|berufsmatura": { main: [MATURA_FH] },
  "matura|university_of_applied_sciences": { main: [MATURA_FH] },
  "matura|university": { main: [MATURA_UNI] },
  "matura|higher_vocational": { main: [HIGHER_VOC] },
  "matura|undecided": { main: [], alternatives: [[MATURA_UNI], [MATURA_FH]] },
  "hf|berufsmatura": { main: [EFZ_TO_FH] },
  "hf|university_of_applied_sciences": { main: [EFZ_TO_FH] },
  "hf|university": { main: [EFZ_TO_FH, PASSERELLE] },
  "hf|higher_vocational": { main: [HIGHER_VOC] },
  "hf|undecided": { main: [], alternatives: [[EFZ_TO_FH], [HIGHER_VOC]] },
  "bachelor|university": { main: [MATURA_UNI] },
  "bachelor|undecided": { main: [], alternatives: [[MATURA_UNI]] }
};

/** Steps (by `order`) that the entry state has already completed. */
const SATISFIED: Record<string, Partial<Record<EntryState, number[]>>> = {
  [MATURA_UNI]: { matura: [1], bachelor: [1, 2, 3, 4, 5, 6, 7, 8], master: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  [MATURA_FH]: { matura: [1] },
  [EFZ_TO_FH]: { efz: [1], hf: [1] },
  [HIGHER_VOC]: { efz: [1], hf: [1] }
};

const LANGUAGE_PATH: Record<string, string> = { de: "learn_german_b2", fr: "learn_french_b2", it: "learn_italian_b1" };
const RECOGNITION_PATH = "recognise_foreign_qualification";

const GERMAN_CANTONS = new Set(["ZH", "BE", "LU", "UR", "SZ", "OW", "NW", "GL", "ZG", "SO", "BS", "BL", "SH", "AR", "AI", "SG", "GR", "AG", "TG"]);
const FRENCH_CANTONS = new Set(["VD", "GE", "NE", "JU", "FR", "VS"]);

export function languageOfCanton(canton: string | undefined): string | undefined {
  if (!canton) return undefined;
  const c = canton.toUpperCase();
  if (GERMAN_CANTONS.has(c)) return "de";
  if (FRENCH_CANTONS.has(c)) return "fr";
  if (c === "TI") return "it";
  return undefined;
}

const LOW_EDUCATION = new Set(["none", "compulsory_school"]);

export function deriveEntry(route: RouteBackground | undefined, profile: UserProfile | null, now = new Date()): { entry: EntryState; assumed: boolean } {
  const highest = route?.highestEducation;
  if (highest) {
    if (LOW_EDUCATION.has(highest)) {
      const age = route?.birthYear ? now.getFullYear() - route.birthYear : undefined;
      const adult = (age !== undefined && age >= 25) || (route?.workExperienceYears ?? 0) >= 3;
      return { entry: adult ? "no_qualification" : "sek1", assumed: false };
    }
    const map: Record<string, EntryState> = {
      upper_secondary_vocational: "efz",
      upper_secondary_general: "matura",
      tertiary_professional: "hf",
      bachelor: "bachelor",
      master: "master"
    };
    if (map[highest]) return { entry: map[highest], assumed: false };
  }
  const stage = profile?.currentStage;
  if (stage === "stage_secondary") return { entry: "sek1", assumed: true };
  if (stage === "stage_university") return { entry: "matura", assumed: true };
  return { entry: "unknown", assumed: true };
}

/**
 * Level in the study language at which a start is realistic. Universities and
 * Fachhochschulen in German-speaking Switzerland typically ask for C1 from
 * non-native speakers (ETH, UZH, Bern, FHNW, ZHAW); the French-speaking
 * universities we checked ask for B1-B2. Vocational routes need less.
 */
export const requiredLanguageRank = (target: TargetState, language: string): number => {
  if (target === "university" || target === "university_of_applied_sciences") return language === "de" ? 5 : 4;
  if (target === "higher_vocational") return 4;
  if (target === "berufsmatura" || target === "apprenticeship") return 3; // B1
  return 0;
};
const RANK_LABEL: Record<number, string> = { 3: "B1", 4: "B2", 5: "C1" };

const CEFR_RANK: Record<string, number> = { none: 0, A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6, native: 7 };

function plan(path: LearningPath, kind: SegmentKind, entry: EntryState, first: boolean): PlannedSegment {
  const done = new Set(SATISFIED[path.code ?? ""]?.[entry] ?? []);
  const ordered = [...path.steps].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  let currentAssigned = !first;
  const steps: PlannedStep[] = ordered.map(step => {
    if (step.order !== undefined && done.has(step.order)) return { step, status: "done", isCurrent: false };
    if (!first) return { step, status: "later", isCurrent: false };
    // First open step is the current one, even if it is optional: some paths (for
    // example the variants of the EFZ-to-FH path) are made of optional choices.
    const isCurrent = !currentAssigned;
    if (isCurrent) currentAssigned = true;
    return { step, status: "todo", isCurrent };
  });
  return { code: path.code ?? "", kind, path, steps };
}

/** Which target level a chosen profession implies when the user stated none. */
const TYPE_TO_TARGET: Record<string, TargetState> = {
  apprenticeship_efz: "apprenticeship",
  apprenticeship_eba: "apprenticeship",
  fachausweis: "higher_vocational",
  diplom: "higher_vocational",
  hf_diploma: "higher_vocational",
  fh_bachelor: "university_of_applied_sciences",
  university: "university"
};

export interface LanguageGapInfo {
  studyLanguage: string;
  required: number;
  requiredLabel: string;
  gap: boolean;
}

/** Study language (canton, then target region, then German) and whether the stated level is below the usual start level. */
export function languageGapInfo(route: RouteBackground | undefined, profile: UserProfile | null, target: TargetState): LanguageGapInfo {
  const studyLanguage =
    languageOfCanton(profile?.preferredCanton) ??
    (profile?.targetLanguageRegion && LANGUAGE_PATH[profile.targetLanguageRegion] ? profile.targetLanguageRegion : undefined) ??
    "de";
  const required = requiredLanguageRank(target, studyLanguage);
  const level = route?.languageLevels.find(l => l.languageCode === studyLanguage)?.level;
  const hasAny = bestSwissLanguageRank(route) !== null;
  const gap = required > 0 && hasAny && (level ? CEFR_RANK[level] ?? 0 : 0) < required;
  return { studyLanguage, required, requiredLabel: RANK_LABEL[required] ?? "", gap };
}

export function buildPersonalRoute(
  route: RouteBackground | undefined,
  profile: UserProfile | null,
  templates: LearningPath[],
  now = new Date(),
  professionType?: string
): PersonalRoute {
  const byCode = new Map(templates.filter(t => t.code).map(t => [t.code as string, t]));
  const { entry: derived, assumed } = deriveEntry(route, profile, now);
  const impliedTarget = professionType ? TYPE_TO_TARGET[professionType] : undefined;
  const target: TargetState = route?.targetLevel ?? impliedTarget ?? "undecided";
  const notes: RouteNote[] = [];
  if (route?.targetLevel && professionType && TARGET_TYPES[route.targetLevel] && !TARGET_TYPES[route.targetLevel].includes(professionType)) {
    notes.push("profession-level-mismatch");
  }

  // Unknown entry is planned as a school student, with a hint to say more.
  const planEntry: EntryState = derived === "unknown" ? "sek1" : derived;
  if (assumed) notes.push("entry-assumed");
  if (target === "undecided") notes.push("target-missing");

  const lookupTarget: TargetState = ["language_course", "job_entry", "continuing_education"].includes(target) ? "undecided" : target;
  const rule = RULES[`${planEntry}|${lookupTarget}`] ?? { main: [], alternatives: [] };
  if (planEntry === "efz" && target === "apprenticeship") notes.push("second-apprenticeship");
  if (planEntry === "matura" && target === "berufsmatura") notes.push("matura-no-bm-needed");

  const segments: PlannedSegment[] = [];

  // 1. Recognition of a foreign qualification comes before everything else.
  const foreign =
    route?.highestEducationCountryCode &&
    route.highestEducationCountryCode !== "CH" &&
    route.highestEducation &&
    !LOW_EDUCATION.has(route.highestEducation);
  const recognised = route?.diplomaRecognitionStatus === "recognised" || route?.diplomaRecognitionStatus === "not_needed";
  if (foreign && !recognised) {
    notes.push("recognition-needed");
    const rec = byCode.get(RECOGNITION_PATH);
    if (rec) segments.push(plan(rec, "recognition", planEntry, true));
  }

  // 2. Language prerequisite.
  const studyLanguage =
    languageOfCanton(profile?.preferredCanton) ??
    (profile?.targetLanguageRegion && LANGUAGE_PATH[profile.targetLanguageRegion] ? profile.targetLanguageRegion : undefined) ??
    "de";
  const required = requiredLanguageRank(target, studyLanguage);
  const level = route?.languageLevels.find(l => l.languageCode === studyLanguage)?.level;
  const levelRank = level ? CEFR_RANK[level] ?? 0 : undefined;
  const hasAnyLanguage = bestSwissLanguageRank(route) !== null;
  const wantsLanguage = target === "language_course";
  if (required > 0 && !hasAnyLanguage) notes.push("language-unknown");
  if (wantsLanguage || (required > 0 && hasAnyLanguage && (levelRank ?? 0) < required)) {
    if (!wantsLanguage) notes.push("language-gap");
    const langPath = byCode.get(LANGUAGE_PATH[studyLanguage]);
    if (langPath && langPath.steps.length > 0) segments.push(plan(langPath, "language", planEntry, true));
  }

  // 3. The main path(s). Only the first block of steps is "current".
  const hasPrior = segments.length > 0;
  rule.main.forEach((code, index) => {
    const tpl = byCode.get(code);
    if (tpl && tpl.steps.length > 0) segments.push(plan(tpl, "main", planEntry, !hasPrior && index === 0));
  });

  // If the prerequisite segments exist, the first main segment waits for them.
  if (hasPrior) {
    segments.forEach((seg, i) => {
      if (seg.kind === "main" && i > 0) {
        seg.steps = seg.steps.map(s => (s.status === "todo" ? { ...s, status: "later", isCurrent: false } : s));
      }
    });
  }

  // 3b. The chosen profession's own path comes after the way to the right level.
  if (route?.targetProfessionId) {
    const own = templates.find(t => t.targetProfessionId === route.targetProfessionId && t.steps.length > 0);
    if (own) segments.push(plan(own, "profession", planEntry, segments.length === 0));
  }

  // 4. Alternatives (never mixed into the main route).
  const alternatives: PlannedSegment[] = [];
  for (const group of rule.alternatives ?? []) {
    group.forEach((code, index) => {
      const tpl = byCode.get(code);
      if (tpl && tpl.steps.length > 0) alternatives.push(plan(tpl, "alternative", planEntry, index === 0));
    });
  }

  const answered = [route?.targetLevel, route?.highestEducation, route && route.languageLevels.length > 0 ? "x" : undefined].filter(Boolean).length;
  const confidence: PersonalRoute["confidence"] = answered >= 3 ? "high" : answered === 2 ? "medium" : "low";

  return {
    entry: derived,
    target,
    segments,
    alternatives,
    notes,
    studyLanguage,
    requiredLanguageLevel: RANK_LABEL[required] ?? "",
    targetStartYear: route?.targetStartYear,
    confidence
  };
}
