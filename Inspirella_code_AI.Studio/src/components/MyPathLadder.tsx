import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowRight, CheckCircle2, ListPlus, Plus, Sparkles, Trophy, GitBranch } from "lucide-react";
import { LanguageCode, LearningPath, RouteBackground, TrackerChecklistItem, TrackerGoal, UserProfile } from "../types";
import { useEducationEngine, ROUTE_CHANGED_EVENT } from "../engine/useEducationEngine";
import { LADDER_CODE, PHASE_BY_ORDER, PLAN_B_TEXT, instantiateLadder, ladderApplies, lehrbeginnYear, phaseWindow, planBSeason, windowLabel } from "../engine/ladder";
import LadderSubsteps from "./LadderSubsteps";
import { DataRepository } from "../data/Repository";
import { TRANSLATIONS } from "../data";
import { localizedText } from "../lib/localized";
import { buildPathTrackerGoal, findPathTrackerGoal } from "../lib/pathTracker";

/**
 * "My Path" - the emotional core of the dashboard. Where the engine's
 * recommendations become one personal, visible journey: where am I, where
 * am I going, what's my next step. It closes the product loop
 * recommendation -> learning path -> tracker (action), and literally shows
 * the slogan "nothing is impossible, and you'll see it".
 *
 * Visual (glow-up 2026-09-28, "Ascension"): 3D glass stair blocks on a glowing
 * perspective floor, an energy beam flowing over the steps already climbed
 * (with a travelling light), lit/gold/glass step states, sparks rising from
 * completed steps, the phoenix standing on the current step inside a pulsing
 * ring, the goal as a radiant star with an orbit and a pillar of light, other
 * careers as constellation branches, a progress ring in the header and a
 * "next step" bar. The whole stage tilts in 3D with the cursor.
 *
 * Data behaviour is unchanged from the original build (see the 2026-09-15
 * notes in Decisions.md): top-3 profession scan for a path, per-step
 * sub-tasks via TrackerChecklistItem.stepId, honest empty state.
 */

interface MyPathLadderProps {
  userProfile?: UserProfile | null;
  language: LanguageCode;
  isDark: boolean;
  trackers?: TrackerGoal[];
  onTrackersChange?: (updated: TrackerGoal[]) => void;
  onExploreAlternatives?: () => void;
}

