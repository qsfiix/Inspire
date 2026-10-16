import React, { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";
import type { LanguageCode, LearningPathStep, Profession, RouteBackground, TrackerChecklistItem, TrackerGoal, UserProfile } from "../types";
import { daysTo } from "../lib/trackerOps";
import { trackerUi, whenText } from "./trackerUi";
import { localizedText } from "../lib/localized";
import LadderExtras from "./LadderExtras";

interface Props {
  step: LearningPathStep;
  /** Tracker items of this phase; a micro step is ticked when the item with its title is completed. */
  items: TrackerChecklistItem[];
  /** False for guests without a tracker goal: the list is readable but cannot be ticked. */
  canTick: boolean;
  onToggle: (itemId: string) => void;
  profession: Profession;
  profile: UserProfile | null;
  route?: RouteBackground;
  language: LanguageCode;
  isDark: boolean;
  alternatives: Profession[];
  /** Every item of the tracker goal: the generated sub-tasks of a micro step hang off its item. */
  goalItems?: TrackerChecklistItem[];
  onPatchItem?: (itemId: string, patch: Partial<TrackerChecklistItem>) => void;
  trackers?: TrackerGoal[];
  onTrackersChange?: (updated: TrackerGoal[]) => void;
}

/** The micro steps of one ladder phase: tick, read the step, see the personal extras. */
export default function LadderSubsteps({ step, items, canTick, onToggle, profession, profile, route, language, isDark, alternatives, goalItems, onPatchItem, trackers, onTrackersChange }: Props) {
  const ui = trackerUi(language);
  const subs = step.substeps ?? [];
  const itemFor = (sub: LearningPathStep) => items.find(i => i.text === localizedText(sub.title, language));
  const doneIds = useMemo(() => new Set(subs.filter(s => itemFor(s)?.completed).map(s => s.id)), [subs, items, language]);
  const firstOpen = subs.find(s => !doneIds.has(s.id))?.id ?? null;
  const [openId, setOpenId] = useState<string | null>(firstOpen);

  return (
    <div className="space-y-1 pt-1">
      {subs.map((sub, i) => {
        const item = itemFor(sub);
        const done = doneIds.has(sub.id);
        const open = openId === sub.id;
        return (
          <div
            key={sub.id}
            className={`rounded-lg border ${
              done
                ? isDark ? "border-violet-400/25 bg-violet-500/10" : "border-violet-200 bg-violet-50"
                : isDark ? "border-white/10 bg-white/[0.03]" : "border-zinc-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-2 px-2.5 py-1.5">
              <button
                type="button"
                disabled={!canTick || !item}
                onClick={() => item && onToggle(item.id)}
                aria-label={done ? "Als offen markieren" : "Als erledigt markieren"}
                className="shrink-0 disabled:cursor-default"
              >
                <CheckCircle2 className={`h-4 w-4 ${done ? (isDark ? "text-violet-300" : "text-violet-700") : "opacity-30"}`} />
              </button>
              <button type="button" onClick={() => setOpenId(open ? null : sub.id)} className="flex flex-1 items-center gap-2 text-left" aria-expanded={open}>
                <span className={`flex-1 text-[12px] font-semibold ${done ? "line-through opacity-70" : ""} ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
                  <span className={`mr-1.5 font-mono text-[10px] ${isDark ? "text-zinc-400" : "text-zinc-400"}`}>{i + 1}.</span>
                  {localizedText(sub.title, language)}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition ${open ? "rotate-180" : ""} ${isDark ? "text-zinc-400" : "text-zinc-500"}`} />
              </button>
            </div>
            {open && (
              <div className="px-3 pb-2.5">
                {localizedText(sub.description, language) && (
                  <p className={`text-[11px] leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>{localizedText(sub.description, language)}</p>
                )}
                {item && goalItems && goalItems.some(c => c.parentId === item.id) && (
                  <ul className="mt-2 space-y-1">
                    {goalItems.filter(c => c.parentId === item.id).map(c => {
                      const days = c.completed ? null : daysTo(c.dueAt);
                      const kind = c.kind && c.kind !== "task" && c.kind !== "application" ? ui.kindLabel[c.kind] : null;
                      return (
                        <li key={c.id} className="flex flex-wrap items-center gap-2">
                          <button type="button" disabled={!canTick} onClick={() => onToggle(c.id)} aria-label={c.text} className="shrink-0 cursor-pointer disabled:cursor-default">
                            <CheckCircle2 className={`h-3.5 w-3.5 ${c.completed ? (isDark ? "text-violet-300" : "text-violet-700") : "opacity-30"}`} />
                          </button>
                          <span className={`flex-1 min-w-[10rem] text-[11px] ${c.completed ? "line-through opacity-60" : ""} ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                            {kind && <span className={`mr-1.5 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${isDark ? "border-violet-400/30 text-violet-200" : "border-violet-300 text-violet-800"}`}>{kind}</span>}
                            {c.text}
                          </span>
                          {onPatchItem && (
                            <input
                              type="date"
                              value={c.dueAt ?? ""}
                              onChange={e => onPatchItem(c.id, { dueAt: e.target.value || undefined })}
                              aria-label={ui.date}
                              className={`rounded-md border px-1.5 py-0.5 text-[10px] ${isDark ? "bg-white/5 border-white/15 text-white" : "bg-white border-violet-200 text-black"}`}
                            />
                          )}
                          {days !== null && <span className={`text-[10px] font-semibold ${days < 0 ? "text-red-500" : days <= 2 ? "text-amber-500" : isDark ? "text-zinc-400" : "text-zinc-600"}`}>{whenText(days, ui)}</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
                <LadderExtras step={sub} profession={profession} profile={profile} route={route} language={language} isDark={isDark} alternatives={alternatives} trackers={trackers} onTrackersChange={onTrackersChange} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
