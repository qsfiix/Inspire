import React, { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, ChevronUp, Circle, ExternalLink, Info, Route as RouteIcon } from "lucide-react";
import { DataRepository } from "../data/Repository";
import { buildPersonalRoute, PlannedSegment, PersonalRoute as PersonalRouteModel } from "../engine/pathPlanner";
import { getTranslatedString } from "../engine/engineConfig";
import { getOnboardingCopy } from "../features/onboardingCopy";
import { getRouteCopy } from "./personalRouteCopy";
import { BM_ORIENTATIONS, STEP_SCHOOLS, suggestSchools, FocusEntry, SchoolSelector } from "../engine/routeSchools";
import { TARGET_TYPES } from "../engine/routeSignals";
import type { Institution, LanguageCode, LearningPath, Profession, RouteBackground, UserProfile } from "../types";

const CANTONS = ["AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU", "LU", "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "VD", "VS", "ZG", "ZH"];

interface SchoolContext {
  institutions: Institution[];
  focus: Map<string, FocusEntry[]>;
  canton: string;
  onCantonChange: (canton: string) => void;
}

interface PersonalRouteProps {
  userProfile: UserProfile | null;
  language: LanguageCode;
  isDark: boolean;
  onRefine: () => void;
  onProfileUpdate?: (patch: Partial<UserProfile>) => void;
}

const NOTE_KEYS: Record<string, string> = {
  "entry-assumed": "note_entry_assumed",
  "target-missing": "note_target_missing",
  "language-unknown": "note_language_unknown",
  "language-gap": "note_language_gap",
  "recognition-needed": "note_recognition_needed",
  "second-apprenticeship": "note_second_apprenticeship",
  "matura-no-bm-needed": "note_matura_no_bm_needed",
  "profession-level-mismatch": "note_profession_level_mismatch"
};

function StepSchools({
  stepKey,
  ctx,
  isDark,
  copy,
  selectorOverride,
  defaultOpen = false
}: {
  key?: React.Key;
  stepKey: string;
  ctx: SchoolContext;
  isDark: boolean;
  copy: Record<string, string>;
  selectorOverride?: SchoolSelector;
  defaultOpen?: boolean;
}) {
  const selector = selectorOverride ?? STEP_SCHOOLS[stepKey];
  const [open, setOpen] = useState(defaultOpen);
  const [orientation, setOrientation] = useState("");
  const [showAll, setShowAll] = useState(false);
  if (!selector) return null;
  const all = suggestSchools(selector, ctx.institutions, ctx.focus, {
    canton: ctx.canton || undefined,
    requireFocus: orientation ? "bm_" + orientation : undefined
  });
  const visible = showAll ? all : all.slice(0, 6);
  const muted = isDark ? "text-zinc-400" : "text-violet-950/70";
  const field =
    "rounded-lg border px-2 py-1 text-[11px] font-semibold " +
    (isDark ? "bg-white/[0.03] border-white/10 text-white" : "bg-white border-purple-200 text-violet-950");

  return (
    <div className="pt-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={"text-[11px] font-bold underline cursor-pointer " + (isDark ? "text-violet-300" : "text-violet-800")}
      >
        {open ? copy.schoolsHide : copy.schoolsShow + " (" + all.length + ")"}
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 text-[11px]">
              <span className={muted}>{copy.schoolsCanton}</span>
              <select className={field} value={ctx.canton} onChange={e => ctx.onCantonChange(e.target.value)}>
                <option value="">{copy.schoolsAll}</option>
                {CANTONS.map(code => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>
            {selector.bm && (
              <select className={field} value={orientation} onChange={e => setOrientation(e.target.value)} aria-label={copy.orientationAll}>
                <option value="">{copy.orientationAll}</option>
                {BM_ORIENTATIONS.map(o => (
                  <option key={o} value={o}>
                    {copy["orient_" + o]}
                  </option>
                ))}
              </select>
            )}
          </div>
          {visible.length === 0 && <p className={"text-[11px] " + muted}>{copy.schoolsNone}</p>}
          <ul className="space-y-1.5">
            {visible.map(({ institution, detail, inCanton }) => (
              <li
                key={institution.id}
                className={
                  "flex flex-wrap items-baseline gap-x-2 rounded-lg border px-2.5 py-1.5 text-[11px] " +
                  (inCanton ? (isDark ? "border-violet-500/60" : "border-violet-500") : isDark ? "border-white/5" : "border-purple-200")
                }
              >
                <span className={"font-bold " + (isDark ? "text-white" : "text-violet-950")}>{institution.title}</span>
                <span className={muted}>{[institution.canton, detail].filter(Boolean).join(" · ")}</span>
                {institution.website && (
                  <a
                    href={institution.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={"ml-auto inline-flex items-center gap-1 underline " + (isDark ? "text-violet-300" : "text-violet-800")}
                  >
                    {copy.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </li>
            ))}
          </ul>
          {all.length > visible.length && (
            <button type="button" onClick={() => setShowAll(true)} className={"text-[11px] underline cursor-pointer " + muted}>
              {copy.schoolsMore}
            </button>
          )}
          <p className={"text-[10px] " + muted}>{copy.schoolsHint}</p>
        </div>
      )}
    </div>
  );
}

function SegmentView({
  segment,
  language,
  isDark,
  copy,
  defaultOpen,
  schools
}: {
  key?: React.Key;
  segment: PlannedSegment;
  language: LanguageCode;
  isDark: boolean;
  copy: Record<string, string>;
  defaultOpen: boolean;
  schools: SchoolContext;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const title = getTranslatedString(segment.path.title, language, "de");
  const doneCount = segment.steps.filter(s => s.status === "done").length;
  const muted = isDark ? "text-zinc-400" : "text-violet-950/70";

  return (
    <div className={`rounded-2xl border ${isDark ? "border-white/10 bg-white/[0.02]" : "border-purple-200 bg-violet-50/40"}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-4 text-left cursor-pointer"
      >
        <div className="min-w-0">
          <span className={`block text-[11px] font-bold uppercase tracking-wider ${isDark ? "text-violet-300" : "text-violet-800"}`}>
            {copy[`kind_${segment.kind}`]}
          </span>
          <span className={`block text-sm font-black ${isDark ? "text-white" : "text-violet-950"}`}>{title}</span>
          <span className={`block text-xs ${muted}`}>
            {doneCount} / {segment.steps.length}
          </span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>

      {open && (
        <ol className="space-y-2 px-4 pb-4">
          {segment.steps.map(({ step, status, isCurrent }) => {
            const stepTitle = getTranslatedString(step.title, language, "de");
            const desc = getTranslatedString(step.description, language, "de");
            const timeframe = getTranslatedString(step.timeframe, language, "de");
            return (
              <li
                key={step.id}
                className={`flex gap-3 rounded-xl border p-3 ${
                  isCurrent
                    ? isDark
                      ? "border-violet-500 bg-violet-950/30"
                      : "border-violet-600 bg-violet-100"
                    : isDark
                      ? "border-white/5"
                      : "border-purple-200 bg-white/60"
                } ${status === "later" ? "opacity-70" : ""}`}
              >
                <span className="mt-0.5 shrink-0">
                  {status === "done" ? (
                    <Check className="h-4 w-4 text-emerald-500" aria-label={copy.status_done} />
                  ) : (
                    <Circle className={`h-4 w-4 ${isCurrent ? "text-violet-500" : muted}`} aria-label={isCurrent ? copy.status_current : copy.status_later} />
                  )}
                </span>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-bold ${isDark ? "text-white" : "text-violet-950"}`}>{stepTitle}</span>
                    {isCurrent && (
                      <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">{copy.status_current}</span>
                    )}
                    {step.isOptional && <span className={`text-[10px] ${muted}`}>{copy.optional}</span>}
                  </div>
                  {desc && status !== "done" && <p className={`text-xs leading-relaxed ${muted}`}>{desc}</p>}
                  <div className="flex flex-wrap items-center gap-3">
                    {timeframe && status !== "done" && <span className={`text-[11px] ${muted}`}>{timeframe}</span>}
                    {step.officialUrl && status !== "done" && (
                      <a
                        href={step.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-1 text-[11px] underline ${isDark ? "text-violet-300" : "text-violet-800"}`}
                      >
                        {copy.open}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {status !== "done" && step.order !== undefined && STEP_SCHOOLS[segment.code + ":" + step.order] && (
                    <StepSchools stepKey={segment.code + ":" + step.order} ctx={schools} isDark={isDark} copy={copy} />
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default function PersonalRoute({ userProfile, language, isDark, onRefine, onProfileUpdate }: PersonalRouteProps) {
  const copy = getRouteCopy(language);
  const onboardingCopy = getOnboardingCopy(language);
  const [templates, setTemplates] = useState<LearningPath[] | null>(null);
  const [route, setRoute] = useState<RouteBackground | undefined>();
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [focus, setFocus] = useState<Map<string, FocusEntry[]>>(new Map());
  const [canton, setCanton] = useState<string>(userProfile?.preferredCanton ?? "");
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [profQuery, setProfQuery] = useState("");
  const [profInstitutionIds, setProfInstitutionIds] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    DataRepository.getProfessions()
      .then(list => active && setProfessions(list))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const chosenProf = useMemo(
    () => professions.find(p => p.id === route?.targetProfessionId),
    [professions, route?.targetProfessionId]
  );

  useEffect(() => {
    let active = true;
    if (!route?.targetProfessionId) {
      setProfInstitutionIds([]);
      return;
    }
    DataRepository.getProfessionInstitutionIds(route.targetProfessionId).then(ids => active && setProfInstitutionIds(ids));
    return () => {
      active = false;
    };
  }, [route?.targetProfessionId]);

  const updateRoute = (patch: Partial<RouteBackground>) => {
    const next: RouteBackground = { ...(route ?? { languageLevels: [] }), ...patch };
    setRoute(next);
    DataRepository.saveRouteBackground(next).catch(() => undefined);
  };

  const profMatches = useMemo(() => {
    const q = profQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    const wanted = route?.targetLevel ? TARGET_TYPES[route.targetLevel] : undefined;
    return professions
      .filter(p => Object.values(p.title ?? {}).some(text => typeof text === "string" && text.toLowerCase().includes(q)))
      .sort((a, b) => Number(!!wanted?.includes(b.professionType ?? "")) - Number(!!wanted?.includes(a.professionType ?? "")))
      .slice(0, 8);
  }, [professions, profQuery, route?.targetLevel]);

  useEffect(() => {
    let active = true;
    Promise.all([DataRepository.getInstitutions(), DataRepository.getInstitutionFocusAreas()])
      .then(([list, focusMap]) => {
        if (!active) return;
        setInstitutions(list);
        setFocus(focusMap);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const handleCanton = (value: string) => {
    setCanton(value);
    if (value) onProfileUpdate?.({ preferredCanton: value });
  };
  const schools: SchoolContext = { institutions, focus, canton, onCantonChange: handleCanton };

  useEffect(() => {
    let active = true;
    Promise.all([DataRepository.getLearningPaths(), DataRepository.getRouteBackground()])
      .then(([paths, bg]) => {
        if (!active) return;
        setTemplates(paths);
        setRoute(bg);
      })
      .catch(() => active && setTemplates([]));
    return () => {
      active = false;
    };
  }, [userProfile]);

  const personal: PersonalRouteModel | null = useMemo(
    () => (templates ? buildPersonalRoute(route, userProfile, templates, new Date(), chosenProf?.professionType) : null),
    [templates, route, userProfile, chosenProf?.professionType]
  );

  const muted = isDark ? "text-zinc-400" : "text-violet-950/70";
  const targetLabel =
    personal && personal.target !== "undecided" ? onboardingCopy[`tgt_${personal.target}`] ?? personal.target : copy.target_undecided;

  return (
    <div className="card-premium space-y-5 rounded-3xl border border-violet-500/20 p-5 sm:p-6" data-testid="personal-route">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <RouteIcon className={`h-5 w-5 ${isDark ? "text-violet-300" : "text-violet-900"}`} />
          <div>
            <h3 className={`text-sm font-black tracking-tight ${isDark ? "text-white" : "text-violet-950"}`}>{copy.title}</h3>
            <p className={`text-xs ${muted}`}>{copy.subtitle}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefine}
          className="btn-secondary px-3 py-2 text-xs font-bold cursor-pointer"
        >
          {copy.refine}
        </button>
      </div>

      {!personal && <p className={`text-xs ${muted}`}>{copy.loading}</p>}

      {personal && (
        <>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-3 py-1 font-bold ${isDark ? "bg-white/5 text-zinc-200" : "bg-white text-violet-950 border border-purple-200"}`}>
              {copy[`entry_${personal.entry}`]}
            </span>
            <span aria-hidden="true">→</span>
            <span className={`rounded-full px-3 py-1 font-bold ${isDark ? "bg-violet-950/40 text-violet-200" : "bg-violet-100 text-violet-900"}`}>
              {targetLabel}
            </span>
            <span className={`ml-auto text-[11px] ${muted}`}>{copy[`conf_${personal.confidence}`]}</span>
          </div>
          {personal.targetStartYear && (
            <p className={`text-xs ${muted}`}>{copy.targetStart.replace("{year}", String(personal.targetStartYear))}</p>
          )}

          {personal.notes.length > 0 && (
            <ul className="space-y-1.5">
              {personal.notes.map(note => (
                <li key={note} className={`flex gap-2 text-xs ${muted}`}>
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{copy[NOTE_KEYS[note]].replace("{level}", personal.requiredLanguageLevel || "B2")}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2" data-testid="route-profession">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? "text-violet-300" : "text-violet-800"}`}>{copy.profTitle}</span>
            {chosenProf ? (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-3 py-1 font-bold ${isDark ? "bg-violet-950/40 text-violet-200" : "bg-violet-100 text-violet-900"}`}>
                  {getTranslatedString(chosenProf.title, language, "de")}
                </span>
                <span className={muted}>{copy["type_" + (chosenProf.professionType ?? "other")] ?? copy.type_other}</span>
                <button type="button" onClick={() => updateRoute({ targetProfessionId: undefined })} className={`underline cursor-pointer ${muted}`}>
                  {copy.profRemove}
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <input
                  value={profQuery}
                  onChange={e => setProfQuery(e.target.value)}
                  placeholder={copy.profSearch}
                  aria-label={copy.profTitle}
                  className={`w-full rounded-xl border px-3 py-2 text-xs font-semibold ${isDark ? "bg-white/[0.03] border-white/10 text-white" : "bg-white border-purple-200 text-violet-950"}`}
                />
                {profQuery.trim().length < 2 && <p className={`text-[11px] ${muted}`}>{copy.profHint}</p>}
                {profQuery.trim().length >= 2 && profMatches.length === 0 && <p className={`text-[11px] ${muted}`}>{copy.profNone}</p>}
                {profMatches.length > 0 && (
                  <ul className="space-y-1">
                    {profMatches.map(p => (
                      <li key={p.id}>
                        <button
                          type="button"
                          onClick={() => {
                            updateRoute({ targetProfessionId: p.id });
                            setProfQuery("");
                          }}
                          className={`flex w-full items-baseline justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[11px] cursor-pointer ${isDark ? "border-white/10 hover:border-violet-500" : "border-purple-200 hover:border-violet-600"}`}
                        >
                          <span className={`font-bold ${isDark ? "text-white" : "text-violet-950"}`}>{getTranslatedString(p.title, language, "de")}</span>
                          <span className={muted}>{copy["type_" + (p.professionType ?? "other")] ?? copy.type_other}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {chosenProf && (
              <div className={`rounded-2xl border p-3 ${isDark ? "border-white/10" : "border-purple-200 bg-violet-50/40"}`}>
                <span className={`block text-xs font-black ${isDark ? "text-white" : "text-violet-950"}`}>{copy.profSchools}</span>
                {profInstitutionIds.length === 0 ? (
                  <p className={`text-[11px] ${muted}`}>{copy.profNoSchools}</p>
                ) : (
                  <StepSchools
                    stepKey={"profession:" + chosenProf.id}
                    ctx={schools}
                    isDark={isDark}
                    copy={copy}
                    selectorOverride={{ ids: new Set(profInstitutionIds) }}
                    defaultOpen
                  />
                )}
              </div>
            )}
          </div>

          {personal.segments.length === 0 && personal.alternatives.length === 0 && <p className={`text-xs ${muted}`}>{copy.empty}</p>}

          <div className="space-y-3">
            {personal.segments.map((segment, index) => (
              <SegmentView
                key={`${segment.code}-${index}`}
                segment={segment}
                language={language}
                isDark={isDark}
                copy={copy}
                defaultOpen={index === 0}
                schools={schools}
              />
            ))}
          </div>

          {personal.alternatives.length > 0 && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setShowAlternatives(!showAlternatives)}
                aria-expanded={showAlternatives}
                className={`flex items-center gap-1 text-xs font-bold underline cursor-pointer ${isDark ? "text-violet-300" : "text-violet-800"}`}
              >
                {copy.alternativesTitle}
                {showAlternatives ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
              {showAlternatives &&
                personal.alternatives.map((segment, index) => (
                  <SegmentView
                    key={`alt-${segment.code}-${index}`}
                    segment={segment}
                    language={language}
                    isDark={isDark}
                    copy={copy}
                    defaultOpen={false}
                    schools={schools}
                  />
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