/** Layout space; the SVG scene and the HTML overlays share these coordinates. */
const VB_W = 1000;
const VB_H = 520;
const STEP_X_START = 120;
const STEP_X_END = 740;
const STEP_Y_START = 385;
const STEP_Y_END = 185;
const GOAL_X = 880;
const GOAL_Y = 150;
const GROUND_Y = 445;
/** Oblique-projection depth offset: the "back" of each block. */
const DX = 26;
const DY = -16;
/** Constellation spots for the alternative careers (empty upper-left sky). */
const ALT_SPOTS = [
  { x: 205, y: 150 },
  { x: 380, y: 100 }
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
/** Fills "{name}" placeholders in a translated string. */
const fill = (template: string, vars: Record<string, string | number>) =>
  String(template).replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
const pct = (v: number, of: number) => `${(v / of) * 100}%`;

type StepState = "done" | "current" | "upcoming";
type Selection = { type: "step"; index: number } | { type: "goal" } | { type: "alt"; index: number } | null;

/** Faces of one glass stair block, per state and theme. */
function blockPalette(state: StepState, isDark: boolean) {
  if (state === "done") {
    return {
      front: ["rgba(167,139,250,0.55)", "rgba(76,29,149,0.08)"],
      top: ["rgba(237,233,254,0.95)", "rgba(167,139,250,0.75)"],
      side: ["rgba(109,40,217,0.45)", "rgba(46,16,101,0.05)"],
      edge: "#e9d5ff"
    };
  }
  if (state === "current") {
    return {
      front: ["rgba(250,199,117,0.5)", "rgba(180,83,9,0.06)"],
      top: ["rgba(254,243,199,1)", "rgba(250,199,117,0.85)"],
      side: ["rgba(217,119,6,0.4)", "rgba(120,53,15,0.04)"],
      edge: "#fde68a"
    };
  }
  return isDark
    ? {
        front: ["rgba(139,126,242,0.2)", "rgba(30,20,60,0.02)"],
        top: ["rgba(196,181,253,0.38)", "rgba(139,126,242,0.22)"],
        side: ["rgba(83,74,183,0.22)", "rgba(20,12,40,0.02)"],
        edge: "rgba(196,181,253,0.55)"
      }
    : {
        front: ["rgba(139,126,242,0.28)", "rgba(237,233,254,0.1)"],
        top: ["rgba(221,214,254,0.95)", "rgba(196,181,253,0.7)"],
        side: ["rgba(124,58,237,0.25)", "rgba(237,233,254,0.05)"],
        edge: "rgba(124,58,237,0.6)"
      };
}

export default function MyPathLadder({
  userProfile,
  language,
  isDark,
  trackers,
  onTrackersChange,
  onExploreAlternatives
}: MyPathLadderProps) {
  const t = TRANSLATIONS[language];
  const { recommendation, loading } = useEducationEngine(userProfile || null);
  const reduceMotion = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const stageRef = useRef<HTMLDivElement>(null);

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

  // The user's route answers decide whether the detailed apprenticeship ladder fits.
  const [route, setRoute] = useState<RouteBackground | undefined>();
  useEffect(() => {
    let active = true;
    const load = () => {
      DataRepository.getRouteBackground().then(r => active && setRoute(r ?? undefined));
    };
    load();
    window.addEventListener(ROUTE_CHANGED_EVENT, load);
    return () => {
      active = false;
      window.removeEventListener(ROUTE_CHANGED_EVENT, load);
    };
  }, []);

  const [selected, setSelected] = useState<Selection>(null);
  // The step that was just completed (index, or -1 for the goal itself) -
  // drives a short celebration: the glass fills with light, feather-dust
  // bursts up, the phoenix hops on. Cleared after the animation.
  const [celebrate, setCelebrate] = useState<{ index: number; key: number } | null>(null);
  useEffect(() => {
    if (!celebrate) return;
    const id = window.setTimeout(() => setCelebrate(null), 1800);
    return () => window.clearTimeout(id);
  }, [celebrate]);
  const [newTaskText, setNewTaskText] = useState("");
  useEffect(() => {
    setNewTaskText("");
  }, [selected]);

  const rankedProfessions = recommendation?.professions || [];

  // Not every profession has a concrete learning_path yet. Rather than only
  // ever looking at the #1 match - which would leave most real profiles with
  // an empty ladder - take the highest-ranked one that actually has a path to
  // walk. The #1 match still isn't lost: if it has no path, it surfaces as an
  // "alternative" branch instead.
  const mainIndex = useMemo(() => {
    return rankedProfessions.findIndex(rp => learningPaths.some(p => p.targetProfessionId === rp.profession.id));
  }, [rankedProfessions, learningPaths]);

  const mainProfession = mainIndex >= 0 ? rankedProfessions[mainIndex]?.profession : undefined;
  // Apprenticeship professions get the detailed ladder (small steps with firms,
  // links and schools for this user); every other profession keeps its own path.
  const mainPath = useMemo(() => {
    if (!mainProfession) return undefined;
    const template = learningPaths.find(p => p.code === LADDER_CODE);
    if (template && ladderApplies(mainProfession, route, userProfile ?? null)) return instantiateLadder(template, mainProfession, language);
    return learningPaths.find(p => p.targetProfessionId === mainProfession.id);
  }, [mainProfession, learningPaths, route, userProfile, language]);

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

  // Cursor -> 3D tilt + parallax, written straight to CSS variables (no re-render).
  const onStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || e.pointerType !== "mouse" || !stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    stageRef.current.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    stageRef.current.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  const onStagePointerLeave = () => {
    stageRef.current?.style.setProperty("--px", "0");
    stageRef.current?.style.setProperty("--py", "0");
  };

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
            <h2 className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-violet-950"}`}>{t.mpTitle}</h2>
            <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
              {t.mpEmpty}
            </p>
          </div>
        </div>
        {onExploreAlternatives && (
          <button
            onClick={onExploreAlternatives}
            className={`shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition ${
              isDark ? "text-violet-300 bg-white/5 hover:bg-white/10" : "text-violet-700 bg-violet-50 hover:bg-violet-100"
            }`}
          >
            {t.mpExplore}
          </button>
        )}
      </div>
    );
  }

  const steps = mainPath.steps;
  const goal = findPathTrackerGoal(trackers, mainPath, language);
  const goalTitle = localizedText(mainPath.title, language);

  // Sub-tasks per step, resolved per step rather than with one global flag -
  // a goal created before sub-tasks existed has one flat, untagged item per
  // step (matched positionally); once a step gets its first extra sub-task,
  // addSubtask() tags that legacy item too so it keeps showing up.
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
  const doneCount = steps.filter((_, idx) => stepDone(idx)).length;
  const progress = steps.length ? doneCount / steps.length : 0;
  const stateOf = (idx: number): StepState => (stepDone(idx) ? "done" : idx === currentStepIndex ? "current" : "upcoming");

  const spacing = steps.length > 1 ? (STEP_X_END - STEP_X_START) / (steps.length - 1) : 180;
  const blockW = clamp(spacing - 8, 70, 160);

  const stepPos = (idx: number) => ({
    x: steps.length === 1 ? (STEP_X_START + STEP_X_END) / 2 : STEP_X_START + (idx * (STEP_X_END - STEP_X_START)) / (steps.length - 1),
    y: steps.length === 1 ? STEP_Y_START : STEP_Y_START - (idx * (STEP_Y_START - STEP_Y_END)) / (steps.length - 1)
  });
  /** Centre of a block's top face - where labels, the phoenix and the beam sit. */
  const topCentre = (idx: number) => {
    const p = stepPos(idx);
    return { x: p.x + DX / 2, y: p.y + DY / 2 };
  };
  const goalW = 150;
  const goalTop = { x: GOAL_X + DX / 2, y: GOAL_Y + DY / 2 };
  // The phoenix stands on the left end of its tread, so the current step's
  // label can sit beside it instead of being pushed up into the next label.
  const personPos = allDone
    ? goalTop
    : { x: topCentre(currentStepIndex).x - blockW / 2 + 24, y: topCentre(currentStepIndex).y };

  // Energy beam: through every top face up to the goal. The lit part runs
  // to where the phoenix stands (or all the way when the goal is reached).
  const beamPoints = [...steps.map((_, i) => topCentre(i)), goalTop];
  const litCount = allDone ? beamPoints.length : currentStepIndex + 1;
  const toPath = (pts: { x: number; y: number }[]) => pts.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  const litPath = toPath(beamPoints.slice(0, litCount));
  const dimPath = toPath(beamPoints.slice(Math.max(0, litCount - 1)));

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

    // Did this tick finish its step (or the whole path)? Same per-step
    // resolution as itemsForStep(), applied to the updated items.
    const stepIdx = steps.findIndex((_, idx) => itemsForStep(idx).some(i => i.id === itemId));
    if (stepIdx >= 0) {
      const ids = new Set(itemsForStep(stepIdx).map(i => i.id));
      const nowDone = updatedItems.filter(i => ids.has(i.id)).every(i => i.completed);
      const wasDone = stepDone(stepIdx);
      if (nowDone && !wasDone) {
        const othersDone = steps.every((_, idx) => idx === stepIdx || stepDone(idx));
        setCelebrate({ index: othersDone ? -1 : stepIdx, key: Date.now() });
      }
    }
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

  const mutedText = isDark ? "#a39fc4" : "#6b6680";
  const ringR = 19;
  const ringC = 2 * Math.PI * ringR;
  const id = (name: string) => `${uid}-${name}`;

  // Deterministic sparks rising from lit steps (3 per done step, 4 on the current one).
  const sparks = steps.flatMap((_, idx) => {
    const state = stateOf(idx);
    if (state === "upcoming") return [];
    const p = stepPos(idx);
    const n = state === "current" ? 4 : 3;
    return Array.from({ length: n }, (_, k) => ({
      key: `${idx}-${k}`,
      x: p.x - blockW / 2 + ((k + 0.5) / n) * blockW + DX / 2,
      y: p.y + DY / 2,
      delay: ((idx * 7 + k * 3) % 10) * 0.35,
      gold: state === "current"
    }));
  });

  const layer = (depth: number): React.CSSProperties => ({
    transform: `translate3d(calc(var(--px, 0) * ${depth}px), calc(var(--py, 0) * ${depth * 0.6}px), 0)`,
    transition: "transform 0.35s ease-out"
  });

  return (
    <div className="card-premium p-5 sm:p-6 relative overflow-hidden text-left">
      {/* Header: title, route, progress ring, tracking CTA */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative h-12 w-12 shrink-0">
            <svg viewBox="0 0 48 48" className="h-12 w-12 -rotate-90">
              <circle cx="24" cy="24" r={ringR} fill="none" strokeWidth="3.5" stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(76,29,149,0.1)"} />
              <motion.circle
                cx="24"
                cy="24"
                r={ringR}
                fill="none"
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke={`url(#${id("ring")})`}
                strokeDasharray={ringC}
                initial={{ strokeDashoffset: ringC }}
                animate={{ strokeDashoffset: ringC * (1 - progress) }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ filter: "drop-shadow(0 0 4px rgba(167,139,250,0.8))" }}
              />
              <defs>
                <linearGradient id={id("ring")} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#c4b5fd" />
                  <stop offset="100%" stopColor="#e879f9" />
                </linearGradient>
              </defs>
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-[11px] font-bold ${isDark ? "text-white" : "text-violet-950"}`}>
              {Math.round(progress * 100)}%
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {headerIcon}
              <h2 className={`text-base font-bold tracking-tight ${isDark ? "text-white" : "text-violet-950"}`}>{t.mpTitle}</h2>
              {language !== "de" && (
                <span
                  className="text-[11px] font-mono px-2 py-0.5 rounded-full border"
                  style={{
                    color: isDark ? "#a79fc4" : "#5C5570",
                    borderColor: isDark ? "#2C2549" : "#E3DEF0",
                    background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"
                  }}
                >
                  {/* Step texts exist in this language only once the nightly
                      translate-missing run (DeepL) has reached this path. */}
                  {steps.some(st => st.title?.[language]) ? t.autoTranslatedNote : t.pathContentGermanOnly}
                </span>
              )}
            </div>
            <p className={`text-xs mt-0.5 truncate ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
              {t.mpRoute} <span className="text-shimmer font-semibold">{goalTitle}</span>
              <span className={isDark ? "text-zinc-500" : "text-zinc-500"}> · {fill(t.mpStepsDone, { done: doneCount, total: steps.length })}</span>
            </p>
          </div>
        </div>
        {!goal && onTrackersChange && (
          <button onClick={addToTracker} className="btn-primary btn-shine gap-1.5 text-[11px] px-3.5 py-2">
            <ListPlus className="h-3.5 w-3.5" />
            {t.mpStart}
          </button>
        )}
      </div>

      {/* Text equivalent of the staircase for screen readers */}
      <p className="sr-only">
        {`${fill(t.mpSrSummary, { goal: goalTitle, done: doneCount, total: steps.length })} ${
          allDone ? t.mpSrGoal : fill(t.mpSrCurrent, { n: currentStepIndex + 1, title: localizedText(steps[currentStepIndex].title, language) })
        }`}
      </p>

      <p className="sm:hidden text-[11px] font-mono uppercase tracking-wider text-center mb-1.5" style={{ color: mutedText }}>
        {t.mpSwipe}
      </p>

      <div className="overflow-x-auto -mx-5 px-5 sm:-mx-6 sm:px-6">
        {/* 3D stage: tilts with the cursor; layers drift at different depths */}
        <div
          ref={stageRef}
          data-scene-portal
          onPointerMove={onStagePointerMove}
          onPointerLeave={onStagePointerLeave}
          className="relative min-w-[660px] sm:min-w-0 sm:w-full sm:max-w-[900px] sm:mx-auto rounded-2xl overflow-hidden"
          style={{
            aspectRatio: `${VB_W} / ${VB_H}`,
            transform: "perspective(1400px) rotateX(calc(var(--py, 0) * -4deg)) rotateY(calc(var(--px, 0) * 6deg))",
            transition: "transform 0.4s ease-out",
            background: isDark
              ? "radial-gradient(120% 90% at 85% 10%, #3b1a78 0%, #170d33 38%, #08050f 75%)"
              : "radial-gradient(120% 90% at 85% 10%, #ddd6fe 0%, #f1edff 45%, #ffffff 80%)",
            boxShadow: isDark ? "inset 0 0 0 1px rgba(167,139,250,0.15), 0 20px 60px -20px rgba(76,29,149,0.6)" : "inset 0 0 0 1px rgba(124,58,237,0.15)"
          }}
        >
          {/* Layer 1 (deepest): stars, nebula glow, horizon and floor grid */}
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="absolute inset-[-3%] h-[106%] w-[106%]" style={layer(-10)} aria-hidden="true">
            <defs>
              <radialGradient id={id("nebula")} cx="0.85" cy="0.2" r="0.6">
                <stop offset="0%" stopColor={isDark ? "rgba(167,139,250,0.35)" : "rgba(167,139,250,0.3)"} />
                <stop offset="100%" stopColor="rgba(167,139,250,0)" />
              </radialGradient>
              <linearGradient id={id("horizon")} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(232,121,249,0)" />
                <stop offset="60%" stopColor={isDark ? "rgba(192,132,252,0.35)" : "rgba(167,139,250,0.35)"} />
                <stop offset="100%" stopColor="rgba(232,121,249,0)" />
              </linearGradient>
              <linearGradient id={id("floorFade")} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
              <mask id={id("floorMask")}>
                <rect x="0" y={GROUND_Y} width={VB_W} height={VB_H - GROUND_Y} fill={`url(#${id("floorFade")})`} />
              </mask>
            </defs>
            <rect x="0" y="0" width={VB_W} height={VB_H} fill={`url(#${id("nebula")})`} />
            {isDark &&
              Array.from({ length: 34 }, (_, i) => {
                const x = (i * 283) % VB_W;
                const y = (i * 131) % (GROUND_Y - 40);
                const r = i % 5 === 0 ? 1.6 : 0.9;
                return (
                  <circle key={i} cx={x} cy={y} r={r} fill="#fff" opacity={0.25 + (i % 4) * 0.12}>
                    {!reduceMotion && (
                      <animate attributeName="opacity" values="0.2;0.8;0.2" dur={`${3 + (i % 5)}s`} begin={`${(i % 7) * 0.4}s`} repeatCount="indefinite" />
                    )}
                  </circle>
                );
              })}
            {/* Glowing horizon line where the floor meets the sky */}
            <rect x="0" y={GROUND_Y - 30} width={VB_W} height="60" fill={`url(#${id("horizon")})`} />
            <line x1="0" y1={GROUND_Y} x2={VB_W} y2={GROUND_Y} stroke={isDark ? "rgba(216,180,254,0.55)" : "rgba(124,58,237,0.35)"} strokeWidth="1" />
            {/* Perspective floor grid */}
            <g mask={`url(#${id("floorMask")})`} stroke={isDark ? "rgba(167,139,250,0.45)" : "rgba(124,58,237,0.3)"} strokeWidth="0.8">
              {Array.from({ length: 23 }, (_, i) => {
                const bx = -600 + i * 100;
                return <line key={`v${i}`} x1={VB_W / 2 + (bx - VB_W / 2) * 0.12} y1={GROUND_Y} x2={bx} y2={VB_H + 40} />;
              })}
              {Array.from({ length: 6 }, (_, i) => {
                const y = GROUND_Y + Math.pow(i + 1, 1.7) * 3.2;
                return <line key={`h${i}`} x1="0" y1={y} x2={VB_W} y2={y} />;
              })}
            </g>
          </svg>

          {/* Layer 2: stair blocks, goal pillar + star, energy beam, branches */}
          <svg viewBox={`0 0 ${VB_W} ${VB_H}`} className="absolute inset-0 h-full w-full" style={layer(0)} aria-hidden="true">
            <defs>
              <filter id={id("glow")} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id={id("softGlow")} x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="10" />
              </filter>
              <linearGradient id={id("fill")} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="rgba(253,230,138,0.05)" />
                <stop offset="70%" stopColor="rgba(253,230,138,0.55)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.95)" />
              </linearGradient>
              <linearGradient id={id("beam")} x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#c4b5fd" />
                <stop offset="60%" stopColor="#e879f9" />
                <stop offset="100%" stopColor="#fde68a" />
              </linearGradient>
              <linearGradient id={id("pillar")} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={allDone ? "rgba(253,230,138,0.55)" : "rgba(232,121,249,0.4)"} />
                <stop offset="100%" stopColor="rgba(232,121,249,0)" />
              </linearGradient>
              {(["done", "current", "upcoming", "goal"] as const).map(s => {
                const pal =
                  s === "goal"
                    ? blockPalette(allDone ? "current" : "done", isDark)
                    : blockPalette(s, isDark);
                return (
                  <React.Fragment key={s}>
                    <linearGradient id={id(`front-${s}`)} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={pal.front[0]} />
                      <stop offset="100%" stopColor={pal.front[1]} />
                    </linearGradient>
                    <linearGradient id={id(`top-${s}`)} x1="0" y1="1" x2="1" y2="0">
                      <stop offset="0%" stopColor={pal.top[0]} />
                      <stop offset="100%" stopColor={pal.top[1]} />
                    </linearGradient>
                    <linearGradient id={id(`side-${s}`)} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={pal.side[0]} />
                      <stop offset="100%" stopColor={pal.side[1]} />
                    </linearGradient>
                  </React.Fragment>
                );
              })}
            </defs>

            {/* Constellation branches to the other careers */}
            {altCandidates.map((_, i) => {
              const from = topCentre(currentStepIndex);
              const to = ALT_SPOTS[i];
              return (
                <path
                  key={`branch-${i}`}
                  d={`M${from.x},${from.y - 20} Q${(from.x + to.x) / 2},${Math.min(from.y, to.y) - 60} ${to.x},${to.y}`}
                  fill="none"
                  stroke={isDark ? "rgba(196,181,253,0.35)" : "rgba(124,58,237,0.3)"}
                  strokeWidth="1.2"
                  strokeDasharray="2 6"
                  strokeLinecap="round"
                >
                  {!reduceMotion && <animate attributeName="stroke-dashoffset" from="0" to="-32" dur="3s" repeatCount="indefinite" />}
                </path>
              );
            })}

            {/* Goal: pillar of light behind the landing */}
            <rect
              x={GOAL_X - 34 + DX / 2}
              y={0}
              width={68}
              height={GOAL_Y}
              fill={`url(#${id("pillar")})`}
              filter={`url(#${id("softGlow")})`}
            >
              {!reduceMotion && <animate attributeName="opacity" values="0.6;1;0.6" dur="4s" repeatCount="indefinite" />}
            </rect>

            {/* Stair blocks, rising from the floor one after another */}
            {steps.map((step, idx) => {
              const p = stepPos(idx);
              const s = stateOf(idx);
              const x0 = p.x - blockW / 2;
              const x1 = p.x + blockW / 2;
              const pal = blockPalette(s, isDark);
              return (
                <motion.g
                  key={`block-${step.id}`}
                  initial={reduceMotion ? false : { opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + idx * 0.09, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* side face */}
                  <polygon
                    points={`${x1},${p.y} ${x1 + DX},${p.y + DY} ${x1 + DX},${GROUND_Y + DY} ${x1},${GROUND_Y}`}
                    fill={`url(#${id(`side-${s}`)})`}
                  />
                  {/* front face */}
                  <rect x={x0} y={p.y} width={blockW} height={GROUND_Y - p.y} fill={`url(#${id(`front-${s}`)})`} />
                  {/* Celebration: light rises through the glass from the floor */}
                  {celebrate && !reduceMotion && (celebrate.index === idx || celebrate.index === -1) && (
                    <motion.rect
                      key={`fill-${celebrate.key}`}
                      x={x0}
                      width={blockW}
                      fill={`url(#${id("fill")})`}
                      initial={{ y: GROUND_Y, height: 0, opacity: 1 }}
                      animate={{ y: [GROUND_Y, p.y, p.y], height: [0, GROUND_Y - p.y, GROUND_Y - p.y], opacity: [1, 1, 0] }}
                      transition={{ duration: 1.5, times: [0, 0.45, 1], ease: "easeOut", delay: celebrate.index === -1 ? idx * 0.08 : 0 }}
                    />
                  )}
                  {/* top face */}
                  <polygon
                    points={`${x0},${p.y} ${x1},${p.y} ${x1 + DX},${p.y + DY} ${x0 + DX},${p.y + DY}`}
                    fill={`url(#${id(`top-${s}`)})`}
                  />
                  {/* glowing front edge */}
                  <line
                    x1={x0}
                    y1={p.y}
                    x2={x1}
                    y2={p.y}
                    stroke={pal.edge}
                    strokeWidth={s === "upcoming" ? 1 : 2}
                    filter={s === "upcoming" ? undefined : `url(#${id("glow")})`}
                  />
                  <line x1={x0} y1={p.y} x2={x0} y2={GROUND_Y} stroke={pal.edge} strokeOpacity="0.35" strokeWidth="1" />
                  {/* step number etched into the front face (only where the block is tall enough to hold it above the task badge) */}
                  {GROUND_Y - p.y >= 90 && <text
                    x={p.x}
                    y={p.y + 40}
                    textAnchor="middle"
                    fontSize="26"
                    fontWeight="800"
                    fontFamily="Space Grotesk, sans-serif"
                    fill={s === "upcoming" ? (isDark ? "rgba(196,181,253,0.18)" : "rgba(124,58,237,0.18)") : "rgba(255,255,255,0.28)"}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </text>}
                </motion.g>
              );
            })}

            {/* Goal landing block */}
            <motion.g
              initial={reduceMotion ? false : { opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + steps.length * 0.09, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <polygon
                points={`${GOAL_X + goalW / 2},${GOAL_Y} ${GOAL_X + goalW / 2 + DX},${GOAL_Y + DY} ${GOAL_X + goalW / 2 + DX},${GROUND_Y + DY} ${GOAL_X + goalW / 2},${GROUND_Y}`}
                fill={`url(#${id("side-goal")})`}
              />
              <rect x={GOAL_X - goalW / 2} y={GOAL_Y} width={goalW} height={GROUND_Y - GOAL_Y} fill={`url(#${id("front-goal")})`} />
              <polygon
                points={`${GOAL_X - goalW / 2},${GOAL_Y} ${GOAL_X + goalW / 2},${GOAL_Y} ${GOAL_X + goalW / 2 + DX},${GOAL_Y + DY} ${GOAL_X - goalW / 2 + DX},${GOAL_Y + DY}`}
                fill={`url(#${id("top-goal")})`}
              />
              <line
                x1={GOAL_X - goalW / 2}
                y1={GOAL_Y}
                x2={GOAL_X + goalW / 2}
                y2={GOAL_Y}
                stroke={allDone ? "#fde68a" : "#f0abfc"}
                strokeWidth="2.5"
                filter={`url(#${id("glow")})`}
              />
            </motion.g>

            {/* Energy beam: dim ahead, flowing light on the part already climbed */}
            <path d={dimPath} fill="none" stroke={isDark ? "rgba(196,181,253,0.35)" : "rgba(124,58,237,0.35)"} strokeWidth="1.5" strokeDasharray="3 7" strokeLinecap="round" />
            {litCount > 1 && (
              <>
                <path d={litPath} fill="none" stroke={`url(#${id("beam")})`} strokeWidth="6" strokeLinecap="round" opacity="0.35" filter={`url(#${id("softGlow")})`} />
                <path d={litPath} fill="none" stroke={`url(#${id("beam")})`} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="14 10" filter={`url(#${id("glow")})`}>
                  {!reduceMotion && <animate attributeName="stroke-dashoffset" from="48" to="0" dur="1.6s" repeatCount="indefinite" />}
                </path>
                {!reduceMotion && (
                  <circle r="4.5" fill="#fff" filter={`url(#${id("glow")})`}>
                    <animateMotion dur={`${1.2 + litCount * 0.45}s`} repeatCount="indefinite" path={litPath} />
                  </circle>
                )}
              </>
            )}

            {/* Pulsing ring where the phoenix stands */}
            <ellipse cx={personPos.x} cy={personPos.y} rx="30" ry="9" fill="none" stroke="#fde68a" strokeWidth="1.5" filter={`url(#${id("glow")})`}>
              {!reduceMotion && (
                <>
                  <animate attributeName="rx" values="22;38;22" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="ry" values="6;12;6" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0.2;0.9" dur="2.4s" repeatCount="indefinite" />
                </>
              )}
            </ellipse>

            {/* Goal star with orbit */}
            <g transform={`translate(${goalTop.x}, ${GOAL_Y - 78})`}>
              <circle r="34" fill={allDone ? "rgba(253,230,138,0.35)" : "rgba(232,121,249,0.3)"} filter={`url(#${id("softGlow")})`} />
              <g filter={`url(#${id("glow")})`}>
                <path
                  d="M0,-24 C3,-6 6,-3 24,0 C6,3 3,6 0,24 C-3,6 -6,3 -24,0 C-6,-3 -3,-6 0,-24 Z"
                  fill={allDone ? "#fef3c7" : "#f5f3ff"}
                >
                  {!reduceMotion && <animateTransform attributeName="transform" type="scale" values="1;1.12;1" dur="3s" repeatCount="indefinite" />}
                </path>
              </g>
              <ellipse rx="44" ry="14" fill="none" stroke={isDark ? "rgba(232,121,249,0.55)" : "rgba(168,85,247,0.55)"} strokeWidth="1.2" strokeDasharray="4 5">
                {!reduceMotion && <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="18s" repeatCount="indefinite" />}
              </ellipse>
              {!reduceMotion && (
                <circle r="3" fill="#fde68a" filter={`url(#${id("glow")})`}>
                  <animateMotion dur="5s" repeatCount="indefinite" path="M-44,0 A44,14 0 1,1 44,0 A44,14 0 1,1 -44,0" />
                </circle>
              )}
            </g>
          </svg>

          {/* Layer 3 (closest): sparks, labels, badges, phoenix, goal, alternatives */}
          <div className="absolute inset-0" style={layer(8)}>
            {!reduceMotion &&
              sparks.map(sp => (
                <span
                  key={sp.key}
                  aria-hidden="true"
                  className="path-spark absolute rounded-full pointer-events-none"
                  style={{
                    left: pct(sp.x, VB_W),
                    top: pct(sp.y, VB_H),
                    width: sp.gold ? 4 : 3,
                    height: sp.gold ? 4 : 3,
                    background: sp.gold ? "#fde68a" : "#e9d5ff",
                    boxShadow: `0 0 8px ${sp.gold ? "#fbbf24" : "#c084fc"}`,
                    animationDelay: `${sp.delay}s`
                  }}
                />
              ))}

            {/* Sub-task badges on each block's front face */}
            {steps.map((step, idx) => {
              const p = stepPos(idx);
              const items = itemsForStep(idx);
              const done = items.filter(i => i.completed).length;
              const color =
                items.length === 0
                  ? mutedText
                  : done === items.length
                  ? isDark ? "#c4b5fd" : "#6d28d9"
                  : isDark ? "#fde68a" : "#b45309";
              return (
                <button
                  key={`todo-${step.id}`}
                  onClick={() => setSelected({ type: "step", index: idx })}
                  className="absolute -translate-x-1/2 flex items-center justify-center rounded-full border backdrop-blur-sm transition hover:scale-110"
                  style={{
                    left: pct(p.x, VB_W),
                    top: pct(GROUND_Y - 30, VB_H),
                    minWidth: 26,
                    height: 20,
                    padding: "0 6px",
                    background: isDark ? "rgba(6,4,10,0.55)" : "rgba(255,255,255,0.75)",
                    borderColor: color,
                    color
                  }}
                  title={t.mpTasksTitle}
                >
                  <span className="text-[11px] font-mono font-bold">{items.length > 0 ? `${done}/${items.length}` : "+"}</span>
                </button>
              );
            })}

            {/* Step labels above each top face */}
            {steps.map((step, idx) => {
              const c = topCentre(idx);
              const s = stateOf(idx);
              const isSel = selected?.type === "step" && selected.index === idx;
              const besidePhoenix = s === "current" && !allDone;
              return (
                <motion.button
                  key={step.id}
                  onClick={() => setSelected({ type: "step", index: idx })}
                  className={`absolute -translate-y-full ${besidePhoenix ? "" : "-translate-x-1/2"}`}
                  style={{ left: pct(besidePhoenix ? c.x - blockW / 2 + 52 : c.x, VB_W), top: pct(c.y, VB_H), paddingBottom: 14 }}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + idx * 0.09, duration: 0.5 }}
                >
                  <div
                    className="rounded-lg px-2.5 py-1.5 border backdrop-blur-md transition hover:-translate-y-0.5"
                    style={{
                      maxWidth: 158,
                      background:
                        s === "done"
                          ? "linear-gradient(135deg, rgba(167,139,250,0.4), rgba(109,40,217,0.18))"
                          : s === "current"
                          ? "linear-gradient(135deg, rgba(250,199,117,0.42), rgba(217,119,6,0.14))"
                          : isDark
                          ? "rgba(20,14,40,0.55)"
                          : "rgba(255,255,255,0.8)",
                      borderColor: isSel ? "#fff" : s === "done" ? "#c4b5fd" : s === "current" ? "#fde68a" : isDark ? "rgba(175,169,236,0.35)" : "rgba(124,58,237,0.3)",
                      boxShadow:
                        s === "current"
                          ? "0 0 22px rgba(250,199,117,0.4)"
                          : s === "done"
                          ? "0 0 16px rgba(167,139,250,0.35)"
                          : "none"
                    }}
                  >
                    <span
                      className="flex items-center gap-1 text-[11px] font-semibold leading-snug"
                      style={{
                        color: isDark
                          ? s === "done" ? "#f5f3ff" : s === "current" ? "#fffbeb" : "#ddd6fe"
                          : s === "done" ? "#4c1d95" : s === "current" ? "#78350f" : "#3C3489"
                      }}
                    >
                      {s === "done" && <CheckCircle2 className="h-3 w-3 shrink-0" />}
                      <span className="truncate">{localizedText(step.title, language)}</span>
                    </span>
                  </div>
                </motion.button>
              );
            })}

            {/* Celebration burst: feather-dust flying up off the completed step */}
            {celebrate && !reduceMotion && (() => {
              const origin = celebrate.index === -1 ? goalTop : topCentre(celebrate.index);
              return Array.from({ length: 16 }, (_, k) => {
                const angle = -Math.PI / 2 + ((k / 15) - 0.5) * Math.PI * 1.1;
                const dist = 50 + (k % 4) * 18;
                return (
                  <motion.span
                    key={`burst-${celebrate.key}-${k}`}
                    aria-hidden="true"
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      left: pct(origin.x, VB_W),
                      top: pct(origin.y, VB_H),
                      width: k % 3 === 0 ? 5 : 3,
                      height: k % 3 === 0 ? 5 : 3,
                      background: k % 2 ? "#fde68a" : "#e9d5ff",
                      boxShadow: `0 0 10px ${k % 2 ? "#fbbf24" : "#c084fc"}`
                    }}
                    initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                    animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist - 20, opacity: 0, scale: 0.3 }}
                    transition={{ duration: 1.1 + (k % 3) * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  />
                );
              });
            })()}

            {/* The phoenix: you, standing on your current step. Glides to the
                next step when one is completed, hopping in on arrival. */}
            {!allDone && (
              <motion.div
                className="absolute -translate-x-1/2 -translate-y-full pointer-events-none flex flex-col items-center"
                initial={false}
                animate={{ left: pct(personPos.x, VB_W), top: pct(personPos.y, VB_H) }}
                transition={{ type: "spring", stiffness: 90, damping: 16 }}
                style={{ paddingBottom: 2 }}
              >
                <motion.div
                  key={`hop-${currentStepIndex}`}
                  initial={reduceMotion ? false : { y: -34, scale: 0.9 }}
                  animate={reduceMotion ? undefined : { y: [0, -6, 0], scale: 1 }}
                  transition={{ y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" }, scale: { duration: 0.4 } }}
                >
                  <img src="/logo-mark.png" alt="" className="h-12 w-12 drop-shadow-[0_0_14px_rgba(250,199,117,0.85)]" />
                </motion.div>
              </motion.div>
            )}

            {/* Goal: star button + title */}
            <button
              onClick={() => setSelected({ type: "goal" })}
              className="absolute -translate-x-1/2 flex flex-col items-center gap-1 group"
              style={{ left: pct(goalTop.x, VB_W), top: pct(GOAL_Y - 118, VB_H) }}
              title={goalTitle}
            >
              <span className="block h-16 w-24" aria-hidden="true" />
              <span
                className="flex items-center gap-1 text-[11px] font-bold whitespace-nowrap max-w-[170px] rounded-full px-2.5 py-1 border backdrop-blur-md"
                style={{
                  color: allDone ? "#fef3c7" : isDark ? "#fae8ff" : "#6b21a8",
                  borderColor: allDone ? "#fde68a" : "rgba(240,171,252,0.6)",
                  background: isDark ? "rgba(20,10,35,0.55)" : "rgba(255,255,255,0.8)",
                  boxShadow: "0 0 18px rgba(232,121,249,0.35)"
                }}
              >
                <Trophy className="h-3 w-3 shrink-0" />
                <span className="truncate">{goalTitle}</span>
              </span>
            </button>

            {/* Alternatives: glowing constellation nodes */}
            {altCandidates.map((alt, i) => {
              const pos = ALT_SPOTS[i];
              return (
                <button
                  key={`alt-${i}`}
                  onClick={() => setSelected({ type: "alt", index: i })}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 opacity-70 hover:opacity-100 transition group"
                  style={{ left: pct(pos.x, VB_W), top: pct(pos.y, VB_H) }}
                >
                  <span className="relative flex h-4 w-4 items-center justify-center">
                    <span className="absolute h-4 w-4 rounded-full bg-violet-400/30 blur-[3px] group-hover:bg-fuchsia-400/50 transition" />
                    <span className="relative h-2 w-2 rounded-full bg-violet-200 shadow-[0_0_8px_rgba(221,214,254,0.9)]" />
                  </span>
                  <span className="text-[11px] font-mono whitespace-nowrap max-w-[110px] truncate" style={{ color: mutedText }}>
                    {localizedText(alt.profession.title, language)}
                  </span>
                </button>
              );
            })}
            {altCandidates.length > 0 && (
              <span
                className="absolute flex items-center gap-1 text-[11px] font-mono uppercase tracking-widest pointer-events-none"
                style={{ left: pct(ALT_SPOTS[0].x - 40, VB_W), top: pct(ALT_SPOTS[1].y - 42, VB_H), color: mutedText }}
              >
                <GitBranch className="h-3 w-3" /> {t.mpOtherPaths}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Next step bar: the one clear action this whole block leads to */}
      {!allDone ? (
        <button
          onClick={() => setSelected({ type: "step", index: currentStepIndex })}
          className={`group mt-4 w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
            isDark
              ? "border-amber-300/25 bg-gradient-to-r from-amber-400/10 via-fuchsia-500/5 to-transparent hover:border-amber-300/50"
              : "border-amber-400/40 bg-gradient-to-r from-amber-100 via-fuchsia-50 to-white hover:border-amber-500/60"
          }`}
        >
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-[0_0_14px_rgba(251,191,36,0.35)] ${isDark ? "bg-amber-300/15 text-amber-300" : "bg-amber-200 text-amber-800"}`}>
            <span className="text-[11px] font-bold">{String(currentStepIndex + 1).padStart(2, "0")}</span>
          </span>
          <span className="min-w-0 flex-1">
            <span className={`block text-[11px] font-mono uppercase tracking-widest ${isDark ? "text-amber-300/80" : "text-amber-700"}`}>{t.mpNextStep}</span>
            <span className={`block truncate text-sm font-semibold ${isDark ? "text-white" : "text-violet-950"}`}>
              {localizedText(steps[currentStepIndex].title, language)}
            </span>
          </span>
          <ArrowRight className={`h-4 w-4 shrink-0 transition group-hover:translate-x-1 ${isDark ? "text-amber-300" : "text-amber-700"}`} />
        </button>
      ) : (
        <div className={`mt-4 flex items-center gap-3 rounded-xl border px-4 py-3 ${isDark ? "border-amber-300/40 bg-amber-400/10" : "border-amber-400 bg-amber-50"}`}>
          <Trophy className="h-5 w-5 text-amber-400" />
          <span className={`text-sm font-semibold ${isDark ? "text-amber-100" : "text-amber-900"}`}>{fill(t.mpReached, { goal: goalTitle })}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {selected && (
          <motion.div
            key={JSON.stringify(selected)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            className={`mt-3 rounded-xl border p-4 backdrop-blur-md ${isDark ? "bg-white/[0.04] border-white/10" : "bg-white border-purple-200"}`}
          >
            {selected.type === "step" && (() => {
              const idx = selected.index;
              const step = steps[idx];
              const items = itemsForStep(idx);
              const itemsDone = items.filter(i => i.completed).length;
              const hasSub = !!step.substeps && step.substeps.length > 0;
              const subTitles = new Set((step.substeps ?? []).map(sub => localizedText(sub.title, language)));
              const ownItems = hasSub ? items.filter(i => !subTitles.has(i.text)) : items;
              const s = stateOf(idx);
              return (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[11px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                        s === "done"
                          ? isDark ? "text-violet-200 border-violet-400/40 bg-violet-500/15" : "text-violet-800 border-violet-300 bg-violet-100"
                          : s === "current"
                          ? isDark ? "text-amber-200 border-amber-300/40 bg-amber-400/15" : "text-amber-800 border-amber-300 bg-amber-100"
                          : isDark
                          ? "text-zinc-400 border-white/10"
                          : "text-zinc-600 border-zinc-200"
                      }`}
                    >
                      {fill(t.mpStepOf, { n: idx + 1, total: steps.length })} · {s === "done" ? t.mpStateDone : s === "current" ? t.mpStateHere : t.mpStateAhead}
                    </span>
                  </div>
                  <div className={`font-bold text-[13px] ${isDark ? "text-violet-100" : "text-violet-950"}`}>
                    {localizedText(step.title, language)}
                  </div>
                  {localizedText(step.description, language) && (
                    <p className={`text-[11px] leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                      {localizedText(step.description, language)}
                    </p>
                  )}
                  {localizedText(step.timeframe, language) && (
                    <div className="text-[11px] font-mono text-emerald-500">{localizedText(step.timeframe, language)}</div>
                  )}
                  {mainPath.code === LADDER_CODE && (() => {
                    const start = lehrbeginnYear(route);
                    const key = PHASE_BY_ORDER[step.order ?? 0];
                    const win = phaseWindow(key, start.year);
                    if (!win) return null;
                    const label = windowLabel(win, start.year, start.assumed, language);
                    const planB = planBSeason(start.year) && (key === "bewerben" || key === "gespraech" || key === "entscheid");
                    return (
                      <div className="space-y-1">
                        <div className={`text-[11px] ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                          {label.text} · <span className={win.state === "now" ? (isDark ? "text-amber-300" : "text-amber-700") : ""}>{label.status}</span>
                        </div>
                        {label.note && <div className={`text-[10px] ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>{label.note}</div>}
                        {planB && (
                          <div className={`rounded-lg border px-2.5 py-1.5 text-[11px] ${isDark ? "border-amber-300/30 bg-amber-400/10 text-amber-100" : "border-amber-300 bg-amber-50 text-amber-900"}`}>
                            {PLAN_B_TEXT[language] ?? PLAN_B_TEXT.de}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {hasSub && mainProfession && (
                    <LadderSubsteps
                      step={step}
                      items={items}
                      canTick={!!goal}
                      onToggle={toggleItem}
                      profession={mainProfession}
                      profile={userProfile ?? null}
                      route={route}
                      language={language}
                      isDark={isDark}
                      alternatives={altCandidates.map(a => a.profession)}
                    />
                  )}
                  {goal ? (
                    <div className="space-y-1.5 pt-1">
                      {items.length > 0 && (
                        <div className={`h-1 w-full overflow-hidden rounded-full ${isDark ? "bg-white/10" : "bg-violet-100"}`}>
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400"
                            initial={false}
                            animate={{ width: `${(itemsDone / items.length) * 100}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                      )}
                      {ownItems.map(item => (
                        <button
                          key={item.id}
                          onClick={() => toggleItem(item.id)}
                          className={`w-full flex items-center gap-2 text-left text-[11px] px-2.5 py-1.5 rounded-lg transition ${
                            item.completed
                              ? isDark
                                ? "text-violet-200 bg-violet-500/15"
                                : "text-violet-800 bg-violet-50"
                              : isDark
                              ? "text-zinc-200 bg-white/5 hover:bg-white/10"
                              : "text-zinc-800 bg-zinc-50 hover:bg-zinc-100"
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
                          placeholder={t.mpAddTask}
                          className={`flex-1 text-[11px] px-2.5 py-1.5 rounded-lg border outline-none ${
                            isDark
                              ? "bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
                              : "bg-white border-purple-200 text-black placeholder:text-zinc-400"
                          }`}
                        />
                        <button
                          onClick={() => addSubtask(idx, newTaskText)}
                          aria-label={t.mpAddTaskLabel}
                          className={`shrink-0 flex items-center justify-center h-7 w-7 rounded-lg transition ${
                            isDark ? "text-violet-300 bg-white/5 hover:bg-white/10" : "text-violet-700 bg-violet-50 hover:bg-violet-100"
                          }`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className={`text-[11px] ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                      {t.mpTrackHint}
                    </p>
                  )}
                </div>
              );
            })()}

            {selected.type === "goal" && (
              <div className="space-y-2">
                <div className={`flex items-center gap-2 font-bold text-[13px] ${isDark ? "text-violet-100" : "text-violet-950"}`}>
                  <Trophy className="h-4 w-4 text-amber-400" />
                  {goalTitle}
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
                  <div className={`font-bold text-[13px] ${isDark ? "text-violet-100" : "text-violet-950"}`}>
                    {localizedText(alt.profession.title, language)}
                  </div>
                  {alt.matchReason && (
                    <p className={`text-[11px] leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>{alt.matchReason}</p>
                  )}
                  {onExploreAlternatives && (
                    <button
                      onClick={onExploreAlternatives}
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1.5 rounded-lg mt-1 ${
                        isDark ? "text-violet-300 bg-white/5 hover:bg-white/10" : "text-violet-700 bg-violet-50 hover:bg-violet-100"
                      }`}
                    >
                      {t.mpExplorePath}
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
