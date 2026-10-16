import { describe, it, expect } from "vitest";
import { EducationEngine } from "./EducationEngine";
import { UserProfile, Profession, Institution, ResourceItem } from "../types";

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
  return {
    id: "prof-1",
    title: { en: "Generic Profession" },
    ...overrides
  };
}

const noInstitutions: Institution[] = [];
const noResources: ResourceItem[] = [];

describe("EducationEngine.determinePathFocus (via run())", () => {
  it("picks the rule whose goal matches, in config order", () => {
    const profile = makeProfile({ goals: ["study_active"], interests: ["academic"] });
    const engine = new EducationEngine(profile, [], noInstitutions, noResources);
    expect(engine.run().pathFocus).toBe("Academic Excellence Track");
  });

  it("falls back to the default focus when nothing matches", () => {
    const profile = makeProfile({ goals: ["nonexistent_goal"], interests: [] });
    const engine = new EducationEngine(profile, [], noInstitutions, noResources);
    expect(engine.run().pathFocus).toBe("General Educational Exploration");
  });

  it("localizes the label to the profile's own language", () => {
    const profile = makeProfile({ goals: ["study_active"], interests: ["academic"], language: "de" });
    const engine = new EducationEngine(profile, [], noInstitutions, noResources);
    expect(engine.run().pathFocus).toBe("Akademische Exzellenz");
  });
});

describe("EducationEngine.determineNextBestStep (via run())", () => {
  it("matches the rule for the user's current stage", () => {
    const profile = makeProfile({ currentStage: "stage_university" });
    const engine = new EducationEngine(profile, [], noInstitutions, noResources);
    expect(engine.run().nextBestStep).toBe("Explore Tertiary B (Higher Professional) or Master programs");
  });

  it("falls back to the default next step for an unknown stage", () => {
    const profile = makeProfile({ currentStage: "stage_unknown" });
    const engine = new EducationEngine(profile, [], noInstitutions, noResources);
    expect(engine.run().nextBestStep).toBe("Schedule a consultation or review official admission portals");
  });
});

describe("EducationEngine profession scoring", () => {
  it("ranks a verified, high-demand, interest-aligned profession above a plain one", () => {
    const profile = makeProfile({ interests: ["technology"] });
    const strong = makeProfession({
      id: "strong",
      title: { en: "Software Engineer" },
      category: "technology",
      status: "verified",
      demandLevel: "high"
    });
    const weak = makeProfession({ id: "weak", title: { en: "Unrelated Role" } });

    const engine = new EducationEngine(profile, [weak, strong], noInstitutions, noResources);
    const [first, second] = engine.run().professions;

    expect(first.profession.id).toBe("strong");
    expect(second.profession.id).toBe("weak");
    expect(first.score).toBeGreaterThan(second.score);
  });

  it("penalizes draft/needs_review professions and discloses it in matchReasons", () => {
    const profile = makeProfile();
    const draft = makeProfession({ id: "draft-one", status: "draft" });
    const engine = new EducationEngine(profile, [draft], noInstitutions, noResources);
    const [scored] = engine.run().professions;

    expect(scored.score).toBeLessThan(0);
    expect(scored.matchReasons).toContain("Provisional data.");
  });

  it("never returns more than the top 3 professions", () => {
    const profile = makeProfile();
    const many = Array.from({ length: 10 }, (_, i) => makeProfession({ id: `p${i}`, title: { en: `Profession ${i}` } }));
    const engine = new EducationEngine(profile, many, noInstitutions, noResources);
    expect(engine.run().professions.length).toBeLessThanOrEqual(3);
  });

  it("matches the apprenticeship track only when the profile actually wants it", () => {
    const vetProfile = makeProfile({ interests: ["vocational"] });
    const vetProfession = makeProfession({ isApprenticeshipPath: true });
    const vetEngine = new EducationEngine(vetProfile, [vetProfession], noInstitutions, noResources);
    expect(vetEngine.run().professions[0].matchReasons).toContain("Matches practical apprenticeship track.");

    const academicProfile = makeProfile({ interests: ["academic"] });
    const academicProfession = makeProfession({ isApprenticeshipPath: false });
    const academicEngine = new EducationEngine(academicProfile, [academicProfession], noInstitutions, noResources);
    expect(academicEngine.run().professions[0].matchReasons).toContain("Matches your academic focus.");
  });

  it("never calls an EFZ apprenticeship an academic match, even without the flag", () => {
    const academicProfile = makeProfile({ interests: ["academic"] });
    const unflaggedEfz = makeProfession({ title: { en: "Fachfrau / Fachmann Operationstechnik EFZ" } });
    const reasons = new EducationEngine(academicProfile, [unflaggedEfz], noInstitutions, noResources).run().professions[0].matchReasons;
    expect(reasons).not.toContain("Matches your academic focus.");
  });

  it("treats a profession with unknown track as neither academic nor vocational", () => {
    const academicProfile = makeProfile({ interests: ["academic"] });
    const unknown = makeProfession({ title: { en: "Generic Profession" } });
    const reasons = new EducationEngine(academicProfile, [unknown], noInstitutions, noResources).run().professions[0].matchReasons;
    expect(reasons).not.toContain("Matches your academic focus.");
  });

  it("matches interests as whole words, not inside German compounds", () => {
    const techProfile = makeProfile({ interests: ["tech"] });
    const compounds = [
      makeProfession({ id: "op", title: { en: "Operationstechnik EFZ" } }),
      makeProfession({ id: "kf", title: { en: "Technische Kauffrau" } })
    ];
    const result = new EducationEngine(techProfile, compounds, noInstitutions, noResources).run();
    for (const p of result.professions) expect(p.matchReasons).not.toContain("Matches interest area.");

    const realTech = makeProfession({ title: { en: "Tech Support Specialist" } });
    const hit = new EducationEngine(techProfile, [realTech], noInstitutions, noResources).run().professions[0];
    expect(hit.matchReasons).toContain("Matches interest area.");
  });
});

describe("EducationEngine ranking is language-independent", () => {
  it("ranks professions the same whatever the UI language", () => {
    // "Business" appears only in the English title; the FR title has no keyword.
    const professions = [
      makeProfession({ id: "a", title: { de: "Kauffrau / Kaufmann EFZ", en: "Business Administrator EFZ", fr: "Employée / Employé de commerce CFC" } }),
      makeProfession({ id: "b", title: { de: "Tänzerin / Tänzer", en: "Dancer", fr: "Danseuse / Danseur" } })
    ];
    const rank = (language: "en" | "fr" | "de") =>
      new EducationEngine(makeProfile({ interests: ["business"], language }), professions, noInstitutions, noResources)
        .run().professions.map(p => p.profession.id);
    expect(rank("fr")).toEqual(rank("en"));
    expect(rank("de")).toEqual(rank("en"));
    expect(rank("en")[0]).toBe("a");
  });
});
