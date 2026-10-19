// Shared TypeScript interfaces and structures for Inspirella educational platform
//
// CONTRACT RULE (03_Data/SQL/Quality Rules.md, 02_Product/Requirements/Trust and Data Requirements.md):
// A field is optional here when Inspirella is NOT allowed to invent it.
// Missing data must stay missing and be communicated honestly - it must never be
// replaced by a plausible-looking default such as a fallback city, salary or website.

export type LanguageCode = "en" | "de" | "fr" | "it" | "uk";

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

export type CefrLevel = "none" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | "native";

export interface LanguageLevel {
  languageCode: string;
  level: CefrLevel;
  certificateName?: string;
  certificateYear?: number;
  /** true until the user attaches a certificate */
  isSelfAssessed: boolean;
}

/**
 * Optional personal facts that decide which route fits a user (admission rules,
 * permits, language requirements, diploma recognition). Everything is optional.
 * `citizenshipCountryCodes` and `residenceStatus` are sensitive: they are synced
 * to the cloud only when `sensitiveDataConsentAt` is set; otherwise they stay on
 * this device. Mirrors the `profile_background` / `profile_language_levels` tables.
 */
export interface RouteBackground {
  citizenshipCountryCodes?: string[];
  residenceStatus?:
    | "swiss_citizen" | "permit_c" | "permit_b" | "permit_l" | "permit_g" | "permit_f"
    | "permit_n" | "permit_s" | "not_in_switzerland" | "other" | "prefer_not_to_say";
  plannedArrivalDate?: string; // ISO date
  arrivedInSwitzerlandYear?: number;
  birthYear?: number;
  swissSchoolingYears?: number;
  highestEducation?:
    | "none" | "compulsory_school" | "upper_secondary_general" | "upper_secondary_vocational"
    | "tertiary_professional" | "bachelor" | "master" | "doctorate" | "other";
  highestEducationCountryCode?: string;
  diplomaRecognitionStatus?: "not_needed" | "not_checked" | "in_progress" | "recognised" | "not_recognised" | "unknown";
  workExperienceYears?: number;
  targetLevel?:
    | "apprenticeship" | "berufsmatura" | "gymnasium" | "higher_vocational"
    | "university_of_applied_sciences" | "university" | "continuing_education"
    | "job_entry" | "language_course" | "undecided";
  targetStartYear?: number;
  studyModePreference?: "full_time" | "part_time" | "work_study" | "any";
  financingPlan?: "self" | "family" | "scholarship" | "employer" | "loan" | "mixed" | "unknown";
  sensitiveDataConsentAt?: string; // ISO timestamp
  /** Neutral, non-legal answer: does the user already live in Switzerland? Stored in profile_background.notes. */
  livesInSwitzerland?: boolean;
  /** A specific school the user wants to get into (institutions.id), e.g. a Gymnasium. */
  targetInstitutionId?: string;
  /** Wunschberuf: professions.id the user picked in the route card. Stored in profile_background.notes. */
  targetProfessionId?: string;
  languageLevels: LanguageLevel[];
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

  /** institutions.institution_subgroup, e.g. gymnasium, university_of_applied_sciences, fachmittelschule. */
  subgroup?: string;

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

  /** Longer "about this institution and who it's for" narrative - distinct from the short `description`. Absent for most institutions today; fills in gradually. */
  profile?: Partial<Record<LanguageCode, string>>;
  /** Which language(s) teaching happens in - important in multilingual Switzerland. */
  languageEnvironment?: Partial<Record<LanguageCode, string>>;
  /** What it's like to study/live here day to day. */
  studentLife?: Partial<Record<LanguageCode, string>>;
  /** Practical notes on accommodation for students relocating from another canton. */
  housingNotes?: Partial<Record<LanguageCode, string>>;
  /** Practical notes on the application process, beyond the formal `admissionRequirements`. */
  applicationNotes?: Partial<Record<LanguageCode, string>>;

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
  /** "applications" holds the firm board and the Schnupperlehre log; "path" a ladder; undefined = a goal the user made. */
  kind?: TrackerGoalKind;
}

export type TrackerGoalKind = "path" | "applications";

/** task = plain to-do; schnupper / interview = a dated appointment; deadline = a hard date; document = paper for the dossier; application = a firm on the board. */
export type TrackerItemKind = "task" | "schnupper" | "interview" | "deadline" | "document" | "application";

/** Where an application stands. */
export type ApplicationStatus = "planned" | "sent" | "interview" | "offer" | "rejected" | "declined";

export interface TrackerFirmRef {
  /** training_companies.id when the firm comes from our directory. */
  id?: string;
  name: string;
  url?: string;
}

