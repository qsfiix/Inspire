import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  BrainCircuit,
  Landmark,
  ShieldCheck,
  Briefcase,
  ExternalLink,
  Lightbulb,
  Wand2,
  AlertTriangle,
  Milestone,
  CircleAlert
} from "lucide-react";
import { LanguageCode, TrackerGoal, UserProfile } from "../types";
import { useEducationEngine } from "../engine/useEducationEngine";
import { TRANSLATIONS } from "../data";

// Goal ids -> the same translated labels the onboarding uses.
const GOAL_LABEL_KEY: Record<string, string> = {
  study_active: "goals_study",
  career_pivot: "goals_career",
  global_compare: "goals_explore",
  parent_routing: "goals_child",
};
import { localizedText } from "../lib/localized";

// The onboarding stores "stage_secondary"; its label lives under "stage_schoolType".
const STAGE_LABEL_KEY: Record<string, string> = { stage_secondary: "stage_schoolType" };
import { FEATURES } from "../featureFlags";
import GoalButton from "./GoalButton";

/** Bring My Path into view after a goal was set from a recommendation. */
const scrollToMyPath = () => document.getElementById("my-path")?.scrollIntoView({ behavior: "smooth", block: "start" });

/** Engine reasons that are trust labels, not reasons for a match (all 4 languages). */
const PROVISIONAL_REASON = /provisional|vorläufig|provisoire|provvisori/i;

interface AdvisorReportProps {
  userProfile?: UserProfile | null;
  interests: string[];
  goals: string[];
  currentStage: string;
  language: LanguageCode;
  theme?: string;
  /** Optional: when provided, the matched learning path gets an "add to my tracker" button. */
  trackers?: TrackerGoal[];
  onTrackersChange?: (updated: TrackerGoal[]) => void;
}

/** Shape of a successful /api/gemini/advisor response (see server.ts). */
interface AiAdvisorResponse {
  welcomeMessage: string;
  suggestedPathTitle: string;
  explanation: string;
  milestones: { id: string; title: string; description: string; timeframe: string }[];
  recommendedInstitutions: string[];
  /** Present only when the server couldn't reach Gemini and returned a generic stand-in. */
  isFallback?: boolean;
  errorMessage?: string;
}

const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: "English",
  de: "German",
  fr: "French",
  it: "Italian"
};

/**
 * Qualitative match label derived from a result's score relative to the
 * top result in the same list (not an absolute scale - the engine has
 * none). Raw score stays available in the tooltip for transparency.
 */
function MatchBadge({ score, topScore, isDark, reasons, t, fit }: { score: number; topScore: number; isDark: boolean; reasons: string[]; t: Record<string, string>; fit?: "specific" | "field" | "weak" }) {
  const ratio = topScore > 0 ? score / topScore : 0;
  // Relative rank alone can't make something a "Strong match": it also needs
  // at least one real reason (trust labels like "Provisional data" don't count).
  const realReasons = reasons.filter(r => !PROVISIONAL_REASON.test(r)).length;
  const ranked = ratio >= 0.85 ? 3 : ratio >= 0.6 ? 2 : 1;
  const byReasons = realReasons === 0 ? 1 : realReasons === 1 ? Math.min(ranked, 2) : ranked;
  // A match that only shares the broad sector never reads as a strong one.
  const level = fit === "field" || fit === "weak" ? 1 : byReasons;
  const label = level === 3 ? t.arStrong : level === 2 ? t.arGood : t.arWorth;
  const tone =
    level === 3
      ? isDark ? "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" : "text-emerald-800 bg-emerald-50 border-emerald-300"
      : level === 2
        ? isDark ? "text-violet-200 bg-violet-500/10 border-violet-500/30" : "text-violet-800 bg-violet-50 border-violet-300"
        : isDark ? "text-zinc-300 bg-white/5 border-white/10" : "text-zinc-700 bg-zinc-50 border-zinc-300";

  return (
    <span
      title={`${score} · ${t.arMatchHint}`}
      className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${tone}`}
    >
      <span className="flex gap-0.5" aria-hidden="true">
        {[1, 2, 3].map(i => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full ${i <= level ? "bg-current" : "bg-current opacity-25"}`} />
        ))}
      </span>
      {label}
    </span>
  );
}

