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
