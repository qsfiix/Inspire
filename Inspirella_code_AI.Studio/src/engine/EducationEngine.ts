import { UserProfile, Profession, Institution, ResourceItem, LanguageCode, RouteBackground } from "../types";
import { bestSwissLanguageRank, languageFit, professionRouteSignal } from "./routeSignals";
import { EngineConfig, hasSemanticMatch, isHighDemand, getTranslatedString, resolveApprenticeship } from "./engineConfig";

export interface ScoredProfession {
  profession: Profession;
  score: number;
  matchReasons: string[];
}

export interface ScoredInstitution {
  institution: Institution;
  score: number;
  matchReasons: string[];
}

export interface ScoredResource {
  resource: ResourceItem;
  score: number;
  matchReasons: string[];
}

export interface EngineRecommendation {
  pathFocus: string;
  nextBestStep: string;
  professions: ScoredProfession[];
  institutions: ScoredInstitution[];
  resources: ScoredResource[];
}

export class EducationEngine {
  private profile: UserProfile;
  private professions: Profession[];
  private institutions: Institution[];
  private resources: ResourceItem[];
  private lang: LanguageCode;
  private route?: RouteBackground;

  constructor(
    profile: UserProfile,
    professions: Profession[],
    institutions: Institution[],
    resources: ResourceItem[],
    route?: RouteBackground
  ) {
    this.route = route;
    this.profile = profile;
    this.professions = professions;
    this.institutions = institutions;
    this.resources = resources;
    this.lang = profile.language || "en";
  }

  public run(): EngineRecommendation {
    // 1. Determine Path Focus
    const pathFocus = this.determinePathFocus();

    // 2. Determine Next Best Step
    const nextBestStep = this.determineNextBestStep(pathFocus);

    // 3. Score & filter professions
    const professions = this.scoreProfessions();
    const topProfessions = professions.slice(0, 3); // Top 3

    // 4. Score & filter institutions
    const institutions = this.scoreInstitutions(topProfessions);
    const topInstitutions = institutions.slice(0, 3);

    // 5. Score & filter resources
    const resources = this.scoreResources(topProfessions, topInstitutions);

    return {
      pathFocus,
      nextBestStep,
      professions: topProfessions,
      institutions: topInstitutions,
      resources: resources.slice(0, 3)
    };
  }

  private determinePathFocus(): string {
    const goals = this.profile.goals || [];
    const interests = this.profile.interests || [];

    for (const rule of EngineConfig.rules.pathFocus) {
      const matchGoal = rule.goalsAny?.some(g => goals.includes(g)) || false;
      const matchInterest = rule.interestsAny?.some(i => interests.includes(i)) || false;
      
      if (matchGoal || matchInterest) {
        return getTranslatedString(rule.label, this.lang);
      }
    }

    return getTranslatedString(EngineConfig.rules.defaultPathFocus, this.lang);
  }

  private determineNextBestStep(pathFocus: string): string {
    const stage = this.profile.currentStage;

    // A stated language gap or a language-first goal changes the very next step.
    const studyTargets = ["university_of_applied_sciences", "university", "berufsmatura", "higher_vocational"];
    const swissRank = bestSwissLanguageRank(this.route);
    if (
      this.route?.targetLevel === "language_course" ||
      (this.route?.targetLevel && studyTargets.includes(this.route.targetLevel) && swissRank !== null && swissRank < 3)
    ) {
      return this.translate(
        "Build your language level first: aim for at least B1 in the language of instruction.",
        "Baue zuerst dein Sprachniveau auf: Ziel ist mindestens B1 in der Unterrichtssprache.",
        "Renforce d'abord ton niveau de langue : vise au moins le B1 dans la langue d'enseignement.",
        "Rafforza prima il tuo livello linguistico: punta ad almeno B1 nella lingua di insegnamento."
      );
    }
    
    for (const rule of EngineConfig.rules.nextSteps) {
      if (rule.stagesAny.includes(stage)) {
        return getTranslatedString(rule.label, this.lang);
      }
    }
    
    return getTranslatedString(EngineConfig.rules.defaultNextStep, this.lang);
  }

