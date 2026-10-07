/**
 * Calibration run: feeds realistic personas through the route planner and the
 * recommendation engine against the LIVE catalog and prints a compact report
 * for manual review. Read-only. Usage: npx tsx scripts/calibrate.ts [personaId]
 */
import { buildPersonalRoute } from "../src/engine/pathPlanner";
import { EducationEngine } from "../src/engine/EducationEngine";
import {
  parseDbInstitution,
  parseDbLearningPath,
  parseDbLearningPathStep,
  parseDbProfession,
  parseDbResource,
  withLookupCategory
} from "../src/data/Repository";
import type { LearningPath, LearningPathStep, RouteBackground, UserProfile } from "../src/types";

const BASE = "https://wfsffzkoaxilirvylswu.supabase.co/rest/v1/";
const KEY = "sb_publishable_IqGPxiQGwhUQWdL9PYmcIQ_Jnv_HwVz";

async function all(table: string, query = ""): Promise<any[]> {
  const rows: any[] = [];
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${BASE}${table}?select=*${query}&order=id&limit=1000&offset=${offset}`, {
      headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }
    });
    const page = await res.json();
    if (!Array.isArray(page)) throw new Error(`${table}: ${JSON.stringify(page)}`);
    rows.push(...page);
    if (page.length < 1000) break;
  }
  return rows;
}

interface Persona {
  id: string;
  label: string;
  profile: Partial<UserProfile>;
  route: Partial<RouteBackground>;
}

const lv = (code: string, level: any) => ({ languageCode: code, level, isSelfAssessed: true });

const PERSONAS: Persona[] = [
  { id: "p01", label: "15y Sek-I student ZH wants FH, tech, de native", profile: { currentStage: "stage_secondary", interests: ["tech"], goals: ["study_active"], preferredCanton: "ZH" }, route: { highestEducation: "compulsory_school", birthYear: 2011, targetLevel: "university_of_applied_sciences", languageLevels: [lv("de", "native")] } },
  { id: "p02", label: "15y Sek-I student BE wants university", profile: { currentStage: "stage_secondary", interests: ["academic"], goals: ["study_active"], preferredCanton: "BE" }, route: { highestEducation: "compulsory_school", birthYear: 2011, targetLevel: "university", languageLevels: [lv("de", "native")] } },
  { id: "p03", label: "EFZ holder AG wants FH", profile: { currentStage: "stage_professional", interests: ["tech", "vocational"], goals: ["study_active"], preferredCanton: "AG" }, route: { highestEducation: "upper_secondary_vocational", birthYear: 2003, targetLevel: "university_of_applied_sciences", languageLevels: [lv("de", "native")] } },
  { id: "p04", label: "EFZ KV LU wants higher vocational", profile: { currentStage: "stage_professional", interests: ["business"], goals: ["career_pivot"], preferredCanton: "LU" }, route: { highestEducation: "upper_secondary_vocational", birthYear: 1998, workExperienceYears: 6, targetLevel: "higher_vocational", languageLevels: [lv("de", "native")] } },
  { id: "p05", label: "Gymnasium Matura wants FH", profile: { currentStage: "stage_secondary", interests: ["business"], goals: ["study_active"], preferredCanton: "ZH" }, route: { highestEducation: "upper_secondary_general", birthYear: 2006, targetLevel: "university_of_applied_sciences", languageLevels: [lv("de", "native")] } },
  { id: "p06", label: "Matura holder wants Uni, German B2 only", profile: { currentStage: "stage_secondary", interests: ["academic"], goals: ["study_active"], preferredCanton: "ZH" }, route: { highestEducation: "upper_secondary_general", birthYear: 2005, targetLevel: "university", languageLevels: [lv("de", "B2"), lv("ru", "native")] } },
  { id: "p07", label: "Ukrainian Matura unrecognised, Uni, German A2, ZH", profile: { currentStage: "stage_other", interests: ["academic"], goals: ["study_active"], preferredCanton: "ZH" }, route: { highestEducation: "upper_secondary_general", highestEducationCountryCode: "UA", diplomaRecognitionStatus: "not_checked", birthYear: 2006, targetLevel: "university", livesInSwitzerland: false, languageLevels: [lv("de", "A2"), lv("uk", "native")] } },
  { id: "p08", label: "Adult 32, no qualification, 6y work, wants EFZ, German B1, SG", profile: { currentStage: "stage_professional", interests: ["vocational"], goals: ["career_pivot"], preferredCanton: "SG" }, route: { highestEducation: "compulsory_school", birthYear: 1994, workExperienceYears: 6, targetLevel: "apprenticeship", languageLevels: [lv("de", "B1")] } },
  { id: "p09", label: "HF graduate wants FH", profile: { currentStage: "stage_professional", interests: ["business"], goals: ["study_active"], preferredCanton: "BE" }, route: { highestEducation: "tertiary_professional", birthYear: 1996, workExperienceYears: 5, targetLevel: "university_of_applied_sciences", languageLevels: [lv("de", "native")] } },
  { id: "p10", label: "Bachelor holder wants University (master)", profile: { currentStage: "stage_university", interests: ["academic"], goals: ["study_active"], preferredCanton: "BS" }, route: { highestEducation: "bachelor", birthYear: 2000, targetLevel: "university", languageLevels: [lv("de", "C1")] } },
  { id: "p11", label: "Undecided school student, nothing answered", profile: { currentStage: "stage_secondary", interests: ["arts"], goals: ["study_active"] }, route: {} },
  { id: "p12", label: "Newcomer teen 16, Syria, A1, wants apprenticeship, SG", profile: { currentStage: "stage_other", interests: ["vocational"], goals: ["study_active"], preferredCanton: "SG" }, route: { highestEducation: "compulsory_school", birthYear: 2010, targetLevel: "apprenticeship", livesInSwitzerland: false, languageLevels: [lv("de", "A1"), lv("ar", "native")] } },
  { id: "p13", label: "French-speaking EFZ VD wants FH", profile: { currentStage: "stage_professional", interests: ["business"], goals: ["study_active"], preferredCanton: "VD" }, route: { highestEducation: "upper_secondary_vocational", birthYear: 2002, targetLevel: "university_of_applied_sciences", languageLevels: [lv("fr", "native"), lv("de", "A2")] } },
  { id: "p14", label: "Student wants language first (Italian), TI", profile: { currentStage: "stage_other", interests: ["tech"], goals: ["global_compare"], preferredCanton: "TI" }, route: { highestEducation: "upper_secondary_general", highestEducationCountryCode: "DE", diplomaRecognitionStatus: "recognised", birthYear: 2005, targetLevel: "language_course", languageLevels: [lv("de", "native"), lv("it", "A1")] } },
  { id: "p15", label: "Master holder no goal", profile: { currentStage: "stage_professional", interests: ["tech"], goals: ["career_pivot"] }, route: { highestEducation: "master", birthYear: 1990, workExperienceYears: 8, languageLevels: [lv("en", "native")] } }
];

(async () => {
  const filter = process.argv[2];
  const lookup = async (table: string) => new Map<string, string>((await all(table)).map((r: any) => [String(r.id), String(r.code)] as [string, string]));
  const [profCats, resCats] = await Promise.all([lookup("profession_categories"), lookup("resource_categories")]);
  const [profRows, instRows, resRows, pathRows, stepRows, focusRows] = await Promise.all([
    all("professions", "&is_active=eq.true"),
    all("institutions"),
    all("resources"),
    all("learning_paths", "&is_active=eq.true"),
    all("learning_path_steps"),
    all("institution_focus_areas")
  ]);
  const professions = withLookupCategory(profRows, "profession_category_id", profCats).map(parseDbProfession).filter(Boolean) as any[];
  const institutions = instRows.map(parseDbInstitution).filter(Boolean) as any[];
  const resources = withLookupCategory(resRows, "resource_category_id", resCats).map(parseDbResource).filter(Boolean) as any[];
  const byPath = new Map<string, LearningPathStep[]>();
  for (const r of stepRows) {
    const s = parseDbLearningPathStep(r);
    if (!s) continue;
    const list = byPath.get(r.learning_path_id) ?? [];
    list.push(s);
    byPath.set(r.learning_path_id, list);
  }
  const templates = pathRows.map(r => parseDbLearningPath(r, byPath)).filter(Boolean) as LearningPath[];
  console.log(`data: ${professions.length} professions, ${institutions.length} institutions, ${resources.length} resources, ${templates.length} paths (${focusRows.length} focus rows)\n`);

  for (const p of PERSONAS) {
    if (filter && p.id !== filter) continue;
    const profile: UserProfile = {
      name: p.id, email: "x@y.z", interests: [], goals: [], currentStage: "", language: "de",
      onboardingComplete: true, createdAt: new Date().toISOString(), ...p.profile
    } as UserProfile;
    const route: RouteBackground = { languageLevels: [], ...p.route } as RouteBackground;
    const plan = buildPersonalRoute(route, profile, templates);
    const rec = new EducationEngine(profile, professions, institutions, resources, route).run();

    console.log(`== ${p.id} ${p.label}`);
    console.log(`   entry=${plan.entry} target=${plan.target} lang=${plan.studyLanguage}/${plan.requiredLanguageLevel || "-"} confidence=${plan.confidence} notes=[${plan.notes.join(", ")}]`);
    for (const s of plan.segments) {
      const cur = s.steps.find(x => x.isCurrent)?.step.title.de ?? "-";
      const done = s.steps.filter(x => x.status === "done").length;
      console.log(`   seg ${s.kind.padEnd(11)} ${s.code} (${done}/${s.steps.length} done) current: ${cur}`);
    }
    if (plan.alternatives.length) console.log(`   alt: ${plan.alternatives.map(a => a.code).join(", ")}`);
    console.log(`   next step: ${rec.nextBestStep}`);
    console.log(`   top professions: ${rec.professions.map(x => `${x.profession.title.de ?? x.profession.title.en} [${(x.profession as any).professionType}]`).join(" | ")}`);
    if (process.env.DETAIL) {
      for (const x of rec.professions) console.log(`     P ${x.score} ${x.profession.title.de} cat=${x.profession.category} :: ${x.matchReasons.join("; ")}`);
      for (const x of rec.institutions) console.log(`     I ${x.score} ${x.institution.title} sub=${x.institution.subgroup} :: ${x.matchReasons.join("; ")}`);
    }
    console.log(`   top institutions: ${rec.institutions.map(x => `${x.institution.title} (${x.institution.canton})`).join(" | ")}`);
    console.log("");
  }
})();
