import type { AdmissionCondition, EducationProgram, EducationTransition, LanguageCode } from "../types";

/**
 * Pure lookups over the pathway tables (admission_conditions, education_programs,
 * education_transitions). Components stay thin; the matching rules live here.
 */

const BM_FOCUS = (code: string) => code === "berufsmaturitaet" || code.startsWith("bm_");

/** Which admission routes a school's own type makes relevant. */
export function admissionRoutesForInstitution(subgroup: string | undefined, focusCodes: string[] = []): string[] {
  const routes = new Set<string>();
  if (subgroup === "university_of_applied_sciences") routes.add("fh");
  if (subgroup === "teacher_education" || subgroup === "university_of_teacher_education") routes.add("ph");
  if (subgroup === "gymnasium") {
    routes.add("gymnasium_kurz");
    routes.add("gymnasium_lang");
  }
  if (subgroup === "fachmittelschule" || focusCodes.includes("fachmittelschule")) routes.add("fms");
  if (focusCodes.some(BM_FOCUS)) {
    routes.add("bms_bm1");
    routes.add("bms_bm2");
  }
  return [...routes];
}

/** Admission routes a path step is about (learning_path_steps.hook = "admission", hook_topic). */
export function routesForTopic(topic: string | undefined): string[] {
  switch (topic) {
    case "gymnasium": return ["gymnasium_kurz", "gymnasium_lang"];
    case "fms": return ["fms"];
    case "bm": return ["bms_bm1", "bms_bm2"];
    case "hms": return ["hms"];
    case "fh": return ["fh"];
    case "ph": return ["ph"];
    case "hf": return ["hf"];
    default: return [];
  }
}

const ROUTE_ORDER = ["gymnasium_kurz", "gymnasium_lang", "fms", "hms", "bms_bm1", "bms_bm2", "hf", "fh", "ph"];

/** Routes whose rules are national or belong to one school, not to a canton. */
export const NATIONAL_ROUTES = new Set(["hf", "fh", "ph"]);

/**
 * Admission rules that apply here. A school's own rule (institutionId) counts only for
 * that school; a nationwide rule (canton "CH") counts for everyone; the rest are matched
 * by canton. School-specific rows come before the general ones of the same route.
 */
export function admissionsFor(all: AdmissionCondition[], canton: string | undefined, routes: string[], institutionId?: string): AdmissionCondition[] {
  if (routes.length === 0 && !institutionId) return [];
  const c = canton?.toUpperCase();
  const applies = (a: AdmissionCondition) => {
    // A school's own rule belongs to that school whatever its route (FHNW has FH and PH rules).
    if (a.institutionId) return a.institutionId === institutionId;
    if (!routes.includes(a.route)) return false;
    return a.canton === "CH" || (!!c && a.canton === c);
  };
  return all
    .filter(applies)
    .sort((a, b) => ROUTE_ORDER.indexOf(a.route) - ROUTE_ORDER.indexOf(b.route) || Number(!!b.institutionId) - Number(!!a.institutionId));
}

const KIND_ORDER = ["bridge_year", "vorlehre", "integration_vorlehre", "motivation_semester", "passerelle", "matura_prep", "fms_profile", "other"];

/** Bridge offers in a canton, in a stable, useful order (bridge year first). */
export function programsFor(all: EducationProgram[], canton: string | undefined, kinds?: string[]): EducationProgram[] {
  if (!canton) return [];
  const c = canton.toUpperCase();
  return all
    .filter(p => p.canton === c && (!kinds || kinds.includes(p.kind)))
    .sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.title.localeCompare(b.title, "de"));
}

const NODE_BY_PROFESSION_TYPE: Record<string, string[]> = {
  apprenticeship_efz: ["efz"],
  apprenticeship_eba: ["eba"],
  fachausweis: ["fa"],
  diplom: ["diplom_hfp"],
  hf_diploma: ["hf"],
  fh_bachelor: ["fh"],
  university: ["uni"]
};

const NODE_BY_TARGET_LEVEL: Record<string, string[]> = {
  apprenticeship: ["efz"],
  berufsmatura: ["berufsmatura"],
  gymnasium: ["gym_matura"],
  higher_vocational: ["hf"],
  university_of_applied_sciences: ["fh"],
  university: ["uni"]
};

/**
 * The stage a goal ends at, as nodes of the transition table: the profession's
 * qualification when the goal is a profession, otherwise the stated target level.
 * Used for "and what comes after this?".
 */
export function nodesForGoal(professionType: string | undefined, targetLevel: string | undefined): string[] {
  if (professionType && NODE_BY_PROFESSION_TYPE[professionType]) return NODE_BY_PROFESSION_TYPE[professionType];
  if (targetLevel && NODE_BY_TARGET_LEVEL[targetLevel]) return NODE_BY_TARGET_LEVEL[targetLevel];
  return [];
}

const KIND_RANK: Record<string, number> = { direct: 0, shortened: 1, with_exam: 2, with_bridge: 3, second_chance: 4, after_work: 5 };

