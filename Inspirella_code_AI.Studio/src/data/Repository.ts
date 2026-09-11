import { isSupabaseActive, getSupabase, fetchSupabaseConfig } from "../supabaseClient";
import { LocalMockDB } from "./localMockDB";
import {
  ResourceItem,
  Institution,
  Profession,
  LanguageCode,
  UserProfile,
  DataOrigin
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
    admissionRequirements: pickLocalizedText(
      db,
      "admissionRequirements",
      "admission_requirements",
      "admissions_summary"
    ),
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
  getProfile: async (): Promise<UserProfile | null> => {
    await fetchSupabaseConfig();
    const localProfile = LocalMockDB.getProfile();

    if (isSupabaseActive()) {
      try {
        const supabase = getSupabase();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (!userError && userData?.user) {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userData.user.id)
            .single();

          if (!error && data) {
            const language = isLanguageCode(data.language)
              ? data.language
              : localProfile?.language ?? "en";

            return {
              id: userData.user.id,
              name: normalizeText(data.name) ?? localProfile?.name ?? "",
              email:
                normalizeText(data.email) ??
                localProfile?.email ??
                normalizeText(userData.user.email) ??
                "",
              interests: asStringArray(data.interests) ?? localProfile?.interests ?? [],
              goals: asStringArray(data.goals) ?? localProfile?.goals ?? [],
              currentStage:
                normalizeText(data.current_stage) ?? localProfile?.currentStage ?? "",
              language,
              onboardingComplete: Boolean(
                data.onboarding_complete ?? localProfile?.onboardingComplete
              ),
              createdAt:
                normalizeText(data.created_at) ??
                localProfile?.createdAt ??
                new Date().toISOString(),
              isGuest: false,
              avatarUrl: normalizeUrl(data.avatar_url) ?? localProfile?.avatarUrl,
              updatedAt: normalizeText(data.updated_at),
              preferredCanton:
                normalizeText(data.preferred_canton) ?? localProfile?.preferredCanton,
              targetLanguageRegion:
                normalizeText(data.target_language_region) ??
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
          await supabase.from("profiles").upsert({
            id: userData.user.id,
            email: profile.email || userData.user.email,
            name: profile.name,
            interests: profile.interests,
            goals: profile.goals,
            current_stage: profile.currentStage,
            language: profile.language,
            preferred_canton: profile.preferredCanton ?? null,
            target_language_region: profile.targetLanguageRegion ?? null,
            onboarding_complete: profile.onboardingComplete,
            created_at: profile.createdAt,
            is_guest: false,
            updated_at: new Date().toISOString()
          });
        }
      } catch (e) {
        console.warn("Failed syncing profile to Supabase", e);
      }
    }
  },

  // Trackers (local-only until the Supabase tracker model is defined and reviewed;
  // see 02_Product/API/Tracker API Contract.md - Current state)
  getTrackers: () => LocalMockDB.getTrackers(),
  saveTrackers: (trackers: unknown[]) => LocalMockDB.saveTrackers(trackers),
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
          .channel("realtime-resources-sync")
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
        const channel = getSupabase().channel("realtime-institutions-changes");
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

  subscribeToProfessions: async (callback: () => void) => {
    await fetchSupabaseConfig();
    if (isSupabaseActive()) {
      try {
        return getSupabase()
          .channel("realtime-professions-sync")
          .on("postgres_changes", { event: "*", schema: "public", table: "professions" }, callback)
          .subscribe();
      } catch (err) {
        console.warn("Failed to establish Realtime listener for professions:", err);
      }
    }
    return null;
  },

  clearAll: () => {
    LocalMockDB.clearAll();
  }
};
