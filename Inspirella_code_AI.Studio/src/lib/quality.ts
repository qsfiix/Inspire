/**
 * Canonical trust / quality vocabulary for product-facing records.
 *
 * SOURCE OF TRUTH: 03_Data/SQL/Quality Rules.md section 10.1 and
 * 03_Data/SQL/Validation Rules.md (validation outcome levels).
 *
 * The database and older imports use several spellings for the same meaning
 * (`published`, `official`, `needs_review`, ...). This module is the single place
 * that maps them onto one canonical set, so no screen has to repeat a chain of
 * `status === "verified" || status === "published" || ...` checks.
 */

export type QualityState =
  | "verified" // confirmed against at least one trusted source
  | "usable" // good enough for the product layer
  | "provisional" // controlled incomplete data, honestly labelled
  | "review_needed" // a human must look at this before it is trusted
  | "draft" // work in progress, not product-facing
  | "archived" // superseded or rejected
  | "unknown"; // no quality state recorded at all

/** Legacy and database spellings mapped onto the canonical vocabulary. */
const STATUS_ALIASES: Record<string, QualityState> = {
  verified: "verified",
  official: "verified",
  confirmed: "verified",
  usable: "usable",
  published: "usable",
  public: "usable",
  live: "usable",
  provisional: "provisional",
  partial: "provisional",
  review_needed: "review_needed",
  needs_review: "review_needed",
  "review-needed": "review_needed",
  pending_review: "review_needed",
  draft: "draft",
  staging: "draft",
  new: "draft",
  archived: "archived",
  rejected: "archived",
  invalid: "archived",
  deprecated: "archived"
};

export interface QualityBearing {
  status?: string;
  verified?: boolean;
  incompleteFields?: string[];
}

/**
 * Resolves the canonical quality state of a record.
 *
 * A `verified === true` boolean alone is accepted as a signal, but per
 * 02_Product/Backend/Recommendation Engine.md ("Trust first") a boolean is not a
 * substitute for provenance, so it resolves to `usable` rather than `verified`
 * unless the status column also says so.
 */
export function resolveQualityState(record: QualityBearing | null | undefined): QualityState {
  if (!record) return "unknown";

  const raw = typeof record.status === "string" ? record.status.trim().toLowerCase() : "";
  const mapped = raw ? STATUS_ALIASES[raw] : undefined;

  if (mapped) return mapped;

  if (record.verified === true) return "usable";
  if (record.verified === false && raw) return "provisional";

  return "unknown";
}

/** States that may be presented as a confident, trustworthy option. */
const TRUSTED_STATES: QualityState[] = ["verified", "usable"];

/** States that must always be shown with an explicit "provisional" marker. */
const PROVISIONAL_STATES: QualityState[] = ["provisional", "review_needed", "draft"];

/** States that must never appear as an equal-standing recommendation. */
const NOT_RECOMMENDABLE_STATES: QualityState[] = ["review_needed", "draft", "archived"];

export function isTrusted(record: QualityBearing | null | undefined): boolean {
  return TRUSTED_STATES.includes(resolveQualityState(record));
}

export function isProvisional(statusOrRecord: string | QualityBearing | null | undefined): boolean {
  const state =
    typeof statusOrRecord === "string"
      ? resolveQualityState({ status: statusOrRecord })
      : resolveQualityState(statusOrRecord);
  return PROVISIONAL_STATES.includes(state);
}

/**
 * Publication policy applied BEFORE ranking.
 *
 * 02_Product/API/Institutions API Contract.md: "`draft`, `review_needed` and
 * `invalid` must not look like equal-standing recommendations."
 * Records with no recorded quality state are still allowed through - excluding them
 * would empty the catalogue today - but they are reported as low confidence.
 */
export function isPubliclyRecommendable(record: QualityBearing | null | undefined): boolean {
  return !NOT_RECOMMENDABLE_STATES.includes(resolveQualityState(record));
}

export type ConfidenceLevel = "high" | "medium" | "low";

/**
 * Confidence is a statement about the DATA, never about the person.
 * It drops when a record has no quality state or is missing canonical fields, so the
 * interface can change its wording instead of sounding equally certain about everything.
 */
export function recordConfidence(record: QualityBearing | null | undefined): ConfidenceLevel {
  const state = resolveQualityState(record);
  const missing = record?.incompleteFields?.length ?? 0;

  if (state === "verified" && missing === 0) return "high";
  if (TRUSTED_STATES.includes(state) && missing <= 1) return "medium";
  if (state === "unknown" || PROVISIONAL_STATES.includes(state)) return "low";
  return missing > 2 ? "low" : "medium";
}

/** Lowest confidence wins: a shortlist is only as strong as its weakest evidence. */
export function combineConfidence(levels: ConfidenceLevel[]): ConfidenceLevel {
  if (levels.length === 0) return "low";
  if (levels.includes("low")) return "low";
  if (levels.includes("medium")) return "medium";
  return "high";
}
