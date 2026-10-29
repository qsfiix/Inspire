import { AdmissionBox } from "./PathwayInfo";
import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import type { CantonalLink, Institution, LanguageCode, LearningPathStep, Profession, ProfessionFacts, RouteBackground, TopicResource, TrackerGoal, TrainingCompany, UserProfile } from "../types";
import { DataRepository } from "../data/Repository";
import { localizedText } from "../lib/localized";
import { factLines, rankFirms } from "../engine/ladder";
import { FocusEntry, suggestSchools } from "../engine/routeSchools";
import { findApplicationsGoal, firmSignalScore, firmSignals, newItem, signalForFirm, withApplicationItem } from "../lib/trackerOps";
import { trackerUi } from "./trackerUi";

/**
 * The personal part of one ladder micro step: what the generic step text becomes
 * for this user (firms near them, links in their language, schools in their
 * canton, facts of the chosen profession). Everything shown comes from our
 * database; when nothing fits, the step says so instead of guessing.
 */

const LADDER_TOPICS = ["schnupperlehre", "bewerbung_dossier", "lebenslauf", "bewerbungsschreiben", "vorstellungsgespraech", "eignungstests", "lehrstellen_portal", "lehrvertrag", "lehrstart", "plan_b", "berufsmatura_info"];

interface LadderData {
  firms: TrainingCompany[];
  facts: Map<string, ProfessionFacts>;
  institutions: Institution[];
  focus: Map<string, FocusEntry[]>;
}

let sharedData: Promise<LadderData> | null = null;
function loadLadderData(): Promise<LadderData> {
  if (!sharedData) {
    sharedData = Promise.all([
      DataRepository.getTrainingCompanies(),
      DataRepository.getProfessionFacts(),
      DataRepository.getInstitutions(),
      DataRepository.getInstitutionFocusAreas()
    ])
      .then(([firms, facts, institutions, focus]) => ({ firms, facts: new Map(facts.map(f => [f.professionId, f])), institutions, focus }))
      .catch(err => {
        sharedData = null;
        throw err;
      });
  }
  return sharedData;
}

