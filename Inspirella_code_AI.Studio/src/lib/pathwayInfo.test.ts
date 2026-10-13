import { describe, it, expect } from "vitest";
import { admissionRoutesForInstitution, admissionsFor, hfFieldLabel, hfFieldOf, nodesForGoal, programsFor, transitionsFrom, nodeLabel } from "./pathwayInfo";
import type { AdmissionCondition, EducationProgram, EducationTransition } from "../types";

const adm = (canton: string, route: string, institutionId?: string): AdmissionCondition => ({ id: canton + route + (institutionId ?? ""), code: "adm_" + canton + route, canton, route, institutionId, verified: true });
const prog = (canton: string, kind: string, title: string): EducationProgram => ({ id: canton + title, canton, kind, title, verified: true });
const tr = (from: string, to: string, kind: string, label: string): EducationTransition => ({ id: from + to + kind, from, to, kind, label, verified: true });

describe("pathway lookups", () => {
  it("tells a HF field rule from the general HF rule by its code", () => {
    expect(hfFieldOf({ ...adm("CH", "hf"), code: "adm_ch_hf_pflege" })).toBe("pflege");
    expect(hfFieldOf({ ...adm("CH", "hf"), code: "adm_ch_hf" })).toBeUndefined();
    expect(hfFieldLabel("pflege", "en")).toBe("Nursing");
  });

  it("picks admission routes from the school type and its focus flags", () => {
    expect(admissionRoutesForInstitution("gymnasium")).toEqual(["gymnasium_kurz", "gymnasium_lang"]);
    expect(admissionRoutesForInstitution("fachmittelschule")).toEqual(["fms"]);
    expect(admissionRoutesForInstitution("vocational_school", ["bm_wd"])).toEqual(["bms_bm1", "bms_bm2"]);
    expect(admissionRoutesForInstitution("vocational_school", [])).toEqual([]);
    expect(admissionRoutesForInstitution("university")).toEqual([]);
    expect(admissionRoutesForInstitution("university_of_applied_sciences")).toEqual(["fh"]);
    expect(admissionRoutesForInstitution("teacher_education")).toEqual(["ph"]);
  });

  it("filters admissions by canton and keeps the route order", () => {
    const all = [adm("ZH", "bms_bm2"), adm("BE", "fms"), adm("ZH", "fms"), adm("ZH", "gymnasium_kurz")];
    expect(admissionsFor(all, "zh", ["fms", "bms_bm2", "gymnasium_kurz"]).map(a => a.route)).toEqual(["gymnasium_kurz", "fms", "bms_bm2"]);
    expect(admissionsFor(all, undefined, ["fms"])).toEqual([]);
    expect(admissionsFor(all, "ZH", [])).toEqual([]);
  });

  it("matches national and school-specific rules for FH, PH and HF", () => {
    const all = [adm("CH", "fh"), adm("BE", "fh", "bfh"), adm("ZH", "fh", "zhaw"), adm("CH", "hf")];
    expect(admissionsFor(all, "BE", ["fh"], "bfh").map(a => a.institutionId ?? "national")).toEqual(["bfh", "national"]);
    expect(admissionsFor(all, undefined, ["fh"]).map(a => a.canton)).toEqual(["CH"]);
    expect(admissionsFor(all, "ZH", ["hf"]).length).toBe(1);
  });

  it("lists bridge offers of one canton, bridge year first", () => {
    const all = [prog("ZH", "other", "B"), prog("ZH", "bridge_year", "A"), prog("BE", "bridge_year", "X"), prog("ZH", "vorlehre", "C")];
    expect(programsFor(all, "ZH").map(p => p.title)).toEqual(["A", "C", "B"]);
    expect(programsFor(all, "ZH", ["vorlehre"]).map(p => p.title)).toEqual(["C"]);
    expect(programsFor(all, undefined)).toEqual([]);
  });

  it("maps a goal to transition nodes and ranks direct ways first", () => {
    expect(nodesForGoal("apprenticeship_efz", "university")).toEqual(["efz"]);
    expect(nodesForGoal(undefined, "gymnasium")).toEqual(["gym_matura"]);
    expect(nodesForGoal("other", "undecided")).toEqual([]);
    expect(nodesForGoal(undefined, undefined)).toEqual([]);
    const all = [tr("efz", "hf", "after_work", "HF"), tr("efz", "bm2", "direct", "BM2"), tr("sek1", "efz", "direct", "EFZ")];
    expect(transitionsFrom(all, nodesForGoal("apprenticeship_efz", undefined)).map(t => t.label)).toEqual(["BM2", "HF"]);
    expect(transitionsFrom(all, [])).toEqual([]);
  });

  it("labels nodes in each language and falls back to the raw code", () => {
    expect(nodeLabel("fh", "en")).toBe("University of applied sciences");
    expect(nodeLabel("uni", "fr")).toContain("Université");
    expect(nodeLabel("mystery", "de")).toBe("mystery");
  });
});
