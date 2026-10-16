import { describe, it, expect } from "vitest";
import { buildPersonalRoute, deriveEntry, languageOfCanton } from "./pathPlanner";
import type { LearningPath, RouteBackground, UserProfile } from "../types";

const codes = [
  "start_vocational_training",
  "lehre_berufsmatura_fachhochschule",
  "efz_ohne_berufsmatura_zur_fachhochschule",
  "gymnasium_quarta_bis_prima",
  "academic_matura_to_university",
  "matura_zur_fachhochschule",
  "passerelle_to_university",
  "vet_to_professional_education",
  "adult_berufsabschluss_nachholen",
  "learn_german_b2",
  "learn_french_b2",
  "recognise_foreign_qualification",
  "specialized_baccalaureate_to_uas"
];

function makePath(code: string, stepCount = 4): LearningPath {
  return {
    id: code,
    code,
    title: { en: code },
    steps: Array.from({ length: stepCount }, (_, i) => ({
      id: `${code}-${i + 1}`,
      title: { en: `${code} step ${i + 1}` },
      order: i + 1,
      stepType: "action"
    }))
  };
}

const templates = codes.map(c => makePath(c, c === "academic_matura_to_university" ? 10 : 4));

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    name: "T",
    email: "t@example.com",
    interests: [],
    goals: [],
    currentStage: "",
    language: "en",
    onboardingComplete: true,
    createdAt: new Date().toISOString(),
    ...overrides
  };
}
const route = (o: Partial<RouteBackground> = {}): RouteBackground => ({ languageLevels: [], ...o });
const de = (level: "A1" | "A2" | "B1" | "B2" | "C1") => [{ languageCode: "de", level, isSelfAssessed: true }];

describe("deriveEntry", () => {
  it("maps the highest education", () => {
    expect(deriveEntry(route({ highestEducation: "upper_secondary_vocational" }), null).entry).toBe("efz");
    expect(deriveEntry(route({ highestEducation: "upper_secondary_general" }), null).entry).toBe("matura");
    expect(deriveEntry(route({ highestEducation: "tertiary_professional" }), null).entry).toBe("hf");
  });

  it("treats low education plus age or work as an adult without qualification", () => {
    const now = new Date("2026-10-01");
    expect(deriveEntry(route({ highestEducation: "compulsory_school", birthYear: 1990 }), null, now).entry).toBe("no_qualification");
    expect(deriveEntry(route({ highestEducation: "compulsory_school", birthYear: 2010 }), null, now).entry).toBe("sek1");
    expect(deriveEntry(route({ highestEducation: "none", workExperienceYears: 5 }), null, now).entry).toBe("no_qualification");
  });

  it("falls back to the onboarding stage and flags it as assumed", () => {
    expect(deriveEntry(undefined, makeProfile({ currentStage: "stage_secondary" }))).toEqual({ entry: "sek1", assumed: true });
    expect(deriveEntry(undefined, makeProfile())).toEqual({ entry: "unknown", assumed: true });
  });
});

describe("languageOfCanton", () => {
  it("maps cantons to a study language", () => {
    expect(languageOfCanton("ZH")).toBe("de");
    expect(languageOfCanton("vd")).toBe("fr");
    expect(languageOfCanton("TI")).toBe("it");
    expect(languageOfCanton(undefined)).toBeUndefined();
  });
});

