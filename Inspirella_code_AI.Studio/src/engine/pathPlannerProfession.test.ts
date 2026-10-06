import { describe, it, expect } from "vitest";
import { buildPersonalRoute } from "./pathPlanner";
import { suggestSchools } from "./routeSchools";
import type { Institution, LearningPath, RouteBackground, UserProfile } from "../types";

const path = (code: string, extra: Partial<LearningPath> = {}): LearningPath => ({
  id: code,
  code,
  title: { en: code },
  steps: [1, 2, 3].map(i => ({ id: `${code}-${i}`, title: { en: `${code} ${i}` }, order: i })),
  ...extra
});

const templates = [
  path("start_vocational_training"),
  path("lehre_berufsmatura_fachhochschule"),
  path("vet_to_professional_education"),
  path("become_baker", { pathType: "profession", targetProfessionId: "prof-baker" })
];

const profile: UserProfile = {
  name: "T",
  email: "t@example.com",
  interests: [],
  goals: [],
  currentStage: "stage_secondary",
  language: "en",
  onboardingComplete: true,
  createdAt: new Date().toISOString()
};
const route = (o: Partial<RouteBackground> = {}): RouteBackground => ({ languageLevels: [], ...o });

describe("buildPersonalRoute with a chosen profession", () => {
  it("derives the target level from the profession type when none was stated", () => {
    const r = buildPersonalRoute(
      route({ highestEducation: "compulsory_school", birthYear: 2011, targetProfessionId: "prof-baker" }),
      profile,
      templates,
      new Date("2026-10-01"),
      "apprenticeship_efz"
    );
    expect(r.target).toBe("apprenticeship");
    expect(r.notes).not.toContain("target-missing");
    expect(r.segments.map(s => s.code)).toEqual(["start_vocational_training", "become_baker"]);
  });

  it("appends the profession path after the way to the right level", () => {
    const r = buildPersonalRoute(
      route({ targetLevel: "apprenticeship", highestEducation: "compulsory_school", birthYear: 2011, targetProfessionId: "prof-baker" }),
      profile,
      templates,
      new Date("2026-10-01"),
      "apprenticeship_efz"
    );
    const prof = r.segments.find(s => s.kind === "profession");
    expect(prof?.code).toBe("become_baker");
    expect(prof?.steps.every(s => s.status !== "todo")).toBe(true);
    expect(r.segments[0].steps[0].isCurrent).toBe(true);
  });

  it("makes the profession path current when it is the only segment", () => {
    const r = buildPersonalRoute(route({ targetProfessionId: "prof-baker" }), profile, [path("become_baker", { targetProfessionId: "prof-baker" })], new Date(), "apprenticeship_efz");
    // entry is assumed (school student), but with no rule templates only the profession path remains
    const prof = r.segments.find(s => s.kind === "profession");
    expect(prof).toBeDefined();
    expect(prof?.steps[0].isCurrent).toBe(true);
  });

  it("warns when the profession sits on another level than the stated goal", () => {
    const r = buildPersonalRoute(
      route({ targetLevel: "university_of_applied_sciences", highestEducation: "compulsory_school", birthYear: 2011 }),
      profile,
      templates,
      new Date("2026-10-01"),
      "apprenticeship_efz"
    );
    expect(r.notes).toContain("profession-level-mismatch");
    expect(r.target).toBe("university_of_applied_sciences");
  });

  it("is unchanged without a chosen profession", () => {
    const a = buildPersonalRoute(route({ targetLevel: "apprenticeship", highestEducation: "compulsory_school", birthYear: 2011 }), profile, templates, new Date("2026-10-01"));
    expect(a.segments.map(s => s.code)).toEqual(["start_vocational_training"]);
    expect(a.notes).not.toContain("profession-level-mismatch");
  });
});

describe("suggestSchools by profession links", () => {
  const inst = (id: string, title: string, canton: string): Institution => ({ id, title, canton, subgroup: "vocational_school" });
  const all = [inst("1", "School A", "ZH"), inst("2", "School B", "BE"), inst("3", "School C", "BE")];

  it("lists only the linked institutions, own canton first", () => {
    const res = suggestSchools({ ids: new Set(["2", "3", "1"]) }, all, new Map(), { canton: "BE" });
    expect(res.map(s => s.institution.id)).toEqual(["2", "3", "1"]);
    const only = suggestSchools({ ids: new Set(["1"]) }, all, new Map());
    expect(only.map(s => s.institution.id)).toEqual(["1"]);
  });
});
