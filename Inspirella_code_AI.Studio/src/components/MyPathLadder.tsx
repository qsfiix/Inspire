import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Circle, ListPlus, Plus, Sparkles, Trophy } from "lucide-react";
import { LanguageCode, LearningPath, TrackerChecklistItem, TrackerGoal, UserProfile } from "../types";
import { useEducationEngine } from "../engine/useEducationEngine";
import { DataRepository } from "../data/Repository";
import { localizedText } from "../lib/localized";
import { buildPathTrackerGoal, findPathTrackerGoal } from "../lib/pathTracker";

interface MyPathLadderProps {
  userProfile?: UserProfile | null;
  language: LanguageCode;
  isDark: boolean;
  trackers?: TrackerGoal[];
  onTrackersChange?: (updated: TrackerGoal[]) => void;
  onExploreAlternatives?: () => void;
}

/** Layout space the ladder is designed in; HTML nodes and the SVG connector
 *  share these coordinates so they always line up regardless of rendered width. */
const VB_W = 1000;
const VB_H = 460;
const TOP_MARGIN = 80;
const STEP_X_START = 90;
const STEP_X_END = 780;
const STEP_Y_START = 330 + TOP_MARGIN;
const STEP_Y_END = 110 + TOP_MARGIN;
const GOAL_X = 920;
const GOAL_Y = 55 + TOP_MARGIN;
const GROUND_Y = STEP_Y_START + 40;
const TREAD_H = 18;

