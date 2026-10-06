import type { CefrLevel, RouteBackground } from "../types";

/**
 * Pure helpers that turn the optional route answers (target, education,
 * languages) into ranking signals. Everything here is "absent means no
 * signal": a user who skipped a question is never penalised for it.
 */

/** Which `professions.profession_type` values satisfy each stated target. */
export const TARGET_TYPES: Record<string, string[]> = {
  apprenticeship: ["apprenticeship_efz", "apprenticeship_eba"],
  berufsmatura: ["apprenticeship_efz"],
  higher_vocational: ["fachausweis", "diplom", "hf_diploma"],
  university_of_applied_sciences: ["fh_bachelor"],
  university: ["university"]
};

/** Qualifications that need an earlier one first. */
const NEEDS_PRIOR_QUALIFICATION = new Set(["fh_bachelor", "university", "hf_diploma", "fachausweis", "diplom"]);
const LOW_EDUCATION = new Set(["none", "compulsory_school"]);

export type ProfessionRouteSignal = "target-match" | "prerequisite-gap" | null;

export function professionRouteSignal(
  route: RouteBackground | undefined,
  professionType: string | undefined
): ProfessionRouteSignal {
  if (!route || !professionType) return null;
  const wanted = route.targetLevel ? TARGET_TYPES[route.targetLevel] : undefined;
  if (wanted?.includes(professionType)) return "target-match";
  // Only flag a gap when the user has not stated a target: otherwise a
  // deliberately ambitious goal would be ranked down for being ambitious.
  if (
    !route.targetLevel &&
    route.highestEducation &&
    LOW_EDUCATION.has(route.highestEducation) &&
    NEEDS_PRIOR_QUALIFICATION.has(professionType)
  ) {
    return "prerequisite-gap";
  }
  return null;
}

const CEFR_RANK: Record<CefrLevel, number> = { none: 0, A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6, native: 7 };
/** Level at which instruction in a language is realistic. */
export const STUDY_LEVEL_RANK = CEFR_RANK.B2;

const LANGUAGE_NAMES: Record<string, string> = { German: "de", French: "fr", Italian: "it", English: "en" };

export interface LanguageFit {
  kind: "fit" | "gap";
  language: string;
  level: CefrLevel;
}

/**
 * Compares the user's stated levels with the instruction language(s) of an
 * institution (`cantonalLanguage`, e.g. "German", "French and German").
 * Uses the best level among the institution's languages, so a bilingual
 * school does not count as a gap for a French speaker.
 */
export function languageFit(route: RouteBackground | undefined, instructionText: string | undefined): LanguageFit | null {
  if (!route || route.languageLevels.length === 0 || !instructionText) return null;
  const codes = Object.entries(LANGUAGE_NAMES)
    .filter(([name]) => instructionText.includes(name))
    .map(([, code]) => code);
  if (codes.length === 0) return null;
  const levelOf = (code: string): CefrLevel =>
    route.languageLevels.find(l => l.languageCode === code)?.level ?? "none";
  const best = codes.reduce((a, b) => (CEFR_RANK[levelOf(b)] > CEFR_RANK[levelOf(a)] ? b : a));
  const level = levelOf(best);
  return { kind: CEFR_RANK[level] >= STUDY_LEVEL_RANK ? "fit" : "gap", language: best, level };
}

/** Best level the user reports in a Swiss national language (de, fr, it). */
export function bestSwissLanguageRank(route: RouteBackground | undefined): number | null {
  if (!route || route.languageLevels.length === 0) return null;
  const ranks = route.languageLevels
    .filter(l => ["de", "fr", "it"].includes(l.languageCode))
    .map(l => CEFR_RANK[l.level]);
  return ranks.length ? Math.max(...ranks) : 0;
}
