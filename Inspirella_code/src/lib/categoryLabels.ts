/**
 * The database carries categories as codes (industry_technology_it, pathway_guide, ...).
 * Cards and filter chips show these labels instead of the raw code. A code that is
 * not listed falls back to a readable version of itself, never an upper-case enum.
 */
type Labels = { de: string; en: string; fr: string; it: string };

const LABELS: Record<string, Labels> = {
  // professions
  industry_technology_it: { de: "Industrie, Technik, IT", en: "Industry, technology, IT", fr: "Industrie, technique, informatique", it: "Industria, tecnica, informatica" },
  health_sports_wellness: { de: "Gesundheit, Sport, Wellness", en: "Health, sports, wellness", fr: "Santé, sport, bien-être", it: "Salute, sport, benessere" },
  economy_management_trade: { de: "Wirtschaft, Management, Handel", en: "Business, management, trade", fr: "Économie, gestion, commerce", it: "Economia, gestione, commercio" },
  education_social_services: { de: "Bildung, Soziales", en: "Education, social services", fr: "Formation, social", it: "Formazione, sociale" },
  media_communication: { de: "Medien, Information, Kommunikation", en: "Media, information, communication", fr: "Médias, information, communication", it: "Media, informazione, comunicazione" },
  hospitality_food_tourism: { de: "Gastgewerbe, Nahrung, Tourismus", en: "Hospitality, food, tourism", fr: "Hôtellerie, alimentation, tourisme", it: "Ristorazione, alimentazione, turismo" },
  nature_environment: { de: "Natur, Umwelt", en: "Nature, environment", fr: "Nature, environnement", it: "Natura, ambiente" },
  // resources
  pathway_guide: { de: "Bildungswege", en: "Pathway guides", fr: "Parcours de formation", it: "Percorsi formativi" },
  admissions_info: { de: "Zulassung", en: "Admissions", fr: "Admission", it: "Ammissione" },
  official_portal: { de: "Offizielle Portale", en: "Official portals", fr: "Portails officiels", it: "Portali ufficiali" },
  scholarship_support: { de: "Stipendien & Finanzierung", en: "Scholarships & funding", fr: "Bourses et financement", it: "Borse di studio e finanziamento" },
  integration_support: { de: "Integration", en: "Integration support", fr: "Intégration", it: "Integrazione" },
  profession_info: { de: "Berufsinfos", en: "Profession info", fr: "Infos métiers", it: "Info professioni" },
  higher_education_info: { de: "Hochschulen", en: "Higher education", fr: "Hautes écoles", it: "Alta formazione" },
  language_learning: { de: "Sprachen lernen", en: "Language learning", fr: "Apprentissage des langues", it: "Imparare le lingue" },
  continuing_education: { de: "Weiterbildung", en: "Continuing education", fr: "Formation continue", it: "Formazione continua" },
  school_directory: { de: "Schulverzeichnisse", en: "School directories", fr: "Répertoires d'écoles", it: "Elenchi di scuole" },
  apprenticeship: { de: "Lehre", en: "Apprenticeship", fr: "Apprentissage", it: "Apprendistato" },
  scholarship: { de: "Stipendien", en: "Scholarships", fr: "Bourses", it: "Borse di studio" },
  visa_guide: { de: "Visum & Einreise", en: "Visa & entry", fr: "Visa et entrée", it: "Visto e ingresso" },
  // institutions (groups, then types)
  secondary_education: { de: "Sekundarstufe II", en: "Secondary education", fr: "Degré secondaire II", it: "Secondario II" },
  higher_education: { de: "Hochschulen", en: "Higher education", fr: "Hautes écoles", it: "Alta formazione" },
  vocational_and_professional_education: { de: "Berufliche Bildung", en: "Vocational and professional education", fr: "Formation professionnelle", it: "Formazione professionale" },
  specialized_and_continuing_education: { de: "Spezial- & Weiterbildung", en: "Specialised and continuing education", fr: "Formation spécialisée et continue", it: "Formazione specializzata e continua" },
  applied_science: { de: "Fachhochschule", en: "University of applied sciences", fr: "Haute école spécialisée", it: "Scuola universitaria professionale" },
  research: { de: "Forschung", en: "Research", fr: "Recherche", it: "Ricerca" },
  vocational: { de: "Berufsbildung", en: "Vocational", fr: "Formation professionnelle", it: "Formazione professionale" },
  vocational_school: { de: "Berufsschule", en: "Vocational school", fr: "École professionnelle", it: "Scuola professionale" },
  continuing_education_center: { de: "Weiterbildungszentrum", en: "Continuing education centre", fr: "Centre de formation continue", it: "Centro di formazione continua" },
  gymnasium: { de: "Gymnasium", en: "Gymnasium", fr: "Gymnase", it: "Liceo" },
  university_of_applied_sciences: { de: "Fachhochschule", en: "University of applied sciences", fr: "Haute école spécialisée", it: "Scuola universitaria professionale" },
  fachmittelschule: { de: "Fachmittelschule", en: "Specialised middle school (FMS)", fr: "École de culture générale", it: "Scuola specializzata" },
  university: { de: "Universität", en: "University", fr: "Université", it: "Università" },
  international_school: { de: "Internationale Schule", en: "International school", fr: "École internationale", it: "Scuola internazionale" },
  teacher_education: { de: "Pädagogische Hochschule", en: "Teacher education", fr: "Haute école pédagogique", it: "Alta scuola pedagogica" },
  university_of_teacher_education: { de: "Pädagogische Hochschule", en: "Teacher education", fr: "Haute école pédagogique", it: "Alta scuola pedagogica" },
  private_school: { de: "Privatschule", en: "Private school", fr: "École privée", it: "Scuola privata" },
  federal_institute_of_technology: { de: "ETH", en: "Federal institute of technology", fr: "École polytechnique fédérale", it: "Politecnico federale" }
};

export function categoryLabel(code: string | undefined | null, language: string): string {
  if (!code) return "";
  const entry = LABELS[code.toLowerCase()];
  if (entry) return entry[(language as keyof Labels) in entry ? (language as keyof Labels) : "en"];
  const plain = code.replace(/_/g, " ").trim();
  return plain.charAt(0).toUpperCase() + plain.slice(1).toLowerCase();
}