  private scoreProfessions(): ScoredProfession[] {
    const scored: ScoredProfession[] = this.professions.map(prof => {
      let score = 0;
      const matchReasons: string[] = [];

      // Quality checks
      if (prof.status === "verified" || prof.status === "official" || prof.status === "published" || prof.verified === true) {
        score += EngineConfig.weights.trust.verifiedOfficial;
      }
      if (prof.status === "draft" || prof.status === "needs_review") {
        score += EngineConfig.weights.trust.provisionalPenalty;
        matchReasons.push(this.translate("Provisional data.", "Vorläufige Daten.", "Données provisoires.", "Dati provvisori."));
      }
      
      if (isHighDemand(prof.demandLevel)) {
        score += EngineConfig.weights.demand.high;
        matchReasons.push(this.translate("High industry demand.", "Hohe Nachfrage in der Industrie.", "Forte demande dans l'industrie.", "Alta domanda nel settore."));
      }

      // Category matching. prof.category comes from professions.sector, a free-text
      // column (real values seen in production: technology, engineering, healthcare,
      // business, science, design, hospitality, skilled_trades, education, law,
      // social_care - not the fixed "engineering"/"IT" labels this used to check for),
      // so the "tech" interest is matched against every sector that is actually tech-adjacent.
      if (this.profile.interests.includes(prof.category) ||
          (this.profile.interests.includes("tech") &&
            (prof.category === "technology" || prof.category === "engineering" || prof.category === "IT" || prof.category === "science"))) {
        score += EngineConfig.weights.alignment.primaryInterest;
        matchReasons.push(this.translate("Aligns with your primary interests.", "Stimmt mit deinen Hauptinteressen überein.", "Correspond à tes intérêts principaux.", "In linea con i tuoi interessi principali."));
      }

      // Semantic matching in description or title. The keywords are English
      // interest ids, so match the English title in every UI language - the
      // ranking must not change when the visitor switches language.
      const titleStr = getTranslatedString(prof.title, "en", "de");
      if (titleStr) {
        if (hasSemanticMatch(titleStr, this.profile.interests)) {
          score += EngineConfig.weights.alignment.semanticMatch;
          matchReasons.push(this.translate(`Matches interest area.`, `Entspricht dem Interessengebiet.`, `Correspond au domaine d'intérêt.`, `Corrisponde all'area di interesse.`));
        }
      }

      // Apprenticeship vs academic track. Only an explicitly non-VET
      // profession earns the academic reason - "unknown" is not "academic".
      const isVet = resolveApprenticeship(prof);
      if (isVet === true && this.profile.interests.includes("vocational")) {
        score += EngineConfig.weights.apprenticeship.practicalTrack;
        matchReasons.push(this.translate("Matches practical apprenticeship track.", "Entspricht dem praktischen Ausbildungsweg.", "Correspond à l'apprentissage pratique.", "Corrisponde al percorso di apprendistato pratico."));
      } else if (isVet === false && this.profile.interests.includes("academic")) {
        score += EngineConfig.weights.apprenticeship.academicTrack;
        matchReasons.push(this.translate("Matches your academic focus.", "Entspricht deinem akademischen Fokus.", "Correspond à ton orientation académique.", "Corrisponde al tuo focus accademico."));
      }

      if (this.route?.targetProfessionId && prof.id === this.route.targetProfessionId) {
        score += EngineConfig.weights.route.chosenProfession;
        matchReasons.unshift(this.translate("Your chosen target profession.", "Dein gewählter Wunschberuf.", "La profession cible que tu as choisie.", "La professione obiettivo che hai scelto."));
      }

      const routeSignal = professionRouteSignal(this.route, prof.professionType);
      if (routeSignal === "target-match") {
        score += EngineConfig.weights.route.targetLevelMatch;
        matchReasons.push(this.translate("Fits the level you are aiming for.", "Passt zur Stufe, die du anstrebst.", "Correspond au niveau que tu vises.", "Corrisponde al livello a cui punti."));
      } else if (routeSignal === "prerequisite-gap") {
        score += EngineConfig.weights.route.prerequisiteGap;
        matchReasons.push(this.translate("Needs an earlier qualification first.", "Setzt zuerst einen früheren Abschluss voraus.", "Nécessite d'abord un diplôme préalable.", "Richiede prima un titolo precedente."));
      }

      return { profession: prof, score, matchReasons };
    });

    return scored.sort((a, b) => b.score - a.score);
  }

