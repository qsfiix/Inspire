import { TrackerGoal } from "../types";

export const MOCK_SEED_TRACKERS: TrackerGoal[] = [
  {
    id: "seed_1",
    title: "Learn Swiss German Dialect",
    category: "education",
    description: "Pragmatic dialect vocabulary",
    streak: 3,
    progress: 50,
    items: [
      { id: "s1_a", text: "Memorize 10 basic Swiss words (e.g., Grüezi, Rüebli)", completed: true, frequency: "daily" },
      { id: "s1_b", text: "Listen to Swiss radio SRF for 10 minutes", completed: false, frequency: "daily" }
    ],
    createdAt: new Date().toISOString()
  }
];
