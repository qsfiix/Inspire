import React from "react";
import { AlertTriangle, CalendarClock, CalendarPlus, CheckCircle2, Circle } from "lucide-react";
import type { LanguageCode, TrackerGoal } from "../types";
import { buildIcs, nextUp, onItemGoal, patchItem, toggleItem, undatedAppointments, upcomingItems } from "../lib/trackerOps";
import { trackerUi, whenText } from "./trackerUi";

interface Props {
  language: LanguageCode;
  isDark: boolean;
  trackers: TrackerGoal[];
  onTrackersChange?: (updated: TrackerGoal[]) => void;
  /** Dashboard version: a few lines, no date editing, a link into the tracker. */
  compact?: boolean;
  onOpenTracker?: () => void;
}

/** "What is coming up": dated items, overdue first, plus appointments that still need a date. */
export default function TrackerNextUp({ language, isDark, trackers, onTrackersChange, compact, onOpenTracker }: Props) {
  const ui = trackerUi(language);
  const list = nextUp(trackers, compact ? 4 : 8);
  const undated = compact ? [] : undatedAppointments(trackers);
  if (compact && list.length === 0) return null;

  const setDate = (itemId: string, value: string) => {
    if (!onTrackersChange) return;
    onTrackersChange(onItemGoal(trackers, itemId, g => patchItem(g, itemId, { dueAt: value || undefined })));
  };
  const tick = (itemId: string) => {
    if (!onTrackersChange) return;
    onTrackersChange(onItemGoal(trackers, itemId, g => toggleItem(g, itemId)));
  };

  const downloadIcs = () => {
    const entries = upcomingItems(trackers).map(u => ({ item: u.item, goalTitle: u.goal.title }));
    if (entries.length === 0) return;
    const blob = new Blob([buildIcs(entries)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inspirella-termine.ics";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const card = isDark ? "border-white/10 bg-white/[0.03]" : "border-violet-200 bg-white";
  const muted = isDark ? "text-zinc-400" : "text-zinc-600";
  const hasOverdue = list.some(u => u.days < 0);
  const dateCls = `rounded-md border px-1.5 py-0.5 text-[11px] ${isDark ? "bg-white/5 border-white/15 text-white" : "bg-white border-violet-200 text-black"}`;

  return (
    <section className={`rounded-xl border p-4 text-left ${hasOverdue ? (isDark ? "border-red-500/25 bg-red-500/[0.04]" : "border-red-200 bg-red-50/60") : card}`} aria-label={ui.nextTitle}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className={`flex items-center gap-2 text-[13px] font-bold ${isDark ? "text-violet-100" : "text-violet-950"}`}>
          {hasOverdue ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <CalendarClock className="h-4 w-4 text-violet-500" />}
          {compact ? ui.weekTitle : ui.nextTitle}
        </h3>
        {compact ? (
          onOpenTracker && (
            <button type="button" onClick={onOpenTracker} className={`text-[11px] underline cursor-pointer ${isDark ? "text-violet-300" : "text-violet-700"}`}>
              {ui.weekAll}
            </button>
          )
        ) : (
          <button type="button" onClick={downloadIcs} title={ui.calendarHint} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold cursor-pointer ${isDark ? "border-white/15 text-zinc-200 hover:bg-white/5" : "border-violet-200 text-violet-900 hover:bg-violet-50"}`}>
            <CalendarPlus className="h-3.5 w-3.5" /> {ui.calendar}
          </button>
        )}
      </div>

      {list.length === 0 && <p className={`text-[12px] ${muted}`}>{ui.nextEmpty}</p>}

      <ul className="space-y-1.5">
        {list.map(({ goal, item, days }) => {
          const dated = Number.isFinite(days);
          return (
            <li key={item.id} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${card}`}>
              <button type="button" onClick={() => tick(item.id)} disabled={!onTrackersChange} aria-label={item.text} className="shrink-0 cursor-pointer disabled:cursor-default">
                {item.completed ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className={`h-4 w-4 ${isDark ? "text-zinc-500" : "text-violet-950/50"}`} />}
              </button>
              <div className="min-w-0 flex-1">
                <div className={`truncate text-[12px] font-semibold ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>
                  {item.text}
                  {item.firm && <span className={`font-normal ${muted}`}> · {item.firm.name}</span>}
                </div>
                <div className={`truncate text-[10px] ${muted}`}>{goal.kind === "applications" ? ui.boardTitle : goal.title}</div>
              </div>
              {dated && (
                <span className={`shrink-0 text-[11px] font-semibold ${days < 0 ? "text-red-500" : days <= 2 ? "text-amber-500" : muted}`}>{whenText(days, ui)}</span>
              )}
              {!compact && onTrackersChange && <input type="date" value={item.dueAt ?? ""} onChange={e => setDate(item.id, e.target.value)} aria-label={ui.date} className={dateCls} />}
            </li>
          );
        })}
      </ul>

      {undated.length > 0 && (
        <div className="mt-3">
          <div className={`text-[11px] font-bold ${isDark ? "text-amber-300" : "text-amber-800"}`}>{ui.noDateHead}</div>
          <p className={`mb-1.5 text-[11px] ${muted}`}>{ui.noDateHint}</p>
          <ul className="space-y-1.5">
            {undated.map(({ item, goal }) => (
              <li key={item.id} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${card}`}>
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-[12px] font-semibold ${isDark ? "text-zinc-100" : "text-zinc-900"}`}>{item.text}</div>
                  <div className={`truncate text-[10px] ${muted}`}>{goal.title}</div>
                </div>
                {onTrackersChange && <input type="date" value="" onChange={e => setDate(item.id, e.target.value)} aria-label={ui.setDate} className={dateCls} />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
