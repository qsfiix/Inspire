import { isSupabaseActive, getSupabase, fetchSupabaseConfig } from "../supabaseClient";
import { LocalMockDB } from "./localMockDB";
import { ResourceItem, Institution, Profession, LanguageCode } from "../types";
import { OFF_RESOURCES, SWISS_INSTITUTIONS } from "../data";

const tryParseJsonOrArray = (val: any, fallback: any = undefined) => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return JSON.parse(trimmed);
      } catch (err) {
        // Fall through
      }
    }
    if (Array.isArray(fallback)) {
      return trimmed.split(",").map(item => item.trim()).filter(Boolean);
    }
  }
  return val;
};

const parseDbResource = (db: any): ResourceItem => {
  let title = db.title || { en: "Unknown Resource" };
  let desc = db.description || { en: "No description provided." };
  if (typeof title === "string" && title.startsWith("{")) {
    try { title = JSON.parse(title); } catch (e) { title = { en: title }; }
  } else if (typeof title === "string") {
    title = { en: title, de: title, fr: title, it: title };
  }

  if (typeof desc === "string" && desc.startsWith("{")) {
    try { desc = JSON.parse(desc); } catch (e) { desc = { en: desc }; }
  } else if (typeof desc === "string") {
    desc = { en: desc, de: desc, fr: desc, it: desc };
  }

  // Support any category, fall back if entirely empty
  const category = db.category || "official_portal";

  return {
    id: db.id || String(Math.random()),
    category,
    country: db.country || "CH",
    title,
    description: desc,
    url: db.url || db.resource_url || "https://www.ch.ch",
    
    // Rich extensions
    status: db.status || (db.verified ? "verified" : undefined),
    verified: Boolean(db.verified),
    rating: typeof db.rating === "number" ? db.rating : undefined,
    tags: tryParseJsonOrArray(db.tags, []),
    isFederal: db.isFederal !== undefined ? Boolean(db.isFederal) : (db.is_federal !== undefined ? Boolean(db.is_federal) : undefined),
    lastUpdated: db.lastUpdated || db.last_updated || undefined,
    clicksCount: typeof db.clicksCount === "number" ? db.clicksCount : (typeof db.clicks_count === "number" ? db.clicks_count : undefined),
    accessCost: db.accessCost || db.access_cost || "free",
    customMetadata: tryParseJsonOrArray(db.customMetadata || db.custom_metadata, undefined)
  };
};

const parseDbInstitution = (db: any): Institution => {
  let coords: [number, number] = [8.5417, 47.3769];
  if (db.coordinates && Array.isArray(db.coordinates) && db.coordinates.length === 2) {
    coords = [db.coordinates[0], db.coordinates[1]];
  } else if (db.longitude && db.latitude) {
    coords = [db.longitude, db.latitude];
  } else if (db.lng && db.lat) {
    coords = [db.lng, db.lat];
  }

  let desc = db.description || { en: "No description provided." };
  if (typeof desc === "string" && desc.startsWith("{")) {
    try { desc = JSON.parse(desc); } catch (e) { desc = { en: desc }; }
  } else if (typeof desc === "string") {
    desc = { en: desc, de: desc, fr: desc, it: desc };
  }

  let adm = db.admissionRequirements;
  if (adm) {
    if (typeof adm === "string") {
      if (adm.startsWith("{")) {
        try { adm = JSON.parse(adm); } catch (e) { adm = { en: adm }; }
      } else {
        adm = { en: db.admissionRequirements, de: db.admissionRequirements, fr: db.admissionRequirements, it: db.admissionRequirements };
      }
    }
  }

  return {
    id: db.id || String(Math.random()),
    title: db.title || db.name || "Unknown Institution",
    category: db.category || "university",
    coordinates: coords,
    canton: db.canton || "Zurich",
    description: desc,
    website: db.website || db.web_url || "https://www.ch.ch",
    email: db.email || "",
    phone: db.phone || "",
    address: db.address || "",
    imageUrl: db.imageUrl || db.image_url || undefined,
    admissionRequirements: adm,

    // Rich database extensions
    status: db.status || (db.verified ? "verified" : undefined),
    verified: Boolean(db.verified),
    rating: typeof db.rating === "number" ? db.rating : undefined,
    establishedYear: typeof db.establishedYear === "number" ? db.establishedYear : (typeof db.established_year === "number" ? db.established_year : undefined),
    studentCount: typeof db.studentCount === "number" ? db.studentCount : (typeof db.student_count === "number" ? db.student_count : undefined),
    cantonalLanguage: db.cantonalLanguage || db.cantonal_language || undefined,
    tags: tryParseJsonOrArray(db.tags, []),
    isPublic: db.isPublic !== undefined ? Boolean(db.isPublic) : (db.is_public !== undefined ? Boolean(db.is_public) : true),
    degreeLevels: tryParseJsonOrArray(db.degreeLevels || db.degree_levels, undefined),
    customMetadata: tryParseJsonOrArray(db.customMetadata || db.custom_metadata, undefined)
  };
};

