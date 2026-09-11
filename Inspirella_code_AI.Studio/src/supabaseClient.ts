import { createClient } from "@supabase/supabase-js";

// Helper state to check if real Supabase client is configured
let isSupabaseConfigured = false;
let supabaseClientInstance: any = null;

/**
 * Mapbox runtime config, read from the same `/api/config` response.
 *
 * PRODUCT RULE (02_Product/Backend/Prototype Limitations.md):
 * `MapboxMap` must receive its token/style explicitly rather than guessing
 * at them, so the map's configuration state is visible and testable.
 */
interface MapboxRuntimeConfig {
  accessToken?: string;
  styleUrl?: string;
}

let mapboxConfig: MapboxRuntimeConfig = {};
let configFetched = false;

/**
 * Fetches runtime config from the server once per session and caches it.
 * Safe to call from multiple places (Repository, App, MapboxMap) - only the
 * first call performs the network request.
 */
export async function fetchSupabaseConfig() {
  if (configFetched) return;

  try {
    const res = await fetch("/api/config");
    if (res.ok) {
      const config = await res.json();
      configFetched = true;

      if (config.supabaseUrl && config.supabaseAnonKey && !config.supabaseUrl.includes("MY_SUPABASE")) {
        supabaseClientInstance = createClient(config.supabaseUrl, config.supabaseAnonKey);
        isSupabaseConfigured = true;
        console.log("Supabase Client initialized successfully with runtime config.");
      }

      mapboxConfig = {
        accessToken: typeof config.mapboxAccessToken === "string" ? config.mapboxAccessToken : undefined,
        styleUrl: typeof config.mapboxStyleUrl === "string" ? config.mapboxStyleUrl : undefined
      };
    }
  } catch (error) {
    console.warn("Failed to fetch runtime config from API route. Falling back to mock persistence.", error);
  }
}

export function getSupabase() {
  return supabaseClientInstance;
}

export function isSupabaseActive(): boolean {
  return isSupabaseConfigured;
}

export function getMapboxConfig(): MapboxRuntimeConfig {
  return mapboxConfig;
}


