import type { Institution } from "../types";
import { languageOfCanton } from "./pathPlanner";

/**
 * Which schools to suggest at which step of a route template. Keyed by
 * `<path code>:<step order>`. A selector matches institutions by their
 * `institution_subgroup` and/or a focus-area code (`institution_focus_areas`).
 */
export interface SchoolSelector {
  /** Match any of these institution subgroups. */
  subgroups?: string[];
  /** Match institutions carrying this focus-area code. */
  focus?: string;
  /** Show the Berufsmaturität orientation filter (TALS, WD, ...). */
  bm?: boolean;
  /** Match exactly these institution ids (used for the schools of a chosen profession). */
  ids?: Set<string>;
}

export const STEP_SCHOOLS: Record<string, SchoolSelector> = {
  "lehre_berufsmatura_fachhochschule:8": { focus: "berufsmaturitaet", bm: true },
  "lehre_berufsmatura_fachhochschule:11": { subgroups: ["university_of_applied_sciences"] },
  "efz_ohne_berufsmatura_zur_fachhochschule:2": { focus: "berufsmaturitaet", bm: true },
  "gymnasium_quarta_bis_prima:2": { subgroups: ["gymnasium"] },
  "academic_matura_to_university:6": { subgroups: ["university", "federal_institute_of_technology"] },
  "matura_zur_fachhochschule:5": { subgroups: ["university_of_applied_sciences"] },
  "specialized_baccalaureate_to_uas:3": { focus: "fachmittelschule" },
  "specialized_baccalaureate_to_uas:6": { subgroups: ["university_of_applied_sciences", "teacher_education"] }
};

/**
 * Steps where the user's own canton matters: the route card shows the official
 * cantonal page for the topic (resources.canton_code + topic_code).
 */
export const STEP_CANTON_TOPICS: Record<string, string> = {
  "start_vocational_training:1": "lehrstellen",
  "start_vocational_training:2": "lehrstellen",
  "lehre_berufsmatura_fachhochschule:1": "lehrstellen",
  "lehre_berufsmatura_fachhochschule:2": "lehrstellen",
  "lehre_berufsmatura_fachhochschule:7": "berufsmaturitaet",
  "lehre_berufsmatura_fachhochschule:13": "stipends",
  "efz_ohne_berufsmatura_zur_fachhochschule:2": "berufsmaturitaet",
  "efz_ohne_berufsmatura_zur_fachhochschule:7": "stipends",
  "gymnasium_quarta_bis_prima:2": "gymnasium",
  "academic_matura_to_university:7": "stipends",
  "matura_zur_fachhochschule:8": "stipends",
  "specialized_baccalaureate_to_uas:3": "fms",
  "adult_berufsabschluss_nachholen:1": "adult_qualification",
  "adult_berufsabschluss_nachholen:2": "adult_qualification",
  "adult_berufsabschluss_nachholen:6": "stipends",
  "passerelle_to_university:2": "passerelle",
  "vet_to_professional_education:6": "stipends"
};

export const BM_ORIENTATIONS = ["tals", "nll", "wd", "gk", "gs"] as const;

export interface FocusEntry {
  code: string;
  note?: string;
}

export interface SuggestedSchool {
  institution: Institution;
  /** "BM1, BM2" and similar, read from the focus-area note when present. */
  detail?: string;
  inCanton: boolean;
}

export interface SuggestOptions {
  canton?: string;
  /** Narrow to institutions that carry this extra focus code (e.g. "bm_wd"). */
  requireFocus?: string;
  limit?: number;
}

const bmDetail = (note?: string): string | undefined => {
  const m = note?.match(/\((BM[^)]*)\)/);
  return m ? m[1] : undefined;
};

/**
 * Picks schools for a step. Own canton first, then the same language region,
 * then everything else; alphabetical inside each group so results are stable.
 */
export function suggestSchools(
  selector: SchoolSelector,
  institutions: Institution[],
  focusByInstitution: Map<string, FocusEntry[]>,
  options: SuggestOptions = {}
): SuggestedSchool[] {
  const canton = options.canton?.toUpperCase();
  const region = languageOfCanton(canton);

  const matches = institutions.filter(inst => {
    if (inst.isPublic === false) return false;
    const focus = focusByInstitution.get(inst.id) ?? [];
    const bySubgroup = selector.subgroups?.includes(inst.subgroup ?? "") ?? false;
    const byFocus = selector.focus ? focus.some(f => f.code === selector.focus) : false;
    const byId = selector.ids?.has(inst.id) ?? false;
    if (!bySubgroup && !byFocus && !byId) return false;
    if (options.requireFocus && !focus.some(f => f.code === options.requireFocus)) return false;
    return true;
  });

  const rank = (inst: Institution): number => {
    const c = inst.canton?.toUpperCase();
    if (canton && c === canton) return 0;
    if (region && languageOfCanton(c) === region) return 1;
    return 2;
  };

  const sorted = [...matches].sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title));
  const out = sorted.map<SuggestedSchool>(inst => ({
    institution: inst,
    detail: bmDetail(focusByInstitution.get(inst.id)?.find(f => f.code === "berufsmaturitaet")?.note),
    inCanton: !!canton && inst.canton?.toUpperCase() === canton
  }));
  return options.limit ? out.slice(0, options.limit) : out;
}