const UI: Record<LanguageCode, Record<string, string>> = {
  de: {
    noFacts: "Für diesen Beruf haben wir noch keine Detailangaben. Schau bei berufsberatung.ch nach.",
    source: "Quelle",
    firmsHead: "Betriebe, die diesen Beruf ausbilden",
    noFirms: "In unserem Verzeichnis gibt es noch keine Betriebe für diesen Beruf. Suche auf berufsberatung.ch (LENA) und bei den Betrieben in deiner Nähe.",
    pickCanton: "Wähle in deinem Profil einen Kanton, dann zeigen wir Angebote in deiner Nähe.",
    reasons_canton: "In deinem Kanton",
    reasons_language: "Deine Sprache",
    reasons_interest: "Passt zu deinen Interessen",
    reasons_schnupperlehre: "Schnupperlehre möglich",
    training: "Lehrstellen-Seite",
    linksHead: "Hilfreiche Links",
    noLinks: "Für diesen Schritt haben wir noch keine Links.",
    schoolsHead: "Schulen",
    noSchools: "Keine passenden Schulen gefunden.",
    altHead: "Verwandte Berufe",
    followHead: "Passende Studienrichtungen",
    cantonLinksHead: "Offizielle Seite deines Kantons",
    nothingCanton: "Für deinen Kanton haben wir hier noch keine Seite."
  },
  en: {
    noFacts: "We do not have details for this profession yet. Check berufsberatung.ch.",
    source: "Source",
    firmsHead: "Companies that train this profession",
    noFirms: "Our directory has no companies for this profession yet. Search berufsberatung.ch (LENA) and companies near you.",
    pickCanton: "Choose a canton in your profile and we will show options near you.",
    reasons_canton: "In your canton",
    reasons_language: "Your language",
    reasons_interest: "Fits your interests",
    reasons_schnupperlehre: "Trial apprenticeship possible",
    training: "Apprenticeship page",
    linksHead: "Helpful links",
    noLinks: "We have no links for this step yet.",
    schoolsHead: "Schools",
    noSchools: "No matching schools found.",
    altHead: "Related professions",
    followHead: "Fitting fields of study",
    cantonLinksHead: "Official page of your canton",
    nothingCanton: "We have no page for your canton here yet."
  },
  fr: {
    noFacts: "Nous n'avons pas encore de détails pour cette profession. Consulte orientation.ch.",
    source: "Source",
    firmsHead: "Entreprises qui forment à ce métier",
    noFirms: "Notre répertoire ne contient pas encore d'entreprises pour ce métier. Cherche sur orientation.ch (LENA) et près de chez toi.",
    pickCanton: "Choisis un canton dans ton profil et nous te montrerons des offres près de chez toi.",
    reasons_canton: "Dans ton canton",
    reasons_language: "Ta langue",
    reasons_interest: "Correspond à tes intérêts",
    reasons_schnupperlehre: "Stage d'orientation possible",
    training: "Page des places d'apprentissage",
    linksHead: "Liens utiles",
    noLinks: "Nous n'avons pas encore de liens pour cette étape.",
    schoolsHead: "Écoles",
    noSchools: "Aucune école correspondante trouvée.",
    altHead: "Métiers proches",
    followHead: "Domaines d'études possibles",
    cantonLinksHead: "Page officielle de ton canton",
    nothingCanton: "Nous n'avons pas encore de page pour ton canton."
  },
  it: {
    noFacts: "Non abbiamo ancora dettagli su questa professione. Consulta orientamento.ch.",
    source: "Fonte",
    firmsHead: "Aziende che formano in questa professione",
    noFirms: "Il nostro elenco non ha ancora aziende per questa professione. Cerca su orientamento.ch (LENA) e vicino a te.",
    pickCanton: "Scegli un cantone nel tuo profilo e ti mostreremo offerte vicino a te.",
    reasons_canton: "Nel tuo cantone",
    reasons_language: "La tua lingua",
    reasons_interest: "Corrisponde ai tuoi interessi",
    reasons_schnupperlehre: "Stage di prova possibile",
    training: "Pagina dei posti di tirocinio",
    linksHead: "Link utili",
    noLinks: "Non abbiamo ancora link per questo passaggio.",
    schoolsHead: "Scuole",
    noSchools: "Nessuna scuola corrispondente trovata.",
    altHead: "Professioni affini",
    followHead: "Campi di studio adatti",
    cantonLinksHead: "Pagina ufficiale del tuo cantone",
    nothingCanton: "Non abbiamo ancora una pagina per il tuo cantone."
  },
  uk: {
    noFacts: "Для цієї професії в нас ще немає докладних даних. Зазирніть на berufsberatung.ch.",
    source: "Джерело",
    firmsHead: "Компанії, які навчають цієї професії",
    noFirms: "У нашому переліку для цієї професії ще немає компаній. Шукайте на berufsberatung.ch (LENA) та серед компаній поруч із вами.",
    pickCanton: "Оберіть кантон у своєму профілі, і ми покажемо пропозиції поруч із вами.",
    reasons_canton: "У вашому кантоні",
    reasons_language: "Ваша мова",
    reasons_interest: "Відповідає вашим інтересам",
    reasons_schnupperlehre: "Можна пройти пробну практику (Schnupperlehre)",
    training: "Сторінка місць для навчання з практикою",
    linksHead: "Корисні посилання",
    noLinks: "Для цього кроку в нас ще немає посилань.",
    schoolsHead: "Школи",
    noSchools: "Відповідних шкіл не знайдено.",
    altHead: "Споріднені професії",
    followHead: "Відповідні напрями навчання",
    cantonLinksHead: "Офіційна сторінка вашого кантону",
    nothingCanton: "Для вашого кантону в нас тут ще немає сторінки."
  }
};

