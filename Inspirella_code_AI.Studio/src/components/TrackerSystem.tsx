import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, CheckCircle, Circle, PlusCircle, Trophy, BarChart3, Star, HeartPulse, BrainCircuit, Activity } from "lucide-react";
import { TrackerGoal, TrackerChecklistItem, LanguageCode } from "../types";
import { TRANSLATIONS } from "../data";

interface TrackerSystemProps {
  currentLanguage: LanguageCode;
  trackers: TrackerGoal[];
  onTrackersChange: (updated: TrackerGoal[]) => void;
  theme?: string;
}

export default function TrackerSystem({
  currentLanguage,
  trackers,
  onTrackersChange,
  theme
}: TrackerSystemProps) {
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDesc, setNewGoalDesc] = useState("");
  const [newGoalCategory, setNewGoalCategory] = useState<TrackerGoal["category"]>("education");
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({}); // goalId: text
  const t = TRANSLATIONS[currentLanguage];
  const isDark = theme !== "light";

  const tCard = isDark
    ? "border border-violet-800/20 bg-[#0e0a16]/45 text-white"
    : "border-2 border-violet-950/20 bg-white text-indigo-950 shadow-md";

  const tCardAccent = isDark
    ? "bg-white/[0.02] border border-white/10"
    : "bg-violet-950/5 border border-violet-950/10 shadow-inner";

  const tTextTitle = isDark ? "text-violet-200" : "text-black font-black";
  const tTextBody = isDark ? "text-zinc-200" : "text-black font-bold";
  const tTextSub = isDark ? "text-zinc-300" : "text-black font-extrabold";
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
      createdAt: new Date().toISOString()
    };

    const updated = [newGoal, ...trackers];
    onTrackersChange(updated);
    setNewGoalTitle("");
    setNewGoalDesc("");
  };

  const handleDeleteGoal = (goalId: string) => {
    const updated = trackers.filter(g => g.id !== goalId);
    onTrackersChange(updated);
  };

  const handleAddChecklistItem = (goalId: string) => {
    const text = newItemTexts[goalId];
    if (!text || !text.trim()) return;

    const updated = trackers.map(g => {
      if (g.id === goalId) {
        const newItem: TrackerChecklistItem = {
          id: crypto.randomUUID(),
          text: text,
          completed: false,
          frequency: "daily"
        };
        const nextItems = [...g.items, newItem];
        return {
          ...g,
          items: nextItems,
          progress: calculateProgress(nextItems)
        };
      }
      return g;
    });

    onTrackersChange(updated);
    setNewItemTexts({
      ...newItemTexts,
      [goalId]: ""
    });
  };

  const handleToggleItem = (goalId: string, itemId: string) => {
    const updated = trackers.map(g => {
      if (g.id === goalId) {
        const nextItems = g.items.map(i => {
          if (i.id === itemId) {
            return { ...i, completed: !i.completed };
          }
          return i;
        });

        // Calculate progress
        const nextProgress = calculateProgress(nextItems);
        // If items are completed, boost streak incrementally
        let nextStreak = g.streak;
        if (nextProgress === 100 && g.progress < 100) {
          nextStreak += 1;
        } else if (nextProgress < 100 && g.progress === 100) {
          nextStreak = Math.max(0, nextStreak - 1);
        }

        return {
          ...g,
          items: nextItems,
          progress: nextProgress,
          streak: nextStreak
        };
      }
      return g;
    });

    onTrackersChange(updated);
  };

  const handleDeleteItem = (goalId: string, itemId: string) => {
    const updated = trackers.map(g => {
      if (g.id === goalId) {
        const nextItems = g.items.filter(i => i.id !== itemId);
        return {
          ...g,
          items: nextItems,
          progress: calculateProgress(nextItems)
        };
      }
      return g;
    });
    onTrackersChange(updated);
  };

  const calculateProgress = (items: TrackerChecklistItem[]): number => {
    if (items.length === 0) return 0;
    const completed = items.filter(i => i.completed).length;
    return Math.round((completed / items.length) * 100);
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

  return (
    <div className="space-y-8">
      {/* Intro Metrics Banner */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-premium p-5 flex items-center gap-4 text-left">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 transition-transform hover:scale-105 ${isDark ? "bg-violet-500/10 text-violet-300 border border-violet-500/20" : "bg-violet-50 text-violet-700 border border-violet-200"}`}>
            <Trophy className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className={`block text-[10px] font-mono uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-violet-900/60 font-bold"}`}>Active Goals</span>
            <span className={`font-sans text-lg font-black block mt-0.5 ${isDark ? "text-white" : "text-violet-950"}`}>{trackers.length} active</span>
          </div>
        </div>

        <div className="card-premium p-5 flex items-center gap-4 text-left">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 transition-transform hover:scale-105 ${isDark ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
            <BarChart3 className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className={`block text-[10px] font-mono uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-violet-900/60 font-bold"}`}>Average Progress</span>
            <span className={`font-sans text-lg font-black block mt-0.5 ${isDark ? "text-white" : "text-violet-950"}`}>
              {trackers.length > 0
                ? Math.round(trackers.reduce((acc, curr) => acc + curr.progress, 0) / trackers.length)
                : 0}% Done
            </span>
          </div>
        </div>

        <div className="card-premium p-5 flex items-center gap-4 text-left">
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 transition-transform hover:scale-105 ${isDark ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20" : "bg-indigo-50 text-indigo-700 border border-indigo-200"}`}>
            <Activity className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className={`block text-[10px] font-mono uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-violet-900/60 font-bold"}`}>Peak Streak</span>
            <span className={`font-sans text-lg font-black block mt-0.5 ${isDark ? "text-white" : "text-violet-950"}`}>
              {trackers.length > 0 ? Math.max(...trackers.map(t => t.streak), 0) : 0} days
            </span>
          </div>
        </div>
      </div>

      {/* Goal Creation Deck */}
      <div className="card-premium p-6 text-left">
        <h3 className={`text-base font-bold mb-4 flex items-center gap-2 ${isDark ? "text-violet-200" : "text-violet-950"}`}>
          <PlusCircle className="h-5 w-5 text-violet-500" />
          {t.createTracker}
        </h3>

        <form onSubmit={handleCreateGoal} className="grid gap-4 sm:grid-cols-6 items-end">
          <div className="sm:col-span-2">
            <label className={`block text-[10px] font-mono uppercase mb-1.5 ${isDark ? "text-zinc-300" : "text-violet-900 font-extrabold"}`}>Goal Title *</label>
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
            <label className={`block text-[10px] font-mono uppercase mb-1.5 ${isDark ? "text-zinc-300" : "text-violet-900 font-extrabold"}`}>Brief Details / Milestone</label>
            <input
              type="text"
              value={newGoalDesc}
              onChange={(e) => setNewGoalDesc(e.target.value)}
              placeholder="e.g., 30 mins study session"
              className={`w-full rounded-lg p-2.5 text-xs focus:outline-none ${tInput}`}
            />
          </div>

          <div className="sm:col-span-1">
            <label className={`block text-[10px] font-mono uppercase mb-1.5 ${isDark ? "text-zinc-300" : "text-violet-900 font-extrabold"}`}>Category</label>
            <select
              value={newGoalCategory}
              onChange={(e) => setNewGoalCategory(e.target.value as TrackerGoal["category"])}
              className={`w-full rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer ${tInput}`}
            >
              <option className={isDark ? "bg-zinc-950 text-white" : "bg-purple-100 text-black font-semibold"} value="education">{t.habitCat_education}</option>
              <option className={isDark ? "bg-zinc-950 text-white" : "bg-purple-100 text-black font-semibold"} value="habit">{t.habitCat_habit}</option>
              <option className={isDark ? "bg-zinc-950 text-white" : "bg-purple-100 text-black font-semibold"} value="sport">{t.habitCat_habit}</option>
              <option className={isDark ? "bg-zinc-950 text-white" : "bg-purple-100 text-black font-semibold"} value="health">{t.habitCat_health}</option>
              <option className={isDark ? "bg-zinc-950 text-white" : "bg-purple-100 text-black font-semibold"} value="productivity">{t.habitCat_productivity}</option>
              <option className={isDark ? "bg-zinc-950 text-white" : "bg-purple-100 text-black font-semibold"} value="other">{t.habitCat_other}</option>
            </select>
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
          {trackers.length === 0 ? (
            <div className="card-premium md:col-span-2 py-12 text-center p-6 border-dashed">
              <Star className="h-8 w-8 text-violet-400 mx-auto mb-2 animate-bounce" />
              <p className={`text-xs font-black ${isDark ? "text-zinc-400" : "text-violet-950"}`}>{t.noTrackers}</p>
            </div>
          ) : (
            trackers.map((goal) => (
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
                        <h4 className={`text-sm font-bold tracking-tight ${isDark ? "text-white" : "text-violet-950 font-black"}`}>{goal.title}</h4>
                        <p className={`text-[10px] ${isDark ? "text-zinc-400" : "text-violet-905 block font-bold"}`}>{goal.description || "Active Goal"}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isDark ? "text-zinc-400 hover:text-red-400 hover:bg-white/5" : "text-violet-950/60 hover:text-red-600 hover:bg-violet-50"}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Progress Indicators & Streaks */}
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className={`font-mono text-[10px] uppercase ${isDark ? "text-zinc-300 font-bold" : "text-violet-950 font-extrabold"}`}>
                      {t.completionPercentage} • {goal.progress}%
                    </span>
                    
                    {goal.streak > 0 && (
                      <span className={`font-mono text-[10px] flex items-center gap-1.5 px-2.5 py-1 rounded-lg border backdrop-blur-md ${
                        isDark ? "bg-white/5 text-amber-300 border-white/10 shadow-[0_0_8px_rgba(245,158,11,0.1)]" : "bg-amber-50 text-amber-950 border-amber-200 font-black shadow-sm"
                      }`}>
                        <Trophy className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                        <span>{goal.streak} {t.completeStreak}</span>
                      </span>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className={`h-2 w-full rounded-full overflow-hidden mb-5 border ${isDark ? "bg-white/5 border-white/5" : "bg-violet-100 border-violet-200"}`}>
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
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {goal.items.map((item) => (
                    <div
                      key={item.id}
                      className="card-premium-accent p-2.5 text-xs flex items-center justify-between"
                    >
                      <button
                        onClick={() => handleToggleItem(goal.id, item.id)}
                        className={`flex-1 flex items-center gap-2.5 text-left transition relative cursor-pointer font-bold ${
                          item.completed ? "text-zinc-500 line-through" : isDark ? "text-zinc-100" : "text-violet-950"
                        }`}
                      >
                        {item.completed ? (
                          <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                        ) : (
                          <Circle className={`h-4.5 w-4.5 shrink-0 ${isDark ? "text-zinc-500" : "text-violet-950/60"}`} />
                        )}
                        <span>{item.text}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteItem(goal.id, item.id)}
                        className={`text-red-500 hover:text-red-700 p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-red-500/10`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
