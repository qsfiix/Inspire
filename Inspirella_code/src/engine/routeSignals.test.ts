import { describe, it, expect } from "vitest";
import { EducationEngine } from "./EducationEngine";
import { languageFit, professionRouteSignal } from "./routeSignals";
import { UserProfile, Profession, Institution, ResourceItem, RouteBackground } from "../types";

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    name: "Test User",
    email: "test@example.com",
    interests: [],
    goals: [],
    currentStage: "stage_secondary",
    language: "en",
    onboardingComplete: true,
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

function makeProfession(overrides: Partial<Profession> = {}): Profession {
  return { id: "p", title: { en: "Generic Profession" }, status: "verified", ...overrides };
}

function makeInstitution(overrides: Partial<Institution> = {}): Institution {
  return {
    id: "i",
    title: "Test School",
    description: { en: "A school." },
    status: "verified",
    ...overrides
  } as Institution;
}

const route = (overrides: Partial<RouteBackground> = {}): RouteBackground => ({ languageLevels: [], ...overrides });
const noResources: ResourceItem[] = [];

describe("professionRouteSignal", () => {
  it("matches the stated target level", () => {
    expect(professionRouteSignal(route({ targetLevel: "university_of_applied_sciences" }), "fh_bachelor")).toBe("target-match");
    expect(professionRouteSignal(route({ targetLevel: "higher_vocational" }), "fachausweis")).toBe("target-match");
    expect(professionRouteSignal(route({ targetLevel: "apprenticeship" }), "university")).toBeNull();
  });

  it("gives no signal when the user skipped the questions", () => {
    expect(professionRouteSignal(undefined, "fh_bachelor")).toBeNull();
    expect(professionRouteSignal(route(), "fh_bachelor")).toBeNull();
    expect(professionRouteSignal(route({ targetLevel: "undecided" }), "fh_bachelor")).toBeNull();
  });

  it("flags a missing prerequisite only when no target was stated", () => {
    const low = route({ highestEducation: "compulsory_school" });
    expect(professionRouteSignal(low, "fh_bachelor")).toBe("prerequisite-gap");
    expect(professionRouteSignal(low, "apprenticeship_efz")).toBeNull();
    expect(professionRouteSignal({ ...low, targetLevel: "university" }, "university")).toBe("target-match");
  });
});

describe("languageFit", () => {
  it("fits at B2 or above in the language of instruction", () => {
    const r = route({ languageLevels: [{ languageCode: "de", level: "B2", isSelfAssessed: true }] });
    expect(languageFit(r, "German")?.kind).toBe("fit");
  });

  it("reports a gap below B2", () => {
    const r = route({ languageLevels: [{ languageCode: "de", level: "A2", isSelfAssessed: true }] });
    expect(languageFit(r, "German")).toMatchObject({ kind: "gap", language: "de", level: "A2" });
  });

  it("uses the best level for bilingual institutions", () => {
    const r = route({
      languageLevels: [
        { languageCode: "de", level: "A1", isSelfAssessed: true },
        { languageCode: "fr", level: "C1", isSelfAssessed: true }
      ]
    });
    expect(languageFit(r, "French and German")?.kind).toBe("fit");
  });

  it("gives no signal without stated levels or an instruction language", () => {
    expect(languageFit(route(), "German")).toBeNull();
    expect(languageFit(route({ languageLevels: [{ languageCode: "de", level: "B2", isSelfAssessed: true }] }), undefined)).toBeNull();
  });
});

describe("EducationEngine with route answers", () => {
  it("ranks professions of the target level first", () => {
    const fh = makeProfession({ id: "fh", professionType: "fh_bachelor" });
    const efz = makeProfession({ id: "efz", professionType: "apprenticeship_efz" });
    const engine = new EducationEngine(makeProfile(), [efz, fh], [], noResources, route({ targetLevel: "university_of_applied_sciences" }));
    const top = engine.run().professions[0];
    expect(top.profession.id).toBe("fh");
    expect(top.matchReasons).toContain("Fits the level you are aiming for.");
  });

  it("does not change the ranking without route answers", () => {
    const a = makeProfession({ id: "a", professionType: "fh_bachelor" });
    const b = makeProfession({ id: "b", professionType: "apprenticeship_efz" });
    const withRoute = new EducationEngine(makeProfile(), [a, b], [], noResources, route()).run().professions.map(p => p.profession.id);
    const without = new EducationEngine(makeProfile(), [a, b], [], noResources).run().professions.map(p => p.profession.id);
    expect(withRoute).toEqual(without);
  });

  it("prefers institutions whose language the user can study in", () => {
    const de = makeInstitution({ id: "de", cantonalLanguage: "German" });
    const fr = makeInstitution({ id: "fr", cantonalLanguage: "French" });
    const r = route({ languageLevels: [{ languageCode: "fr", level: "C1", isSelfAssessed: true }, { languageCode: "de", level: "A1", isSelfAssessed: true }] });
    const result = new EducationEngine(makeProfile(), [], [de, fr], noResources, r).run();
    expect(result.institutions[0].institution.id).toBe("fr");
    expect(result.institutions[1].matchReasons.join(" ")).toContain("not reached B2");
  });

  it("suggests building the language first when the level is low for a study goal", () => {
    const r = route({ targetLevel: "university", languageLevels: [{ languageCode: "de", level: "A1", isSelfAssessed: true }] });
    expect(new EducationEngine(makeProfile(), [], [], noResources, r).run().nextBestStep).toMatch(/language level/i);
  });
});
