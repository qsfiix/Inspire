import { TrackerGoal } from "../types";

/**
 * A single example goal offered only on a user's very first visit, so the tracker
 * is not an empty box with no idea of what it is for.
 *
 * PRODUCT RULE (02_Product/Requirements/Tracker Requirements.md):
 * The tracker is downstream of a meaningful path. This example is therefore marked
 * with `isExample` so the UI can label it honestly, and it is never re-injected
 * after the user has deleted it (see `LocalMockDB.hasTrackers`).
 */
export const EXAMPLE_TRACKERS: TrackerGoal[] = [
  {
    id: "example-swiss-language-start",
    title: "Learn everyday Swiss German",
    category: "education",
    description: "A small daily step towards feeling at home in a German-speaking canton",
    streak: 0,
    progress: 0,
    items: [
      {
        id: "example-item-vocabulary",
        text: "Learn 10 everyday words (Grüezi, Rüebli, Velo, ...)",
        completed: false,
        frequency: "daily"
      },
      {
        id: "example-item-listening",
        text: "Listen to 10 minutes of SRF radio",
        completed: false,
        frequency: "daily"
      }
    ],
    createdAt: new Date().toISOString(),
    isExample: true
  }
];
