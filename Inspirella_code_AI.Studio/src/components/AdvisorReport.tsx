import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, BrainCircuit, Landmark, ShieldCheck, Briefcase, ExternalLink, Lightbulb, Route, CheckCircle2 } from "lucide-react";
import { LanguageCode, LearningPath, UserProfile } from "../types";
import { TRANSLATIONS } from "../data";
import { useEducationEngine } from "../engine/useEducationEngine";
import { DataRepository } from "../data/Repository";

interface AdvisorReportProps {
  userProfile?: UserProfile | null;
  interests: string[];
  goals: string[];
  currentStage: string;
  language: LanguageCode;
  theme?: string;
}

export default function AdvisorReport({
  userProfile,
  interests,
  goals,
  currentStage,
  language,
  theme
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
                          {typeof rp.profession.title === "string" ? rp.profession.title : (rp.profession.title[language] || rp.profession.title["en"])}
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
                <div className={`text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 ${isDark ? "text-white/40" : "text-violet-950/60 font-black"}`}>
                  <Route className="h-3.5 w-3.5" />
                  Your Path to Becoming {typeof matchedPath.title === "string" ? matchedPath.title : (matchedPath.title[language] || matchedPath.title["en"])}
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
                          {step.title[language] || step.title["en"]}
                        </div>
                        {step.description && (step.description[language] || step.description["en"]) && (
                          <p className={`text-[10px] mt-1 leading-snug ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                            {step.description[language] || step.description["en"]}
                          </p>
                        )}
                        {step.timeframe && (step.timeframe[language] || step.timeframe["en"]) && (
                          <div className={`text-[9px] mt-1 font-mono flex items-center gap-1 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>
                            <CheckCircle2 className="h-3 w-3" />
                            {step.timeframe[language] || step.timeframe["en"]}
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
                        {typeof rawRes.resource.title === "string" ? rawRes.resource.title : (rawRes.resource.title[language] || rawRes.resource.title["en"])}
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
