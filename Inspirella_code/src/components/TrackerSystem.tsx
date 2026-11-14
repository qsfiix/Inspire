import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, CheckCircle, Circle, PlusCircle, Trophy, BarChart3, Star, HeartPulse, BrainCircuit, Activity, CalendarClock, AlertTriangle } from "lucide-react";
import { TrackerGoal, TrackerChecklistItem, LanguageCode } from "../types";
import { TRANSLATIONS } from "../data";
import SectionGlow from "./SectionGlow";
import TrackerNextUp from "./TrackerNextUp";
import TrackerBoard from "./TrackerBoard";
import { trackerUi, whenText } from "./trackerUi";
import { addItem, daysTo, goalProgress, newItem, onItemGoal, patchItem, removeItem, toggleItem } from "../lib/trackerOps";

interface TrackerSystemProps {
  currentLanguage: LanguageCode;
  trackers: TrackerGoal[];
  onTrackersChange: (updated: TrackerGoal[]) => void;
  theme?: string;
}

/**
 * Days between today and a "YYYY-MM-DD" due date; negative means overdue.
 * Exported so the dashboard's passive reminder banner (dashboard.tsx) can
 * reuse the exact same date math instead of a second, possibly-diverging copy.
 */
export const daysUntilDue = (dueDate?: string): number | null => {
  if (!dueDate) return null;
  const due = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

export default function TrackerSystem({
  currentLanguage,
  trackers,
  onTrackersChange,
  theme
}: TrackerSystemProps) {
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDesc, setNewGoalDesc] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState<TrackerGoal["category"]>("education");
  const [newGoalDueDate, setNewGoalDueDate] = useState("");
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({}); // goalId: text
  const t = TRANSLATIONS[currentLanguage];
  const ui = trackerUi(currentLanguage);
  const isDark = theme !== "light";
  const shownGoals = trackers.filter(g => g.kind !== "applications");

  const tCard = isDark
    ? "border border-violet-800/20 bg-[#0e0a16]/45 text-white"
    : "border-2 border-violet-950/20 bg-white text-indigo-950 shadow-md";

  const tCardAccent = isDark
    ? "bg-white/[0.02] border border-white/10"
    : "bg-violet-950/5 border border-violet-950/10 shadow-inner";

  const tTextTitle = "text-ink font-black";
  const tTextBody = "text-ink font-bold";
  const tTextSub = "text-ink font-extrabold";
  const tInput = isDark
    ? "border border-white/10 bg-white/5 text-white placeholder-zinc-500 focus:border-white/30"
    : "border-2 border-violet-950/20 bg-white text-indigo-950 placeholder-violet-950/45 focus:border-violet-950";

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const newGoal: TrackerGoal = {
      id: crypto.randomUUID(),
      title: newGoalTitle,
      category: newGoalCategory,
      description: newGoalDesc,
      streak: 0,
      progress: 0,
      items: [],
      createdAt: new Date().toISOString(),
      dueDate: newGoalDueDate || undefined
    };

    const updated = [newGoal, ...trackers];
    onTrackersChange(updated);
    setNewGoalTitle("");
    setNewGoalDesc("");
    setNewGoalDueDate("");
  };

  const handleDeleteGoal = (goalId: string) => {
    const updated = trackers.filter(g => g.id !== goalId);
    onTrackersChange(updated);
  };

  const handleAddChecklistItem = (goalId: string) => {
    const text = newItemTexts[goalId];
    if (!text || !text.trim()) return;
    onTrackersChange(trackers.map(g => (g.id === goalId ? addItem(g, newItem(text.trim(), { frequency: "daily" })) : g)));
    setNewItemTexts({ ...newItemTexts, [goalId]: "" });
  };

  const handleToggleItem = (goalId: string, itemId: string) => {
    const updated = trackers.map(g => {
      if (g.id !== goalId) return g;
      const next = toggleItem(g, itemId);
      // If items are completed, boost streak incrementally
      let nextStreak = g.streak;
      if (next.progress === 100 && g.progress < 100) nextStreak += 1;
      else if (next.progress < 100 && g.progress === 100) nextStreak = Math.max(0, nextStreak - 1);
      return { ...next, streak: nextStreak };
    });
    onTrackersChange(updated);
  };

  const handleDeleteItem = (goalId: string, itemId: string) => {
    onTrackersChange(trackers.map(g => (g.id === goalId ? removeItem(g, itemId) : g)));
  };

  const handlePatchItem = (itemId: string, patch: Partial<TrackerChecklistItem>) => {
    onTrackersChange(onItemGoal(trackers, itemId, g => patchItem(g, itemId, patch)));
  };


  const getCategoryIcon = (cat: TrackerGoal["category"]) => {
    switch (cat) {
      case "education":
        return <BrainCircuit className="h-5 w-5 text-violet-400" />;
      case "habit":
        return <Star className="h-5 w-5 text-indigo-400" />;
      case "sport":
        return <Activity className="h-5 w-5 text-rose-400" />;
      case "health":
        return <HeartPulse className="h-5 w-5 text-emerald-400" />;
      default:
        return <Trophy className="h-5 w-5 text-yellow-400" />;
    }
  };

  /** One checklist row: tick, date, kind, note. Sub-tasks (parentId) are drawn indented under their step. */
  const renderItem = (goal: TrackerGoal, item: TrackerChecklistItem, nested: boolean, children: TrackerChecklistItem[]) => {
    const days = item.completed ? null : daysTo(item.dueAt);
    const kindLabel = item.kind && item.kind !== "task" && item.kind !== "application" ? ui.kindLabel[item.kind] : null;
    const muted = "text-muted";
    return (
      <div key={item.id} className={`card-premium-accent text-xs ${nested ? "ml-5 p-2" : "p-2.5"}`}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => handleToggleItem(goal.id, item.id)}
            className={`flex-1 flex items-center gap-2.5 text-left transition relative cursor-pointer font-bold ${
              item.completed ? "text-zinc-500 line-through" : "text-ink"
            }`}
          >
            {item.completed ? (
              <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
            ) : (
              <Circle className={`h-4.5 w-4.5 shrink-0 text-muted`} />
            )}
            <span>{item.text}</span>
          </button>
          <button
            onClick={() => handleDeleteItem(goal.id, item.id)}
            aria-label={ui.remove}
            className="text-red-500 hover:text-red-700 p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 pl-7">
          {kindLabel && (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold border-line text-plum`}>{kindLabel}</span>
          )}
          <input
            type="date"
            value={item.dueAt ?? ""}
            onChange={e => handlePatchItem(item.id, { dueAt: e.target.value || undefined })}
            aria-label={ui.date}
            className={`rounded-md border px-1.5 py-0.5 text-[11px] bg-card border-line text-ink`}
          />
          {days !== null && (
            <span className={`text-[11px] font-semibold ${days < 0 ? "text-red-500" : days <= 2 ? "text-amber-500" : muted}`}>{whenText(days, ui)}</span>
          )}
          {children.length > 0 && (
            <span className={`text-[11px] ${muted}`}>{ui.subtasks.replace("{done}", String(children.filter(c => c.completed).length)).replace("{total}", String(children.length))}</span>
          )}
          {item.firm && <span className={`text-[11px] ${muted}`}>{item.firm.name}</span>}
        </div>
        {!nested && (
          <input
            value={item.note ?? ""}
            onChange={e => handlePatchItem(item.id, { note: e.target.value || undefined })}
            placeholder={ui.notePlaceholder}
            aria-label={ui.note}
            className={`mt-1.5 ml-7 w-[calc(100%-1.75rem)] rounded-md border px-2 py-1 text-[11px] outline-none bg-card border-line text-ink placeholder-muted`}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* One plain status line (the earlier stat tiles with 0% / 0 days read as a template and demotivated) */}
      {(() => {
        const steps = shownGoals.flatMap(g => g.items ?? []);
        const done = steps.filter(i => i.completed).length;
        const n = shownGoals.length;
        const line: Record<string, string> = {
          de: `${n} ${n === 1 ? "Ziel" : "Ziele"} aktiv${steps.length ? ` · ${done} von ${steps.length} Schritten erledigt` : ""}`,
          en: `${n} ${n === 1 ? "goal" : "goals"} active${steps.length ? ` · ${done} of ${steps.length} steps done` : ""}`,
          fr: `${n} ${n === 1 ? "objectif actif" : "objectifs actifs"}${steps.length ? ` · ${done} étape${done === 1 ? "" : "s"} sur ${steps.length} faite${done === 1 ? "" : "s"}` : ""}`,
          it: `${n} ${n === 1 ? "obiettivo attivo" : "obiettivi attivi"}${steps.length ? ` · ${done} di ${steps.length} passi fatti` : ""}`,
          uk: `Активних цілей: ${n}${steps.length ? ` · виконано ${done} з ${steps.length} кроків` : ""}`
        };
        return <p className={`text-sm font-medium ${isDark ? "text-zinc-300" : "text-[var(--ink-2)]"}`}>{line[currentLanguage] ?? line.en}</p>;
      })()}

      {/* Dates and reminders, application board, Schnupperlehre diary */}
      <TrackerNextUp language={currentLanguage} isDark={isDark} trackers={trackers} onTrackersChange={onTrackersChange} />
      <TrackerBoard language={currentLanguage} isDark={isDark} trackers={trackers} onTrackersChange={onTrackersChange} />

      {/* Goal Creation Deck */}
      <div className="card-premium p-6 text-left relative overflow-hidden">
        <SectionGlow isDark={isDark} corner="top-right" />
        <h2 className={`relative text-base font-bold mb-4 flex items-center gap-2 text-ink`}>
          <PlusCircle className="h-5 w-5 text-violet-500" />
          {t.createTracker}
        </h2>

        <form onSubmit={handleCreateGoal} className="grid gap-4 sm:grid-cols-7 items-end">
          <div className="sm:col-span-2">
            <label className={`block text-xs font-mono uppercase mb-1.5 text-ink font-extrabold`}>Goal Title *</label>
            <input
              type="text"
              value={newGoalTitle}
              onChange={(e) => setNewGoalTitle(e.target.value)}
              placeholder={t.trackerTitlePlace}
              required
              className={`w-full rounded-lg p-2.5 text-xs focus:outline-none ${tInput}`}
            />
          </div>

          <div className="sm:col-span-2">
            <label className={`block text-xs font-mono uppercase mb-1.5 text-ink font-extrabold`}>Brief Details / Milestone</label>
            <input
              type="text"
              value={newGoalDesc}
              onChange={(e) => setNewGoalDesc(e.target.value)}
              placeholder="e.g., 30 mins study session"
              className={`w-full rounded-lg p-2.5 text-xs focus:outline-none ${tInput}`}
            />
          </div>

          <div className="sm:col-span-1">
            <label className={`block text-xs font-mono uppercase mb-1.5 text-ink font-extrabold`}>Category</label>
            <select
              value={newGoalCategory}
              onChange={(e) => setNewGoalCategory(e.target.value as TrackerGoal["category"])}
              className={`w-full rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer ${tInput}`}
            >
              <option className="bg-mist text-ink font-semibold" value="education">{t.habitCat_education}</option>
              <option className="bg-mist text-ink font-semibold" value="habit">{t.habitCat_habit}</option>
              <option className="bg-mist text-ink font-semibold" value="sport">{t.habitCat_sport}</option>
              <option className="bg-mist text-ink font-semibold" value="health">{t.habitCat_health}</option>
              <option className="bg-mist text-ink font-semibold" value="productivity">{t.habitCat_productivity}</option>
              <option className="bg-mist text-ink font-semibold" value="other">{t.habitCat_other}</option>
            </select>
          </div>

          <div className="sm:col-span-1">
            <label className={`block text-xs font-mono uppercase mb-1.5 text-ink font-extrabold`}>{t.trackerDueDateLabel}</label>
            <input
              type="date"
              value={newGoalDueDate}
              onChange={(e) => setNewGoalDueDate(e.target.value)}
              className={`w-full rounded-lg p-2.5 text-xs focus:outline-none ${tInput}`}
            />
          </div>

          <div className="sm:col-span-1">
            <button
              type="submit"
              className="btn-primary w-full h-10 text-xs gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>{t.addGoalBtn}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Trackers List Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {shownGoals.length === 0 ? (
            <div className="card-premium md:col-span-2 py-12 text-center p-6 border-dashed">
              <Star className="h-8 w-8 text-violet-400 mx-auto mb-2" />
              <p className={`text-xs font-black text-ink`}>{t.noTrackers}</p>
            </div>
          ) : (
            shownGoals.map((goal) => (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="card-premium p-5 relative overflow-hidden flex flex-col justify-between text-left"
              >
                {/* Visual Category Flare Indicator */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-600 to-indigo-600"></div>

                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-lg border ${isDark ? "bg-white/5 border-white/10" : "bg-violet-50 border-violet-150"}`}>
                        {getCategoryIcon(goal.category)}
                      </div>
                      <div>
                        <h3 className={`text-sm font-bold tracking-tight text-ink font-black`}>{goal.title}</h3>
                        <p className={`text-xs ${isDark ? "text-zinc-400" : "text-violet-905 block font-bold"}`}>{goal.description || "Active Goal"}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isDark ? "text-zinc-400 hover:text-red-400 hover:bg-white/5" : "text-violet-950/70 hover:text-red-600 hover:bg-violet-50"}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Progress Indicators & Streaks */}
                  <div className="flex items-center justify-between text-xs mb-3 flex-wrap gap-1.5">
                    <span className={`font-mono text-xs uppercase text-ink font-extrabold`}>
                      {t.completionPercentage} • {goal.progress}%
                    </span>

                    <div className="flex items-center gap-1.5">
                      {goal.dueDate && (() => {
                        const days = daysUntilDue(goal.dueDate);
                        const isOverdue = days !== null && days < 0 && goal.progress < 100;
                        const isDueSoon = days !== null && days >= 0 && days <= 7 && goal.progress < 100;
                        return (
                          <span className={`font-mono text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-lg border backdrop-blur-md ${
                            isOverdue
                              ? (isDark ? "bg-red-500/10 text-red-300 border-red-500/20" : "bg-red-50 text-red-700 border-red-200 font-black")
                              : isDueSoon
                              ? (isDark ? "bg-amber-500/10 text-amber-300 border-amber-500/20" : "bg-amber-50 text-amber-800 border-amber-200 font-black")
                              : ("bg-mist text-ink border-line font-bold")
                          }`}>
                            {isOverdue ? <AlertTriangle className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />}
                            <span>
                              {isOverdue ? t.trackerOverdueBadge : isDueSoon ? t.trackerDueSoonBadge : t.trackerDuePrefix}
                              {" "}
                              {new Date(`${goal.dueDate}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          </span>
                        );
                      })()}

                      {goal.streak > 0 && (
                        <span className={`font-mono text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-lg border backdrop-blur-md ${
                          isDark ? "bg-white/5 text-amber-300 border-white/10 shadow-[0_0_8px_rgba(245,158,11,0.1)]" : "bg-amber-50 text-amber-950 border-amber-200 font-black shadow-sm"
                        }`}>
                          <Trophy className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                          <span>{goal.streak} {t.completeStreak}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className={`h-2 w-full rounded-full overflow-hidden mb-5 border bg-mist border-line`}>
                    <motion.div
                      className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${goal.progress}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>

                  {/* Sub Checklist Item Addition */}
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="text"
                      value={newItemTexts[goal.id] || ""}
                      onChange={(e) => setNewItemTexts({ ...newItemTexts, [goal.id]: e.target.value })}
                      placeholder={t.addChecklistItem}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddChecklistItem(goal.id);
                      }}
                      className={`flex-grow rounded-lg p-2 text-xs focus:outline-none ${tInput}`}
                    />
                    <button
                      onClick={() => handleAddChecklistItem(goal.id)}
                      className="btn-primary p-2 w-9 h-9 flex items-center justify-center shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Checklist Container */}
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {goal.items.filter(i => !i.parentId).map(item => {
                    const children = goal.items.filter(c => c.parentId === item.id);
                    return (
                      <div key={item.id} className="space-y-1">
                        {renderItem(goal, item, false, children)}
                        {children.map(child => renderItem(goal, child, true, []))}
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
