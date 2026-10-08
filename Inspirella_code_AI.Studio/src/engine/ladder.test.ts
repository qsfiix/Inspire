import { describe, it, expect } from "vitest";
import { factLines, instantiateLadder, ladderApplies, lehrbeginnYear, phaseWindow, planBSeason, rankFirms, routeToLadderPath, windowLabel } from "./ladder";
import { buildPersonalRoute } from "./pathPlanner";
import { levelOfProfessionType, levelOfSubgroup } from "../components/GoalPicker";
import type { LearningPath, Profession, ProfessionFacts, TrainingCompany, UserProfile } from "../types";

const prof = { id: "p1", title: { de: "Informatikerin / Informatiker EFZ", en: "IT specialist EFZ" }, professionType: "apprenticeship_efz", category: "industry_technology_it" } as unknown as Profession;
const profile = (o: Partial<UserProfile> = {}) => ({ name: "t", email: "t@x.ch", interests: [], goals: [], currentStage: "stage_secondary", language: "de", onboardingComplete: true, createdAt: "2026-01-01", ...o }) as UserProfile;
const firm = (id: string, o: Partial<TrainingCompany> = {}): TrainingCompany => ({ id, name: id, sectorCodes: [], languages: ["de"], professionIds: ["p1"], ...o });

describe("ladderApplies", () => {
  it("fits a school leaver who wants an apprenticeship profession", () => {
    expect(ladderApplies(prof, { languageLevels: [], highestEducation: "compulsory_school", birthYear: new Date().getFullYear() - 15 }, profile())).toBe(true);
  });
  it("does not fit someone who already holds an EFZ or a non-apprenticeship profession", () => {
    expect(ladderApplies(prof, { languageLevels: [], highestEducation: "upper_secondary_vocational" }, profile())).toBe(false);
    expect(ladderApplies({ professionType: "university" }, { languageLevels: [] }, profile())).toBe(false);
  });
});

describe("instantiateLadder", () => {
  const template = {
    id: "t1",
    title: { de: "Vorlage" },
    steps: [{ id: "s1", title: { de: "Orientieren" }, description: { de: "Du lernst {beruf} kennen." }, substeps: [{ id: "s1a", title: { de: "Den Beruf kennenlernen" }, description: { de: "Prüfe {beruf}." } }] }]
  } as unknown as LearningPath;
  it("fills the profession into the texts and gives the path its own id", () => {
    const path = instantiateLadder(template, prof, "de");
    expect(path.id).toBe("t1:p1");
    expect(path.steps[0].description?.de).toBe("Du lernst Informatikerin / Informatiker EFZ kennen.");
    expect(path.steps[0].substeps?.[0].description?.de).toBe("Prüfe Informatikerin / Informatiker EFZ.");
    expect(path.targetProfessionId).toBe("p1");
  });
});

describe("rankFirms", () => {
  it("only suggests firms that name the profession and ranks by canton, language and interest", () => {
    const firms = [
      firm("other-profession", { professionIds: ["p2"], canton: "ZH" }),
      firm("far", { canton: "SG" }),
      firm("near", { canton: "ZH", sectorCodes: ["industry_technology_it"], schnupperlehre: true })
    ];
    const ranked = rankFirms(firms, prof, profile({ preferredCanton: "ZH", interests: ["tech"] }));
    expect(ranked.map(r => r.firm.id)).toEqual(["near", "far"]);
    expect(ranked[0].reasons).toEqual(expect.arrayContaining(["canton", "language", "interest", "schnupperlehre"]));
  });
  it("prefers firms with a Schnupperlehre for the schnupperlehre step", () => {
    const firms = [firm("a", { canton: "ZH" }), firm("b", { canton: "ZH", schnupperlehre: true })];
    expect(rankFirms(firms, prof, profile({ preferredCanton: "ZH" }), { schnupperlehre: true })[0].firm.id).toBe("b");
  });
});

describe("factLines", () => {
  const facts: ProfessionFacts = { professionId: "p1", durationYears: 4, schoolLevel: "obligatorische Schule", aptitudeTests: ["Multicheck"], bmDirections: [], fhFollowups: [], weiterbildung: ["HF Informatik"], typicalWorkplaces: "Büro" };
  it("splits overview and requirements without repeating lines", () => {
    expect(factLines(facts, null)).toEqual(["Lehrdauer: 4 Jahre", "Arbeitsorte: Büro", "Danach zum Beispiel: HF Informatik"]);
    expect(factLines(facts, "requirements")).toEqual(["Schulniveau: obligatorische Schule", "Eignungstests: Multicheck"]);
    expect(factLines(undefined, null)).toEqual([]);
  });
});

