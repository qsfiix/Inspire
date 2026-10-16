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
let configPromise: Promise<void> | null = null;

/**
 * Fetches runtime config from the server once per session and caches it.
 *
 * Safe to call from multiple places (Repository, App, MapboxMap) - and safe
 * to call concurrently. `data/Repository.ts` calls this at the top of every
 * method, so several calls routinely land in the same tick before the first
 * `fetch` resolves; without sharing one in-flight promise each of them would
 * create its own Supabase client ("Multiple GoTrueClient instances" warning,
 * duplicate auth listeners).
 */
export function fetchSupabaseConfig(): Promise<void> {
  if (configFetched) return Promise.resolve();
  if (configPromise) return configPromise;

  configPromise = (async () => {
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
    } finally {
      configPromise = null;
    }
  })();

  return configPromise;
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


