import { isSupabaseActive, getSupabase, fetchSupabaseConfig } from "../supabaseClient";
import { LocalMockDB } from "./localMockDB";
import {
  ResourceItem,
  Institution,
  Profession,
  LanguageCode,
  UserProfile,
  DataOrigin,
  TrackerGoal,
  TrackerChecklistItem,
  LearningPath,
  LearningPathStep,
  ProfessionInstitutionLink
} from "../types";
import { OFF_RESOURCES, SWISS_INSTITUTIONS } from "../data";
import { normalizeCoordinates, normalizeId, normalizeText, normalizeUrl } from "../lib/validation";
import { isLanguageCode, SUPPORTED_LANGUAGES } from "../lib/localized";

/**
 * DataRepository is the single data access layer between features/engine and storage.
 *
 * DESIGN RATIONALE:
 * - Components never learn whether data came from Supabase, local cache or static seed.
 * - Every returned record is normalized and carries `dataOrigin`.
 *
 * HARD RULE (02_Product/Requirements/Trust and Data Requirements.md):
 * The adapter must never invent a value. If a canonical field is missing in the source
 * row it stays `undefined` and is listed in `incompleteFields`. If the *identity* of a
 * record is missing, the record is dropped rather than given a random ID.
 */

// ---------------------------------------------------------------------------
// Normalization primitives
// ---------------------------------------------------------------------------

/** Reads the first present value among several possible column spellings. */
const pick = (db: Record<string, any>, ...keys: string[]): unknown => {
  for (const key of keys) {
    const value = db?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
};

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const asBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (value === "true" || value === "TRUE" || value === 1 || value === "1") return true;
  if (value === "false" || value === "FALSE" || value === 0 || value === "0") return false;
  return undefined;
};

const asStringArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) {
    const items = value.map(item => normalizeText(item)).filter((v): v is string => Boolean(v));
    return items.length > 0 ? items : undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith("[")) {
      try {
        return asStringArray(JSON.parse(trimmed));
      } catch {
        // fall through to comma splitting
      }
    }
    const items = trimmed
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);
    return items.length > 0 ? items : undefined;
  }
  return undefined;
};

const asMetadata = (value: unknown): Record<string, unknown> | undefined => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value === "string" && value.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch {
      return undefined;
    }
  }
  return undefined;
};

/**
 * Normalizes a multilingual text column.
 *
 * A plain string is treated as a single known translation (English) instead of being
 * copied into all four languages: duplicating a German sentence into the `fr` slot
 * would be a fabricated translation, and `localizedText` already falls back safely.
 */
const asLocalizedText = (
  value: unknown
): Partial<Record<LanguageCode, string>> | undefined => {
  if (value === undefined || value === null) return undefined;

  if (typeof value === "object" && !Array.isArray(value)) {
    const source = value as Record<string, unknown>;
    const result: Partial<Record<LanguageCode, string>> = {};
    for (const code of SUPPORTED_LANGUAGES) {
      const text = normalizeText(source[code]);
      if (text) result[code] = text;
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith("{")) {
      try {
        return asLocalizedText(JSON.parse(trimmed));
      } catch {
        // not JSON - treat as a single translation below
      }
    }
    return { en: trimmed };
  }

  return undefined;
};

/**
 * Picks a localized text field, trying each base name in order and returning
 * the first one that yields any translation at all.
 *
 * Two source conventions exist across imports and the current Supabase schema:
 * - suffixed columns per language (`title_en`, `title_de`, `title_fr`, `title_it`) -
 *   this is how the live `institutions`/`resources`/`professions` tables store
 *   multilingual text;
 * - a single column holding either a nested `{en, de, fr, it}` object or one
 *   plain string (handled by `asLocalizedText`) - kept for static/legacy rows.
 *
 * Order base names from the most language-complete field to the least: the
 * first base name with ANY translation wins outright, so a fuller field
 * (e.g. `summary_de/fr/it/en`) should be listed before a partial one
 * (e.g. `description_de` only).
 */
const pickLocalizedText = (
  db: Record<string, any>,
  ...baseNames: string[]
): Partial<Record<LanguageCode, string>> | undefined => {
  for (const base of baseNames) {
    const suffixed: Partial<Record<LanguageCode, string>> = {};
    for (const code of SUPPORTED_LANGUAGES) {
      const text = normalizeText(db?.[`${base}_${code}`]);
      if (text) suffixed[code] = text;
    }
    if (Object.keys(suffixed).length > 0) return suffixed;

    const bare = asLocalizedText(db?.[base]);
    if (bare) return bare;
  }
  return undefined;
};

/**
 * Picks a single best-available string for fields that are not localized in
 * the product model (currently only `Institution.title`). Prefers English,
 * then the other supported languages via suffixed columns, then a plain
 * column - never mixes languages within one call, just picks one source.
 */
const pickPlainText = (db: Record<string, any>, ...baseNames: string[]): string | undefined => {
  for (const base of baseNames) {
    for (const code of SUPPORTED_LANGUAGES) {
      const text = normalizeText(db?.[`${base}_${code}`]);
      if (text) return text;
    }
    const bare = normalizeText(db?.[base]);
    if (bare) return bare;
  }
  return undefined;
};

