import type { EducationTransition } from "../types";

/**
 * Logic of the Swiss Path Map: which stages are drawn where, how the transition rows
 * become drawable connections, and how the shortest way between two stages is found.
 * Pure functions: the component only draws what this returns.
 */

/** Stage codes in the transition table that are drawn as another stage. */
const ALIASES: Record<string, string> = { bm1: "berufsmatura", bm2: "berufsmatura" };
export const canonicalNode = (code: string): string => ALIASES[code] ?? code;

/** Grid position of each stage: column = how far along the system, row = lane (fractions allowed). */
export const NODE_LAYOUT: Record<string, { col: number; row: number }> = {
  arrival: { col: 0, row: 3.1 },
  recognition: { col: 0, row: 5.7 },
  primar: { col: 1, row: 3.6 },
  sek1: { col: 2, row: 3.6 },
  gymnasium: { col: 3, row: 0.2 },
  fms: { col: 3, row: 1.3 },
  wms: { col: 3, row: 2.4 },
  efz: { col: 3, row: 4.4 },
  eba: { col: 3, row: 5.5 },
  bridge: { col: 3, row: 6.6 },
  integration: { col: 3, row: 7.7 },
  adult: { col: 3, row: 8.8 },
  gym_matura: { col: 4, row: 0.2 },
  fachmatura: { col: 4, row: 1.3 },
  passerelle: { col: 4, row: 2.6 },
  berufsmatura: { col: 4, row: 4.0 },
  work: { col: 4, row: 7.4 },
  uni: { col: 5, row: 0.2 },
  ph: { col: 5, row: 1.5 },
  fh: { col: 5, row: 3.2 },
  hf: { col: 5, row: 5.0 },
  fa: { col: 5, row: 6.2 },
  diplom_hfp: { col: 5, row: 7.4 },
  doctorate: { col: 7, row: 0.2 },
  master: { col: 6, row: 1.2 },
  weiterbildung: { col: 6, row: 4.6 }
};

export const MAP_GEOMETRY = { colGap: 158, rowGap: 78, nodeW: 124, nodeH: 46, padX: 24, padY: 28 };

export function nodeBox(code: string): { x: number; y: number; w: number; h: number } | undefined {
  const pos = NODE_LAYOUT[code];
  if (!pos) return undefined;
  const g = MAP_GEOMETRY;
  return { x: g.padX + pos.col * g.colGap, y: g.padY + pos.row * g.rowGap, w: g.nodeW, h: g.nodeH };
}

export function mapSize(): { width: number; height: number } {
  const g = MAP_GEOMETRY;
  const cols = Math.max(...Object.values(NODE_LAYOUT).map(p => p.col));
  const rows = Math.max(...Object.values(NODE_LAYOUT).map(p => p.row));
  return { width: g.padX * 2 + cols * g.colGap + g.nodeW, height: g.padY * 2 + rows * g.rowGap + g.nodeH };
}

/** Lower = the more direct way. Used to pick a bundle's look and as path cost. */
export const KIND_WEIGHT: Record<string, number> = { direct: 1, shortened: 1.3, with_exam: 1.6, with_bridge: 1.8, second_chance: 2.2, after_work: 2.6 };

export interface MapEdge {
  from: string;
  to: string;
  /** The most direct kind among the transitions of this pair. */
  kind: string;
  weight: number;
  transitions: EducationTransition[];
  /** Same column or backwards: drawn as an arc around the stages. */
  loops: boolean;
}

/**
 * One drawable connection per ordered pair of stages. Aliases (BM1/BM2) merge into one stage,
 * a stage pointing to itself (second apprenticeship) and arrows into "work" (completion, nothing
 * to draw) are left out, and a pair without a position on the map is skipped.
 */
export function buildEdges(transitions: EducationTransition[]): MapEdge[] {
  const byPair = new Map<string, EducationTransition[]>();
  for (const t of transitions) {
    const from = canonicalNode(t.from);
    const to = canonicalNode(t.to);
    if (from === to || to === "work") continue;
    if (!NODE_LAYOUT[from] || !NODE_LAYOUT[to]) continue;
    const key = `${from}>${to}`;
    byPair.set(key, [...(byPair.get(key) ?? []), t]);
  }
  return [...byPair.entries()].map(([key, list]) => {
    const [from, to] = key.split(">");
    const best = [...list].sort((a, b) => (KIND_WEIGHT[a.kind] ?? 3) - (KIND_WEIGHT[b.kind] ?? 3))[0];
    return {
      from,
      to,
      kind: best.kind,
      weight: KIND_WEIGHT[best.kind] ?? 3,
      transitions: list,
      loops: NODE_LAYOUT[to].col <= NODE_LAYOUT[from].col
    };
  });
}

