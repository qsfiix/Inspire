/** The onboarding stores "stage_secondary"; its translated label lives under "stage_schoolType". */
const STAGE_LABEL_KEY: Record<string, string> = { stage_secondary: "stage_schoolType" };

/** Translation key for a stored stage id. */
export const stageLabelKey = (stage: string): string => STAGE_LABEL_KEY[stage] ?? stage;
