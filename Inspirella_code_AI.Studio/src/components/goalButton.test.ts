import { describe, it, expect } from "vitest";
import { goalPatch } from "./GoalButton";
import type { Institution, Profession } from "../types";

describe("goalPatch", () => {
  it("makes a profession the goal and derives the level from its type", () => {
    const p = { id: "p1", title: { de: "Informatiker EFZ" }, professionType: "apprenticeship_efz" } as unknown as Profession;
    expect(goalPatch({ kind: "profession", profession: p })).toEqual({ targetProfessionId: "p1", targetInstitutionId: undefined, targetLevel: "apprenticeship" });
  });

  it("clears the old level when the profession type has none", () => {
    const p = { id: "p2", title: { de: "X" }, professionType: "other" } as unknown as Profession;
    expect(goalPatch({ kind: "profession", profession: p })).toEqual({ targetProfessionId: "p2", targetInstitutionId: undefined, targetLevel: undefined });
  });

  it("makes a school the goal and clears the profession target", () => {
    const i = { id: "i1", title: "KS Zürich Nord", subgroup: "gymnasium" } as unknown as Institution;
    expect(goalPatch({ kind: "institution", institution: i })).toEqual({ targetInstitutionId: "i1", targetProfessionId: undefined, targetLevel: "gymnasium" });
  });
});