const parseDbProfession = (db: any): Profession => {
  let title = db.title || { en: "Unknown Profession" };
  let desc = db.description || { en: "No description provided." };
  if (typeof title === "string" && title.startsWith("{")) {
    try { title = JSON.parse(title); } catch (e) { title = { en: title }; }
  } else if (typeof title === "string") {
    title = { en: title, de: title, fr: title, it: title };
  }

  if (typeof desc === "string" && desc.startsWith("{")) {
    try { desc = JSON.parse(desc); } catch (e) { desc = { en: desc }; }
  } else if (typeof desc === "string") {
    desc = { en: desc, de: desc, fr: desc, it: desc };
  }

  let edu = db.educationRequired || { en: "Not specified" };
  if (typeof edu === "string" && edu.startsWith("{")) {
    try { edu = JSON.parse(edu); } catch (e) { edu = { en: edu }; }
  } else if (typeof edu === "string") {
    edu = { en: edu, de: edu, fr: edu, it: edu };
  }

  const rawSkills = tryParseJsonOrArray(db.skillsRequired || db.skills_required, undefined);
  let skillsRequired: Record<LanguageCode, string[]> | undefined = undefined;
  if (rawSkills) {
    if (Array.isArray(rawSkills)) {
      skillsRequired = {
        en: rawSkills,
        de: rawSkills,
        fr: rawSkills,
        it: rawSkills
      };
    } else if (typeof rawSkills === "object") {
      const en = Array.isArray(rawSkills.en) ? rawSkills.en : (Array.isArray(rawSkills.de || rawSkills.fr || rawSkills.it) ? (rawSkills.de || rawSkills.fr || rawSkills.it) : []);
      const de = Array.isArray(rawSkills.de) ? rawSkills.de : en;
      const fr = Array.isArray(rawSkills.fr) ? rawSkills.fr : en;
      const it = Array.isArray(rawSkills.it) ? rawSkills.it : en;
      skillsRequired = { en, de, fr, it };
    }
  }

  const category = db.category || "other";

  return {
    id: db.id || String(Math.random()),
    title,
    description: desc,
    category,
    salaryCHF: typeof db.salaryCHF === "number" ? db.salaryCHF : (typeof db.salary_chf === "number" ? db.salary_chf : 90000),
    outlook: db.outlook || "medium",
    educationRequired: edu,

    // Rich database extensions
    status: db.status || (db.verified ? "verified" : undefined),
    verified: Boolean(db.verified),
    demandLevel: db.demandLevel || db.demand_level || undefined,
    growthRatePct: typeof db.growthRatePct === "number" ? db.growthRatePct : (typeof db.growth_rate_pct === "number" ? db.growth_rate_pct : undefined),
    avgWorkHoursWeekly: typeof db.avgWorkHoursWeekly === "number" ? db.avgWorkHoursWeekly : (typeof db.avg_work_hours_weekly === "number" ? db.avg_work_hours_weekly : undefined),
    flexibilityScore: typeof db.flexibilityScore === "number" ? db.flexibilityScore : (typeof db.flexibility_score === "number" ? db.flexibility_score : undefined),
    skillsRequired,
    industries: tryParseJsonOrArray(db.industries, undefined),
    isApprenticeshipPath: db.isApprenticeshipPath !== undefined ? Boolean(db.isApprenticeshipPath)
      : db.is_apprenticeship_path !== undefined ? Boolean(db.is_apprenticeship_path)
      : db.is_apprentices_path !== undefined ? Boolean(db.is_apprentices_path)
      : db.isApprenticesPath !== undefined ? Boolean(db.isApprenticesPath)
      : undefined,
    customMetadata: tryParseJsonOrArray(db.customMetadata || db.custom_metadata, undefined)
  };
};

/**
 * DataRepository acts as the unified data access layer.
 * 
 * DESIGN RATIONALE:
 * - This separates components from knowing whether data comes from Mock/Local or Supabase.
 * - Components are clean and simply ask Repository for data or subscriptions.
 * - Calling functions will wait for fetchSupabaseConfig() to prevent early race condition fails.
 */
