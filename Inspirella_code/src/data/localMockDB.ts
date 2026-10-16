import { RouteBackground, TrackerGoal, UserProfile } from "../types";

const PROFILE_KEY = "inspirella_profile";
const ROUTE_KEY = "inspirella_route_background";
const TRACKERS_KEY = "inspirella_trackers";

/**
 * Local-first persistence layer.
 *
 * This is deliberately the *only* place that touches localStorage, so that
 * "saved locally" is never presented to the user as "synced to the cloud"
 * (02_Product/API/Tracker API Contract.md - States).
 *
 * Every read is defensive: a corrupted or hand-edited storage entry must not
 * crash the application on boot.
 */

const readJson = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`Discarding unreadable local entry "${key}".`, err);
    return null;
  }
};

const writeJson = (key: string, value: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    // Quota exceeded or storage disabled (private mode). The app must keep working.
    console.warn(`Could not persist local entry "${key}".`, err);
  }
};

export const LocalMockDB = {
  getProfile(): UserProfile | null {
    const profile = readJson<UserProfile>(PROFILE_KEY);
    if (!profile || typeof profile !== "object") return null;
    // Guard against partially written records from older builds.
    if (!Array.isArray(profile.interests)) profile.interests = [];
    if (!Array.isArray(profile.goals)) profile.goals = [];
    return profile;
  },

  saveProfile(profile: UserProfile): void {
    writeJson(PROFILE_KEY, profile);
  },

  getRouteBackground(): RouteBackground | null {
    const bg = readJson<RouteBackground>(ROUTE_KEY);
    if (!bg || typeof bg !== "object") return null;
    if (!Array.isArray(bg.languageLevels)) bg.languageLevels = [];
    return bg;
  },

  saveRouteBackground(bg: RouteBackground): void {
    writeJson(ROUTE_KEY, bg);
  },

  getTrackers(): TrackerGoal[] {
    const trackers = readJson<TrackerGoal[]>(TRACKERS_KEY);
    return Array.isArray(trackers) ? trackers : [];
  },

  saveTrackers(trackers: unknown[]): void {
    writeJson(TRACKERS_KEY, trackers);
  },

  /**
   * True when this browser has a tracker list at all - including an empty one.
   *
   * This distinction matters: an empty list means "the user deleted their goals",
   * which must be respected, while a missing key means "first visit", which is the
   * only moment an example goal may be offered.
   */
  hasTrackers(): boolean {
    try {
      return localStorage.getItem(TRACKERS_KEY) !== null;
    } catch {
      return false;
    }
  },

  clearAll(): void {
    try {
      localStorage.removeItem(PROFILE_KEY);
      localStorage.removeItem(TRACKERS_KEY);
      localStorage.removeItem(ROUTE_KEY);
    } catch (err) {
      console.warn("Could not clear local Inspirella data.", err);
    }
  }
};
