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
// Real (fixed) UUIDs rather than human-readable slugs: `TrackerGoal.id`/
// `TrackerChecklistItem.id` now must be valid UUIDs to match the `tracker_goals`/
// `tracker_items` Supabase columns (uuid type) once a signed-in user's trackers
// sync to the cloud - see DataRepository.saveTrackers in data/Repository.ts.
export const EXAMPLE_TRACKERS: TrackerGoal[] = [
  {
    id: "8f14e45f-ceea-467e-add2-000000000001",
    title: "Learn everyday Swiss German",
    category: "education",
    description: "A small daily step towards feeling at home in a German-speaking canton",
    streak: 0,
    progress: 0,
    items: [
      {
        id: "8f14e45f-ceea-467e-add2-000000000002",
        text: "Learn 10 everyday words (Grüezi, Rüebli, Velo, ...)",
        completed: false,
        frequency: "daily"
      },
      {
        id: "8f14e45f-ceea-467e-add2-000000000003",
        text: "Listen to 10 minutes of SRF radio",
        completed: false,
        frequency: "daily"
      }
    ],
    createdAt: new Date().toISOString(),
    isExample: true
  }
];

const EXAMPLE_TEXT: Record<string, { title: string; description: string; items: [string, string] }> = {
  de: { title: "Alltags-Schweizerdeutsch lernen", description: "Ein kleiner täglicher Schritt, um dich in einem deutschsprachigen Kanton zu Hause zu fühlen", items: ["10 Alltagswörter lernen (Grüezi, Rüebli, Velo, ...)", "10 Minuten SRF-Radio hören"] },
  en: { title: "Learn everyday Swiss German", description: "A small daily step towards feeling at home in a German-speaking canton", items: ["Learn 10 everyday words (Grüezi, Rüebli, Velo, ...)", "Listen to 10 minutes of SRF radio"] },
  fr: { title: "Apprendre le suisse allemand du quotidien", description: "Un petit pas par jour pour se sentir chez soi dans un canton germanophone", items: ["Apprendre 10 mots du quotidien (Grüezi, Rüebli, Velo, ...)", "Écouter 10 minutes de radio SRF"] },
  it: { title: "Imparare lo svizzero tedesco di tutti i giorni", description: "Un piccolo passo al giorno per sentirsi a casa in un cantone germanofono", items: ["Imparare 10 parole di uso quotidiano (Grüezi, Rüebli, Velo, ...)", "Ascoltare 10 minuti di radio SRF"] },
  uk: { title: "Вивчати швейцарську німецьку для щодня", description: "Маленький щоденний крок, щоб почуватися вдома в німецькомовному кантоні", items: ["Вивчити 10 щоденних слів (Grüezi, Rüebli, Velo, ...)", "Слухати 10 хвилин радіо SRF"] }
};

/** The example goal, written in the visitor's language. */
export function exampleTrackers(language: string): TrackerGoal[] {
  const t = EXAMPLE_TEXT[language] ?? EXAMPLE_TEXT.en;
  return EXAMPLE_TRACKERS.map(g => ({
    ...g,
    title: t.title,
    description: t.description,
    items: g.items.map((it, i) => ({ ...it, text: t.items[i] ?? it.text })),
    createdAt: new Date().toISOString()
  }));
}
