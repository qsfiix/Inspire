import { LanguageCode } from "../types";

export interface LocalizedString {
  en: string;
  de: string;
  fr: string;
  it: string;
}

export interface PathFocusRule {
  goalsAny?: string[];
  interestsAny?: string[];
  label: LocalizedString;
}

export interface NextStepRule {
  stagesAny: string[];
  label: LocalizedString;
}

export interface EngineConfigType {
  weights: {
    trust: {
      verifiedOfficial: number;
      verifiedFallback: number;
      resourceVerifiedFallback: number;
      provisionalPenalty: number;
      federalBoost: number;
    };
    demand: {
      high: number;
    };
    alignment: {
      primaryInterest: number;
      semanticMatch: number;
      routeMatch: number;
      academicFit: number;
      techFit: number;
      businessFit: number;
      genericInterest: number;
      languageMatch: number;
      resourceRouteMatch: number;
      resourceProfessionMatch: number;
      resourceGoalMatch: number;
      resourceTitleMatch: number;
    };
    apprenticeship: {
      practicalTrack: number;
      academicTrack: number;
    };
    institution: {
      highRating: number;
    };
    route: {
      targetLevelMatch: number;
      partialLevelMatch: number;
      prerequisiteGap: number;
      languageFit: number;
      languageGap: number;
      chosenProfession: number;
      institutionTargetMatch: number;
      dataRichness: number;
    };
    regional: {
      cantonMatch: number;
      languageRegionMatch: number;
      bilingualBonus: number;
    };
    fallback: {
      defaultResourceScore: number;
    };
  };
  rules: {
    pathFocus: PathFocusRule[];
    defaultPathFocus: LocalizedString;
    nextSteps: NextStepRule[];
    defaultNextStep: LocalizedString;
  };
}

export const EngineConfig: EngineConfigType = {
  weights: {
    trust: {
      verifiedOfficial: 20,
      verifiedFallback: 15,
      resourceVerifiedFallback: 10,
      provisionalPenalty: -15,
      federalBoost: 20,
    },
    demand: {
      high: 10,
    },
    alignment: {
      primaryInterest: 30,
      semanticMatch: 20,
      routeMatch: 25,
      academicFit: 30,
      techFit: 40,
      businessFit: 40,
      genericInterest: 15,
      languageMatch: 20,
      resourceRouteMatch: 25,
      resourceProfessionMatch: 15,
      resourceGoalMatch: 20,
      resourceTitleMatch: 20,
    },
    apprenticeship: {
      practicalTrack: 25,
      academicTrack: 15,
    },
    institution: {
      highRating: 10,
    },
    // Stated route answers outrank interest signals: the goal is what the user told us first.
    route: {
      targetLevelMatch: 40,
      partialLevelMatch: 15,
      prerequisiteGap: -15,
      languageFit: 15,
      languageGap: -25,
      // The profession the user picked themselves always ranks first.
      chosenProfession: 1000,
      institutionTargetMatch: 60,
      dataRichness: 1,
    },
    regional: {
      cantonMatch: 40,
      languageRegionMatch: 20,
      bilingualBonus: 15,
    },
    fallback: {
      defaultResourceScore: 5
    }
  },
  rules: {
    pathFocus: [
      {
        goalsAny: ["career_pivot"],
        interestsAny: ["vocational"],
        label: {
          en: "Vocational & Professional Focus",
          de: "Fokus auf Berufsbildung",
          fr: "Spécialisation Professionnelle",
          it: "Focus Professionale (AFC)"
        }
      },
      {
        goalsAny: ["study_active"],
        interestsAny: ["academic"],
        label: {
          en: "Academic Excellence Track",
          de: "Akademische Exzellenz",
          fr: "Excellence Académique",
          it: "Percorso Accademico d'Eccellenza"
        }
      },
      {
        goalsAny: ["parent_routing"],
        label: {
          en: "System Orientation for Parents",
          de: "Systemorientierung für Eltern",
          fr: "Orientation système pour parents",
          it: "Orientamento per i genitori"
        }
      },
      {
        goalsAny: ["global_compare"],
        label: {
          en: "Global Educational Comparison",
          de: "Globaler Bildungsvergleich",
          fr: "Comparaison Éducative Globale",
          it: "Confronto Educativo Globale"
        }
      }
    ],
    defaultPathFocus: {
      en: "General Educational Exploration",
      de: "Allgemeine Bildungserkundung",
      fr: "Exploration éducative générale",
      it: "Esplorazione formativa generale"
    },
    nextSteps: [
      {
        stagesAny: ["stage_secondary", "stage_schoolType"],
        label: {
          en: "Review Gymnasiale Maturität vs. VET Apprenticeship",
          de: "Gymnasiale Maturität mit Berufslehre vergleichen",
          fr: "Comparer Maturité Gymnasiale et Apprentissage CFC",
          it: "Confronta Maturità Liceale e Apprendistato AFC"
        }
      },
      {
        stagesAny: ["stage_university", "academic"],
        label: {
          en: "Explore Tertiary B (Higher Professional) or Master programs",
          de: "Masterstudiengänge oder Höhere Fachschulen erkunden",
          fr: "Explorer les Masters ou Hautes Écoles Spécialisées",
          it: "Esplora Master o Scuole Specializzate Superiori"
        }
      },
      {
        stagesAny: ["stage_professional", "industry"],
        label: {
          en: "Consider an Executive Master or Specialized Federal Diploma",
          de: "Weiterbildung oder Eidgenössisches Diplom prüfen",
          fr: "Envisager un diplôme fédéral ou une formation continue",
          it: "Valuta un diploma federale o formazione continua"
        }
      }
    ],
    defaultNextStep: {
        en: "Schedule a consultation or review official admission portals",
        de: "Beratungstermin vereinbaren oder offizielle Portale prüfen",
        fr: "Planifier une consultation ou lire les portails officiels",
        it: "Fissa una consulenza o controlla i portali ufficiali"
    }
  }
};