const asLocalizedList = (
  value: unknown
): Partial<Record<LanguageCode, string[]>> | undefined => {
  if (value === undefined || value === null) return undefined;

  if (Array.isArray(value)) {
    const items = asStringArray(value);
    return items ? { en: items } : undefined;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{")) {
      try {
        return asLocalizedList(JSON.parse(trimmed));
      } catch {
        // fall through
      }
    }
    const items = asStringArray(trimmed);
    return items ? { en: items } : undefined;
  }

  if (typeof value === "object") {
    const source = value as Record<string, unknown>;
    const result: Partial<Record<LanguageCode, string[]>> = {};
    for (const code of SUPPORTED_LANGUAGES) {
      const items = asStringArray(source[code]);
      if (items) result[code] = items;
    }
    return Object.keys(result).length > 0 ? result : undefined;
  }

  return undefined;
};

/** Collects the canonical fields that were absent, so the UI can lower confidence. */
const collectMissing = (record: Record<string, unknown>, fields: string[]): string[] =>
  fields.filter(field => record[field] === undefined);

/**
 * True when `value` is a well-formed UUID string.
 *
 * `tracker_goals.id`/`tracker_items.id` are `uuid` columns, so client-generated
 * ids must actually be UUIDs (see `crypto.randomUUID()` in TrackerSystem.tsx).
 * Used defensively before syncing trackers to Supabase, so a browser holding
 * pre-UUID-fix localStorage data degrades to local-only rather than erroring.
 */