describe("buildPersonalRoute", () => {
  it("builds Lehre -> BM -> FH for a school student aiming at a university of applied sciences", () => {
    const r = buildPersonalRoute(
      route({ targetLevel: "university_of_applied_sciences", highestEducation: "compulsory_school", birthYear: 2011, languageLevels: de("C1") }),
      makeProfile(),
      templates,
      new Date("2026-10-01")
    );
    expect(r.segments.map(s => s.code)).toEqual(["lehre_berufsmatura_fachhochschule"]);
    expect(r.segments[0].steps.filter(s => s.isCurrent)).toHaveLength(1);
    expect(r.segments[0].steps[0].isCurrent).toBe(true);
    expect(r.alternatives.map(s => s.code)).toEqual(["gymnasium_quarta_bis_prima", "matura_zur_fachhochschule", "specialized_baccalaureate_to_uas"]);
    expect(r.confidence).toBe("high");
  });

  it("marks finished steps as done for someone who already has an EFZ", () => {
    const r = buildPersonalRoute(
      route({ targetLevel: "university_of_applied_sciences", highestEducation: "upper_secondary_vocational", languageLevels: de("C1") }),
      makeProfile(),
      templates
    );
    expect(r.segments[0].code).toBe("efz_ohne_berufsmatura_zur_fachhochschule");
    expect(r.segments[0].steps[0].status).toBe("done");
    expect(r.segments[0].steps[1].isCurrent).toBe(true);
  });

  it("puts a language segment first when the level is below the usual study level (C1 for German)", () => {
    const r = buildPersonalRoute(
      route({ targetLevel: "university", highestEducation: "upper_secondary_general", languageLevels: de("B2") }),
      makeProfile(),
      templates
    );
    expect(r.notes).toContain("language-gap");
    expect(r.requiredLanguageLevel).toBe("C1");
    expect(r.segments.map(s => s.code)).toEqual(["learn_german_b2", "academic_matura_to_university"]);
    expect(r.segments[0].steps[0].isCurrent).toBe(true);
    expect(r.segments[1].steps.every(s => s.status !== "todo")).toBe(true);
  });

  it("measures the language gap against the language of the preferred canton", () => {
    const r = buildPersonalRoute(
      route({ targetLevel: "university", highestEducation: "upper_secondary_general", languageLevels: de("C1") }),
      makeProfile({ preferredCanton: "VD" }),
      templates
    );
    expect(r.studyLanguage).toBe("fr");
    expect(r.segments[0].code).toBe("learn_french_b2");
  });

  it("starts with recognition of a foreign diploma that is not recognised yet", () => {
    const r = buildPersonalRoute(
      route({
        targetLevel: "university",
        highestEducation: "upper_secondary_general",
        highestEducationCountryCode: "UA",
        diplomaRecognitionStatus: "not_checked",
        languageLevels: de("C1")
      }),
      makeProfile(),
      templates
    );
    expect(r.notes).toContain("recognition-needed");
    expect(r.segments[0].code).toBe("recognise_foreign_qualification");
    expect(r.segments[1].steps.every(s => s.status !== "todo")).toBe(true);
  });

  it("does not add recognition once the diploma is recognised", () => {
    const r = buildPersonalRoute(
      route({ targetLevel: "university", highestEducation: "upper_secondary_general", highestEducationCountryCode: "DE", diplomaRecognitionStatus: "recognised", languageLevels: de("C1") }),
      makeProfile(),
      templates
    );
    expect(r.segments.map(s => s.code)).toEqual(["academic_matura_to_university"]);
  });

  it("offers orientation instead of a route when nothing is known", () => {
    const r = buildPersonalRoute(undefined, makeProfile(), templates);
    expect(r.segments).toHaveLength(0);
    expect(r.alternatives.length).toBeGreaterThan(0);
    expect(r.notes).toEqual(expect.arrayContaining(["entry-assumed", "target-missing"]));
    expect(r.confidence).toBe("low");
  });

  it("builds a language-first route for a language goal", () => {
    const r = buildPersonalRoute(route({ targetLevel: "language_course" }), makeProfile(), templates);
    expect(r.segments.map(s => s.code)).toEqual(["learn_german_b2"]);
  });

  it("skips templates that are missing or empty", () => {
    const sparse = templates.filter(t => t.code !== "lehre_berufsmatura_fachhochschule");
    const r = buildPersonalRoute(
      route({ targetLevel: "berufsmatura", highestEducation: "compulsory_school", birthYear: 2011, languageLevels: de("C1") }),
      makeProfile(),
      sparse,
      new Date("2026-10-01")
    );
    expect(r.segments).toHaveLength(0);
  });

  it("notes that a Matura holder does not need a Berufsmatura", () => {
    const r = buildPersonalRoute(route({ targetLevel: "berufsmatura", highestEducation: "upper_secondary_general", languageLevels: de("C1") }), makeProfile(), templates);
    expect(r.notes).toContain("matura-no-bm-needed");
    expect(r.segments[0].code).toBe("matura_zur_fachhochschule");
  });

  it("marks the bachelor steps done for a bachelor holder aiming at a university", () => {
    const r = buildPersonalRoute(route({ targetLevel: "university", highestEducation: "bachelor", languageLevels: de("C1") }), makeProfile(), templates);
    const steps = r.segments[0].steps;
    expect(steps.slice(0, 8).every(s => s.status === "done")).toBe(true);
    expect(steps[8].isCurrent).toBe(true);
  });
});
