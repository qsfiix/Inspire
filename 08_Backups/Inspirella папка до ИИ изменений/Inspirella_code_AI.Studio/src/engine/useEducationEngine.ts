import { useState, useEffect } from "react";
import { DataRepository } from "../data/Repository";
import { UserProfile, Profession, Institution, ResourceItem } from "../types";
import { EducationEngine, EngineRecommendation } from "./EducationEngine";

export function useEducationEngine(profile: UserProfile | null) {
  const [recommendation, setRecommendation] = useState<EngineRecommendation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
        const [professions, institutions, resources] = await Promise.all([
          DataRepository.getProfessions(),
          DataRepository.getInstitutions(),
          DataRepository.getResources()
        ]);

        if (!active) return;

        // Initialize the Education Engine
        const engine = new EducationEngine(
          profile,
          professions,
          institutions,
          resources
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
  }, [profile]); // Re-run if profile objectives/stage change

  return { recommendation, loading, error };
}