export interface PathStep {
  from: string;
  to: string;
  edge: MapEdge;
}

/** Cheapest way between two stages (Dijkstra over the drawable connections), or undefined. */
export function shortestPath(edges: MapEdge[], start: string, goal: string): PathStep[] | undefined {
  if (start === goal) return [];
  const dist = new Map<string, number>([[start, 0]]);
  const prev = new Map<string, MapEdge>();
  const open = new Set<string>([start]);
  while (open.size > 0) {
    let current = "";
    let best = Infinity;
    for (const n of open) {
      const d = dist.get(n) ?? Infinity;
      if (d < best) {
        best = d;
        current = n;
      }
    }
    open.delete(current);
    if (current === goal) break;
    for (const e of edges) {
      if (e.from !== current) continue;
      // Going back a stage (leaving the Gymnasium for an apprenticeship) is an option, not a route to plan with.
      // Child school entry is the way for children and teenagers; an adult newcomer is better served by the adult routes.
      const schoolEntry = e.from === "arrival" && (e.to === "primar" || e.to === "sek1") ? 2 : 0;
      const cost = best + e.weight + (e.loops ? 1.5 : 0) + schoolEntry;
      if (cost < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, cost);
        prev.set(e.to, e);
        open.add(e.to);
      }
    }
  }
  if (!prev.has(goal)) return undefined;
  const steps: PathStep[] = [];
  for (let at = goal; at !== start; ) {
    const e = prev.get(at)!;
    steps.unshift({ from: e.from, to: e.to, edge: e });
    at = e.from;
  }
  return steps;
}

/** Where the engine's entry state sits on the map. */
export function nodeForEntry(entry: string | undefined): string | undefined {
  switch (entry) {
    case "sek1": return "sek1";
    case "efz": return "efz";
    case "matura": return "gym_matura";
    case "hf": return "hf";
    case "bachelor": return "fh";
    case "master": return "master";
    case "no_qualification": return "adult";
    default: return undefined;
  }
}

/** The stage a stated target level leads to (the same levels the goal picker offers). */
export function nodeForTargetLevel(level: string | undefined): string | undefined {
  switch (level) {
    case "apprenticeship": return "efz";
    case "berufsmatura": return "berufsmatura";
    case "gymnasium": return "gym_matura";
    case "higher_vocational": return "hf";
    case "university_of_applied_sciences": return "fh";
    case "university": return "uni";
    default: return undefined;
  }
}

/** Target levels a stage can be made the goal of ("Make this my goal"). */
export function targetLevelForNode(code: string): string | undefined {
  switch (code) {
    case "efz": return "apprenticeship";
    case "berufsmatura": return "berufsmatura";
    case "gymnasium":
    case "gym_matura": return "gymnasium";
    case "hf": return "higher_vocational";
    case "fh": return "university_of_applied_sciences";
    case "uni": return "university";
    default: return undefined;
  }
}

/** Admission routes (admission_conditions.route) that belong to a stage. */
export function admissionRoutesForNode(code: string): string[] {
  switch (code) {
    case "gymnasium": return ["gymnasium_kurz", "gymnasium_lang"];
    case "fms": return ["fms"];
    case "wms": return ["hms"];
    case "berufsmatura": return ["bms_bm1", "bms_bm2"];
    case "hf": return ["hf"];
    case "fh": return ["fh"];
    case "ph": return ["ph"];
    case "uni": return ["uni"];
    default: return [];
  }
}

/** Institution subgroups that offer a stage (for "find schools"). */
export function institutionSubgroupsForNode(code: string): string[] {
  switch (code) {
    case "gymnasium": return ["gymnasium"];
    case "fms": return ["fachmittelschule"];
    case "efz":
    case "eba":
    case "berufsmatura": return ["vocational_school"];
    case "hf":
    case "fa":
    case "diplom_hfp":
    case "weiterbildung": return ["continuing_education_center", "vocational_school"];
    case "fh": return ["university_of_applied_sciences"];
    case "ph": return ["teacher_education"];
    case "uni":
    case "master":
    case "doctorate": return ["university", "federal_institute_of_technology"];
    default: return [];
  }
}
