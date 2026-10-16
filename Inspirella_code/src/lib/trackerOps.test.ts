import { describe, it, expect } from "vitest";
import type { LearningPath, TrackerChecklistItem, TrackerGoal } from "../types";
import { LADDER_CODE } from "../engine/ladder";
import { SUBTASK_TEMPLATES } from "../engine/subtaskTemplates";
import { buildPathTrackerGoal } from "./pathTracker";
import {
  addItem,
  buildIcs,
  daysTo,
  expandLadderSubtasks,
  firmSignalScore,
  firmSignals,
  goalProgress,
  nextUp,
  newItem,
  removeItem,
  signalForFirm,
  toggleItem,
  undatedAppointments,
  upcomingItems,
  withApplicationItem
} from "./trackerOps";

const goalWith = (items: TrackerChecklistItem[], extra: Partial<TrackerGoal> = {}): TrackerGoal => ({
  id: "g1",
  title: "Path: Test",
  category: "education",
  description: "",
  streak: 0,
  progress: 0,
  items,
  createdAt: "now",
  ...extra
});

const NOW = new Date(2026, 9, 8); // 8 Oct 2026

describe("subtask templates", () => {
  const LANGS = ["de", "en", "fr", "it"] as const;
  it("cover all 31 micro steps with all four languages", () => {
    const keys = Object.keys(SUBTASK_TEMPLATES).map(Number);
    expect(keys.length).toBe(31);
    for (const key of keys) {
      const list = SUBTASK_TEMPLATES[key];
      expect(list.length).toBeGreaterThanOrEqual(3);
      for (const tpl of list) for (const l of LANGS) expect(tpl.text[l]?.trim().length, `${key} ${l}`).toBeGreaterThan(5);
    }
  });
});

describe("progress and ticking", () => {
  it("counts only top-level items", () => {
    const parent = newItem("parent");
    const kids = [newItem("a", { parentId: parent.id }), newItem("b", { parentId: parent.id })];
    expect(goalProgress([parent, ...kids])).toBe(0);
    expect(goalProgress([{ ...parent, completed: true }, ...kids])).toBe(100);
  });

  it("completes the parent when the last sub-task is ticked and reopens it when one is unticked", () => {
    const parent = newItem("parent");
    const a = newItem("a", { parentId: parent.id });
    const b = newItem("b", { parentId: parent.id });
    let g = goalWith([parent, a, b]);
    g = toggleItem(g, a.id);
    expect(g.items.find(i => i.id === parent.id)?.completed).toBe(false);
    g = toggleItem(g, b.id);
    expect(g.items.find(i => i.id === parent.id)?.completed).toBe(true);
    expect(g.progress).toBe(100);
    g = toggleItem(g, a.id);
    expect(g.items.find(i => i.id === parent.id)?.completed).toBe(false);
  });

  it("removes sub-tasks together with their parent", () => {
    const parent = newItem("parent");
    const a = newItem("a", { parentId: parent.id });
    const g = removeItem(goalWith([parent, a, newItem("other")]), parent.id);
    expect(g.items.map(i => i.text)).toEqual(["other"]);
  });
});

describe("dates", () => {
  it("counts days and marks overdue as negative", () => {
    expect(daysTo("2026-10-08", NOW)).toBe(0);
    expect(daysTo("2026-10-10", NOW)).toBe(2);
    expect(daysTo("2026-10-05", NOW)).toBe(-3);
    expect(daysTo(undefined, NOW)).toBeNull();
  });

  it("lists overdue first, skips done and rejected items", () => {
    const g = goalWith([
      newItem("later", { dueAt: "2026-10-20" }),
      newItem("overdue", { dueAt: "2026-10-01" }),
      newItem("done", { dueAt: "2026-10-02", completed: true }),
      newItem("rejected", { dueAt: "2026-10-03", kind: "application", appStatus: "rejected" }),
      newItem("no date")
    ]);
    expect(upcomingItems([g], { now: NOW }).map(u => u.item.text)).toEqual(["overdue", "later"]);
    expect(upcomingItems([g], { now: NOW, withinDays: 7 }).map(u => u.item.text)).toEqual(["overdue"]);
  });

  it("finds appointments that still need a date", () => {
    const g = goalWith([newItem("Schnuppern", { kind: "schnupper" }), newItem("Interview", { kind: "interview", dueAt: "2026-11-01" }), newItem("plain")]);
    expect(undatedAppointments([g]).map(u => u.item.text)).toEqual(["Schnuppern"]);
  });

  it("nextUp puts dated items first and then the first open item of each path goal", () => {
    const g1 = goalWith([newItem("one"), newItem("two", { dueAt: "2026-10-09" })]);
    const g2 = goalWith([newItem("x", { completed: true }), newItem("y")], { id: "g2" });
    const list = nextUp([g1, g2], 5, NOW);
    expect(list.map(u => u.item.text)).toEqual(["two", "one", "y"]);
  });
});