export interface TrackerChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  frequency: "daily" | "weekly";
  /** Present when this item is a small sub-task of one LearningPathStep (see MyPathLadder). */
  stepId?: string;
  /** Date it should happen by or on ("YYYY-MM-DD"). */
  dueAt?: string;
  kind?: TrackerItemKind;
  /** Free note of the user. */
  note?: string;
  /** Set on a generated sub-task: the id of the micro-step item it belongs to. */
  parentId?: string;
  firm?: TrackerFirmRef;
  /** Board column of an application item. */
  appStatus?: ApplicationStatus;
  /** Schnupperlehre log: 1 to 5. */
  rating?: number;
  /** Schnupperlehre log: would the user apply there? */
  wouldApply?: boolean;
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

  /** ISCO-08 two-digit occupation group (BFS wage statistics); only set when the mapping is high/medium confidence. */
  iscoGroup?: string;
  iscoConfidence?: string;

  /** Absent rather than defaulted to "medium". */
  outlook?: string;

  educationRequired?: Partial<Record<LanguageCode, string>>;

  /** Who this profession genuinely suits - interests, strengths, temperament. */
  targetGroup?: Partial<Record<LanguageCode, string>>;
  /** What a typical working day actually looks like. */
  dailyWorkContext?: Partial<Record<LanguageCode, string>>;
  /** Where people in this profession actually work (employer types, settings). */
  typicalWorkplace?: Partial<Record<LanguageCode, string>>;
  /** The realistic, practical side of getting in - beyond the formal `educationRequired`. */
  admissionReality?: Partial<Record<LanguageCode, string>>;
  /** Where a career in this profession can lead afterwards. */
  progressionNotes?: Partial<Record<LanguageCode, string>>;

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
  /** professions.profession_type: apprenticeship_efz, fachausweis, fh_bachelor, ... */
  professionType?: string;
  customMetadata?: Record<string, unknown>;
}

/** A curated, verified link between a profession and an institution that
 *  genuinely offers a pathway into it (see `profession_institutions`). Not
 *  every profession has one yet - absent rather than guessed. */
/** An official cantonal page for one topic (resources.canton_code + topic_code). */
export interface CantonalLink {
  topic: string;
  title: Partial<Record<LanguageCode, string>>;
  url: string;
}

export interface ProfessionInstitutionLink {
  id: string;
  professionId: string;
  professionTitle?: string;
  institutionId: string;
  institutionTitle: string;
  institutionCity?: string;
  note?: string;
}

/** One concrete action within a LearningPath, in order. */
export interface LearningPathStep {
  id: string;
  title: Partial<Record<LanguageCode, string>>;
  description?: Partial<Record<LanguageCode, string>>;
  timeframe?: Partial<Record<LanguageCode, string>>;
  /** 1-based position inside the path (learning_path_steps.step_order). */
  order?: number;
  /** info | action | resource | milestone | exam | document | application */
  stepType?: string;
  officialUrl?: string;
  isOptional?: boolean;
  /** Set on micro steps of a ladder template: the phase (parent step) they belong to. */
  parentStepId?: string;
  /** Personalisation hook of a ladder micro step: profession_facts | canton_links | firms | resources | schools | alternatives | fh_followups. */
  hook?: string;
  hookTopic?: string;
  /** Micro steps of a phase (ladder templates only). */
  substeps?: LearningPathStep[];
}

/** A firm that trains apprentices (training_companies), pilot directory. */
export interface TrainingCompany {
  id: string;
  name: string;
  street?: string;
  postalCode?: string;
  city?: string;
  canton?: string;
  website?: string;
  trainingUrl?: string;
  /** profession_categories codes, e.g. industry_technology_it. */
  sectorCodes: string[];
  languages: string[];
  schnupperlehre?: boolean;
  /** Ids of the professions the firm's own page names. */
  professionIds: string[];
}

/** Practical facts for one profession (profession_facts). */
export interface ProfessionFacts {
  professionId: string;
  durationYears?: number;
  schoolLevel?: string;
  aptitudeTests: string[];
  bmPossible?: string;
  bmDirections: string[];
  fhFollowups: string[];
  weiterbildung: string[];
  typicalWorkplaces?: string;
  sourceUrl?: string;
}

