import { describe, it, expect } from "vitest";
import { factLines, instantiateLadder, ladderApplies, rankFirms } from "./ladder";
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