export function transitionsFrom(all: EducationTransition[], nodes: string[]): EducationTransition[] {
  if (nodes.length === 0) return [];
  return all
    .filter(t => nodes.includes(t.from))
    .sort((a, b) => (KIND_RANK[a.kind] ?? 9) - (KIND_RANK[b.kind] ?? 9) || a.label.localeCompare(b.label, "de"));
}

type Labels = Record<LanguageCode, string>;

const NODE_LABELS: Record<string, Labels> = {
  sek1: { de: "Sekundarstufe I", en: "Lower secondary", fr: "Secondaire I", it: "Secondario I" },
  efz: { de: "Berufslehre EFZ", en: "Apprenticeship (EFZ)", fr: "CFC", it: "AFC" },
  eba: { de: "Berufsattest EBA", en: "Vocational certificate (EBA)", fr: "AFP", it: "CFP" },
  bm1: { de: "Berufsmaturität (während der Lehre)", en: "Vocational baccalaureate (during apprenticeship)", fr: "Maturité professionnelle (pendant l'apprentissage)", it: "Maturità professionale (durante il tirocinio)" },
  bm2: { de: "Berufsmaturität (nach der Lehre)", en: "Vocational baccalaureate (after apprenticeship)", fr: "Maturité professionnelle (après l'apprentissage)", it: "Maturità professionale (dopo il tirocinio)" },
  berufsmatura: { de: "Berufsmaturität", en: "Vocational baccalaureate", fr: "Maturité professionnelle", it: "Maturità professionale" },
  gymnasium: { de: "Gymnasium", en: "Gymnasium", fr: "Gymnase", it: "Liceo" },
  gym_matura: { de: "Gymnasiale Matura", en: "Gymnasial Matura", fr: "Maturité gymnasiale", it: "Maturità liceale" },
  fms: { de: "Fachmittelschule", en: "Specialised middle school (FMS)", fr: "École de culture générale", it: "Scuola specializzata" },
  fachmatura: { de: "Fachmaturität", en: "Specialised baccalaureate", fr: "Maturité spécialisée", it: "Maturità specializzata" },
  passerelle: { de: "Passerelle", en: "Passerelle", fr: "Passerelle", it: "Passerella" },
  hf: { de: "Höhere Fachschule (HF)", en: "Professional college (HF)", fr: "École supérieure (ES)", it: "Scuola specializzata superiore (SSS)" },
  fa: { de: "Eidg. Fachausweis", en: "Federal professional certificate", fr: "Brevet fédéral", it: "Attestato professionale federale" },
  diplom_hfp: { de: "Eidg. Diplom (HFP)", en: "Federal diploma (HFP)", fr: "Diplôme fédéral", it: "Diploma federale" },
  fh: { de: "Fachhochschule", en: "University of applied sciences", fr: "Haute école spécialisée", it: "Scuola universitaria professionale" },
  ph: { de: "Pädagogische Hochschule", en: "University of teacher education", fr: "Haute école pédagogique", it: "Alta scuola pedagogica" },
  uni: { de: "Universität / ETH", en: "University / ETH", fr: "Université / EPF", it: "Università / PF" },
  master: { de: "Master", en: "Master's", fr: "Master", it: "Master" },
  work: { de: "Berufstätigkeit", en: "Working life", fr: "Vie professionnelle", it: "Vita professionale" },
  adult: { de: "Erwachsenenbildung", en: "Adult education", fr: "Formation des adultes", it: "Formazione per adulti" },
  bridge: { de: "Brückenangebot", en: "Bridge programme", fr: "Offre transitoire", it: "Offerta transitoria" }
};

export function nodeLabel(node: string, language: LanguageCode): string {
  const entry = NODE_LABELS[node];
  return entry ? entry[language] ?? entry.de : node;
}

const ROUTE_LABELS: Record<string, Labels> = {
  gymnasium_kurz: { de: "Kurzgymnasium", en: "Short Gymnasium", fr: "Gymnase (voie courte)", it: "Liceo (percorso breve)" },
  gymnasium_lang: { de: "Langgymnasium", en: "Long Gymnasium", fr: "Gymnase (voie longue)", it: "Liceo (percorso lungo)" },
  fms: { de: "Fachmittelschule", en: "Specialised middle school (FMS)", fr: "École de culture générale", it: "Scuola specializzata" },
  hf: { de: "Höhere Fachschule (HF)", en: "Professional college (HF)", fr: "École supérieure (ES)", it: "Scuola specializzata superiore (SSS)" },
  fh: { de: "Fachhochschule (Bachelor)", en: "University of applied sciences (Bachelor)", fr: "Haute école spécialisée (Bachelor)", it: "Scuola universitaria professionale (Bachelor)" },
  ph: { de: "Pädagogische Hochschule", en: "University of teacher education", fr: "Haute école pédagogique", it: "Alta scuola pedagogica" },
  hms: { de: "Handelsmittelschule", en: "Commercial middle school", fr: "École de commerce", it: "Scuola di commercio" },
  bms_bm1: { de: "Berufsmaturität während der Lehre (BM 1)", en: "Vocational baccalaureate during the apprenticeship (BM 1)", fr: "Maturité professionnelle pendant l'apprentissage (MP 1)", it: "Maturità professionale durante il tirocinio (MP 1)" },
  bms_bm2: { de: "Berufsmaturität nach der Lehre (BM 2)", en: "Vocational baccalaureate after the apprenticeship (BM 2)", fr: "Maturité professionnelle après l'apprentissage (MP 2)", it: "Maturità professionale dopo il tirocinio (MP 2)" }
};