export default function AdvisorReport({
  userProfile,
  interests,
  goals,
  currentStage,
  language,
  theme,
  trackers,
  onTrackersChange
}: AdvisorReportProps) {
  const { recommendation, loading, error } = useEducationEngine(userProfile || null);
  const t = TRANSLATIONS[language];
  const isDark = theme !== "light";

  // The engine's scores are unbounded weighted sums, so a raw "SCORE: 35"
  // means nothing to a user. MatchBadge shows each result relative to the
  // best one in its own list instead.
  const topProfessionScore = Math.max(0, ...(recommendation?.professions.map(p => p.score) ?? []));
  const topInstitutionScore = Math.max(0, ...(recommendation?.institutions.map(i => i.score) ?? []));

  // The learning path's step list and its "add to tracker" button used to be
  // repeated here; My Path (just above on the dashboard) is now the one place
  // the steps live, so this report only explains *why* (audit 2026-09-28).

  // AI explanation layer: an optional, explicitly user-triggered narrative on top
  // of the rule-based engine result above. The engine's scored lists remain the
  // source of truth - this only ever adds a plain-language read of them, never
  // replaces them, and clearly discloses itself if Gemini couldn't be reached
  // (server.ts sets `isFallback` rather than silently serving invented content).
  const [aiState, setAiState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [aiData, setAiData] = useState<AiAdvisorResponse | null>(null);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);

  const requestAiExplanation = async () => {
    setAiState("loading");
    setAiErrorMessage(null);
    try {
      const res = await fetch("/api/gemini/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests,
          goals,
          currentStage: currentStage.replace("stage_", ""),
          language: LANGUAGE_NAMES[language] || "English"
        })
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setAiErrorMessage(
          res.status === 429
            ? t.arAiBusy
            : (body && body.message) || t.arAiUnreachable
        );
        setAiState("error");
        return;
      }

      setAiData(body as AiAdvisorResponse);
      setAiState("success");
    } catch {
      setAiErrorMessage(t.arAiUnreachable);
      setAiState("error");
    }
  };

  const tTextBody = isDark ? "text-zinc-200" : "text-black font-bold";
  const tTextMuted = isDark ? "text-zinc-300" : "text-black font-extrabold";

  return (
    <div className="card-premium-glow w-full p-6 relative overflow-hidden text-left">
      {/* Background soft lighting blobs */}
      <div className={`absolute -right-16 -top-16 h-36 w-36 rounded-full blur-3xl ${
        isDark ? "bg-violet-600/10" : "bg-violet-600/15"
      }`}></div>
      <div className={`absolute -left-16 -bottom-16 h-36 w-36 rounded-full blur-3xl ${
        isDark ? "bg-indigo-600/10" : "bg-indigo-600/15"
      }`}></div>

      <div className={`flex items-center justify-between border-b pb-4 mb-5 ${
        isDark ? "border-white/10" : "border-violet-950/10"
      }`}>
        <div className="flex items-center gap-2">
          <BrainCircuit className={`h-5.5 w-5.5 ${isDark ? "text-violet-300" : "text-violet-950"}`} />
          <h2 className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-violet-950 font-black"}`}>
            {t.arTitle}
          </h2>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium backdrop-blur-md ${
          isDark ? "bg-white/10 border border-white/10 text-violet-300" : "bg-violet-950/10 border border-violet-950/15 text-violet-950 font-bold"
        }`}>
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span>{t.arRuleBased}</span>
        </div>
      </div>

      {/* Consultation Input Scope Tags Box */}
      <div className={`rounded-xl p-3 border mb-5 flex flex-wrap items-center gap-2 text-xs ${
        isDark ? "bg-white/[0.01] border-white/5" : "bg-violet-50/50 border-purple-200"
      }`}>
        <span className={`font-medium mr-1 shrink-0 ${isDark ? "text-zinc-400" : "text-violet-950/70 font-bold"}`}>
          {t.arBasedOn}
        </span>
        <div className={`px-2 py-0.5 rounded border ${isDark ? "bg-white/5 border-white/5 text-zinc-300" : "bg-white border-purple-200 text-violet-950 font-extrabold"}`}>
          {t.arStage}: {t[STAGE_LABEL_KEY[currentStage] ?? currentStage] || currentStage.replace("stage_", "")}
        </div>
        {interests.length > 0 && (
          <div className={`px-2 py-0.5 rounded border max-w-xs truncate ${isDark ? "bg-white/5 border-white/5 text-zinc-300" : "bg-white border-purple-200 text-violet-950 font-extrabold"}`}>
            {t.arInterests}: {interests.map(i => t["interests_" + i] || i).join(", ")}
          </div>
        )}
        {goals.length > 0 && (
          <div className={`px-2 py-0.5 rounded border max-w-xs truncate ${isDark ? "bg-white/5 border-white/5 text-zinc-300" : "bg-white border-purple-200 text-violet-950 font-extrabold"}`}>
            {t.arFocus}: {goals.map(g => t[GOAL_LABEL_KEY[g.replace(/^goals_/, "")]] || g.replace(/^goals_/, "")).join(", ")}
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 text-center"
          >
            <div className="relative flex h-14 w-14 items-center justify-center">
              <div className={`absolute inset-0 rounded-full border-4 ${isDark ? "border-white/5" : "border-violet-950/5"}`}></div>
              <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin"></div>
              <BrainCircuit className="h-6 w-6 text-violet-500 animate-pulse" />
            </div>
            <p className={`mt-4 text-sm ${tTextMuted}`}>{t.arLoading}</p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-6"
          >
            <p className="text-sm text-red-400">{t.arError}</p>
          </motion.div>
        ) : recommendation ? (
          <motion.div
            key="advice-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Primary Path Focus */}
            <div className={`border-beam p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isDark ? "bg-violet-950/20 border-violet-800/30" : "bg-purple-100/60 border-purple-300"
            }`}>
              <div className="space-y-1">
                <span className={`text-xs font-medium ${isDark ? "text-violet-300" : "text-violet-800 font-bold"}`}>{t.arFocusLabel}</span>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-violet-950"}`}>
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  {recommendation.pathFocus}
                </h3>
              </div>
              <div className="sm:text-right max-w-[240px]">
                <span className={`text-xs font-medium ${isDark ? "text-zinc-400" : "text-zinc-600 font-bold"}`}>{t.arNextStep}</span>
                <p className={`text-sm leading-snug mt-1 ${isDark ? "text-zinc-200" : "text-black font-semibold"}`}>
                  {recommendation.nextBestStep}
                </p>
              </div>
            </div>

            {/* AI explanation layer: optional, on-demand narrative over the result above */}
            {FEATURES.aiExplanation && (
            <div className={`rounded-xl border p-4 ${isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-purple-200"}`}>
              {aiState === "idle" && (
                <button
                  onClick={requestAiExplanation}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold tracking-wide btn-primary btn-shine"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  {t.arExplainAi}
                </button>
              )}

              {aiState === "loading" && (
                <div className="flex items-center justify-center gap-2 py-2 text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-violet-500 animate-pulse" />
                  <span className={isDark ? "text-zinc-300" : "text-zinc-700"}>{t.arAiLoading}</span>
                </div>
              )}

              {aiState === "error" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-amber-500">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    <span>{aiErrorMessage}</span>
                  </div>
                  <button
                    onClick={requestAiExplanation}
                    className={`text-[11px] font-mono underline ${isDark ? "text-zinc-400 hover:text-zinc-200" : "text-violet-950/70 hover:text-violet-950"}`}
                  >
                    {t.arTryAgain}
                  </button>
                </div>
              )}

              {aiState === "success" && aiData && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                    <span className={`text-[11px] uppercase tracking-widest font-mono ${isDark ? "text-violet-400" : "text-violet-800 font-extrabold"}`}>
                      {t.arAiPerspective}{aiData.isFallback ? t.arAiGeneric : ""}
                    </span>
                  </div>

                  {aiData.isFallback && (
                    <div className={`flex items-start gap-2 rounded-lg border p-2.5 text-xs ${
                      isDark ? "bg-amber-500/10 border-amber-500/25 text-amber-300" : "bg-amber-50 border-amber-300 text-amber-800"
                    }`}>
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>
                        {t.arAiFallback}
                      </span>
                    </div>
                  )}

                  <h3 className={`text-base font-bold ${isDark ? "text-white" : "text-violet-950"}`}>{aiData.suggestedPathTitle}</h3>
                  <p className={`text-xs leading-relaxed ${tTextBody}`}>{aiData.welcomeMessage}</p>
                  <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>{aiData.explanation}</p>

                  {aiData.milestones?.length > 0 && (
                    <ol className="space-y-2 pt-1">
                      {aiData.milestones.map((m, idx) => (
                        <li key={m.id || idx} className={`p-2.5 rounded-lg border flex items-start gap-2.5 ${isDark ? "bg-white/[0.02] border-white/10" : "bg-purple-50/50 border-purple-200"}`}>
                          <Milestone className="h-3.5 w-3.5 mt-0.5 text-violet-500 shrink-0" />
                          <div className="min-w-0">
                            <div className={`font-bold text-[11px] ${isDark ? "text-violet-200" : "text-violet-950"}`}>{m.title}</div>
                            <p className={`text-xs mt-0.5 leading-snug ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>{m.description}</p>
                            {m.timeframe && (
                              <span className={`text-[11px] font-mono ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>{m.timeframe}</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}

                  {aiData.recommendedInstitutions?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {aiData.recommendedInstitutions.map((name, idx) => (
                        <span
                          key={idx}
                          className={`text-[11px] font-mono px-2 py-1 rounded-lg border ${isDark ? "bg-white/5 border-white/10 text-zinc-300" : "bg-purple-100/80 text-violet-950 border-purple-200"}`}
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {/* Shortlist: Professions */}
              <div className="space-y-3 flex flex-col">
                <div className={`text-sm font-semibold flex items-center gap-1.5 ${isDark ? "text-zinc-200" : "text-violet-950 font-bold"}`}>
                  <Briefcase className="h-4 w-4 text-violet-400" />
                  {t.arCareers}
                </div>
                {recommendation.professions.length > 0 ? recommendation.professions.map((rp, idx) => (
                  <div key={idx} className="card-premium-accent p-3.5 space-y-2 text-left h-full flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className={`font-bold text-sm ${isDark ? "text-violet-100" : "text-violet-950"}`}>
                          {localizedText(rp.profession.title, language)}
                        </span>
                        <MatchBadge score={rp.score} topScore={topProfessionScore} isDark={isDark} reasons={rp.matchReasons} t={t} fit={rp.fit} />
                      </div>
                      <div className={`text-xs mt-2 space-y-1 ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                        {rp.matchReasons.filter(r => !PROVISIONAL_REASON.test(r)).map((reason, i) => (
                          <div key={i} className="flex gap-1.5 items-start">
                            <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-amber-400 shrink-0" />
                            <span className="leading-snug">{reason}</span>
                          </div>
                        ))}
                        {rp.matchReasons.some(r => PROVISIONAL_REASON.test(r)) && (
                          <span
                            title={t.arProvisionalHint}
                            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border ${
                              isDark ? "text-amber-200 border-amber-400/30 bg-amber-400/10" : "text-amber-800 border-amber-300 bg-amber-50"
                            }`}
                          >
                            <CircleAlert className="h-3 w-3" aria-hidden="true" />
                            {t.arProvisional}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="pt-1">
                      <GoalButton item={{ kind: "profession", profession: rp.profession }} language={language} isDark={isDark} onDone={scrollToMyPath} />
                    </div>
                  </div>
                )) : <p className="text-[11px] opacity-60">{t.arNoCareers}</p>}
              </div>

              {/* Shortlist: Institutions */}
              <div className="space-y-3 flex flex-col">
                <div className={`text-sm font-semibold flex items-center gap-1.5 ${isDark ? "text-zinc-200" : "text-violet-950 font-bold"}`}>
                  <Landmark className="h-4 w-4 text-violet-400" />
                  {t.arStudy}
                </div>
                {recommendation.institutions.length > 0 ? recommendation.institutions.map((inst, idx) => (
                  <div key={idx} className="card-premium-accent p-3.5 space-y-2 text-left h-full flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className={`font-bold text-sm ${isDark ? "text-violet-100" : "text-violet-950"}`}>
                          {inst.institution.title}
                        </span>
                        <MatchBadge score={inst.score} topScore={topInstitutionScore} isDark={isDark} reasons={inst.matchReasons} t={t} />
                      </div>
                      <div className={`text-xs mt-2 space-y-1 ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                        {inst.matchReasons.filter(r => !PROVISIONAL_REASON.test(r)).map((reason, i) => (
                          <div key={i} className="flex gap-1.5 items-start">
                            <Lightbulb className="h-3.5 w-3.5 mt-0.5 text-amber-400 shrink-0" />
                            <span className="leading-snug">{reason}</span>
                          </div>
                        ))}
                        {inst.matchReasons.some(r => PROVISIONAL_REASON.test(r)) && (
                          <span
                            title={t.arProvisionalHint}
                            className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border ${
                              isDark ? "text-amber-200 border-amber-400/30 bg-amber-400/10" : "text-amber-800 border-amber-300 bg-amber-50"
                            }`}
                          >
                            <CircleAlert className="h-3 w-3" aria-hidden="true" />
                            {t.arProvisional}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="pt-1">
                      <GoalButton item={{ kind: "institution", institution: inst.institution }} language={language} isDark={isDark} onDone={scrollToMyPath} />
                    </div>
                  </div>
                )) : <p className="text-[11px] opacity-60">{t.arNoInstitutions}</p>}
              </div>
            </div>

            {/* Shortlist: Resources */}
            <div className={`pt-4 border-t space-y-3 ${isDark ? "border-white/10" : "border-violet-950/10"}`}>
              <div className={`text-sm font-semibold ${isDark ? "text-zinc-200" : "text-violet-950 font-bold"}`}>
                {t.arResources}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {recommendation.resources.length > 0 ? recommendation.resources.map((rawRes, idx) => (
                  <a
                    key={idx}
                    href={rawRes.resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block p-3 rounded-lg border transition ${
                      isDark ? "bg-white/[0.02] border-white/10 hover:bg-white/[0.05]" : "bg-white border-purple-200 hover:border-violet-500 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`font-semibold text-sm leading-snug ${isDark ? "text-violet-200" : "text-violet-900"}`}>
                        {localizedText(rawRes.resource.title, language)}
                      </span>
                      <ExternalLink className="h-3 w-3 opacity-50 shrink-0" />
                    </div>
                    <div className={`text-xs mt-1 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                      {rawRes.matchReasons.find(r => !PROVISIONAL_REASON.test(r)) || t.arGeneral}
                    </div>
                  </a>
                )) : null}
              </div>
            </div>

          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