/**
 * Normalizes translated text fields
 */
export function getTranslatedString(field: string | Record<LanguageCode, string> | any, lang: LanguageCode, fallback: string = "en"): string {
  if (typeof field === "string") return field;
  if (!field) return "";
  return field[lang] || field[fallback] || "";
}

/**
 * Checks for high demand level
 */
export function isHighDemand(demandLevel?: string): boolean {
  if (!demandLevel) return false;
  const norm = demandLevel.toLowerCase().replace(" ", "_");
  return norm === "high" || norm === "very_high";
}

/**
 * Whole-word, case-insensitive match of any interest keyword in a title.
 * Substring matching made short keywords fire inside unrelated German
 * compounds - "tech" matched "Operationstechnik" (surgery) and "Technische
 * Kauffrau" (commerce), so those ranked as "Strong match" for a tech profile.
 */
export function hasSemanticMatch(source: string, targetWords: string[]): boolean {
  if (!source) return false;
  return targetWords.some(w => {
    const escaped = w.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return escaped.length > 0 && new RegExp("(^|[^\\p{L}])" + escaped + "($|[^\\p{L}])", "iu").test(source);
  });
}

// Swiss VET certificate abbreviations (DE/FR/IT) that mark an apprenticeship.
const VET_TITLE_MARKER = /(^|[^\p{L}])(EFZ|EBA|CFC|AFC|AFP)($|[^\p{L}])/u;

/**
 * Whether a profession is a VET apprenticeship path: true when the flag says
 * so or any title carries a Swiss VET certificate (EFZ/EBA/CFC/AFC/AFP);
 * otherwise the stored flag, which is undefined when the data doesn't say.
 * Many rows have no flag, and treating "unknown" as "academic" is what
 * labelled EFZ apprenticeships "Matches your academic focus".
 */
export function resolveApprenticeship(prof: { title?: unknown; isApprenticeshipPath?: boolean }): boolean | undefined {
  if (prof.isApprenticeshipPath === true) return true;
  const titles =
    typeof prof.title === "string" ? prof.title : prof.title && typeof prof.title === "object" ? Object.values(prof.title as Record<string, string>).join(" ") : "";
  if (VET_TITLE_MARKER.test(titles)) return true;
  return prof.isApprenticeshipPath;
}