  private scoreInstitutions(topProfessions: ScoredProfession[]): ScoredInstitution[] {
    const scored: ScoredInstitution[] = this.institutions.map(inst => {
      let score = 0;
      const matchReasons: string[] = [];

      // Quality checks
      if (inst.status === "verified" || inst.status === "official" || inst.status === "published" || inst.verified === true) {
        score += EngineConfig.weights.trust.verifiedOfficial;
      }
      if (inst.status === "draft" || inst.status === "needs_review") {
        score += EngineConfig.weights.trust.provisionalPenalty;
        matchReasons.push(this.translate("Provisional institution data.", "Vorläufige Einrichtungsdaten.", "Données d'établissement provisoires.", "Dati provvisori dell'istituto."));
      }
      if (inst.rating && inst.rating > 4.5) {
        score += EngineConfig.weights.institution.highRating;
        matchReasons.push(this.translate("Highly rated institution.", "Hoch bewertete Einrichtung.", "Institution hautement évaluée.", "Istituzione con ottima valutazione."));
      }

      // Route connection from Professions -> Institutions
      const connectedProfession = topProfessions.find(tp => {
        const profCategory = tp.profession.category?.toLowerCase() || '';
        const instCategory = inst.category?.toLowerCase() || '';
        const instDesc = getTranslatedString(inst.description, "en").toLowerCase();
        
        if (profCategory && instCategory && (profCategory.includes(instCategory) || instCategory.includes(profCategory))) return true;
        if (profCategory && instDesc.includes(profCategory)) return true;
        const vet = resolveApprenticeship(tp.profession);
        if (vet === true && (instCategory === "vocational" || instCategory === "technical")) return true;
        if (vet === false && instCategory === "university") return true;
        return false;
      });

      if (connectedProfession) {
        score += EngineConfig.weights.alignment.routeMatch; // boost
        const profName = getTranslatedString(connectedProfession.profession.title, this.lang);
        const msg = this.translate(
             `Route match: Leads to ${profName}`,
             `Routenabgleich: Führt zu ${profName}`,
             `Correspondance de parcours: Mène à ${profName}`,
             `Corrispondenza di percorso: Conduce a ${profName}`
        );
        if (!matchReasons.includes(msg)) matchReasons.push(msg);
      }

      // Goal -> Institution type
      if (this.profile.interests.includes("academic") && inst.category === "university") {
        score += EngineConfig.weights.alignment.academicFit;
        matchReasons.push(this.translate("Strong fit for academic track.", "Starker Fit für den akademischen Weg.", "Excellent choix pour la voie académique.", "Ottima scelta per il percorso accademico."));
      }

      if (this.profile.interests.includes("tech") && 
          (inst.category === "technical" || inst.title.toLowerCase().includes("tech") || inst.id === "ethz" || inst.id === "epfl")) {
        score += EngineConfig.weights.alignment.techFit;
        matchReasons.push(this.translate("Excellent reputation in technology.", "Ausgezeichneter Ruf in Technologie.", "Excellente réputation en technologie.", "Eccellente reputazione in ambito tecnologico."));
      }

      if (this.profile.interests.includes("business") && 
          (inst.title.toLowerCase().includes("business") || inst.id === "unisg")) {
        score += EngineConfig.weights.alignment.businessFit;
        matchReasons.push(this.translate("Top pick for business studies.", "Top-Wahl für Wirtschaftswissenschaften.", "Premier choix pour les études de commerce.", "Prima scelta per gli studi economici."));
      }

      // Generic interest hits in description
      const descStr = getTranslatedString(inst.description, this.lang);
      if (descStr) {
        for (const interest of this.profile.interests) {
          if (descStr.toLowerCase().includes(interest.toLowerCase())) {
            score += EngineConfig.weights.alignment.genericInterest;
            const msg = this.translate("Matches your specific interests.", "Passt zu deinen spezifischen Interessen.", "Correspond à tes intérêts spécifiques.", "Corrisponde ai tuoi interessi specifici.");
            if (!matchReasons.includes(msg)) {
              matchReasons.push(msg);
            }
          }
        }
      }

      // Regional & Language Match
      const canton = inst.canton || "";
      const isBilingual = inst.cantonalLanguage?.includes("Bilingual") || inst.cantonalLanguage?.includes(" und ") || inst.cantonalLanguage?.includes(" et ");

      // 1. Explicit Canton Match
      if (this.profile.preferredCanton && canton.toLowerCase() === this.profile.preferredCanton.toLowerCase()) {
        score += EngineConfig.weights.regional.cantonMatch;
        matchReasons.push(this.translate("Relevant for your canton context.", "Relevant für deinen Kantonskontext.", "Pertinent pour le contexte de ton canton.", "Rilevante per il tuo cantone."));
      }

      // 2. Language Region Match (using profile.targetLanguageRegion or profile.language)
      const targetLang = this.profile.targetLanguageRegion || this.lang;
      let langMatch = false;

      if (inst.cantonalLanguage) {
        if (
          (targetLang === "de" && inst.cantonalLanguage.includes("German")) ||
          (targetLang === "fr" && inst.cantonalLanguage.includes("French")) ||
          (targetLang === "it" && inst.cantonalLanguage.includes("Italian"))
        ) {
          langMatch = true;
        }
      } else {
        // Fallback checks (e.g. Zurich -> German, Vaud/Geneva -> French)
        if (targetLang === "de" && ["Zurich", "Zürich", "Bern", "St. Gallen", "Basel", "Aargau", "Luzern", "Zug", "Schwyz"].some(c => canton.includes(c))) langMatch = true;
        if (targetLang === "fr" && ["Vaud", "Geneva", "Genève", "Neuchâtel", "Jura", "Fribourg"].some(c => canton.includes(c))) langMatch = true;
        if (targetLang === "it" && ["Ticino"].some(c => canton.includes(c))) langMatch = true;
      }

      if (langMatch) {
        score += EngineConfig.weights.regional.languageRegionMatch;
        matchReasons.push(this.translate("Matches your preferred language region.", "Entspricht deiner bevorzugten Sprachregion.", "Correspond à ta région linguistique préférée.", "Corrisponde alla tua regione linguistica preferita."));
      }

      // 3. Bilingual Bonus
      if (isBilingual && (this.profile.targetLanguageRegion || this.lang !== "en")) {
        // Assuming if they specify a language, bilingual programs might be of interest
        score += EngineConfig.weights.regional.bilingualBonus;
        matchReasons.push(this.translate("Suitable for bilingual study options.", "Zweisprachige Studienmöglichkeiten.", "Options d'études bilingues.", "Opzioni di studio bilingue."));
      }

      const fit = languageFit(this.route, inst.cantonalLanguage);
      if (fit?.kind === "fit") {
        score += EngineConfig.weights.route.languageFit;
        matchReasons.push(this.translate("Your language level fits the language of instruction.", "Dein Sprachniveau passt zur Unterrichtssprache.", "Ton niveau de langue correspond à la langue d'enseignement.", "Il tuo livello linguistico è adatto alla lingua di insegnamento."));
      } else if (fit?.kind === "gap") {
        score += EngineConfig.weights.route.languageGap;
        matchReasons.push(this.translate("Instruction is in a language you have not reached B2 in yet.", "Unterricht in einer Sprache, in der du noch nicht B2 erreicht hast.", "Enseignement dans une langue où tu n'as pas encore atteint le B2.", "Insegnamento in una lingua in cui non hai ancora raggiunto il B2."));
      }

      return { institution: inst, score, matchReasons };
    });

    return scored.sort((a, b) => b.score - a.score);
  }