interface Props {
  step: LearningPathStep;
  profession: Profession;
  profile: UserProfile | null;
  route?: RouteBackground;
  language: LanguageCode;
  isDark: boolean;
  alternatives: Profession[];
  /** The user's tracker: firms can be added to the application board, and impressions reorder the firms. */
  trackers?: TrackerGoal[];
  onTrackersChange?: (updated: TrackerGoal[]) => void;
}

export default function LadderExtras({ step, profession, profile, language, isDark, alternatives, trackers, onTrackersChange }: Props) {
  const ui = UI[language] ?? UI.de;
  const canton = profile?.preferredCanton?.toUpperCase();
  const hook = step.hook;
  const topic = step.hookTopic ?? null;

  const [data, setData] = useState<LadderData | null>(null);
  const [resources, setResources] = useState<TopicResource[]>([]);
  const [cantonLinks, setCantonLinks] = useState<Map<string, CantonalLink[]>>(new Map());
  const [profSchoolIds, setProfSchoolIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!hook) return;
    let active = true;
    loadLadderData().then(d => active && setData(d)).catch(() => undefined);
    return () => {
      active = false;
    };
  }, [hook]);

  useEffect(() => {
    // The Berufsmatura step also shows plain-language information next to the schools.
    const wanted = hook === "resources" ? topic : hook === "schools" && topic === "bm" ? "berufsmatura_info" : null;
    if (!wanted || !LADDER_TOPICS.includes(wanted)) return;
    let active = true;
    DataRepository.getTopicResources([wanted], canton).then(r => active && setResources(r));
    return () => {
      active = false;
    };
  }, [hook, topic, canton]);

  useEffect(() => {
    if (hook !== "canton_links" || !canton) return;
    let active = true;
    DataRepository.getCantonalLinks(canton).then(m => active && setCantonLinks(m));
    return () => {
      active = false;
    };
  }, [hook, canton]);

  useEffect(() => {
    if (hook !== "schools" || topic !== "berufsfachschule") return;
    let active = true;
    DataRepository.getProfessionInstitutionIds(profession.id).then(ids => active && setProfSchoolIds(new Set(ids)));
    return () => {
      active = false;
    };
  }, [hook, topic, profession.id]);

  const muted = isDark ? "text-zinc-400" : "text-zinc-600";
  const head = `text-[10px] font-mono uppercase tracking-widest ${isDark ? "text-violet-300/80" : "text-violet-700"}`;
  const linkCls = `inline-flex items-center gap-1 text-[11px] font-semibold underline-offset-2 hover:underline ${isDark ? "text-violet-300" : "text-violet-700"}`;
  const chip = `text-[10px] px-1.5 py-0.5 rounded-full border ${isDark ? "border-white/15 text-zinc-300" : "border-zinc-300 text-zinc-700"}`;

  const facts = data?.facts.get(profession.id);
  const lines = useMemo(() => factLines(facts, topic), [facts, topic]);
  const signals = useMemo(() => firmSignals(trackers), [trackers]);
  const firms = useMemo(
    () => (data ? rankFirms(data.firms, profession, profile, { schnupperlehre: topic === "schnupperlehre", limit: 5, adjust: f => firmSignalScore(signalForFirm(signals, f)) }) : []),
    [data, profession, profile, topic, signals]
  );
  const tui = trackerUi(language);
  const appsGoal = findApplicationsGoal(trackers);
  const firmOnBoard = (f: TrainingCompany) => !!appsGoal?.items.some(i => i.kind === "application" && (i.firm?.id === f.id || i.firm?.name === f.name));
  const firmInLog = (f: TrainingCompany) => !!appsGoal?.items.some(i => i.kind === "schnupper" && (i.firm?.id === f.id || i.firm?.name === f.name));
  const goalTexts = { title: tui.boardTitle, description: tui.boardHint };
  const addFirmToBoard = (f: TrainingCompany) => {
    if (!trackers || !onTrackersChange || firmOnBoard(f)) return;
    onTrackersChange(withApplicationItem(trackers, goalTexts, newItem(f.name, { kind: "application", appStatus: "planned", firm: { id: f.id, name: f.name, url: f.trainingUrl } })));
  };
  const addFirmToLog = (f: TrainingCompany) => {
    if (!trackers || !onTrackersChange || firmInLog(f)) return;
    onTrackersChange(withApplicationItem(trackers, goalTexts, newItem(`${tui.kindLabel.schnupper} · ${f.name}`, { kind: "schnupper", firm: { id: f.id, name: f.name, url: f.trainingUrl } })));
  };
  const schools = useMemo(() => {
    if (!data || hook !== "schools") return [];
    if (topic === "bm") return suggestSchools({ focus: "berufsmaturitaet", bm: true }, data.institutions, data.focus, { canton, limit: 4 });
    if (topic === "berufsfachschule") return suggestSchools({ ids: profSchoolIds }, data.institutions, data.focus, { canton, limit: 4 });
    return [];
  }, [data, hook, topic, canton, profSchoolIds]);
  const uasSchools = useMemo(
    () => (data && hook === "fh_followups" ? suggestSchools({ subgroups: ["university_of_applied_sciences"] }, data.institutions, data.focus, { canton, limit: 4 }) : []),
    [data, hook, canton]
  );

  if (!hook) return null;

  const ordered = [...resources].sort((a, b) => Number(b.language === language) - Number(a.language === language) || Number(b.official) - Number(a.official));
  const shownResources = ordered.filter(r => r.language === language || r.language === "de" || !r.language).slice(0, 4);

  return (
    <div className="mt-2 space-y-1.5">
      {hook === "profession_facts" && (
        <div className="space-y-1">
          {lines.length > 0 ? (
            <ul className={`text-[11px] space-y-0.5 ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
              {lines.map(l => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          ) : (
            data && <p className={`text-[11px] ${muted}`}>{ui.noFacts}</p>
          )}
          {facts?.sourceUrl && (
            <a href={facts.sourceUrl} target="_blank" rel="noreferrer" className={linkCls}>
              {ui.source} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {hook === "canton_links" && (
        <div className="space-y-1">
          <div className={head}>{ui.cantonLinksHead}</div>
          {!canton ? (
            <p className={`text-[11px] ${muted}`}>{ui.pickCanton}</p>
          ) : (cantonLinks.get(topic ?? "") ?? []).length > 0 ? (
            (cantonLinks.get(topic ?? "") ?? []).slice(0, 3).map(l => (
              <div key={l.url}>
                <a href={l.url} target="_blank" rel="noreferrer" className={linkCls}>
                  {localizedText(l.title, language)} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))
          ) : (
            <p className={`text-[11px] ${muted}`}>{ui.nothingCanton}</p>
          )}
        </div>
      )}

      {hook === "resources" && (
        <div className="space-y-1">
          <div className={head}>{ui.linksHead}</div>
          {shownResources.length === 0 ? (
            <p className={`text-[11px] ${muted}`}>{ui.noLinks}</p>
          ) : (
            shownResources.map(r => (
              <div key={r.url}>
                <a href={r.url} target="_blank" rel="noreferrer" className={linkCls}>
                  {localizedText(r.title, language)} <ExternalLink className="h-3 w-3" />
                </a>
                {r.provider && <span className={`ml-1 text-[10px] ${muted}`}>{r.provider}</span>}
              </div>
            ))
          )}
        </div>
      )}

      {hook === "firms" && (
        <div className="space-y-1.5">
          <div className={head}>{ui.firmsHead}</div>
          {!canton && <p className={`text-[11px] ${muted}`}>{ui.pickCanton}</p>}
          {data && firms.length === 0 && <p className={`text-[11px] ${muted}`}>{ui.noFirms}</p>}
          {firms.map(({ firm, reasons }) => (
            <div key={firm.id} className={`rounded-lg border px-2.5 py-1.5 ${isDark ? "border-white/10 bg-white/[0.03]" : "border-zinc-200 bg-zinc-50"}`}>
              <div className={`text-[12px] font-semibold ${isDark ? "text-white" : "text-violet-950"}`}>{firm.name}</div>
              <div className={`flex items-center gap-1 text-[11px] ${muted}`}>
                <MapPin className="h-3 w-3" />
                {[firm.postalCode, firm.city, firm.canton].filter(Boolean).join(" ")}
              </div>
              {reasons.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {reasons.map(r => (
                    <span key={r} className={chip}>
                      {ui[`reasons_${r}`]}
                    </span>
                  ))}
                </div>
              )}
              {(() => {
                const sig = signalForFirm(signals, firm);
                const score = firmSignalScore(sig);
                const text = sig?.status === "rejected" || sig?.status === "declined" ? tui.signalRejected : score > 0 ? tui.signalGood : score < 0 ? tui.signalBad : null;
                return text ? <div className={`mt-1 text-[10px] font-semibold ${score > 0 ? "text-emerald-500" : "text-amber-500"}`}>{text}</div> : null;
              })()}
              {firm.trainingUrl && (
                <a href={firm.trainingUrl} target="_blank" rel="noreferrer" className={`${linkCls} mt-1`}>
                  {ui.training} <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {onTrackersChange && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {topic === "schnupperlehre" ? (
                    <button type="button" onClick={() => addFirmToLog(firm)} disabled={firmInLog(firm)} className={`${chip} cursor-pointer disabled:cursor-default disabled:opacity-70`}>
                      {firmInLog(firm) ? tui.inLog : tui.toLog}
                    </button>
                  ) : (
                    <button type="button" onClick={() => addFirmToBoard(firm)} disabled={firmOnBoard(firm)} className={`${chip} cursor-pointer disabled:cursor-default disabled:opacity-70`}>
                      {firmOnBoard(firm) ? tui.onBoard : tui.toBoard}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {hook === "schools" && topic === "bm" && canton && (
        <AdmissionBox canton={canton} routes={["bms_bm1", "bms_bm2"]} language={language} isDark={isDark} />
      )}

      {hook === "schools" && topic === "bm" && shownResources.length > 0 && (
        <div className="space-y-1">
          <div className={head}>{ui.linksHead}</div>
          {shownResources.map(r => (
            <div key={r.url}>
              <a href={r.url} target="_blank" rel="noreferrer" className={linkCls}>
                {localizedText(r.title, language)} <ExternalLink className="h-3 w-3" />
              </a>
              {r.provider && <span className={`ml-1 text-[10px] ${muted}`}>{r.provider}</span>}
            </div>
          ))}
        </div>
      )}

      {hook === "schools" && (
        <div className="space-y-1">
          <div className={head}>{ui.schoolsHead}</div>
          {data && schools.length === 0 && <p className={`text-[11px] ${muted}`}>{ui.noSchools}</p>}
          {schools.map(s => (
            <div key={s.institution.id} className={`text-[11px] ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
              {s.institution.title}
              <span className={`ml-1 ${muted}`}>
                {[s.institution.canton, s.detail].filter(Boolean).join(" · ")}
              </span>
            </div>
          ))}
        </div>
      )}

      {hook === "alternatives" && alternatives.length > 0 && (
        <div className="space-y-1">
          <div className={head}>{ui.altHead}</div>
          <div className="flex flex-wrap gap-1">
            {alternatives.map(p => (
              <span key={p.id} className={chip}>
                {localizedText(p.title, language)}
              </span>
            ))}
          </div>
        </div>
      )}

      {hook === "fh_followups" && (
        <div className="space-y-1.5">
          {facts && facts.fhFollowups.length > 0 && (
            <div className="space-y-1">
              <div className={head}>{ui.followHead}</div>
              <div className="flex flex-wrap gap-1">
                {facts.fhFollowups.map(f => (
                  <span key={f} className={chip}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
          {uasSchools.length > 0 && (
            <div className="space-y-0.5">
              <div className={head}>{ui.schoolsHead}</div>
              {uasSchools.map(s => (
                <div key={s.institution.id} className={`text-[11px] ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                  {s.institution.title}
                  <span className={`ml-1 ${muted}`}>{s.institution.canton}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
