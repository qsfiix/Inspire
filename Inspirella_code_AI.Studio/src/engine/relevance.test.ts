import { describe, it, expect } from "vitest";
import { EducationEngine } from "./EducationEngine";
import { levelFitAdjustment, titleMatchesInterestTopic } from "./routeSignals";
import type { Profession, RouteBackground, UserProfile } from "../types";

const profile = (o: Partial<UserProfile> = {}): UserProfile =>
  ({ name: "T", email: "t@x.ch", interests: [], goals: [], currentStage: "stage_university", language: "de", onboardingComplete: true, createdAt: "2026-01-01", ...o }) as UserProfile;
const prof = (id: string, title: string, professionType: string, category = "industry_technology_it"): Profession =>
  ({ id, title: { de: title }, category, professionType }) as unknown as Profession;

// The audit case: a university student interested in tech and academic topics got
// Apron Controller, a Glass project lead and a ventilation EBA, all tied.
const CATALOG = [
  prof("a", "Apron Controllerin / Apron Controller", "other"),
  prof("b", "Projektleiterin / Projektleiter Glas mit eidg. Fachausweis", "fachausweis"),
  prof("c", "Lüftungsanlagenpraktikerin / Lüftungsanlagenpraktiker EBA", "apprenticeship_eba"),
  prof("d", "Maler EFZ", "apprenticeship_efz"),
  prof("e", "Data Scientist", "university"),
  prof("f", "Informatikerin / Informatiker FH", "fh_bachelor")
];

describe("recommendations fit field and level", () => {
  it("shows a student of tech field professions at their level, not trades in the same sector", () => {
    const top = new EducationEngine(profile({ interests: ["academic", "tech"] }), CATALOG, [], []).run().professions.map(p => p.profession.id);
    expect(top).toContain("e");
    expect(top).toContain("f");
    expect(top).not.toContain("c"); // Berufsattest
    expect(top).not.toContain("d"); // EFZ trade
    expect(top).not.toContain("a");
  });

  it("marks a sector-only match as field and a title match as specific", () => {
    const res = new EducationEngine(profile({ interests: ["tech"], currentStage: "stage_secondary" }), CATALOG, [], []).run();
    const byId = Object.fromEntries(res.professions.map(p => [p.profession.id, p]));
    expect(byId.e?.fit ?? byId.f?.fit).toBe("specific");
    const trades = new EducationEngine(profile({ interests: ["tech"], currentStage: "stage_secondary" }), [CATALOG[0]], [], []).run();
    expect(trades.professions[0].fit).toBe("field");
  });

  it("does not rank a two-year Berufsattest first for someone who already holds an EFZ", () => {
    expect(levelFitAdjustment("efz", "apprenticeship_eba", [])).toBeLessThan(0);
    expect(levelFitAdjustment("sek1", "apprenticeship_eba", [])).toBe(0);
  });

  it("leaves the choice to the stated target", () => {
    const route = { languageLevels: [], targetLevel: "apprenticeship" } as RouteBackground;
    expect(levelFitAdjustment("matura", "apprenticeship_efz", [], route.targetLevel)).toBe(0);
  });

  it("matches topic words at the start of a word only", () => {
    expect(titleMatchesInterestTopic(["tech"], "Softwareentwicklerin")).toBe(true);
    expect(titleMatchesInterestTopic(["tech"], "Weberin / Weber EFZ")).toBe(false);
    expect(titleMatchesInterestTopic(["tech"], "Apron Controllerin")).toBe(false);
    expect(titleMatchesInterestTopic(["business"], "Kauffrau / Kaufmann EFZ")).toBe(true);
  });

  it("breaks ties without depending on the order of the catalog", () => {
    const run = (cat: Profession[]) => new EducationEngine(profile({ interests: ["tech"] }), cat, [], []).run().professions.map(p => p.profession.id);
    expect(run(CATALOG)).toEqual(run([...CATALOG].reverse()));
  });
});
