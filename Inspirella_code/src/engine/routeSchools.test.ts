import { describe, it, expect } from "vitest";
import { STEP_SCHOOLS, suggestSchools, FocusEntry } from "./routeSchools";
import type { Institution } from "../types";

const inst = (id: string, title: string, canton: string, subgroup: string, extra: Partial<Institution> = {}): Institution => ({
  id,
  title,
  canton,
  subgroup,
  ...extra
});

const institutions = [
  inst("a", "Berufsfachschule Zürich", "ZH", "vocational_school"),
  inst("b", "BBZ Bern", "BE", "vocational_school"),
  inst("c", "École professionnelle Lausanne", "VD", "vocational_school"),
  inst("d", "Gymnasium Bern", "BE", "gymnasium"),
  inst("e", "FHNW", "AG", "university_of_applied_sciences"),
  inst("f", "ZHAW", "ZH", "university_of_applied_sciences"),
  inst("g", "Hidden School", "ZH", "vocational_school", { isPublic: false })
];

const focus = new Map<string, FocusEntry[]>([
  ["a", [{ code: "berufsmaturitaet", note: "Berufsmaturität (BM1, BM2); Ausrichtungen: TALS, WD. Quelle: https://x" }, { code: "bm_tals" }, { code: "bm_wd" }]],
  ["b", [{ code: "berufsmaturitaet", note: "Berufsmaturität; Details bei der Schule erfragen." }]],
  ["c", [{ code: "berufsmaturitaet", note: "Berufsmaturität (BM1); Ausrichtungen: TALS." }, { code: "bm_tals" }]],
  ["g", [{ code: "berufsmaturitaet" }]]
]);

describe("suggestSchools", () => {
  const bm = STEP_SCHOOLS["lehre_berufsmatura_fachhochschule:8"];

  it("matches by focus area and skips non-public institutions", () => {
    const ids = suggestSchools(bm, institutions, focus).map(s => s.institution.id);
    expect(ids.sort()).toEqual(["a", "b", "c"]);
  });

  it("lists the own canton first, then the same language region, then the rest", () => {
    const ids = suggestSchools(bm, institutions, focus, { canton: "BE" }).map(s => s.institution.id);
    expect(ids).toEqual(["b", "a", "c"]);
    expect(suggestSchools(bm, institutions, focus, { canton: "BE" })[0].inCanton).toBe(true);
  });

  it("filters by orientation focus and reads BM types from the note", () => {
    const res = suggestSchools(bm, institutions, focus, { requireFocus: "bm_wd" });
    expect(res.map(s => s.institution.id)).toEqual(["a"]);
    expect(res[0].detail).toBe("BM1, BM2");
  });

  it("matches by subgroup", () => {
    const uas = suggestSchools(STEP_SCHOOLS["lehre_berufsmatura_fachhochschule:11"], institutions, focus, { canton: "ZH" });
    expect(uas.map(s => s.institution.title)).toEqual(["ZHAW", "FHNW"]);
    const gym = suggestSchools(STEP_SCHOOLS["gymnasium_quarta_bis_prima:2"], institutions, focus);
    expect(gym.map(s => s.institution.id)).toEqual(["d"]);
  });

  it("respects the limit", () => {
    expect(suggestSchools(bm, institutions, focus, { limit: 2 })).toHaveLength(2);
  });
});
