import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  BrainCircuit,
  Landmark,
  ShieldCheck,
  Briefcase,
  ExternalLink,
  Lightbulb,
  Route,
  CheckCircle2,
  Wand2,
  AlertTriangle,
  Milestone,
  ListPlus
} from "lucide-react";
import { LanguageCode, LearningPath, TrackerGoal, UserProfile } from "../types";
import { TRANSLATIONS } from "../data";
import { useEducationEngine } from "../engine/useEducationEngine";
import { DataRepository } from "../data/Repository";
import { localizedText } from "../lib/localized";
import { buildPathTrackerGoal, findPathTrackerGoal } from "../lib/pathTracker";

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

  // Learning paths are catalog-wide (not profile-scoped), so they're fetched
  // once and matched client-side against the engine's top profession - no
  // need to re-run this alongside useEducationEngine.
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  useEffect(() => {
    let active = true;
    DataRepository.getLearningPaths().then(paths => {
      if (active) setLearningPaths(paths);
    });
    return () => {
      active = false;
    };
  }, []);

  const topProfessionId = recommendation?.professions[0]?.profession.id;
  const matchedPath = topProfessionId
    ? learningPaths.find(p => p.targetProfessionId === topProfessionId)
    : undefined;

  // Bridge to the Life Tracker (Sofiia's review 2026-09-13: the tracker felt
  // disconnected from the rest of the product - this is the most direct tie,
  // since the path's steps are already structured and ordered).
  const matchedPathTitleText = matchedPath ? localizedText(matchedPath.title, language) : "";
  const isPathInTracker = !!(matchedPath && findPathTrackerGoal(trackers, matchedPath, language));

  const addPathToTracker = () => {
    if (!matchedPath || !onTrackersChange || isPathInTracker) return;
    onTrackersChange([buildPathTrackerGoal(matchedPath, language), ...(trackers || [])]);
  };

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
            ? "Too many requests right now. Please try again in a few minutes."
            : (body && body.message) || "The AI advisor couldn't be reached. Please try again shortly."
        );
        setAiState("error");
        return;
      }

      setAiData(body as AiAdvisorResponse);
      setAiState("success");
    } catch {
      setAiErrorMessage("The AI advisor couldn't be reached. Please try again shortly.");
      setAiState("error");
    }
  };

  const tTextBody = isDark ? "text-zinc-200" : "text-black font-bold";
  const tTextMuted = isDark ? "text-zinc-300 animate-pulse" : "text-black font-extrabold";

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
          <h2 className={`text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-violet-950 font-black"}`}>
            Education Path Engine
          </h2>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] backdrop-blur-md ${
          isDark ? "bg-white/10 border border-white/10 text-violet-300" : "bg-violet-950/10 border border-violet-950/15 text-violet-950 font-bold"
        }`}>
          <Sparkles className="h-3 w-3 text-yellow-500 animate-pulse" />
          <span>RULE-BASED SOLVER</span>
        </div>
      </div>

      {/* Consultation Input Scope Tags Box */}
      <div className={`rounded-xl p-3 border mb-5 flex flex-wrap items-center gap-2 text-[10px] ${
        isDark ? "bg-white/[0.01] border-white/5" : "bg-violet-50/50 border-purple-200"
      }`}>
        <span className={`font-mono uppercase tracking-wider text-[9px] mr-1 shrink-0 ${isDark ? "text-zinc-400" : "text-violet-950/60 font-black"}`}>
          {userProfile?.isGuest ? "Guest Onboarding Parameters:" : "Personalized Profile Matrix:"}
        </span>
        <div className={`px-2 py-0.5 rounded border ${isDark ? "bg-white/5 border-white/5 text-zinc-300" : "bg-white border-purple-200 text-violet-950 font-extrabold"}`}>
          Stage: {currentStage.replace("stage_", "")}
        </div>
        {interests.length > 0 && (
          <div className={`px-2 py-0.5 rounded border max-w-xs truncate ${isDark ? "bg-white/5 border-white/5 text-zinc-300" : "bg-white border-purple-200 text-violet-950 font-extrabold"}`}>
            Interests: {interests.join(", ")}
          </div>
        )}
        {goals.length > 0 && (
          <div className={`px-2 py-0.5 rounded border max-w-xs truncate ${isDark ? "bg-white/5 border-white/5 text-zinc-300" : "bg-white border-purple-200 text-violet-950 font-extrabold"}`}>
            Focus: {goals.join(", ").replace(/goals_/g, "")}
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
            <p className={`mt-4 font-mono text-xs ${tTextMuted}`}>Computing deterministic paths...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-6"
          >
            <p className="text-sm text-red-500">Engine Error: {error}</p>
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
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isDark ? "bg-violet-950/20 border-violet-800/30" : "bg-purple-100/60 border-purple-300"
            }`}>
              <div className="space-y-1">
                <span className={`text-[9px] uppercase tracking-widest font-mono ${isDark ? "text-violet-400" : "text-violet-800 font-extrabold"}`}>Recommended Path Focus</span>
                <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-violet-950"}`}>
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  {recommendation.pathFocus}
                </h3>
              </div>
              <div className="sm:text-right max-w-[200px]">
                <span className={`text-[9px] uppercase tracking-widest font-mono ${isDark ? "text-zinc-400" : "text-zinc-600 font-bold"}`}>Next Best Step</span>
                <p className={`text-[11px] leading-snug mt-1 ${isDark ? "text-zinc-300" : "text-black font-semibold"}`}>
                  {recommendation.nextBestStep}
                </p>
              </div>
            </div>

            {/* AI explanation layer: optional, on-demand narrative over the result above */}
            <div className={`rounded-xl border p-4 ${isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-purple-200"}`}>
              {aiState === "idle" && (
                <button
                  onClick={requestAiExplanation}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold tracking-wide btn-primary"
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  Explain my recommendation with AI
                </button>
              )}

              {aiState === "loading" && (
                <div className="flex items-center justify-center gap-2 py-2 text-xs">
                  <Sparkles className="h-3.5 w-3.5 text-violet-500 animate-pulse" />
                  <span className={isDark ? "text-zinc-300" : "text-zinc-700"}>Asking the AI advisor for a plain-language explanation...</span>
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
                    className={`text-[11px] font-mono underline ${isDark ? "text-zinc-400 hover:text-zinc-200" : "text-violet-950/60 hover:text-violet-950"}`}
                  >
                    Try again
                  </button>
                </div>
              )}

              {aiState === "success" && aiData && (
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                    <span className={`text-[9px] uppercase tracking-widest font-mono ${isDark ? "text-violet-400" : "text-violet-800 font-extrabold"}`}>
                      AI Perspective{aiData.isFallback ? " — Generic Overview" : ""}
                    </span>
                  </div>

                  {aiData.isFallback && (
                    <div className={`flex items-start gap-2 rounded-lg border p-2.5 text-[10px] ${
                      isDark ? "bg-amber-500/10 border-amber-500/25 text-amber-300" : "bg-amber-50 border-amber-300 text-amber-800"
                    }`}>
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>
                        The AI advisor couldn't be reached just now, so this is a generic overview rather than a
                        response tailored to your profile. The scored results above are unaffected.
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
                            <p className={`text-[10px] mt-0.5 leading-snug ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>{m.description}</p>
                            {m.timeframe && (
                              <span className={`text-[9px] font-mono ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>{m.timeframe}</span>
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
                          className={`text-[9.5px] font-mono px-2 py-1 rounded-lg border ${isDark ? "bg-white/5 border-white/10 text-zinc-300" : "bg-purple-100/80 text-violet-950 border-purple-200"}`}
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Shortlist: Professions */}
              <div className="space-y-3 flex flex-col">
                <div className={`text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 ${isDark ? "text-white/40" : "text-violet-950/60 font-black"}`}>
                  <Briefcase className="h-3.5 w-3.5" />
                  Relevant Careers
                </div>
                {recommendation.professions.length > 0 ? recommendation.professions.map((rp, idx) => (
                  <div key={idx} className="card-premium-accent p-3.5 space-y-2 text-left h-full flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className={`font-black text-[12px] truncate ${isDark ? "text-violet-200" : "text-violet-950"}`}>
                          {localizedText(rp.profession.title, language)}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono border ${isDark ? "bg-white/5 border-white/10 text-emerald-400" : "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"}`}>
                          SCORE: {rp.score}
                        </span>
                      </div>
                      <div className={`text-[10px] mt-1.5 space-y-1 ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                        {rp.matchReasons.map((reason, i) => (
                          <div key={i} className="flex gap-1.5 items-start">
                            <Lightbulb className="h-3 w-3 mt-0.5 text-amber-500 shrink-0" />
                            <span className="leading-snug">{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )) : <p className="text-[11px] opacity-60">No distinct career matches.</p>}
              </div>

              {/* Shortlist: Institutions */}
              <div className="space-y-3 flex flex-col">
                <div className={`text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 ${isDark ? "text-white/40" : "text-violet-950/60 font-black"}`}>
                  <Landmark className="h-3.5 w-3.5" />
                  Suggested Institutions
                </div>
                {recommendation.institutions.length > 0 ? recommendation.institutions.map((inst, idx) => (
                  <div key={idx} className="card-premium-accent p-3.5 space-y-2 text-left h-full flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className={`font-black text-[12px] ${isDark ? "text-violet-200" : "text-violet-950"}`}>
                          {inst.institution.title}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono border ${isDark ? "bg-white/5 border-white/10 text-emerald-400" : "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"}`}>
                          SCORE: {inst.score}
                        </span>
                      </div>
                      <div className={`text-[10px] mt-1.5 space-y-1 ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                        {inst.matchReasons.map((reason, i) => (
                          <div key={i} className="flex gap-1.5 items-start">
                            <Lightbulb className="h-3 w-3 mt-0.5 text-amber-500 shrink-0" />
                            <span className="leading-snug">{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )) : <p className="text-[11px] opacity-60">No distinct institutions found.</p>}
              </div>
            </div>

            {/* Matched learning path: concrete ordered steps toward the top-scored profession */}
            {matchedPath && matchedPath.steps.length > 0 && (
              <div className={`pt-4 border-t space-y-3 ${isDark ? "border-white/10" : "border-violet-950/10"}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className={`text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 ${isDark ? "text-white/40" : "text-violet-950/60 font-black"}`}>
                    <Route className="h-3.5 w-3.5" />
                    Your Path to Becoming {matchedPathTitleText}
                  </div>
                  {onTrackersChange && (
                    <button
                      onClick={addPathToTracker}
                      disabled={isPathInTracker}
                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition ${
                        isPathInTracker
                          ? (isDark ? "text-emerald-400 bg-emerald-500/10 cursor-default" : "text-emerald-700 bg-emerald-50 cursor-default")
                          : (isDark ? "text-violet-300 bg-white/5 hover:bg-white/10 cursor-pointer" : "text-violet-700 bg-violet-50 hover:bg-violet-100 cursor-pointer")
                      }`}
                    >
                      {isPathInTracker ? <CheckCircle2 className="h-3 w-3" /> : <ListPlus className="h-3 w-3" />}
                      {isPathInTracker ? t.advisorPathInTracker : t.advisorAddPathToTracker}
                    </button>
                  )}
                </div>
                <ol className="space-y-2">
                  {matchedPath.steps.map((step, idx) => (
                    <li
                      key={step.id}
                      className={`p-3 rounded-lg border flex items-start gap-3 ${
                        isDark ? "bg-white/[0.02] border-white/10" : "bg-white border-purple-200"
                      }`}
                    >
                      <div className={`shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                        isDark ? "bg-violet-500/20 text-violet-300" : "bg-violet-100 text-violet-800"
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className={`font-bold text-[12px] ${isDark ? "text-violet-200" : "text-violet-950"}`}>
                          {localizedText(step.title, language)}
                        </div>
                        {localizedText(step.description, language) && (
                          <p className={`text-[10px] mt-1 leading-snug ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                            {localizedText(step.description, language)}
                          </p>
                        )}
                        {localizedText(step.timeframe, language) && (
                          <div className={`text-[9px] mt-1 font-mono flex items-center gap-1 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>
                            <CheckCircle2 className="h-3 w-3" />
                            {localizedText(step.timeframe, language)}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Shortlist: Resources */}
            <div className={`pt-4 border-t space-y-3 ${isDark ? "border-white/10" : "border-violet-950/10"}`}>
              <div className={`text-xs font-mono uppercase tracking-wider ${isDark ? "text-white/40" : "text-violet-950/60 font-black"}`}>
                Actionable Resources
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
                      <span className={`font-bold text-[10px] truncate ${isDark ? "text-violet-300" : "text-violet-900"}`}>
                        {localizedText(rawRes.resource.title, language)}
                      </span>
                      <ExternalLink className="h-3 w-3 opacity-50 shrink-0" />
                    </div>
                    <div className={`text-[9px] ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                      {rawRes.matchReasons[0] || "General recommendation"}
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