describe("ladder subtasks", () => {
  const path: LearningPath = {
    id: "lehre_leiter:p1",
    code: LADDER_CODE,
    title: { de: "Test" },
    steps: [
      {
        id: "phase-schnuppern",
        title: { de: "Schnuppern" },
        order: 200,
        substeps: [
          { id: "s201", title: { de: "Betriebe zum Schnuppern auswählen" }, order: 201 },
          { id: "s203", title: { de: "Schnuppern und Eindrücke festhalten" }, order: 203 }
        ]
      }
    ]
  } as LearningPath;

  it("adds dated sub-tasks under each micro step, appointments undated, and is idempotent", () => {
    const base = buildPathTrackerGoal(path, "de");
    const goal = expandLadderSubtasks(base, path, "de", { beruf: "Informatiker/in", startYear: 2027, now: NOW });
    const parent203 = goal.items.find(i => i.text === "Schnuppern und Eindrücke festhalten")!;
    const kids = goal.items.filter(i => i.parentId === parent203.id);
    expect(kids.length).toBe(SUBTASK_TEMPLATES[203].length);
    expect(kids[0].kind).toBe("schnupper");
    expect(kids[0].dueAt).toBeUndefined();
    expect(kids.slice(1).every(k => /^\d{4}-\d{2}-\d{2}$/.test(k.dueAt ?? ""))).toBe(true);
    // the step itself is due when its last dated sub-task is
    expect(parent203.dueAt).toBe(kids.map(k => k.dueAt).filter(Boolean).sort().pop());
    const again = expandLadderSubtasks(goal, path, "de", { beruf: "Informatiker/in", startYear: 2027, now: NOW });
    expect(again.items.length).toBe(goal.items.length);
    // the phase items still decide progress
    expect(goal.progress).toBe(0);
  });

  it("spreads dates over the phase window when it is still ahead", () => {
    const goal = expandLadderSubtasks(buildPathTrackerGoal(path, "de"), path, "de", { beruf: "x", startYear: 2028, now: NOW });
    const dates = goal.items.filter(i => i.parentId && i.dueAt).map(i => i.dueAt!);
    expect(dates.length).toBeGreaterThan(0);
    // schnuppern window for a start in 2028: Jan to Sep 2027
    expect(dates.every(d => d >= "2027-01-01" && d <= "2027-09-30")).toBe(true);
  });

  it("plans a catch-up fortnight when the window is over", () => {
    const goal = expandLadderSubtasks(buildPathTrackerGoal(path, "de"), path, "de", { beruf: "x", startYear: 2027, now: NOW });
    const dates = goal.items.filter(i => i.parentId && i.dueAt).map(i => i.dueAt!);
    expect(dates.every(d => d > "2026-10-08" && d <= "2026-10-22")).toBe(true);
  });

  it("does nothing for paths that are not the Lehre ladder", () => {
    const base = buildPathTrackerGoal({ ...path, code: "route" } as LearningPath, "de");
    expect(expandLadderSubtasks(base, { ...path, code: "route" } as LearningPath, "de", { beruf: "x", startYear: 2027, now: NOW })).toBe(base);
  });

  it("fills the profession name into sub-tasks", () => {
    const p2: LearningPath = { ...path, steps: [{ ...path.steps[0], substeps: [{ id: "s101", title: { de: "Den Beruf kennenlernen" }, order: 101 }], order: 100 }] } as LearningPath;
    const goal = expandLadderSubtasks(buildPathTrackerGoal(p2, "de"), p2, "de", { beruf: "Schreiner/in", startYear: 2027, now: NOW });
    expect(goal.items.some(i => i.parentId && i.text.includes("Schreiner/in"))).toBe(true);
    expect(goal.items.some(i => i.text.includes("{beruf}"))).toBe(false);
  });
});

describe("applications, impressions and the calendar", () => {
  it("creates the applications goal once and adds to it", () => {
    const texts = { title: "Meine Bewerbungen", description: "" };
    let list = withApplicationItem([], texts, newItem("Firma A", { kind: "application", appStatus: "planned", firm: { name: "Firma A" } }));
    list = withApplicationItem(list, texts, newItem("Firma B", { kind: "application", appStatus: "sent", firm: { name: "Firma B" } }));
    expect(list.filter(g => g.kind === "applications").length).toBe(1);
    expect(list[0].items.length).toBe(2);
    expect(addItem(list[0], newItem("c")).items.length).toBe(3);
  });

  it("turns Schnupperlehre impressions and rejections into a score", () => {
    const g = goalWith([
      newItem("Schnuppern · Gut AG", { kind: "schnupper", completed: true, rating: 5, wouldApply: true, firm: { id: "f1", name: "Gut AG" } }),
      newItem("Schnuppern · Schlecht AG", { kind: "schnupper", completed: true, rating: 1, firm: { name: "Schlecht AG" } }),
      newItem("Absage AG", { kind: "application", appStatus: "rejected", firm: { name: "Absage AG" } })
    ]);
    const sig = firmSignals([g]);
    expect(firmSignalScore(signalForFirm(sig, { id: "f1", name: "Gut AG" }))).toBe(30);
    expect(firmSignalScore(signalForFirm(sig, { name: "SCHLECHT AG" }))).toBeLessThan(0);
    expect(firmSignalScore(signalForFirm(sig, { name: "absage ag" }))).toBeLessThan(0);
    expect(firmSignalScore(signalForFirm(sig, { name: "Unbekannt" }))).toBe(0);
  });

  it("writes an all-day event with a reminder per dated item", () => {
    const ics = buildIcs([
      { item: newItem("Gespräch, 14 Uhr", { dueAt: "2026-11-03", firm: { name: "Firma; A" } }), goalTitle: "Path: Test" },
      { item: newItem("ohne Datum"), goalTitle: "Path: Test" }
    ], NOW);
    expect(ics.match(/BEGIN:VEVENT/g)?.length).toBe(1);
    expect(ics).toContain("DTSTART;VALUE=DATE:20261103");
    expect(ics).toContain("DTEND;VALUE=DATE:20261104");
    expect(ics).toContain("TRIGGER:-P1D");
    expect(ics).toContain("SUMMARY:Gespräch\\, 14 Uhr (Firma\\; A)");
    expect(ics.startsWith("BEGIN:VCALENDAR")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR")).toBe(true);
  });
});