describe("time windows", () => {
  const oct2026 = new Date(2026, 9, 8);
  it("takes the wished start year, otherwise 16th birthday, otherwise next August", () => {
    expect(lehrbeginnYear({ languageLevels: [], targetStartYear: 2028 }, oct2026)).toEqual({ year: 2028, assumed: false });
    expect(lehrbeginnYear({ languageLevels: [], birthYear: 2011 }, oct2026)).toEqual({ year: 2027, assumed: false });
    expect(lehrbeginnYear({ languageLevels: [], birthYear: 2005 }, oct2026)).toEqual({ year: 2027, assumed: true });
    expect(lehrbeginnYear(undefined, oct2026)).toEqual({ year: 2027, assumed: true });
    expect(lehrbeginnYear(undefined, new Date(2026, 3, 1)).year).toBe(2026);
  });
  it("places the phases before the start and reports where we are", () => {
    const w = phaseWindow("schnuppern", 2027, oct2026)!;
    expect(w.from.getFullYear()).toBe(2026);
    expect(w.from.getMonth()).toBe(0);
    expect(w.to!.getMonth()).toBe(8);
    expect(w.state).toBe("past");
    expect(phaseWindow("dossier", 2027, new Date(2026, 6, 1))!.state).toBe("now");
    expect(phaseWindow("bewerben", 2027, oct2026)!.state).toBe("now");
    expect(phaseWindow("lehre", 2027, oct2026)!.to).toBeNull();
    expect(phaseWindow("fh", 2027)).toBeUndefined();
  });
  it("formats a label in the user's language and flags assumed years", () => {
    const w = phaseWindow("orient", 2027, oct2026)!;
    const de = windowLabel(w, 2027, true, "de");
    expect(de.text).toContain("August 2027");
    expect(de.note).toBeDefined();
    expect(windowLabel(w, 2027, false, "fr").text).toContain("août 2027");
  });
  it("raises the Plan B flag only between March and August of the start year", () => {
    expect(planBSeason(2027, new Date(2027, 1, 15))).toBe(false);
    expect(planBSeason(2027, new Date(2027, 3, 15))).toBe(true);
    expect(planBSeason(2027, new Date(2027, 7, 15))).toBe(false);
  });
});

describe("goals that are not a profession", () => {
  const mk = (code: string, n: number): LearningPath =>
    ({ id: code, code, title: { de: code }, steps: Array.from({ length: n }, (_, i) => ({ id: `${code}-${i + 1}`, title: { de: `${code} ${i + 1}` }, order: i + 1 })) }) as unknown as LearningPath;

  it("plans a Gymnasium goal for a school leaver and shows each step as a tread", () => {
    const templates = [mk("gymnasium_quarta_bis_prima", 8)];
    const planned = buildPersonalRoute({ languageLevels: [], highestEducation: "compulsory_school", birthYear: 2011, targetLevel: "gymnasium" } as any, profile(), templates);
    expect(planned.segments.map(s => s.code)).toEqual(["gymnasium_quarta_bis_prima"]);
    const path = routeToLadderPath(planned, "Gymnasium (Matura)", "de")!;
    expect(path.code).toBe("route");
    expect(path.steps).toHaveLength(8);
  });

  it("groups a long route by segment", () => {
    const templates = [mk("gymnasium_quarta_bis_prima", 8), mk("academic_matura_to_university", 10)];
    const planned = buildPersonalRoute({ languageLevels: [], highestEducation: "compulsory_school", birthYear: 2011, targetLevel: "university" } as any, profile(), templates);
    const path = routeToLadderPath(planned, "Universität", "de")!;
    expect(path.steps).toHaveLength(2);
    expect(path.steps[0].substeps).toHaveLength(8);
  });

  it("maps professions and schools to the level they lead to", () => {
    expect(levelOfProfessionType("apprenticeship_efz")).toBe("apprenticeship");
    expect(levelOfProfessionType("fachausweis")).toBe("higher_vocational");
    expect(levelOfProfessionType("other")).toBeUndefined();
    expect(levelOfSubgroup("gymnasium")).toBe("gymnasium");
    expect(levelOfSubgroup("federal_institute_of_technology")).toBe("university");
    expect(levelOfSubgroup("fachmittelschule")).toBe("university_of_applied_sciences");
  });
});
