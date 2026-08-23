import { createClient } from "@supabase/supabase-js";

// Helper state to check if real Supabase client is configured
let isSupabaseConfigured = false;
let supabaseClientInstance: any = null;

export async function fetchSupabaseConfig() {
  try {
    const res = await fetch("/api/config");
    if (res.ok) {
      const config = await res.json();
      if (config.supabaseUrl && config.supabaseAnonKey && !config.supabaseUrl.includes("MY_SUPABASE")) {
        supabaseClientInstance = createClient(config.supabaseUrl, config.supabaseAnonKey);
        isSupabaseConfigured = true;
        console.log("Supabase Client initialized successfully with runtime config.");
      }
    }
  } catch (error) {
    console.warn("Failed to fetch Supabase config from API route. Falling back to mock persistence.", error);
  }
}

export function getSupabase() {
  return supabaseClientInstance;
}

export function isSupabaseActive(): boolean {
  return isSupabaseConfigured;
}


