import { describe, it, expect } from "vitest";
import { pathTrackerGoalTitle, findPathTrackerGoal, buildPathTrackerGoal } from "./pathTracker";
import { LearningPath, TrackerGoal } from "../types";

const samplePath: LearningPath = {
  id: "path-1",
  title: { en: "Become a Software Engineer", de: "Softwareentwickler/in werden" },
  description: { en: "A route into software engineering." },
  steps: [
    { id: "step-1", title: { en: "Learn the basics" }, description: { en: "Start here" } },
    { id: "step-2", title: { en: "Build a project" } }
  ]
};

describe("pathTrackerGoalTitle", () => {
  it("prefixes the localized path title consistently", () => {
    expect(pathTrackerGoalTitle(samplePath, "en")).toBe("Path: Become a Software Engineer");
  });

  it("falls back across languages the same way localizedText does", () => {
    expect(pathTrackerGoalTitle(samplePath, "fr")).toBe("Path: Become a Software Engineer");
  });
});

describe("findPathTrackerGoal", () => {
  it("finds the tracker goal whose title matches this path", () => {
    const trackers: TrackerGoal[] = [
      { id: "g1", title: "Path: Become a Software Engineer", category: "education", description: "", streak: 0, progress: 0, items: [], createdAt: "now" },
      { id: "g2", title: "Some other goal", category: "other", description: "", streak: 0, progress: 0, items: [], createdAt: "now" }
    ];
    const found = findPathTrackerGoal(trackers, samplePath, "en");
    expect(found?.id).toBe("g1");
  });

  it("returns undefined when the path hasn't been added yet", () => {
    expect(findPathTrackerGoal([], samplePath, "en")).toBeUndefined();
    expect(findPathTrackerGoal(undefined, samplePath, "en")).toBeUndefined();
  });
});

describe("buildPathTrackerGoal", () => {
  it("creates one checklist item per step, tagged with that step's id", () => {
    const goal = buildPathTrackerGoal(samplePath, "en");
    expect(goal.items).toHaveLength(2);
    expect(goal.items[0]).toMatchObject({ text: "Learn the basics", completed: false, stepId: "step-1" });
    expect(goal.items[1]).toMatchObject({ text: "Build a project", completed: false, stepId: "step-2" });
  });

  it("starts at zero progress with a title that matches pathTrackerGoalTitle", () => {
    const goal = buildPathTrackerGoal(samplePath, "en");
    expect(goal.progress).toBe(0);
    expect(goal.title).toBe(pathTrackerGoalTitle(samplePath, "en"));
  });

  it("gives every generated id a distinct value", () => {
    const goal = buildPathTrackerGoal(samplePath, "en");
    const ids = [goal.id, ...goal.items.map(i => i.id)];
    expect(new Set(ids).size).toBe(ids.length);
  });
});
