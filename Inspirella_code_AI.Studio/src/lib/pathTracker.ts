import { LanguageCode, LearningPath, TrackerGoal } from "../types";
import { localizedText } from "./localized";

/**
 * Shared "learning path <-> tracker goal" bridge, used by both AdvisorReport
 * (the original "add this path to my tracker" button) and MyPathLadder (the
 * dashboard path visualization) so the two stay in sync on the same goal
 * instead of each creating their own.
 */

export function pathTrackerGoalTitle(path: LearningPath, language: LanguageCode): string {
  return `Path: ${localizedText(path.title, language)}`;
}

export function findPathTrackerGoal(
  trackers: TrackerGoal[] | undefined,
  path: LearningPath,
  language: LanguageCode
): TrackerGoal | undefined {
  const title = pathTrackerGoalTitle(path, language);
  return trackers?.find(g => g.title === title);
}

export function buildPathTrackerGoal(path: LearningPath, language: LanguageCode): TrackerGoal {
  return {
    id: crypto.randomUUID(),
    title: pathTrackerGoalTitle(path, language),
    category: "education",
    description: localizedText(path.description, language),
    streak: 0,
    progress: 0,
    items: path.steps.map(step => ({
      id: crypto.randomUUID(),
      text: localizedText(step.title, language),
      completed: false,
      frequency: "weekly",
      stepId: step.id
    })),
    createdAt: new Date().toISOString()
  };
}