export const DataRepository = {
  // Profiles (Cloud-First for Auth Users, Local for Guests)
  getProfile: async () => {
    await fetchSupabaseConfig();
    const localProfile = LocalMockDB.getProfile();

    if (isSupabaseActive()) {
      try {
        const supabase = getSupabase();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (!userError && userData?.user) {
          // Authentic cloud user
          if (localProfile?.isGuest) {
            // We have a local guest profile but the user is signed in.
            // Ideally we'd merge, but for now just prioritize the signed in user.
          }
          
          const { data, error } = await supabase.from("profiles").select("*").eq("id", userData.user.id).single();
          if (!error && data) {
            return {
              name: data.name || localProfile?.name || "",
              email: data.email || localProfile?.email || userData.user.email || "",
              interests: tryParseJsonOrArray(data.interests, localProfile?.interests || []),
              goals: tryParseJsonOrArray(data.goals, localProfile?.goals || []),
              currentStage: data.current_stage || localProfile?.currentStage || "secondary",
              language: data.language || localProfile?.language || "en",
              onboardingComplete: Boolean(data.onboarding_complete || localProfile?.onboardingComplete),
              createdAt: data.created_at || localProfile?.createdAt || new Date().toISOString(),
              isGuest: false,
              avatarUrl: data.avatar_url || localProfile?.avatarUrl,
              updatedAt: data.updated_at,
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
  saveProfile: async (profile: any) => {
    await fetchSupabaseConfig();
    
    // Always keep a local copy for quick load
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
            interests: JSON.stringify(profile.interests),
            goals: JSON.stringify(profile.goals),
            current_stage: profile.currentStage,
            language: profile.language,
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
  
  // Trackers (Cache / Local-First)
  getTrackers: () => {
    if (isSupabaseActive()) {
      // TODO (Future): return await getSupabase().from("trackers")...
    }
    return LocalMockDB.getTrackers();
  },
  saveTrackers: (trackers: any[]) => {
    if (isSupabaseActive()) {
      // TODO (Future): await getSupabase().from("trackers").upsert(trackers)
    }
    LocalMockDB.saveTrackers(trackers);
  },

  // Resources (Cloud-First if active, otherwise Local)
  getResources: async (): Promise<ResourceItem[]> => {
    await fetchSupabaseConfig();
    if (isSupabaseActive()) {
      try {
        const { data, error } = await getSupabase().from("resources").select("*");
        if (!error && data && data.length > 0) {
          const parsed = data.map(parseDbResource);
          const merged = [...parsed, ...OFF_RESOURCES];
          const seen = new Set();
          return merged.filter(x => {
            if (seen.has(x.id)) return false;
            seen.add(x.id);
            return true;
          });
        }
      } catch (err) {
        console.warn("Failed to load resources from Supabase table 'resources'. Falling back to static data.", err);
      }
    }
    return OFF_RESOURCES;
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
        console.warn("Failed to establish PostgreSQL Realtime listen hooks for resources:", err);
      }
    }
    return null;
  },

  // Institutions (Cloud-First if active, otherwise Local)
  getInstitutions: async (): Promise<Institution[]> => {
    await fetchSupabaseConfig();
    if (isSupabaseActive()) {
      try {
        const supabase = getSupabase();
        let { data, error } = await supabase.from("institutions").select("*");
        if (error || !data || data.length === 0) {
          const response = await supabase.from("schools").select("*");
          data = response.data;
        }
        if (data && data.length > 0) {
          return data.map(parseDbInstitution);
        }
      } catch (err) {
        console.warn("Failed to load institutions from Supabase tables, falling back to static SWISS_INSTITUTIONS.", err);
      }
    }
    return SWISS_INSTITUTIONS;
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
        console.warn("Failed to establish PostgreSQL Realtime listen hooks for institutions/schools:", err);
      }
    }
    return null;
  },

  // Professions (Preparation for future expansion)
  getProfessions: async (): Promise<Profession[]> => {
    await fetchSupabaseConfig();
    if (isSupabaseActive()) {
      try {
        const { data, error } = await getSupabase().from("professions").select("*");
        if (!error && data && data.length > 0) {
          return data.map(parseDbProfession);
        }
      } catch (err) {
        console.warn("Failed to load professions from Supabase", err);
      }
    }
    return []; // Return mock static data here if any
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
         console.warn("Failed to establish PostgreSQL Realtime listen hooks for professions:", err);
      }
    }
    return null;
  },

  clearAll: () => {
    LocalMockDB.clearAll();
  }
};
