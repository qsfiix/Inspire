// Shared TypeScript interfaces and structures for Inspirella educational platform

export type LanguageCode = "en" | "de" | "fr" | "it";

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  interests: string[]; // e.g., ["academic", "vocational", "arts", "tech", "business"]
  goals: string[]; // e.g., ["study_abroad", "career_switch", "professional_dev", "general_curiosity"]
  currentStage: string; // e.g., "secondary", "academic", "industry", "parent_educator"
  language: LanguageCode;
  onboardingComplete: boolean;
  avatarUrl?: string;
  createdAt: string;
  isGuest?: boolean;
  updatedAt?: string;
  syncState?: "local" | "syncing" | "cloud";
  preferredCanton?: string; // Optional field for canton-aware recommendations
  targetLanguageRegion?: string; // Optional field for language region preferences
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

export interface Institution {
  id: string;
  title: string;
  category: string; // Made dynamic to support any categories from the database without repeated enum rewrites
  coordinates: [number, number]; // [Longitude, Latitude]
  canton: string;
  description: Record<LanguageCode, string>;
  website: string;
  email: string;
  phone: string;
  address: string;
  imageUrl?: string;
  admissionRequirements?: Record<LanguageCode, string>;
  
  // Real database capability extensions
  status?: "verified" | "published" | "draft" | "needs_review" | string;
  verified?: boolean;
  rating?: number; // quality rating score
  establishedYear?: number;
  studentCount?: number;
  cantonalLanguage?: "German" | "French" | "Italian" | "Bilingual" | string;
  tags?: string[];
  isPublic?: boolean;
  degreeLevels?: string[]; // e.g. ["Bachelor", "Master", "PhD", "Apprenticeship"]
  customMetadata?: Record<string, any>;
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
}

export interface TrackerChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  frequency: "daily" | "weekly";
}

export interface ResourceItem {
  id: string;
  title: Record<LanguageCode, string>;
  description: Record<LanguageCode, string>;
  category: string; // Made dynamic to facilitate any official or local categories
  url: string;
  country: string; // "CH"

  // Real database capability extensions
  status?: "verified" | "published" | "draft" | "needs_review" | string;
  verified?: boolean;
  rating?: number;
  tags?: string[];
  isFederal?: boolean;
  lastUpdated?: string;
  clicksCount?: number;
  accessCost?: "free" | "paid" | string;
  customMetadata?: Record<string, any>;
}

export interface Profession {
  id: string;
  title: Record<LanguageCode, string>;
  description: Record<LanguageCode, string>;
  category: string; // Made dynamic to map professions accurately from Supabase/Postgres
  salaryCHF: number;
  outlook: string; // Accepts "high" | "medium" | "low" as well as custom rating ranges
  educationRequired: Record<LanguageCode, string>;

  // Real database capability extensions
  status?: "verified" | "published" | "draft" | "needs_review" | string;
  verified?: boolean;
  demandLevel?: "very_high" | "high" | "medium" | "low" | string;
  growthRatePct?: number;
  avgWorkHoursWeekly?: number;
  flexibilityScore?: number; // 1-10
  skillsRequired?: Record<LanguageCode, string[]>;
  industries?: string[];
  isApprenticeshipPath?: boolean;
  customMetadata?: Record<string, any>;
}