/** How to get in, per canton and route (admission_conditions). German source text; dates are "as printed on the page". */
export interface AdmissionCondition {
  id: string;
  /** Stable code, e.g. adm_zh_fms or adm_ch_hf_pflege. */
  code: string;
  /** Two-letter canton code, e.g. ZH, or CH for a rule that applies nationwide (HF, FH, PH). */
  canton: string;
  /** gymnasium_kurz | gymnasium_lang | fms | hms | bms_bm1 | bms_bm2 | hf | fh | ph */
  route: string;
  /** Set when the rule is one school's own (FH, PH). */
  institutionId?: string;
  headline?: string;
  requirements?: string;
  examInfo?: string;
  deadline?: string;
  timing?: string;
  costNote?: string;
  url?: string;
  verified: boolean;
  /** Ukrainian translation, when available. */
  uk?: { headline?: string; requirements?: string; examInfo?: string; deadline?: string; timing?: string; costNote?: string };
}

/** A bridge or preparation offer (education_programs): Brückenangebot, Vorlehre, Motivationssemester, Passerelle... */
export interface EducationProgram {
  id: string;
  /** bridge_year | vorlehre | integration_vorlehre | motivation_semester | passerelle | matura_prep | fms_profile | other */
  kind: string;
  canton: string;
  title: string;
  description?: string;
  provider?: string;
  targetGroup?: string;
  duration?: string;
  admission?: string;
  url?: string;
  verified: boolean;
  uk?: { title?: string; description?: string; targetGroup?: string; duration?: string; admission?: string };
}

/** A way from one stage of the Swiss system to another (education_transitions). */
export interface EducationTransition {
  id: string;
  /** Node vocabulary: sek1, efz, eba, bm1, bm2, berufsmatura, gymnasium, gym_matura, fms, fachmatura, passerelle, hf, fa, diplom_hfp, fh, ph, uni, master, work, adult, bridge. */
  from: string;
  to: string;
  /** direct | with_exam | shortened | second_chance | with_bridge | after_work */
  kind: string;
  label: string;
  conditions?: string;
  duration?: string;
  typicalAge?: string;
  notes?: string;
  url?: string;
  verified: boolean;
  uk?: { label?: string; conditions?: string; duration?: string; typicalAge?: string; notes?: string };
}

/** A stage of the Swiss education system as drawn on the Swiss Path Map (education_nodes). */
export interface EducationNode {
  code: string;
  /** -1 arrival, 0 Primarstufe, 1 Sekundarstufe I, 2 Sekundarstufe II, 3 Tertiary, 4 Master, doctorate, continuing education. */
  band: number;
  /** school | qualification | bridge | entry | work */
  kind: string;
  sortOrder: number;
  /** German first; the other languages fall back to German when a text is missing. */
  label: Record<LanguageCode, string>;
  summary: Record<LanguageCode, string>;
  duration?: string;
  typicalAge?: string;
  diploma?: string;
  requirements?: string;
  cantonalNote?: string;
  goodToKnow: string[];
  url?: string;
  verified: boolean;
  uk?: { duration?: string; typicalAge?: string; diploma?: string; requirements?: string; cantonalNote?: string; goodToKnow?: string[] };
}

/** What a canton does at one stage of the system (canton_stage_facts): school model, Langgymnasium or not, newcomer schooling, offices. */
export interface CantonStageFact {
  canton: string;
  node: string;
  /** yes | no | partial | unknown: is the offer there in this canton */
  available: string;
  headline: string;
  text?: string;
  url?: string;
  verified: boolean;
  uk?: { headline?: string; text?: string };
}

/** An education fact for one audience, e.g. people from Ukraine with protection status S (audience_facts). German and English texts. */
/** BFS Lohnstrukturerhebung: monthly gross wage (CHF, standardised full time) of an occupation group in Switzerland. */
export interface SalaryBenchmark {
  group: string;
  groupName: string;
  age: "total" | "bis29" | "30-49" | "ab50";
  year: number;
  p10?: number;
  p25?: number;
  median: number;
  p75?: number;
  p90?: number;
  sourceName: string;
  sourceUrl?: string;
}

/** Recommended monthly pay in one apprenticeship year (an association recommendation, not a guarantee). */
export interface ApprenticeWage {
  year: number;
  min: number;
  max: number;
  sourceUrl?: string;
}

export interface AudienceFact {
  audience: string;
  canton?: string;
  topic: string;
  node?: string;
  sortOrder: number;
  headline: { de: string; en: string; uk: string };
  text: { de: string; en: string; uk: string };
  url?: string;
  verified: boolean;
}

/** A national or cantonal how-to resource by topic (resources.topic_code). */
export interface TopicResource {
  topic: string;
  title: Partial<Record<LanguageCode, string>>;
  url: string;
  language?: string;
  official: boolean;
  provider?: string;
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

  /** Where the path starts and ends, e.g. "efz" -> "fh_bachelor". */
  entryLevelCode?: string;
  exitLevelCode?: string;

  steps: LearningPathStep[];
}