const isValidUuid = (value: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

/**
 * `tracker_goals.category` (DB CHECK) allows education/habit/language/career/
 * health/productivity/other - "sport" (a value the product UI offers) is not
 * one of them. Map both directions rather than silently failing the write or
 * losing the distinction on read.
 */
const toDbTrackerCategory = (category: TrackerGoal["category"]): string =>
  category === "sport" ? "health" : category;

const fromDbTrackerCategory = (value: unknown): TrackerGoal["category"] => {
  if (
    value === "education" ||
    value === "habit" ||
    value === "health" ||
    value === "productivity" ||
    value === "other"
  ) {
    return value;
  }
  // "language"/"career" are valid in the DB but have no direct app category yet.
  return "other";
};

/** `tracker_items.frequency` (DB CHECK) allows once/daily/weekly/monthly/custom; the product UI only offers daily/weekly. */
const fromDbTrackerFrequency = (value: unknown): TrackerChecklistItem["frequency"] =>
  value === "weekly" ? "weekly" : "daily";

const calculateTrackerProgress = (items: { completed: boolean }[]): number => {
  if (items.length === 0) return 0;
  return Math.round((items.filter(i => i.completed).length / items.length) * 100);
};

// ---------------------------------------------------------------------------
// Row adapters. Each returns `null` when the row has no usable identity.
// ---------------------------------------------------------------------------

const INSTITUTION_QUALITY_FIELDS = ["category", "coordinates", "canton", "website", "description"];

export const parseDbInstitution = (db: Record<string, any>): Institution | null => {
  const id = normalizeId(pick(db, "id", "institution_id", "slug"));
  // `Institution.title` is a single (non-localized) string in the product model.
  // Prefer a real title column (title_en/de/fr/it) over the shorter `name`,
  // which reads more like an internal label in the current schema.
  const title = pickPlainText(db, "title", "name", "institution_name");

  // Identity validation first: no stable ID or no usable title means no record.
  if (!id || !title) return null;

  const rawCoordinates = pick(db, "coordinates");
  let coordinates = undefined;
  if (Array.isArray(rawCoordinates) && rawCoordinates.length === 2) {
    coordinates = normalizeCoordinates(asNumber(rawCoordinates[0]), asNumber(rawCoordinates[1]));
  }
  if (!coordinates) {
    coordinates = normalizeCoordinates(
      asNumber(pick(db, "longitude", "lng", "lon")),
      asNumber(pick(db, "latitude", "lat"))
    );
  }

  const institution: Institution = {
    id,
    title,
    category: normalizeText(pick(db, "category", "institution_type", "type", "institution_group")),
    coordinates,
    canton: normalizeText(pick(db, "canton", "region")),
    // `summary_*` has full en/de/fr/it coverage in the live schema; `description_de`
    // and `overview_de` are German-only fallbacks (localizedText() falls back to
    // whichever language is present rather than showing nothing).
    description: pickLocalizedText(db, "summary", "description", "overview"),
    website: normalizeUrl(pick(db, "website", "web_url", "website_url", "official_homepage_url")),
    email: normalizeText(pick(db, "email", "contact_email")),
    phone: normalizeText(pick(db, "phone", "contact_phone")),
    address: normalizeText(pick(db, "address", "formatted_address", "street_address")),
    imageUrl: normalizeUrl(pick(db, "imageUrl", "image_url", "logo_url")),
    imageAttribution: normalizeText(pick(db, "imageAttribution", "image_attribution", "logo_attribution")),
    admissionRequirements: pickLocalizedText(
      db,
      "admissionRequirements",
      "admission_requirements",
      "admissions_summary"
    ),
    profile: pickLocalizedText(db, "institution_profile"),
    languageEnvironment: pickLocalizedText(db, "language_environment"),
    studentLife: pickLocalizedText(db, "student_life"),
    housingNotes: pickLocalizedText(db, "housing_notes"),
    applicationNotes: pickLocalizedText(db, "application_notes"),
    status: normalizeText(pick(db, "status", "verification_status")),
    verified: asBoolean(pick(db, "verified", "is_verified")),
    rating: asNumber(pick(db, "rating", "data_confidence_score")),
    establishedYear: asNumber(pick(db, "establishedYear", "established_year")),
    studentCount: asNumber(pick(db, "studentCount", "student_count")),
    cantonalLanguage: normalizeText(
      pick(db, "cantonalLanguage", "cantonal_language", "languages_of_instruction")
    ),
    tags: asStringArray(pick(db, "tags")),
    isPublic: asBoolean(pick(db, "isPublic", "is_public")),
    degreeLevels: asStringArray(pick(db, "degreeLevels", "degree_levels")),
    customMetadata: asMetadata(pick(db, "customMetadata", "custom_metadata")),
    dataOrigin: "cloud"
  };

  const incompleteFields = collectMissing(
    institution as unknown as Record<string, unknown>,
    INSTITUTION_QUALITY_FIELDS
  );
  if (incompleteFields.length > 0) institution.incompleteFields = incompleteFields;

  return institution;
};

const RESOURCE_QUALITY_FIELDS = ["category", "description", "country"];

export const parseDbResource = (db: Record<string, any>): ResourceItem | null => {
  const id = normalizeId(pick(db, "id", "resource_id", "slug"));
  const title = pickLocalizedText(db, "title", "name");
  const url = normalizeUrl(pick(db, "url", "resource_url", "link", "official_url"));

  // A resource without an identity, a title or a reachable official link has no
  // product value and must not appear as a trusted choice.
  if (!id || !title || !url) return null;

  const resource: ResourceItem = {
    id,
    title,
    description: pickLocalizedText(db, "summary", "description"),
    category: normalizeText(pick(db, "category", "resource_type")),
    url,
    country: normalizeText(pick(db, "country", "country_code")),
    status: normalizeText(pick(db, "status", "verification_status")),
    verified: asBoolean(pick(db, "verified", "is_verified")),
    rating: asNumber(pick(db, "rating")),
    tags: asStringArray(pick(db, "tags")),
    isFederal: asBoolean(pick(db, "isFederal", "is_federal")),
    lastUpdated: normalizeText(pick(db, "lastUpdated", "last_updated", "last_verified_at")),
    clicksCount: asNumber(pick(db, "clicksCount", "clicks_count")),
    accessCost: normalizeText(pick(db, "accessCost", "access_cost", "price_type")),
    customMetadata: asMetadata(pick(db, "customMetadata", "custom_metadata")),
    dataOrigin: "cloud"
  };

  const incompleteFields = collectMissing(
    resource as unknown as Record<string, unknown>,
    RESOURCE_QUALITY_FIELDS
  );
  if (incompleteFields.length > 0) resource.incompleteFields = incompleteFields;

  return resource;
};

const PROFESSION_QUALITY_FIELDS = ["category", "description", "educationRequired", "salaryCHF"];

export const parseDbProfession = (db: Record<string, any>): Profession | null => {
  const id = normalizeId(pick(db, "id", "profession_id", "slug"));
  const title = pickLocalizedText(db, "title", "name");

  if (!id || !title) return null;

  const profession: Profession = {
    id,
    title,
    description: pickLocalizedText(db, "summary", "description"),
    category: normalizeText(pick(db, "category", "profession_category", "sector")),
    // No numeric salary column exists in the live schema (only free-text
    // `salary_notes_de`); stays undefined rather than parsed out of prose.
    salaryCHF: asNumber(pick(db, "salaryCHF", "salary_chf", "salary_range_median")),
    outlook: normalizeText(pick(db, "outlook")),
    educationRequired: pickLocalizedText(db, "educationRequired", "education_required", "education_notes"),
    targetGroup: pickLocalizedText(db, "target_group"),
    dailyWorkContext: pickLocalizedText(db, "daily_work_context"),
    typicalWorkplace: pickLocalizedText(db, "typical_workplace"),
    admissionReality: pickLocalizedText(db, "admission_reality"),
    progressionNotes: pickLocalizedText(db, "progression_notes"),
    status: normalizeText(pick(db, "status", "verification_status")),
    verified: asBoolean(pick(db, "verified", "is_verified")),
    demandLevel: normalizeText(pick(db, "demandLevel", "demand_level")),
    growthRatePct: asNumber(pick(db, "growthRatePct", "growth_rate_pct")),
    avgWorkHoursWeekly: asNumber(pick(db, "avgWorkHoursWeekly", "avg_work_hours_weekly")),
    flexibilityScore: asNumber(pick(db, "flexibilityScore", "flexibility_score")),
    skillsRequired: asLocalizedList(pick(db, "skillsRequired", "skills_required")),
    industries: asStringArray(pick(db, "industries")),
    isApprenticeshipPath: asBoolean(
      pick(db, "isApprenticeshipPath", "is_apprenticeship_path", "isApprenticesPath")
    ),
    customMetadata: asMetadata(pick(db, "customMetadata", "custom_metadata")),
    dataOrigin: "cloud"
  };

  const incompleteFields = collectMissing(
    profession as unknown as Record<string, unknown>,
    PROFESSION_QUALITY_FIELDS
  );
  if (incompleteFields.length > 0) profession.incompleteFields = incompleteFields;

  return profession;
};

const parseDbLearningPathStep = (db: Record<string, any>): LearningPathStep | null => {
  const id = normalizeId(pick(db, "id"));
  const title = pickLocalizedText(db, "title", "name");
  if (!id || !title) return null;

  return {
    id,
    title,
    description: pickLocalizedText(db, "summary", "description", "long_description", "details"),
    timeframe: pickLocalizedText(db, "recommended_timeline")
  };
};

/**
 * A concrete route toward an outcome (e.g. "become_software_engineer"),
 * connected to `learning_path_steps` via `stepsByPath` (keyed by
 * `learning_path_id`, pre-grouped by the caller since Supabase doesn't
 * nest child rows for us).
 */
const parseDbLearningPath = (
  db: Record<string, any>,
  stepsByPath: Map<string, LearningPathStep[]>
): LearningPath | null => {
  const id = normalizeId(pick(db, "id"));
  const title = pickLocalizedText(db, "outcomeTitle", "outcome_title", "title", "name");
  if (!id || !title) return null;

  return {
    id,
    code: normalizeText(pick(db, "code")),
    title,
    description: pickLocalizedText(db, "summary", "description", "short_description", "long_description"),
    pathType: normalizeText(pick(db, "pathType", "path_type", "goal_type")),
    targetProfessionId: normalizeId(pick(db, "targetProfessionId", "target_profession_id")) ?? undefined,
    steps: stepsByPath.get(id) ?? [],
    dataOrigin: "cloud"
  };
};

/** Tags bundled seed data so the UI can tell it apart from live records. */
const withOrigin = <T extends { dataOrigin?: DataOrigin }>(records: T[], origin: DataOrigin): T[] =>
  records.map(record => (record.dataOrigin ? record : { ...record, dataOrigin: origin }));

const parseRows = <T>(rows: unknown, adapter: (row: Record<string, any>) => T | null): T[] => {
  if (!Array.isArray(rows)) return [];
  return rows
    .map(row => (row && typeof row === "object" ? adapter(row as Record<string, any>) : null))
    .filter((record): record is T => record !== null);
};

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export const DataRepository = {
  // Profiles (cloud-first for authenticated users, local for guests)
  //
  // SCHEMA NOTE (verified live 2026-09-12): `profiles` does not carry
  // `interests`/`goals`/`language`/`onboarding_complete`/`preferred_canton`/
  // `target_language_region` as columns. Interests and goals are normalized
  // into `profile_interests`/`profile_goals` (one row per slug); target
  // canton/language are `profile_target_cantons`/`profile_target_languages`
  // (one row per preference, ordered by `priority` - the app currently only
  // models a single value for each, so we read/write the top-priority row).
  // `profiles` itself uses `full_name`, `interface_language_code`, and a
  // status+timestamp pair (`onboarding_status`/`onboarding_completed_at`)
  // instead of a boolean.
  getProfile: async (): Promise<UserProfile | null> => {
    await fetchSupabaseConfig();
    const localProfile = LocalMockDB.getProfile();

    if (isSupabaseActive()) {
      try {
        const supabase = getSupabase();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (!userError && userData?.user) {
          const uid = userData.user.id;
          const [profileRes, interestsRes, goalsRes, targetLangRes, targetCantonRes] = await Promise.all([
            supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
            supabase.from("profile_interests").select("interest_slug").eq("profile_id", uid),
            supabase.from("profile_goals").select("goal_slug").eq("profile_id", uid),
            supabase
              .from("profile_target_languages")
              .select("language_code")
              .eq("profile_id", uid)
              .order("priority", { ascending: true })
              .limit(1),
            supabase
              .from("profile_target_cantons")
              .select("canton_code")
              .eq("profile_id", uid)
              .order("priority", { ascending: true })
              .limit(1)
          ]);

          const data = profileRes.data;
          if (!profileRes.error && data) {
            const language = isLanguageCode(data.interface_language_code)
              ? data.interface_language_code
              : localProfile?.language ?? "en";

            return {
              id: uid,
              name: normalizeText(data.full_name) ?? localProfile?.name ?? "",
              email:
                normalizeText(data.email) ??
                localProfile?.email ??
                normalizeText(userData.user.email) ??
                "",
              interests:
                asStringArray((interestsRes.data ?? []).map((r: any) => r.interest_slug)) ??
                localProfile?.interests ??
                [],
              goals:
                asStringArray((goalsRes.data ?? []).map((r: any) => r.goal_slug)) ??
                localProfile?.goals ??
                [],
              currentStage:
                normalizeText(data.current_stage) ?? localProfile?.currentStage ?? "",
              language,
              onboardingComplete:
                data.onboarding_status === "completed" || Boolean(localProfile?.onboardingComplete),
              createdAt:
                normalizeText(data.created_at) ??
                localProfile?.createdAt ??
                new Date().toISOString(),
              isGuest: false,
              avatarUrl: normalizeUrl(data.avatar_url) ?? localProfile?.avatarUrl,
              bio: normalizeText(data.bio) ?? localProfile?.bio,
              updatedAt: normalizeText(data.updated_at),
              preferredCanton:
                normalizeText(targetCantonRes.data?.[0]?.canton_code) ?? localProfile?.preferredCanton,
              targetLanguageRegion:
                normalizeText(targetLangRes.data?.[0]?.language_code) ??
                localProfile?.targetLanguageRegion,
              syncState: "cloud"
            };
          }
        }
      } catch (e) {
        console.warn("Failed fetching profile from Supabase", e);
      }
    }

    if (localProfile) {
      localProfile.syncState = "local";
    }
    return localProfile;
  },

  saveProfile: async (profile: UserProfile) => {
    await fetchSupabaseConfig();

    // Always keep a local copy for instant load and offline continuity.
    LocalMockDB.saveProfile(profile);

    if (isSupabaseActive() && !profile.isGuest) {
      try {
        const supabase = getSupabase();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (!userError && userData?.user) {
          const uid = userData.user.id;

          await supabase.from("profiles").upsert({
            id: uid,
            email: profile.email || userData.user.email,
            full_name: profile.name,
            interface_language_code: profile.language,
            current_stage: profile.currentStage || null,
            onboarding_status: profile.onboardingComplete ? "completed" : "pending",
            onboarding_completed_at: profile.onboardingComplete ? new Date().toISOString() : null,
            avatar_url: profile.avatarUrl ?? null,
            bio: profile.bio ?? null,
            is_guest: false,
            updated_at: new Date().toISOString()
          });

          // Child preference tables have no stable id from the client side,
          // so a full replace-per-save is the simplest correct sync for a
          // flat client-side list/single-value model. RLS on these tables
          // (`*_all_own`) requires profile_id = auth.uid(), matching `uid`.
          await supabase.from("profile_interests").delete().eq("profile_id", uid);
          if (profile.interests.length > 0) {
            await supabase.from("profile_interests").insert(
              profile.interests.map(slug => ({ profile_id: uid, interest_slug: slug }))
            );
          }

          await supabase.from("profile_goals").delete().eq("profile_id", uid);
          if (profile.goals.length > 0) {
            await supabase.from("profile_goals").insert(
              profile.goals.map(slug => ({ profile_id: uid, goal_slug: slug }))
            );
          }

          await supabase.from("profile_target_languages").delete().eq("profile_id", uid);
          if (profile.targetLanguageRegion) {
            await supabase.from("profile_target_languages").insert({
              profile_id: uid,
              language_code: profile.targetLanguageRegion
            });
          }

          await supabase.from("profile_target_cantons").delete().eq("profile_id", uid);
          if (profile.preferredCanton) {
            await supabase.from("profile_target_cantons").insert({
              profile_id: uid,
              canton_code: profile.preferredCanton
            });
          }
        }
      } catch (e) {
        console.warn("Failed syncing profile to Supabase", e);
      }
    }
  },

  // Auth (real Supabase Auth accounts; guest mode never calls these and stays local-only)
  //
  // PRODUCT RULE (02_Product/Backend/Prototype Limitations.md - "Login не является
  // полноценной Supabase authentication flow"): a signed-up user must get a real
  // account whose data survives clearing the browser, not a local-only profile
  // that merely LOOKS like one. `saveProfile` above already syncs to Supabase
  // once a real session exists - these methods are what create that session.
  signUp: async (
    name: string,
    email: string,
    password: string,
    language: LanguageCode
  ): Promise<{ profile: UserProfile | null; needsEmailConfirmation: boolean; error?: string }> => {
    await fetchSupabaseConfig();
    if (!isSupabaseActive()) {
      return {
        profile: null,
        needsEmailConfirmation: false,
        error: "Cloud accounts are not available right now. Try Guest mode instead."
      };
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { profile: null, needsEmailConfirmation: false, error: error.message };
    if (!data.user) {
      return { profile: null, needsEmailConfirmation: false, error: "Account creation failed unexpectedly." };
    }

    // If email confirmation is required, Supabase returns a user but no
    // session - `saveProfile`'s cloud upsert needs `auth.getUser()` to
    // resolve, so the profile stays local-only until the user confirms and
    // signs in for real. It is not lost: `saveProfile` always writes locally
    // first regardless of session state.
    const needsEmailConfirmation = !data.session;

    const profile: UserProfile = {
      id: data.user.id,
      name,
      email,
      interests: [],
      goals: [],
      currentStage: "",
      language,
      onboardingComplete: false,
      createdAt: new Date().toISOString(),
      isGuest: false,
      syncState: needsEmailConfirmation ? "local" : "cloud"
    };

    await DataRepository.saveProfile(profile);

    return { profile, needsEmailConfirmation };
  },

  signIn: async (
    email: string,
    password: string
  ): Promise<{ profile: UserProfile | null; error?: string }> => {
    await fetchSupabaseConfig();
    if (!isSupabaseActive()) {
      return { profile: null, error: "Cloud accounts are not available right now. Try Guest mode instead." };
    }

    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { profile: null, error: error.message };

    let profile = await DataRepository.getProfile();

    // Signed in successfully but no `profiles` row exists yet (e.g. the
    // account predates this flow, or the profiles table isn't set up yet) -
    // start a fresh profile rather than failing the sign-in.
    if (!profile && data.user) {
      profile = {
        id: data.user.id,
        name: normalizeText(data.user.user_metadata?.name) ?? "",
        email: normalizeText(data.user.email) ?? email,
        interests: [],
        goals: [],
        currentStage: "",
        language: "en",
        onboardingComplete: false,
        createdAt: new Date().toISOString(),
        isGuest: false,
        syncState: "local"
      };
      await DataRepository.saveProfile(profile);
    }

    return { profile };
  },

  signOut: async (): Promise<void> => {
    if (!isSupabaseActive()) return;
    try {
      await getSupabase().auth.signOut();
    } catch (e) {
      console.warn("Failed to sign out of Supabase", e);
    }
  },

  // Trackers (cloud-first for signed-in users via tracker_goals/tracker_items,
  // local-only for guests - see 02_Product/API/Tracker API Contract.md).
  //
  // Neither table gives the client a stable identity to diff against beyond
  // the ids it generated itself, so - like the profile preference tables -
  // saveTrackers does a full replace per save rather than a partial sync.
  // Deleting a tracker_goal cascades to its tracker_items
  // (fk_tracker_items_tracker_goal ... ON DELETE CASCADE), so one delete is enough.
  getTrackers: async (): Promise<TrackerGoal[]> => {
    await fetchSupabaseConfig();
    const localTrackers = LocalMockDB.getTrackers();

    if (isSupabaseActive()) {
      try {
        const supabase = getSupabase();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (!userError && userData?.user) {
          const uid = userData.user.id;
          const [goalsRes, itemsRes] = await Promise.all([
            supabase
              .from("tracker_goals")
              .select("*")
              .eq("profile_id", uid)
              .neq("status", "archived")
              .order("sort_order", { ascending: true }),
            supabase
              .from("tracker_items")
              .select("*")
              .eq("profile_id", uid)
              .order("sort_order", { ascending: true })
          ]);

          if (!goalsRes.error && Array.isArray(goalsRes.data)) {
            const itemsByGoal = new Map<string, TrackerChecklistItem[]>();
            for (const row of (itemsRes.data ?? []) as any[]) {
              const list = itemsByGoal.get(row.tracker_goal_id) ?? [];
              list.push({
                id: row.id,
                text: normalizeText(row.title) ?? "",
                completed: Boolean(row.is_completed),
                frequency: fromDbTrackerFrequency(row.frequency),
                stepId: normalizeId(row.metadata?.step_id) ?? undefined
              });
              itemsByGoal.set(row.tracker_goal_id, list);
            }

            return (goalsRes.data as any[]).map(row => {
              const items = itemsByGoal.get(row.id) ?? [];
              const tracker: TrackerGoal = {
                id: row.id,
                title: normalizeText(row.title) ?? "",
                category: fromDbTrackerCategory(row.category),
                description: normalizeText(row.description) ?? "",
                streak: asNumber(row.streak_count) ?? 0,
                progress: calculateTrackerProgress(items),
                items,
                createdAt: normalizeText(row.created_at) ?? new Date().toISOString(),
                updatedAt: normalizeText(row.updated_at),
                dueDate: normalizeText(row.due_on)
              };
              return tracker;
            });
          }
        }
      } catch (e) {
        console.warn("Failed fetching trackers from Supabase", e);
      }
    }

    return localTrackers;
  },

  saveTrackers: async (trackers: TrackerGoal[]): Promise<void> => {
    await fetchSupabaseConfig();

    // Always keep a local copy for instant load and offline continuity.
    LocalMockDB.saveTrackers(trackers);

    if (isSupabaseActive()) {
      try {
        const supabase = getSupabase();
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) return; // guest or no session: local-only

        const uid = userData.user.id;

        const allIdsValid = trackers.every(
          goal => isValidUuid(goal.id) && goal.items.every(item => isValidUuid(item.id))
        );
        if (!allIdsValid) {
          console.warn(
            "Skipping cloud sync for trackers with non-UUID ids (pre-fix local data) - saved locally only."
          );
          return;
        }

        await supabase.from("tracker_goals").delete().eq("profile_id", uid);
        if (trackers.length === 0) return;

        const goalRows = trackers.map((goal, index) => ({
          id: goal.id,
          profile_id: uid,
          title: goal.title,
          description: goal.description || null,
          category: toDbTrackerCategory(goal.category),
          status: "active",
          streak_count: goal.streak,
          sort_order: index,
          due_on: goal.dueDate || null
        }));
        const { error: goalsError } = await supabase.from("tracker_goals").insert(goalRows);
        if (goalsError) throw goalsError;

        const itemRows = trackers.flatMap(goal =>
          goal.items.map((item, index) => ({
            id: item.id,
            tracker_goal_id: goal.id,
            profile_id: uid,
            title: item.text,
            frequency: item.frequency,
            is_completed: item.completed,
            sort_order: index,
            metadata: item.stepId ? { step_id: item.stepId } : {}
          }))
        );
        if (itemRows.length > 0) {
          const { error: itemsError } = await supabase.from("tracker_items").insert(itemRows);
          if (itemsError) throw itemsError;
        }
      } catch (e) {
        console.warn("Failed syncing trackers to Supabase", e);
      }
    }
  },

  hasStoredTrackers: () => LocalMockDB.hasTrackers(),

  // Resources (cloud-first if active, otherwise curated static set)
  getResources: async (): Promise<ResourceItem[]> => {
    await fetchSupabaseConfig();
    if (isSupabaseActive()) {
      try {
        const { data, error } = await getSupabase().from("resources").select("*");
        if (!error && Array.isArray(data) && data.length > 0) {
          const parsed = parseRows(data, parseDbResource);
          if (parsed.length > 0) {
            const merged = [...parsed, ...withOrigin(OFF_RESOURCES, "static")];
            const seen = new Set<string>();
            return merged.filter(item => {
              if (seen.has(item.id)) return false;
              seen.add(item.id);
              return true;
            });
          }
        }
      } catch (err) {
        console.warn(
          "Failed to load resources from Supabase table 'resources'. Falling back to curated static data.",
          err
        );
      }
    }
    return withOrigin(OFF_RESOURCES, "static");
  },

  subscribeToResources: async (callback: () => void) => {
    await fetchSupabaseConfig();
    if (isSupabaseActive()) {
      try {
        return getSupabase()
          .channel(`realtime-resources-sync-${crypto.randomUUID()}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "resources" }, callback)
          .subscribe();
      } catch (err) {
        console.warn("Failed to establish Realtime listener for resources:", err);
      }
    }
    return null;
  },

  // Institutions (canonical table first, legacy `schools` as a labelled import fallback)
  getInstitutions: async (): Promise<Institution[]> => {
    await fetchSupabaseConfig();
    if (isSupabaseActive()) {
      try {
        const supabase = getSupabase();
        const canonical = await supabase.from("institutions").select("*");
        const fromCanonical = parseRows(canonical.data, parseDbInstitution);
        if (fromCanonical.length > 0) return fromCanonical;

        // Legacy/import layer. Kept only until the canonical migration is complete
        // (03_Data/SQL/Data Model.md - canonical naming rule).
        const legacy = await supabase.from("schools").select("*");
        const fromLegacy = parseRows(legacy.data, parseDbInstitution);
        if (fromLegacy.length > 0) return fromLegacy;
      } catch (err) {
        console.warn(
          "Failed to load institutions from Supabase. Falling back to curated static data.",
          err
        );
      }
    }
    return withOrigin(SWISS_INSTITUTIONS, "static");
  },

  subscribeToInstitutions: async (callback: () => void) => {
    await fetchSupabaseConfig();
    if (isSupabaseActive()) {
      try {
        const channel = getSupabase().channel(`realtime-institutions-changes-${crypto.randomUUID()}`);
        channel
          .on("postgres_changes", { event: "*", schema: "public", table: "institutions" }, callback)
          .on("postgres_changes", { event: "*", schema: "public", table: "schools" }, callback);
        return channel.subscribe();
      } catch (err) {
        console.warn("Failed to establish Realtime listener for institutions/schools:", err);
      }
    }
    return null;
  },

  // Professions
  getProfessions: async (): Promise<Profession[]> => {
    await fetchSupabaseConfig();
    if (isSupabaseActive()) {
      try {
        const { data, error } = await getSupabase().from("professions").select("*");
        if (!error && Array.isArray(data) && data.length > 0) {
          const parsed = parseRows(data, parseDbProfession);
          if (parsed.length > 0) return parsed;
        }
      } catch (err) {
        console.warn("Failed to load professions from Supabase", err);
      }
    }
    return [];
  },

  /** Curated profession -> institution pathways (see `profession_institutions`).
   *  Two queries + a client-side join, same pattern as getLearningPaths -
   *  avoids depending on PostgREST FK-embed syntax being set up just right. */
  getProfessionInstitutionLinks: async (): Promise<ProfessionInstitutionLink[]> => {
    await fetchSupabaseConfig();
    if (!isSupabaseActive()) return [];

    try {
      const supabase = getSupabase();
      const [linksRes, instRes, profRes] = await Promise.all([
        supabase.from("profession_institutions").select("*").eq("is_active", true),
        supabase.from("institutions").select("id, title_en, title_de, title_fr, title_it, name, city"),
        supabase.from("professions").select("id, title_en, title_de, title_fr, title_it")
      ]);

      if (linksRes.error || !Array.isArray(linksRes.data)) return [];

      const institutionsById = new Map<string, { title: string; city?: string }>();
      for (const row of (instRes.data ?? []) as any[]) {
        // Falls back to `name` since not every institution has title_* set yet -
        // without this, institutions missing title_* silently drop out of this
        // map and their profession links vanish from the UI with no error.
        const title = pickPlainText(row, "title", "name");
        if (!title) continue;
        institutionsById.set(row.id, { title, city: normalizeText(row.city) });
      }

      const professionsById = new Map<string, string>();
      for (const row of (profRes.data ?? []) as any[]) {
        const title = pickPlainText(row, "title");
        if (!title) continue;
        professionsById.set(row.id, title);
      }

      const links: ProfessionInstitutionLink[] = [];
      for (const row of linksRes.data as any[]) {
        const institution = institutionsById.get(row.institution_id);
        if (!institution) continue;
        links.push({
          id: row.id,
          professionId: row.profession_id,
          professionTitle: professionsById.get(row.profession_id),
          institutionId: row.institution_id,
          institutionTitle: institution.title,
          institutionCity: institution.city,
          note: normalizeText(row.notes_de)
        });
      }
      return links;
    } catch (err) {
      console.warn("Failed to load profession-institution links from Supabase", err);
      return [];
    }
  },

  subscribeToProfessions: async (callback: () => void) => {
    await fetchSupabaseConfig();
    if (isSupabaseActive()) {
      try {
        return getSupabase()
          .channel(`realtime-professions-sync-${crypto.randomUUID()}`)
          .on("postgres_changes", { event: "*", schema: "public", table: "professions" }, callback)
          .subscribe();
      } catch (err) {
        console.warn("Failed to establish Realtime listener for professions:", err);
      }
    }
    return null;
  },

  // Learning paths: concrete, ordered routes toward a specific outcome
  // (02_Product/Requirements/... "path and next steps" is core, not support,
  // per 01_Strategy/Features.md - Уровень A). No static fallback: an empty
  // result here honestly means "no path defined yet for this goal", not
  // "the feature is broken".
  getLearningPaths: async (): Promise<LearningPath[]> => {
    await fetchSupabaseConfig();
    if (!isSupabaseActive()) return [];

    try {
      const supabase = getSupabase();
      const [pathsRes, stepsRes] = await Promise.all([
        supabase.from("learning_paths").select("*").eq("is_active", true),
        supabase.from("learning_path_steps").select("*").order("sort_order", { ascending: true })
      ]);

      if (pathsRes.error || !Array.isArray(pathsRes.data)) return [];

      const stepsByPath = new Map<string, LearningPathStep[]>();
      for (const row of parseRows(stepsRes.data, r => ({ row: r, step: parseDbLearningPathStep(r) }))) {
        if (!row.step) continue;
        const pathId = normalizeId(row.row.learning_path_id);
        if (!pathId) continue;
        const list = stepsByPath.get(pathId) ?? [];
        list.push(row.step);
        stepsByPath.set(pathId, list);
      }

      return parseRows(pathsRes.data, row => parseDbLearningPath(row, stepsByPath));
    } catch (err) {
      console.warn("Failed to load learning paths from Supabase", err);
      return [];
    }
  },

  /**
   * Real, RLS-filtered row counts for the homepage stat strip - never a
   * guessed or rounded figure. Uses `head: true` count queries (no row data
   * transferred) rather than fetching full catalogues just to measure them.
   * Returns null when Supabase isn't reachable, so the caller can hide the
   * strip entirely instead of showing zeros that look like an empty product.
   */
  getPlatformStats: async (): Promise<{ institutions: number; professions: number; learningPaths: number } | null> => {
    await fetchSupabaseConfig();
    if (!isSupabaseActive()) return null;

    try {
      const supabase = getSupabase();
      const [instRes, profRes, pathRes] = await Promise.all([
        supabase.from("institutions").select("*", { count: "exact", head: true }),
        supabase.from("professions").select("*", { count: "exact", head: true }),
        supabase.from("learning_paths").select("*", { count: "exact", head: true }).eq("is_active", true)
      ]);

      if (instRes.error && profRes.error && pathRes.error) return null;

      return {
        institutions: instRes.count ?? 0,
        professions: profRes.count ?? 0,
        learningPaths: pathRes.count ?? 0
      };
    } catch (err) {
      console.warn("Failed to load platform stats from Supabase", err);
      return null;
    }
  },

  clearAll: () => {
    LocalMockDB.clearAll();
  }
};