  private scoreResources(topProfessions: ScoredProfession[], topInstitutions: ScoredInstitution[]): ScoredResource[] {
    const scored: ScoredResource[] = this.resources.map(res => {
      let score = 0;
      const matchReasons: string[] = [];

      // Quality & Federal Status
      let isVerified = false;
      if (res.status === "verified" || res.status === "official" || res.status === "published" || res.verified === true) {
        score += EngineConfig.weights.trust.verifiedOfficial;
        isVerified = true;
      }
      
      if (res.status === "draft" || res.status === "needs_review") {
        score += EngineConfig.weights.trust.provisionalPenalty;
        matchReasons.push(this.translate("Provisional resource.", "Vorläufige Ressource.", "Ressource provisoire.", "Risorsa provvisoria."));
      } else if (res.verified && !isVerified) {
        score += EngineConfig.weights.trust.resourceVerifiedFallback;
      }
      
      if (res.isFederal) {
        score += EngineConfig.weights.trust.federalBoost; // High trust
        matchReasons.push(this.translate("Trusted official federal resource.", "Vertrauenswürdige offizielle Bundesressource.", "Ressource fédérale officielle fiable.", "Risorsa federale ufficiale affidabile."));
      }

      // Regional match for resources
      const resDescLower = getTranslatedString(res.description, "en").toLowerCase();
      const resTitleLower = getTranslatedString(res.title, "en").toLowerCase();

      if (this.profile.preferredCanton) {
        const pCanton = this.profile.preferredCanton.toLowerCase();
        if (resDescLower.includes(pCanton) || resTitleLower.includes(pCanton) || res.tags?.some(tag => tag.toLowerCase().includes(pCanton))) {
          score += EngineConfig.weights.regional.cantonMatch;
          matchReasons.push(this.translate("Relevant for your canton context.", "Relevant für deinen Kantonskontext.", "Pertinent pour le contexte de ton canton.", "Rilevante per il tuo cantone."));
        }
      }

      const targetLang = this.profile.targetLanguageRegion || this.lang;
      let languageBonus = false;
      if (targetLang === "fr" && (resDescLower.includes("romandi") || resDescLower.includes("french-speaking") || resDescLower.includes("suisse romande"))) {
        languageBonus = true;
      } else if (targetLang === "de" && (resDescLower.includes("deutschschweiz") || resDescLower.includes("german-speaking"))) {
        languageBonus = true;
      } else if (targetLang === "it" && (resDescLower.includes("ticino") || resDescLower.includes("svizzera italiana") || resDescLower.includes("italian-speaking"))) {
        languageBonus = true;
      }

      if (languageBonus) {
        score += EngineConfig.weights.regional.languageRegionMatch;
        matchReasons.push(this.translate("Matches your preferred language region.", "Entspricht deiner bevorzugten Sprachregion.", "Correspond à ta région linguistique préférée.", "Corrisponde alla tua regione linguistica preferita."));
      }

      // Route connection from Institutions -> Resources
      const connectedInstitution = topInstitutions.find(ti => {
        const instTitle = ti.institution.title.toLowerCase();
        const resDesc = getTranslatedString(res.description, "en").toLowerCase();
        const resTitle = getTranslatedString(res.title, "en").toLowerCase();
        
        if (resDesc.includes(instTitle) || resTitle.includes(instTitle)) return true;
        if (ti.institution.category === "university" && resTitle.includes("university")) return true;
        if (ti.institution.category === "vocational" && resTitle.includes("vocational")) return true;
        if (ti.institution.category === "technical" && resTitle.includes("tech")) return true;
        return false;
      });

      if (connectedInstitution) {
        score += EngineConfig.weights.alignment.resourceRouteMatch;
        const msg = this.translate(
          `Supports your path to ${connectedInstitution.institution.title}`,
          `Unterstützt deinen Weg zu ${connectedInstitution.institution.title}`,
          `Soutient ton parcours vers ${connectedInstitution.institution.title}`,
          `Supporta il tuo percorso verso ${connectedInstitution.institution.title}`
        );
        if (!matchReasons.includes(msg)) matchReasons.push(msg);
      } else {
        // Fallback: check profession connection
        const connectedProfession = topProfessions.find(tp => {
            const pCategory = tp.profession.category?.toLowerCase() || '';
            const resCat = res.category?.toLowerCase() || '';
            if (pCategory && resCat && (pCategory.includes(resCat) || resCat.includes(pCategory))) return true;
            return false;
        });

        if (connectedProfession) {
          score += EngineConfig.weights.alignment.resourceProfessionMatch;
          const profName = getTranslatedString(connectedProfession.profession.title, this.lang);
          const msg = this.translate(
            `Relevant for ${profName} careers`,
            `Relevant für ${profName}-Karrieren`,
            `Pertinent pour les carrières en ${profName}`,
            `Rilevante per le carriere in ${profName}`
          );
          if (!matchReasons.includes(msg)) matchReasons.push(msg);
        }
      }

      // Category matching
      if (this.profile.goals.includes("career_pivot") && res.category === "scholarship") {
        score += EngineConfig.weights.alignment.resourceGoalMatch;
        matchReasons.push(this.translate("Relevant transition support.", "Relevante Unterstützung beim Übergang.", "Soutien de transition pertinent.", "Supporto di transizione rilevante."));
      }
      
      // English keywords -> English title, independent of the UI language.
      const titleStr = getTranslatedString(res.title, "en", "de");
      if (titleStr) {
        if (this.profile.interests.includes("academic") && titleStr.toLowerCase().includes("university")) {
          score += EngineConfig.weights.alignment.resourceTitleMatch;
          matchReasons.push(this.translate("Useful for academic orientation.", "Nützlich für die akademische Orientierung.", "Utile pour l'orientation académique.", "Utile per l'orientamento accademico."));
        }
        if (this.profile.interests.includes("vocational") && (titleStr.toLowerCase().includes("vet") || titleStr.toLowerCase().includes("apprenticeship"))) {
          score += EngineConfig.weights.alignment.resourceTitleMatch;
          matchReasons.push(this.translate("Useful for vocational pathways.", "Nützlich für Berufsbildungswege.", "Utile pour les voies professionnelles.", "Utile per i percorsi professionali."));
        }
      }

      return { resource: res, score, matchReasons };
    });

    // Provide some baseline score if none hit
    scored.forEach(s => {
      if (s.score === 0) {
        s.score = EngineConfig.weights.fallback.defaultResourceScore;
        s.matchReasons.push(this.translate("General high-value resource.", "Allgemein wertvolle Ressource.", "Ressource générale de grande valeur.", "Risorsa generale di alto valore."));
      }
    });

    return scored.sort((a, b) => b.score - a.score);
  }

  private translate(en: string, de: string, fr: string, it: string): string {
    switch (this.lang) {
      case "de": return de;
      case "fr": return fr;
      case "it": return it;
      default: return en;
    }
  }
}