export function routeLabel(route: string, language: LanguageCode): string {
  const entry = ROUTE_LABELS[route];
  return entry ? entry[language] ?? entry.de : route;
}

const HF_FIELD_LABELS: Record<string, Labels> = {
  pflege: { de: "Pflege", en: "Nursing", fr: "Soins infirmiers", it: "Cure infermieristiche" },
  medtech: { de: "Medizinisch-technische Berufe", en: "Medical-technical professions", fr: "Professions médico-techniques", it: "Professioni medico-tecniche" },
  soziales: { de: "Soziales und Pädagogik", en: "Social work and education", fr: "Travail social et pédagogie", it: "Lavoro sociale e pedagogia" },
  wirtschaft: { de: "Wirtschaft", en: "Business", fr: "Économie", it: "Economia" },
  informatik: { de: "Informatik", en: "IT", fr: "Informatique", it: "Informatica" },
  technik: { de: "Technik", en: "Engineering and technology", fr: "Technique", it: "Tecnica" },
  gestaltung: { de: "Gestaltung", en: "Design", fr: "Design", it: "Design" },
  tourismus: { de: "Tourismus und Hotellerie", en: "Tourism and hospitality", fr: "Tourisme et hôtellerie", it: "Turismo e ristorazione" },
  natur: { de: "Landwirtschaft, Forst, Lebensmittel", en: "Agriculture, forestry, food", fr: "Agriculture, forêt, alimentation", it: "Agricoltura, foresta, alimentazione" },
  medien: { de: "Medien und Marketing", en: "Media and marketing", fr: "Médias et marketing", it: "Media e marketing" }
};

/** The HF field a field-specific national rule is about (code adm_ch_hf_<field>), or undefined for the general rule. */
export function hfFieldOf(a: AdmissionCondition): string | undefined {
  const m = /^adm_ch_hf_(.+)$/.exec(a.code);
  return a.route === "hf" && m ? m[1] : undefined;
}

export function hfFieldLabel(field: string, language: LanguageCode): string {
  const entry = HF_FIELD_LABELS[field];
  return entry ? entry[language] ?? entry.de : field;
}

const KIND_LABELS: Record<string, Labels> = {
  bridge_year: { de: "Brückenangebot", en: "Bridge year", fr: "Année de transition", it: "Anno di transizione" },
  vorlehre: { de: "Vorlehre", en: "Pre-apprenticeship", fr: "Préapprentissage", it: "Preapprendistato" },
  integration_vorlehre: { de: "Integrationsvorlehre", en: "Integration pre-apprenticeship", fr: "Préapprentissage d'intégration", it: "Preapprendistato d'integrazione" },
  motivation_semester: { de: "Motivationssemester", en: "Motivation semester", fr: "Semestre de motivation", it: "Semestre di motivazione" },
  passerelle: { de: "Passerelle", en: "Passerelle", fr: "Passerelle", it: "Passerella" },
  matura_prep: { de: "Maturitätsvorbereitung", en: "Matura preparation", fr: "Préparation à la maturité", it: "Preparazione alla maturità" },
  fms_profile: { de: "FMS-Profil", en: "FMS profile", fr: "Profil ECG", it: "Profilo SS" },
  other: { de: "Weiteres Angebot", en: "Other offer", fr: "Autre offre", it: "Altra offerta" },
  direct: { de: "Direkt", en: "Direct", fr: "Direct", it: "Diretto" },
  shortened: { de: "Verkürzt", en: "Shortened", fr: "Raccourci", it: "Abbreviato" },
  with_exam: { de: "Mit Prüfung", en: "With an exam", fr: "Avec examen", it: "Con esame" },
  with_bridge: { de: "Mit Zwischenschritt", en: "With an extra step", fr: "Avec une étape intermédiaire", it: "Con un passaggio intermedio" },
  second_chance: { de: "Zweite Chance", en: "Second chance", fr: "Deuxième chance", it: "Seconda possibilità" },
  after_work: { de: "Nach der Berufstätigkeit", en: "After working", fr: "Après la vie active", it: "Dopo il lavoro" }
};

export function kindLabel(kind: string, language: LanguageCode): string {
  const entry = KIND_LABELS[kind];
  return entry ? entry[language] ?? entry.de : kind;
}
