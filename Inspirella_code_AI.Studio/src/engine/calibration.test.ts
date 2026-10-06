import { describe, it, expect } from "vitest";
import { EducationEngine } from "./EducationEngine";
import { institutionFitsTarget, interestMatchesCategory } from "./routeSignals";
import { languageGapInfo } from "./pathPlanner";
import type { Institution, Profession, RouteBackground, UserProfile } from "../types";

const profile = (o: Partial<UserProfile> = {}): UserProfile =>
  ({ name: "T", email: "t@x.ch", interests: [], goals: [], currentStage: "stage_secondary", language: "de", onboardingComplete: true, createdAt: "2026-01-01", ...o }) as UserProfile;
const route = (o: Partial<RouteBackground> = {}): RouteBackground => ({ languageLevels: [], ...o }) as RouteBackground;

describe("interest to category mapping", () => {
  it("maps field interests to DB category codes", () => {
    expect(interestMatchesCategory(["tech"], "industry_technology_it")).toBe(true);
    expect(interestMatchesCategory(["business"], "economy_management_trade")).toBe(true);
    expect(interestMatchesCategory(["tech"], "media_communication")).toBe(false);
    expect(interestMatchesCategory(["academic"], "industry_technology_it")).toBe(false);
    expect(interestMatchesCategory(["tech"], undefined)).toBe(false);
  });

  it("ranks an IT profession above an arts one for a tech interest", () => {
    const mk = (id: string, category: string): Profession => ({ id, title: { de: id }, category, professionType: "fh_bachelor" }) as unknown as Profession;
    const result = new EducationEngine(
      profile({ interests: ["tech"] }),
      [mk("art", "media_communication"), mk("it", "industry_technology_it")],
      [],
      []
    ).run();
    expect(result.professions[0].profession.id).toBe("it");
  });
});

describe("institution target alignment", () => {
  it("matches subgroups to the stated target level", () => {
    expect(institutionFitsTarget(route({ targetLevel: "university" }), "university")).toBe(true);
    expect(institutionFitsTarget(route({ targetLevel: "university" }), "vocational_school")).toBe(false);
    expect(institutionFitsTarget(route({ targetLevel: "apprenticeship" }), "vocational_school")).toBe(true);
    expect(institutionFitsTarget(undefined, "university")).toBe(false);
  });

  it("puts a university of applied sciences above a technical vocational school for an FH target", () => {
    const mk = (id: string, title: string, subgroup: string): Institution =>
      ({ id, title, subgroup, category: "technical", canton: "ZH", description: { de: "" } }) as unknown as Institution;
    const result = new EducationEngine(
      profile({ interests: ["tech"], preferredCanton: "ZH" }),
      [],
      [mk("tbz", "Technische Berufsschule", "vocational_school"), mk("fh", "Hochschule", "university_of_applied_sciences")],
      [],
      route({ targetLevel: "university_of_applied_sciences" })
    ).run();
    expect(result.institutions[0].institution.id).toBe("fh");
  });
});

describe("next best step follows the user's situation", () => {
  const next = (p: Partial<UserProfile>, r: Partial<RouteBackground>) =>
    new EducationEngine(profile(p), [], [], [], route(r)).run().nextBestStep;

  it("puts a language gap first, with the level the target needs", () => {
    const text = next({ preferredCanton: "ZH" }, {
      highestEducation: "upper_secondary_general", targetLevel: "university", languageLevels: [{ languageCode: "de", level: "B2" }]
    } as Partial<RouteBackground>);
    expect(text).toContain("C1");
  });

  it("points an EFZ holder aiming for an FH at the Berufsmatura", () => {
    expect(next({ currentStage: "stage_professional" }, { highestEducation: "upper_secondary_vocational", targetLevel: "university_of_applied_sciences" })).toMatch(/Berufsmatur/);
  });

  it("points a Bachelor holder at master programmes", () => {
    expect(next({ currentStage: "stage_university" }, { highestEducation: "bachelor", targetLevel: "university" })).toMatch(/Master/);
  });
});

describe("languageGapInfo", () => {
  it("reports no gap without any stated language", () => {
    expect(languageGapInfo(route(), profile(), "university").gap).toBe(false);
  });

  it("uses the canton's language", () => {
    const info = languageGapInfo(route({ languageLevels: [{ languageCode: "fr", level: "A2" }] } as Partial<RouteBackground>), profile({ preferredCanton: "VD" }), "university_of_applied_sciences");
    expect(info.studyLanguage).toBe("fr");
    expect(info.gap).toBe(true);
  });
});
