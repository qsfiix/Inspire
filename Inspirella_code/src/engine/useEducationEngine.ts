import { useState, useEffect } from "react";
import { DataRepository } from "../data/Repository";
import { UserProfile, Profession, Institution, ResourceItem } from "../types";
import { EducationEngine, EngineRecommendation } from "./EducationEngine";

type EngineData = [Profession[], Institution[], ResourceItem[]];

// Dashboard, My Path, the advisor report and the route card all run the engine
// at the same time. They share one fetch of the (large) catalog tables instead
// of each downloading them again; the entry expires so edits still show up.
const DATA_TTL_MS = 60_000;
let dataCache: { at: number; promise: Promise<EngineData> } | null = null;

function loadEngineData(): Promise<EngineData> {
  const now = Date.now();
  if (dataCache && now - dataCache.at < DATA_TTL_MS) return dataCache.promise;
  const promise = Promise.all([
    DataRepository.getProfessions(),
    DataRepository.getInstitutions(),
    DataRepository.getResources()
  ]) as Promise<EngineData>;
  dataCache = { at: now, promise };
  promise.catch(() => {
    if (dataCache?.promise === promise) dataCache = null;
  });
  return promise;
}

/** Fired by DataRepository.saveRouteBackground so every engine instance recomputes. */
export const ROUTE_CHANGED_EVENT = "inspirella:route-changed";

export function useEducationEngine(profile: UserProfile | null) {
  const [recommendation, setRecommendation] = useState<EngineRecommendation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [routeVersion, setRouteVersion] = useState(0);

  useEffect(() => {
    const onChange = () => setRouteVersion(v => v + 1);
    window.addEventListener(ROUTE_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(ROUTE_CHANGED_EVENT, onChange);
  }, []);

  useEffect(() => {
    let active = true;

    async function computeRecommendations() {
      if (!profile) {
        setRecommendation(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Load the core datasets required for analysis
        const [[professions, institutions, resources], route] = await Promise.all([
          loadEngineData(),
          DataRepository.getRouteBackground()
        ]);

        if (!active) return;

        // Initialize the Education Engine
        const engine = new EducationEngine(
          profile,
          professions,
          institutions,
          resources,
          route
        );

        // Run the engine
        const engineResult = engine.run();

        setRecommendation(engineResult);
        setError(null);
      } catch (err: any) {
        console.error("Education Engine failure:", err);
        setError("The Education Engine encountered an issue computing your path.");
      } finally {
        if (active) setLoading(false);
      }
    }

    computeRecommendations();

    return () => {
      active = false;
    };
  }, [profile, routeVersion]); // Re-run if profile objectives/stage or the route answers change

  return { recommendation, loading, error };
}