/** Purely decorative ambient stars behind the ladder. */
const STAR_DOTS = [
  { x: 8, y: 15, s: 3, o: 0.5 },
  { x: 18, y: 55, s: 2, o: 0.35 },
  { x: 30, y: 20, s: 2, o: 0.4 },
  { x: 45, y: 68, s: 3, o: 0.3 },
  { x: 58, y: 12, s: 2, o: 0.45 },
  { x: 70, y: 45, s: 2, o: 0.3 },
  { x: 83, y: 22, s: 3, o: 0.4 },
  { x: 92, y: 60, s: 2, o: 0.35 },
  { x: 12, y: 80, s: 2, o: 0.3 },
  { x: 65, y: 85, s: 2, o: 0.3 }
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type Selection =
  | { type: "step"; index: number }
  | { type: "goal" }
  | { type: "alt"; index: number }
  | null;

export default function MyPathLadder({
  userProfile,
  language,
  isDark,
  trackers,
  onTrackersChange,
  onExploreAlternatives
}: MyPathLadderProps) {
  const { recommendation, loading } = useEducationEngine(userProfile || null);

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

  const [selected, setSelected] = useState<Selection>(null);
  const [newTaskText, setNewTaskText] = useState("");
  useEffect(() => {
    setNewTaskText("");
  }, [selected]);

  const rankedProfessions = recommendation?.professions || [];

  // Not every profession has a concrete learning_path yet (currently ~17 of
  // 75+). Rather than only ever looking at the #1 match - which would leave
  // most real profiles with an empty ladder - take the highest-ranked one
  // that actually has a path to walk. The #1 match still isn't lost: if it
  // has no path, it surfaces below as an "alternative" instead.
  const mainIndex = useMemo(() => {
    return rankedProfessions.findIndex(rp =>
      learningPaths.some(p => p.targetProfessionId === rp.profession.id)
    );
  }, [rankedProfessions, learningPaths]);

  const mainPath = useMemo(() => {
    const id = mainIndex >= 0 ? rankedProfessions[mainIndex]?.profession.id : undefined;
    return id ? learningPaths.find(p => p.targetProfessionId === id) : undefined;
  }, [mainIndex, rankedProfessions, learningPaths]);

  const altCandidates = useMemo(() => {
    return rankedProfessions
      .filter((_, i) => i !== mainIndex)
      .slice(0, 2)
      .map(rp => ({
        profession: rp.profession,
        matchReason: rp.matchReasons[0],
        path: learningPaths.find(p => p.targetProfessionId === rp.profession.id)
      }));
  }, [rankedProfessions, mainIndex, learningPaths]);

  if (loading) return null;

  const headerIcon = <Sparkles className={`h-4.5 w-4.5 ${isDark ? "text-violet-300" : "text-violet-800"}`} />;

  // Honest empty state: no fabricated path when the profile hasn't produced
  // one yet - just an invitation, not silence and not a placeholder.
  if (!mainPath || mainPath.steps.length === 0) {
    return (
      <div className="card-premium p-6 relative overflow-hidden text-left flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          {headerIcon}
          <div>
            <h2 className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-violet-950"}`}>My Path</h2>
            <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
              Set your goals, and your path will appear here.
            </p>
          </div>
        </div>
        {onExploreAlternatives && (
          <button
            onClick={onExploreAlternatives}
            className={`shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg transition ${
              isDark ? "text-violet-300 bg-white/5 hover:bg-white/10" : "text-violet-700 bg-violet-50 hover:bg-violet-100"
            }`}
          >
            Explore paths
          </button>
        )}
      </div>
    );
  }

  const steps = mainPath.steps;
  const goal = findPathTrackerGoal(trackers, mainPath, language);

  // Sub-tasks per step, resolved per step rather than with one global flag -
  // a goal created before this feature has one flat, untagged item per step
  // (matched positionally); once a step gets its first extra sub-task added,
  // addSubtask() tags that legacy item too, so it keeps showing up alongside
  // the new ones instead of disappearing.
  const itemsForStep = (idx: number): TrackerChecklistItem[] => {
    if (!goal) return [];
    const stepId = steps[idx].id;
    const tagged = goal.items.filter(i => i.stepId === stepId);
    if (tagged.length > 0) return tagged;
    const positional = goal.items[idx];
    return positional && !positional.stepId ? [positional] : [];
  };
  const stepDone = (idx: number) => {
    const items = itemsForStep(idx);
    return items.length > 0 && items.every(i => i.completed);
  };

  const firstOpenIndex = steps.findIndex((_, idx) => !stepDone(idx));
  const allDone = !!goal && firstOpenIndex === -1;
  const currentStepIndex = allDone ? steps.length - 1 : Math.max(firstOpenIndex, 0);

  const spacing = steps.length > 1 ? (STEP_X_END - STEP_X_START) / (steps.length - 1) : 220;
  const treadW = clamp(spacing * 0.78, 60, 130);
  const riserW = clamp(spacing * 0.3, 18, 50);

  const stepPos = (idx: number) => ({
    x: steps.length === 1 ? STEP_X_START : STEP_X_START + (idx * (STEP_X_END - STEP_X_START)) / (steps.length - 1),
    y: steps.length === 1 ? STEP_Y_START : STEP_Y_START - (idx * (STEP_Y_START - STEP_Y_END)) / (steps.length - 1)
  });

  const personPos = allDone ? { x: GOAL_X, y: GOAL_Y } : stepPos(currentStepIndex);

  const altPositions = altCandidates.map((_, i) => {
    const anchor = stepPos(currentStepIndex);
    const raw = i === 0 ? { x: anchor.x + 90, y: anchor.y + 85 } : { x: anchor.x - 90, y: anchor.y - 85 };
    return { x: clamp(raw.x, 50, VB_W - 50), y: clamp(raw.y, TOP_MARGIN + 30, VB_H - 30) };
  });

  const addToTracker = () => {
    if (!onTrackersChange || goal) return;
    onTrackersChange([buildPathTrackerGoal(mainPath, language), ...(trackers || [])]);
  };

  const toggleItem = (itemId: string) => {
    if (!goal || !onTrackersChange || !trackers) return;
    const updatedItems = goal.items.map(it => (it.id === itemId ? { ...it, completed: !it.completed } : it));
    const updatedGoal: TrackerGoal = {
      ...goal,
      items: updatedItems,
      progress: Math.round((updatedItems.filter(i => i.completed).length / updatedItems.length) * 100)
    };
    onTrackersChange(trackers.map(g => (g.id === goal.id ? updatedGoal : g)));
  };

  const addSubtask = (stepIdx: number, text: string) => {
    if (!goal || !onTrackersChange || !trackers || !text.trim()) return;
    const stepId = steps[stepIdx].id;
    const newItem: TrackerChecklistItem = {
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false,
      frequency: "weekly",
      stepId
    };
    // Tag this step's untagged legacy item (if any) so it keeps showing up
    // alongside the new sub-task instead of falling out of itemsForStep().
    const migratedExisting = goal.items.map((it, i) => (i === stepIdx && !it.stepId ? { ...it, stepId } : it));
    const updatedItems = [...migratedExisting, newItem];
    const updatedGoal: TrackerGoal = {
      ...goal,
      items: updatedItems,
      progress: Math.round((updatedItems.filter(i => i.completed).length / updatedItems.length) * 100)
    };
    onTrackersChange(trackers.map(g => (g.id === goal.id ? updatedGoal : g)));
    setNewTaskText("");
  };

  const mutedText = isDark ? "#a39fc4" : "#5F5E5A";

  const treadFill = (state: "done" | "current" | "upcoming") =>
    state === "done"
      ? "linear-gradient(180deg, rgba(99,153,34,0.75), rgba(59,109,17,0.55))"
      : state === "current"
      ? "linear-gradient(180deg, rgba(250,199,117,0.85), rgba(186,117,23,0.55))"
      : "linear-gradient(180deg, rgba(139,126,242,0.65), rgba(83,74,183,0.35))";

  const riserFill = (state: "done" | "current" | "upcoming") =>
    state === "done" ? "rgba(59,109,17,0.4)" : state === "current" ? "rgba(186,117,23,0.4)" : "rgba(83,74,183,0.28)";

  return (
    <div className="card-premium p-6 relative overflow-hidden text-left">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          {headerIcon}
          <h2 className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-violet-950"}`}>My Path</h2>
        </div>
        {!goal && onTrackersChange && (
          <button
            onClick={addToTracker}
            className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition ${
              isDark ? "text-violet-300 bg-white/5 hover:bg-white/10" : "text-violet-700 bg-violet-50 hover:bg-violet-100"
            }`}
          >
            <ListPlus className="h-3 w-3" />
            Start tracking this path
          </button>
        )}
      </div>

      <div className="relative w-full max-w-[820px] mx-auto" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
        {/* Ambient purple-to-black backdrop, matching the site's glow language */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            background: isDark
              ? "linear-gradient(135deg, #241246 0%, #0d0a1c 55%, #060409 100%)"
              : "linear-gradient(135deg, #ede9fe 0%, #f7f5fd 55%, #ffffff 100%)"
          }}
        >
          <div
            className="absolute -top-10 -right-6 h-44 w-44 rounded-full blur-3xl"
            style={{ background: isDark ? "rgba(139,92,246,0.28)" : "rgba(139,92,246,0.16)" }}
          />
          <div
            className="absolute bottom-0 left-6 h-36 w-36 rounded-full blur-3xl"
            style={{ background: "rgba(250,199,117,0.10)" }}
          />
          {isDark &&
            STAR_DOTS.map((d, i) => (
              <span
                key={i}
                className="absolute rounded-full bg-white"
                style={{ left: `${d.x}%`, top: `${d.y}%`, width: d.s, height: d.s, opacity: d.o }}
              />
            ))}
        </div>

        {/* The staircase itself: a tread + riser per step, ascending from the ground to the goal landing */}
        {steps.map((step, idx) => {
          const pos = stepPos(idx);
          const prevY = idx === 0 ? GROUND_Y : stepPos(idx - 1).y;
          const state: "done" | "current" | "upcoming" = stepDone(idx) ? "done" : idx === currentStepIndex ? "current" : "upcoming";
          const leftX = pos.x - treadW / 2;
          return (
            <div key={`stair-${step.id}`}>
              <div
                className="absolute rounded-t-md"
                style={{
                  left: `${(leftX / VB_W) * 100}%`,
                  top: `${(pos.y / VB_H) * 100}%`,
                  width: `${(treadW / VB_W) * 100}%`,
                  height: `${(TREAD_H / VB_H) * 100}%`,
                  background: treadFill(state),
                  boxShadow: state === "current" ? "0 0 16px rgba(250,199,117,0.4)" : "none"
                }}
              />
              <div
                className="absolute"
                style={{
                  left: `${(leftX / VB_W) * 100}%`,
                  top: `${(pos.y / VB_H) * 100}%`,
                  width: `${(riserW / VB_W) * 100}%`,
                  height: `${((prevY - pos.y) / VB_H) * 100}%`,
                  background: riserFill(state)
                }}
              />
            </div>
          );
        })}

        {/* Small to-do markers sitting between the steps */}
        {steps.map((step, idx) => {
          const pos = stepPos(idx);
          const prevY = idx === 0 ? GROUND_Y : stepPos(idx - 1).y;
          const leftX = pos.x - treadW / 2;
          const items = itemsForStep(idx);
          const doneCount = items.filter(i => i.completed).length;
          const badgeX = leftX + riserW / 2;
          const badgeY = (pos.y + prevY) / 2;
          const badgeColor = items.length === 0 ? mutedText : doneCount === items.length ? "#a3d977" : "#FAC775";
          return (
            <button
              key={`todo-${step.id}`}
              onClick={() => setSelected({ type: "step", index: idx })}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-full border transition hover:scale-110"
              style={{
                left: `${(badgeX / VB_W) * 100}%`,
                top: `${(badgeY / VB_H) * 100}%`,
                width: 20,
                height: 20,
                background: "rgba(6,4,10,0.55)",
                borderColor: badgeColor,
                color: badgeColor
              }}
              title="Small tasks for this step"
            >
              <span className="text-[8px] font-mono font-bold">{items.length > 0 ? `${doneCount}/${items.length}` : "+"}</span>
            </button>
          );
        })}

        {/* Step labels, standing above their tread like a sign post */}
        {steps.map((step, idx) => {
          const pos = stepPos(idx);
          const done = stepDone(idx);
          const isCurrent = !allDone && idx === currentStepIndex;
          const minWidth = Math.min(150, 76 + idx * 11);
          return (
            <button
              key={step.id}
              onClick={() => setSelected({ type: "step", index: idx })}
              className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center"
              style={{ left: `${(pos.x / VB_W) * 100}%`, top: `${(pos.y / VB_H) * 100}%`, paddingBottom: TREAD_H + 6 }}
            >
              <div
                className="rounded-lg px-2.5 py-1.5 border backdrop-blur-sm transition"
                style={{
                  minWidth,
                  maxWidth: 170,
                  background: done
                    ? "linear-gradient(135deg, rgba(99,153,34,0.4), rgba(99,153,34,0.15))"
                    : isCurrent
                    ? "linear-gradient(135deg, rgba(250,199,117,0.4), rgba(250,199,117,0.14))"
                    : "linear-gradient(135deg, rgba(139,126,242,0.32), rgba(83,74,183,0.12))",
                  borderColor: done ? "#639922" : isCurrent ? "#FAC775" : "rgba(175,169,236,0.45)",
                  boxShadow: isCurrent
                    ? "0 0 20px rgba(250,199,117,0.35)"
                    : done
                    ? "0 0 14px rgba(99,153,34,0.25)"
                    : "none"
                }}
              >
                <span
                  className="flex items-center gap-1 text-[10.5px] font-semibold leading-snug"
                  style={{ color: done ? "#d5efb0" : isCurrent ? "#FAEEDA" : isDark ? "#ece9fb" : "#3C3489" }}
                >
                  {done && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                  <span className="truncate">{localizedText(step.title, language)}</span>
                </span>
              </div>
            </button>
          );
        })}

        {!allDone && (
          <motion.div
            className="absolute -translate-x-1/2 -translate-y-full pointer-events-none flex flex-col items-center"
            style={{ left: `${(personPos.x / VB_W) * 100}%`, top: `${(personPos.y / VB_H) * 100}%`, paddingBottom: TREAD_H + 4 }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <img src="/logo-mark.png" alt="" className="h-11 w-11 drop-shadow-[0_0_10px_rgba(250,199,117,0.75)]" />
            <span className="block text-center text-[9.5px] font-mono font-bold text-amber-400 mt-0.5 whitespace-nowrap">
              you are here
            </span>
          </motion.div>
        )}

        {/* Goal landing at the top of the staircase */}
        {(() => {
          const prevY = stepPos(steps.length - 1).y;
          const landingW = treadW + 50;
          const landingH = TREAD_H + 6;
          const leftX = GOAL_X - landingW / 2;
          return (
            <div key="goal-stair">
              <div
                className="absolute rounded-t-md"
                style={{
                  left: `${(leftX / VB_W) * 100}%`,
                  top: `${(GOAL_Y / VB_H) * 100}%`,
                  width: `${(landingW / VB_W) * 100}%`,
                  height: `${(landingH / VB_H) * 100}%`,
                  background: allDone
                    ? "linear-gradient(180deg, rgba(250,199,117,0.9), rgba(186,117,23,0.6))"
                    : "linear-gradient(180deg, rgba(240,153,123,0.7), rgba(180,90,55,0.45))",
                  boxShadow: allDone ? "0 0 20px rgba(250,199,117,0.45)" : "0 0 14px rgba(240,153,123,0.25)"
                }}
              />
              <div
                className="absolute"
                style={{
                  left: `${(leftX / VB_W) * 100}%`,
                  top: `${(GOAL_Y / VB_H) * 100}%`,
                  width: `${(riserW / VB_W) * 100}%`,
                  height: `${((prevY - GOAL_Y) / VB_H) * 100}%`,
                  background: allDone ? "rgba(186,117,23,0.4)" : "rgba(180,90,55,0.3)"
                }}
              />
            </div>
          );
        })()}

        <button
          onClick={() => setSelected({ type: "goal" })}
          className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center gap-1.5"
          style={{ left: `${(GOAL_X / VB_W) * 100}%`, top: `${(GOAL_Y / VB_H) * 100}%`, paddingBottom: TREAD_H + 10 }}
        >
          <span
            className="flex items-center justify-center rounded-full"
            style={{
              width: 46,
              height: 46,
              border: `2.5px solid ${allDone ? "#FAC775" : "#F0997B"}`,
              background: "rgba(0,0,0,0.25)",
              boxShadow: `0 0 18px ${allDone ? "rgba(250,199,117,0.4)" : "rgba(240,153,123,0.3)"}`
            }}
          >
            <Trophy className="h-5.5 w-5.5" style={{ color: allDone ? "#FAC775" : "#F0997B" }} />
          </span>
          <span className="text-[10.5px] font-mono font-bold whitespace-nowrap max-w-[140px] truncate" style={{ color: "#F0997B" }}>
            {localizedText(mainPath.title, language)}
          </span>
        </button>

        {altCandidates.map((alt, i) => {
          const pos = altPositions[i];
          return (
            <button
              key={i}
              onClick={() => setSelected({ type: "alt", index: i })}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition"
              style={{ left: `${(pos.x / VB_W) * 100}%`, top: `${(pos.y / VB_H) * 100}%` }}
            >
              <Circle className="h-3.5 w-3.5" style={{ color: mutedText }} />
              <span className="text-[9px] font-mono whitespace-nowrap max-w-[90px] truncate" style={{ color: mutedText }}>
                {localizedText(alt.profession.title, language)}
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={JSON.stringify(selected)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className={`mt-4 rounded-xl border p-4 ${isDark ? "bg-white/[0.03] border-white/10" : "bg-white border-purple-200"}`}
          >
            {selected.type === "step" && (() => {
              const idx = selected.index;
              const step = steps[idx];
              const items = itemsForStep(idx);
              return (
                <div className="space-y-2">
                  <div className={`font-bold text-[13px] ${isDark ? "text-violet-200" : "text-violet-950"}`}>
                    {localizedText(step.title, language)}
                  </div>
                  {localizedText(step.description, language) && (
                    <p className={`text-[11px] leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                      {localizedText(step.description, language)}
                    </p>
                  )}
                  {localizedText(step.timeframe, language) && (
                    <div className="text-[9px] font-mono text-emerald-500">{localizedText(step.timeframe, language)}</div>
                  )}

                  {goal ? (
                    <div className="space-y-1.5 pt-1">
                      {items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          className={`w-full flex items-center gap-2 text-left text-[10.5px] px-2.5 py-1.5 rounded-lg transition ${
                            item.completed
                              ? (isDark ? "text-emerald-400 bg-emerald-500/10" : "text-emerald-700 bg-emerald-50")
                              : (isDark ? "text-zinc-200 bg-white/5 hover:bg-white/10" : "text-zinc-800 bg-zinc-50 hover:bg-zinc-100")
                          }`}
                        >
                          <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 ${item.completed ? "" : "opacity-30"}`} />
                          <span className={item.completed ? "line-through" : ""}>{item.text}</span>
                        </button>
                      ))}

                      <div className="flex items-center gap-1.5 pt-1">
                        <input
                          value={newTaskText}
                          onChange={e => setNewTaskText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === "Enter") addSubtask(idx, newTaskText);
                          }}
                          placeholder="Add a small task..."
                          className={`flex-1 text-[10.5px] px-2.5 py-1.5 rounded-lg border outline-none ${
                            isDark
                              ? "bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
                              : "bg-white border-purple-200 text-black placeholder:text-zinc-400"
                          }`}
                        />
                        <button
                          onClick={() => addSubtask(idx, newTaskText)}
                          className={`shrink-0 flex items-center justify-center h-7 w-7 rounded-lg transition ${
                            isDark ? "text-violet-300 bg-white/5 hover:bg-white/10" : "text-violet-700 bg-violet-50 hover:bg-violet-100"
                          }`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className={`text-[10px] ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                      Start tracking this path to check off steps and add small tasks.
                    </p>
                  )}
                </div>
              );
            })()}

            {selected.type === "goal" && (
              <div className="space-y-2">
                <div className={`font-bold text-[13px] ${isDark ? "text-violet-200" : "text-violet-950"}`}>
                  {localizedText(mainPath.title, language)}
                </div>
                {localizedText(mainPath.description, language) && (
                  <p className={`text-[11px] leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                    {localizedText(mainPath.description, language)}
                  </p>
                )}
              </div>
            )}

            {selected.type === "alt" && (() => {
              const alt = altCandidates[selected.index];
              return (
                <div className="space-y-2">
                  <div className={`font-bold text-[13px] ${isDark ? "text-violet-200" : "text-violet-950"}`}>
                    {localizedText(alt.profession.title, language)}
                  </div>
                  {alt.matchReason && (
                    <p className={`text-[11px] leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                      {alt.matchReason}
                    </p>
                  )}
                  {onExploreAlternatives && (
                    <button
                      onClick={onExploreAlternatives}
                      className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg mt-1 ${
                        isDark ? "text-violet-300 bg-white/5 hover:bg-white/10" : "text-violet-700 bg-violet-50 hover:bg-violet-100"
                      }`}
                    >
                      Explore this path
                    </button>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
