// Shared TypeScript interfaces and structures for Inspirella educational platform
//
// CONTRACT RULE (03_Data/SQL/Quality Rules.md, 02_Product/Requirements/Trust and Data Requirements.md):
// A field is optional here when Inspirella is NOT allowed to invent it.
// Missing data must stay missing and be communicated honestly - it must never be
// replaced by a plausible-looking default such as a fallback city, salary or website.

export type LanguageCode = "en" | "de" | "fr" | "it";

/**
 * Where a product-facing record physically came from.
 * Used so the UI can never present demo/static content as live verified data.
 */
export type DataOrigin = "cloud" | "static";

/**
 * Fields shared by every public catalogue record (institutions, resources, professions).
 * `incompleteFields` lists canonical fields that were absent in the source row, so
 * screens can lower confidence instead of showing a fabricated value.
 */
export interface RecordProvenance {
  dataOrigin?: DataOrigin;
  incompleteFields?: string[];
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  interests: string[]; // e.g., ["academic", "vocational", "arts", "tech", "business"]
  goals: string[]; // e.g., ["study_active", "career_pivot", "global_compare", "parent_routing"]
  currentStage: string; // e.g., "stage_secondary", "stage_university", "stage_professional", "stage_other"
  language: LanguageCode;
  onboardingComplete: boolean;
  avatarUrl?: string;
  createdAt: string;
  isGuest?: boolean;
  updatedAt?: string;
  syncState?: "local" | "syncing" | "cloud";
  preferredCanton?: string; // Optional field for canton-aware recommendations
  targetLanguageRegion?: string; // Optional field for language region preferences
  bio?: string; // Free-text "about me", written by the user themselves
}

export interface EducationPathStep {
  id: string;
  title: Record<LanguageCode, string>;
  description: Record<LanguageCode, string>;
  timeframe?: Record<LanguageCode, string>;
}

export interface EducationLevel {
  id: string;
  title: Record<LanguageCode, string>;
  sub: Record<LanguageCode, string>;
  description: Record<LanguageCode, string>;
  keyFacts: Record<LanguageCode, string[]>;
  permeabilityText: Record<LanguageCode, string>; // Describes transfer options (Durchlässigkeit)
  pathSteps: EducationPathStep[];
}

/**
 * Geographic position of an institution.
 * Optional on purpose: the map must never invent coordinates
 * (02_Product/Requirements/Map Discovery Requirements.md - Data rules).
 */
export type Coordinates = [number, number]; // [Longitude, Latitude]

export interface Institution extends RecordProvenance {
  id: string;
  title: string;

  /** Controlled classification. Absent when the source row has no usable type. */
  category?: string;

  /** Absent when the source row has no valid location. Never guessed. */
  coordinates?: Coordinates;

  /** Absent when the source row has no canton. Never guessed. */
  canton?: string;

  description?: Partial<Record<LanguageCode, string>>;

  /** Official website. Absent rather than replaced by a generic portal link. */
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  imageUrl?: string;
  /** Short credit line for imageUrl when sourced externally (e.g. Wikimedia Commons author/license) - shown in small print under the image. Never invented; absent when the image itself is absent. */
  imageAttribution?: string;
  admissionRequirements?: Partial<Record<LanguageCode, string>>;

  // Trust and quality layer
  status?: string;
  verified?: boolean;
  rating?: number; // quality rating score
  establishedYear?: number;
  studentCount?: number;
  cantonalLanguage?: string;
  tags?: string[];
  isPublic?: boolean;
  degreeLevels?: string[]; // e.g. ["Bachelor", "Master", "PhD", "Apprenticeship"]
  customMetadata?: Record<string, unknown>;
}

export interface TrackerGoal {
  id: string;
  title: string;
  category: "education" | "habit" | "sport" | "health" | "productivity" | "other";
  description: string;
  streak: number;
  progress: number; // Percentage
  items: TrackerChecklistItem[];
  createdAt: string;
  updatedAt?: string;
  /** Marks goals seeded by Inspirella as an example rather than created by the user. */
  isExample?: boolean;
  /** Optional target date (ISO "YYYY-MM-DD"). Drives the dashboard's due/overdue reminders. */
  dueDate?: string;
}

export interface TrackerChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  frequency: "daily" | "weekly";
}

export interface ResourceItem extends RecordProvenance {
  id: string;
  title: Partial<Record<LanguageCode, string>>;
  description?: Partial<Record<LanguageCode, string>>;

  /** Controlled category. Absent when the source row has no usable category. */
  category?: string;

  /** Required: a resource without a reachable official link has no product value. */
  url: string;

  country?: string; // e.g. "CH"

  // Trust and quality layer
  status?: string;
  verified?: boolean;
  rating?: number;
  tags?: string[];
  isFederal?: boolean;
  lastUpdated?: string;
  clicksCount?: number;
  accessCost?: string;
  customMetadata?: Record<string, unknown>;
}

export interface Profession extends RecordProvenance {
  id: string;
  title: Partial<Record<LanguageCode, string>>;
  description?: Partial<Record<LanguageCode, string>>;

  /** Controlled category. Absent when the source row has no usable category. */
  category?: string;

  /** Absent rather than defaulted: a guessed salary is a fabricated fact. */
  salaryCHF?: number;

  /** Absent rather than defaulted to "medium". */
  outlook?: string;

  educationRequired?: Partial<Record<LanguageCode, string>>;

  // Trust and quality layer
  status?: string;
  verified?: boolean;
  demandLevel?: string;
  growthRatePct?: number;
  avgWorkHoursWeekly?: number;
  flexibilityScore?: number; // 1-10
  skillsRequired?: Partial<Record<LanguageCode, string[]>>;
  industries?: string[];
  isApprenticeshipPath?: boolean;
  customMetadata?: Record<string, unknown>;
}

/** One concrete action within a LearningPath, in order. */
export interface LearningPathStep {
  id: string;
  title: Partial<Record<LanguageCode, string>>;
  description?: Partial<Record<LanguageCode, string>>;
  timeframe?: Partial<Record<LanguageCode, string>>;
}

/**
 * A concrete, ordered route toward a specific outcome (e.g. "become a
 * software engineer"), as opposed to `EducationPathStep`/`EducationLevel`
 * (data.ts) which describe the general shape of the Swiss system rather
 * than a path to any particular goal.
 */
export interface LearningPath extends RecordProvenance {
  id: string;
  code?: string;
  title: Partial<Record<LanguageCode, string>>;
  description?: Partial<Record<LanguageCode, string>>;

  /** e.g. "profession" | "admission" - what kind of goal this path leads to. */
  pathType?: string;

  /** Present when this path leads to a specific profession (see Profession.id). */
  targetProfessionId?: string;

  steps: LearningPathStep[];
}
