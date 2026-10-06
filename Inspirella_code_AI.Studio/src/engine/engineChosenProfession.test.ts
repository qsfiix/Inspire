import { describe, it, expect } from "vitest";
import { EducationEngine } from "./EducationEngine";
import type { Profession, UserProfile } from "../types";

const profile: UserProfile = {
  name: "T",
  email: "t@example.com",
  interests: ["tech"],
  goals: ["study_active"],
  currentStage: "stage_secondary",
  language: "en",
  onboardingComplete: true,
  createdAt: new Date().toISOString()
};

const prof = (id: string, extra: Partial<Profession> = {}): Profession => ({ id, title: { en: id }, status: "verified", ...extra });

describe("EducationEngine with a chosen target profession", () => {
  it("ranks the chosen profession first even when others score higher", () => {
    const strong = prof("strong", { category: "technology", demandLevel: "high", isApprenticeshipPath: true });
    const chosen = prof("chosen", { status: "draft" });
    const engine = new EducationEngine(profile, [strong, chosen], [], [], { languageLevels: [], targetProfessionId: "chosen" });
    const top = engine.run().professions;
    expect(top[0].profession.id).toBe("chosen");
    expect(top[0].matchReasons[0]).toBe("Your chosen target profession.");
    expect(top[1].profession.id).toBe("strong");
  });

  it("changes nothing when no profession was chosen", () => {
    const a = prof("a", { category: "technology" });
    const b = prof("b");
    const plain = new EducationEngine(profile, [b, a], [], []).run().professions.map(p => p.profession.id);
    const withRoute = new EducationEngine(profile, [b, a], [], [], { languageLevels: [] }).run().professions.map(p => p.profession.id);
    expect(withRoute).toEqual(plain);
  });
});
