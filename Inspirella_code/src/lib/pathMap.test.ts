import { describe, it, expect } from "vitest";
import { buildEdges, canonicalNode, mapSize, nodeBox, nodeForEntry, shortestPath, NODE_LAYOUT } from "./pathMap";
import type { EducationTransition } from "../types";

const tr = (from: string, to: string, kind: string, id = from + to + kind): EducationTransition => ({ id, from, to, kind, label: id, verified: true });

describe("swiss path map", () => {
  it("merges BM1 and BM2 into one stage and keeps the most direct kind of a pair", () => {
    const edges = buildEdges([tr("efz", "bm2", "direct"), tr("sek1", "bm1", "direct"), tr("efz", "berufsmatura", "after_work", "x")]);
    expect(edges.map(e => `${e.from}>${e.to}`).sort()).toEqual(["efz>berufsmatura", "sek1>berufsmatura"]);
    expect(edges.find(e => e.from === "efz")?.kind).toBe("direct");
    expect(edges.find(e => e.from === "efz")?.transitions.length).toBe(2);
    expect(canonicalNode("bm1")).toBe("berufsmatura");
  });

  it("leaves out self loops, arrows into work and stages that are not on the map", () => {
    const edges = buildEdges([tr("efz", "efz", "shortened"), tr("fh", "work", "direct"), tr("efz", "mystery", "direct"), tr("sek1", "efz", "direct")]);
    expect(edges.map(e => `${e.from}>${e.to}`)).toEqual(["sek1>efz"]);
  });

  it("marks same-column and backward connections as arcs", () => {
    const edges = buildEdges([tr("gymnasium", "fms", "direct"), tr("gym_matura", "efz", "shortened"), tr("sek1", "gymnasium", "with_exam")]);
    expect(edges.find(e => e.to === "fms")?.loops).toBe(true);
    expect(edges.find(e => e.to === "efz")?.loops).toBe(true);
    expect(edges.find(e => e.to === "gymnasium")?.loops).toBe(false);
  });

  it("finds the cheapest way and prefers direct steps over detours", () => {
    const edges = buildEdges([
      tr("sek1", "efz", "direct"),
      tr("efz", "bm2", "direct"),
      tr("bm2", "fh", "direct"),
      tr("sek1", "gymnasium", "with_exam"),
      tr("gymnasium", "gym_matura", "direct"),
      tr("gym_matura", "fh", "after_work")
    ]);
    const path = shortestPath(edges, "sek1", "fh")!;
    expect(path.map(s => s.to)).toEqual(["efz", "berufsmatura", "fh"]);
    expect(shortestPath(edges, "fh", "sek1")).toBeUndefined();
    expect(shortestPath(edges, "efz", "efz")).toEqual([]);
  });

  it("places every stage on the grid without overlap", () => {
    const boxes = Object.keys(NODE_LAYOUT).map(c => ({ c, ...nodeBox(c)! }));
    for (const a of boxes) {
      for (const b of boxes) {
        if (a.c >= b.c) continue;
        const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        expect(overlap, `${a.c} overlaps ${b.c}`).toBe(false);
      }
    }
    expect(mapSize().width).toBeGreaterThan(1000);
  });

  it("maps the planner's entry states to stages", () => {
    expect(nodeForEntry("matura")).toBe("gym_matura");
    expect(nodeForEntry("unknown")).toBeUndefined();
  });
});

describe("links to professions and schools", () => {
  it("maps profession types and school types to the same stages", async () => {
    const { professionTypesForNode, nodeForProfessionType, nodeForSubgroup } = await import("./pathMap");
    for (const code of ["efz", "eba", "fa", "diplom_hfp", "hf", "fh", "uni"]) {
      for (const type of professionTypesForNode(code)) expect(nodeForProfessionType(type)).toBe(code);
    }
    expect(nodeForSubgroup("fachmittelschule")).toBe("fms");
    expect(nodeForSubgroup("nonsense")).toBeUndefined();
  });
});

describe("alternatives and duration", () => {
  it("offers different routes, cheapest first, and sums the years of the stages entered", async () => {
    const { alternativePaths, estimateYears } = await import("./pathMap");
    const edges = buildEdges([
      tr("sek1", "gymnasium", "direct"), tr("gymnasium", "gym_matura", "direct"), tr("gym_matura", "uni", "direct"),
      tr("sek1", "efz", "direct"), tr("efz", "berufsmatura", "direct"), tr("berufsmatura", "fh", "direct"), tr("fh", "master", "direct"), tr("uni", "master", "direct")
    ]);
    const routes = alternativePaths(edges, "sek1", "master");
    expect(routes.length).toBe(2);
    expect(routes[0].at(-1)?.to).toBe("master");
    const via = routes.map(r => r.map(s => s.to).join(">"));
    expect(via).toContain("gymnasium>gym_matura>uni>master");
    expect(via).toContain("efz>berufsmatura>fh>master");
    const years = estimateYears(routes[0]);
    expect(years.max).toBeGreaterThanOrEqual(years.min);
    expect(years.min).toBeGreaterThan(3);
  });
});
