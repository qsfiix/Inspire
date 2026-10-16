import type { ApplicationStatus, LanguageCode, LearningPath, TrackerChecklistItem, TrackerFirmRef, TrackerGoal, TrackerItemKind } from "../types";
import { localizedText } from "./localized";
import { LADDER_CODE, PHASE_BY_ORDER, phaseWindow } from "../engine/ladder";
import { SUBTASK_TEMPLATES } from "../engine/subtaskTemplates";

/**
 * Pure operations on tracker goals: ticking with sub-task sync, dates, the
 * application board, Schnupperlehre log, reminders and the calendar export.
 * No React and no storage here, so everything can be tested.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Share of the top-level items that are done. Sub-tasks and board entries do not count on their own. */
export function goalProgress(items: TrackerChecklistItem[]): number {
  const top = items.filter(i => !i.parentId && i.kind !== "application");
  if (top.length === 0) return 0;
  return Math.round((top.filter(i => i.completed).length / top.length) * 100);
}

const withProgress = (goal: TrackerGoal, items: TrackerChecklistItem[]): TrackerGoal => ({ ...goal, items, progress: goalProgress(items) });

/** Ticks or unticks an item. A sub-task keeps its parent in step: the parent is done when all its sub-tasks are. */
export function toggleItem(goal: TrackerGoal, itemId: string): TrackerGoal {
  const target = goal.items.find(i => i.id === itemId);
  if (!target) return goal;
  const completed = !target.completed;
  let items = goal.items.map(i => (i.id === itemId ? { ...i, completed } : i));
  if (target.parentId) {
    const siblings = items.filter(i => i.parentId === target.parentId);
    const allDone = siblings.length > 0 && siblings.every(i => i.completed);
    items = items.map(i => (i.id === target.parentId ? { ...i, completed: allDone } : i));
  }
  return withProgress(goal, items);
}

export function patchItem(goal: TrackerGoal, itemId: string, patch: Partial<TrackerChecklistItem>): TrackerGoal {
  return withProgress(goal, goal.items.map(i => (i.id === itemId ? { ...i, ...patch } : i)));
}

export function addItem(goal: TrackerGoal, item: TrackerChecklistItem): TrackerGoal {
  return withProgress(goal, [...goal.items, item]);
}

/** Removes an item together with its sub-tasks. */
export function removeItem(goal: TrackerGoal, itemId: string): TrackerGoal {
  return withProgress(goal, goal.items.filter(i => i.id !== itemId && i.parentId !== itemId));
}

/** Applies a goal operation to the goal that holds the item. */
export function onItemGoal(trackers: TrackerGoal[], itemId: string, op: (goal: TrackerGoal) => TrackerGoal): TrackerGoal[] {
  return trackers.map(g => (g.items.some(i => i.id === itemId) ? op(g) : g));
}

export const newItem = (text: string, extra: Partial<TrackerChecklistItem> = {}): TrackerChecklistItem => ({
  id: crypto.randomUUID(),
  text,
  completed: false,
  frequency: "weekly",
  ...extra
});

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

export const toIsoDate = (d: Date): string => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Days from `now` to an ISO date; negative = overdue. */
export function daysTo(dueAt: string | undefined, now: Date = new Date()): number | null {
  if (!dueAt) return null;
  const due = new Date(`${dueAt}T00:00:00`);
  if (Number.isNaN(due.getTime())) return null;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / DAY_MS);
}

export interface Upcoming {
  goal: TrackerGoal;
  item: TrackerChecklistItem;
  days: number;
}

/** Open dated items of all goals, overdue first, then by date. `withinDays` caps how far ahead to look. */
export function upcomingItems(trackers: TrackerGoal[], opts: { withinDays?: number; now?: Date } = {}): Upcoming[] {
  const out: Upcoming[] = [];
  for (const goal of trackers) {
    for (const item of goal.items) {
      if (item.completed || !item.dueAt) continue;
      if (item.kind === "application" && (item.appStatus === "rejected" || item.appStatus === "declined")) continue;
      const days = daysTo(item.dueAt, opts.now);
      if (days === null) continue;
      if (opts.withinDays !== undefined && days > opts.withinDays) continue;
      out.push({ goal, item, days });
    }
  }
  return out.sort((a, b) => a.days - b.days || a.item.text.localeCompare(b.item.text));
}

/** Open appointments (Schnupperlehre / interview / deadline) that still have no date. */
export function undatedAppointments(trackers: TrackerGoal[]): Upcoming[] {
  const out: Upcoming[] = [];
  for (const goal of trackers) {
    for (const item of goal.items) {
      if (!item.completed && !item.dueAt && (item.kind === "schnupper" || item.kind === "interview" || item.kind === "deadline")) out.push({ goal, item, days: 0 });
    }
  }
  return out;
}

/** The next few things to do: dated items first, then the first open top-level item of each path goal. */
export function nextUp(trackers: TrackerGoal[], limit = 4, now: Date = new Date()): Upcoming[] {
  const dated = upcomingItems(trackers, { now }).filter(u => !u.item.parentId || u.days <= 14);
  const seen = new Set(dated.map(u => u.item.id));
  const rest: Upcoming[] = [];
  for (const goal of trackers) {
    if (goal.kind === "applications") continue;
    const open = goal.items.find(i => !i.completed && !i.parentId && !seen.has(i.id));
    if (open) rest.push({ goal, item: open, days: Number.POSITIVE_INFINITY });
  }
  return [...dated, ...rest].slice(0, limit);
}

// ---------------------------------------------------------------------------
// Ladder to tracker: sub-tasks with dates
// ---------------------------------------------------------------------------

/**
 * Adds the concrete sub-tasks of a ladder to its tracker goal. Each micro step
 * item gets 3-5 sub-tasks (from SUBTASK_TEMPLATES); the dates are spread over the
 * time window of the phase, from today when the phase is already running.
 * Appointments (Schnupperlehre, interview, deadlines) stay undated: only the
 * user knows the real date. Safe to run twice: steps that already have sub-tasks are skipped.
 */
export function expandLadderSubtasks(
  goal: TrackerGoal,
  path: LearningPath,
  language: LanguageCode,
  opts: { beruf: string; startYear: number; now?: Date }
): TrackerGoal {
  if (path.code !== LADDER_CODE) return goal;
  const now = opts.now ?? new Date();
  const add: TrackerChecklistItem[] = [];
  const parentPatch = new Map<string, string>();
  // Phases whose window is already over are caught up one after the other, two weeks each.
  let catchUp = now;

  for (const phase of path.steps) {
    const win = phaseWindow(phase.order ? PHASE_BY_ORDER[phase.order] : undefined, opts.startYear, now);
    const catchFrom = catchUp;
    if (win?.state === "past") catchUp = new Date(catchUp.getTime() + 14 * DAY_MS);
    for (const sub of phase.substeps ?? []) {
      const templates = sub.order ? SUBTASK_TEMPLATES[sub.order] : undefined;
      if (!templates) continue;
      const parent = goal.items.find(i => i.stepId === phase.id && i.text === localizedText(sub.title, language));
      if (!parent || goal.items.some(i => i.parentId === parent.id)) continue;

      const from = win ? (win.state === "ahead" ? win.from : win.state === "past" ? catchFrom : now) : undefined;
      const to = win?.state === "past" ? new Date(catchFrom.getTime() + 14 * DAY_MS) : win?.to ?? undefined;
      const canDate = !!from && !!to && to.getTime() > from.getTime();
      let lastDate: string | undefined;
      templates.forEach((tpl, idx) => {
        const kind: TrackerItemKind = tpl.kind ?? "task";
        const appointment = kind === "schnupper" || kind === "interview" || kind === "deadline";
        let dueAt: string | undefined;
        if (canDate && !appointment) {
          const span = to!.getTime() - from!.getTime();
          dueAt = toIsoDate(new Date(from!.getTime() + (span * (idx + 1)) / (templates.length + 1)));
          lastDate = dueAt;
        }
        add.push(
          newItem((tpl.text[language] ?? tpl.text.de).replace(/\{beruf\}/g, opts.beruf), {
            parentId: parent.id,
            kind: kind === "task" ? undefined : kind,
            dueAt
          })
        );
      });
      if (lastDate && !parent.dueAt) parentPatch.set(parent.id, lastDate);
    }
  }
  if (add.length === 0) return goal;
  const items = goal.items.map(i => (parentPatch.has(i.id) ? { ...i, dueAt: parentPatch.get(i.id) } : i));
  return withProgress(goal, [...items, ...add]);
}

// ---------------------------------------------------------------------------
// Applications board and Schnupperlehre log
// ---------------------------------------------------------------------------

export const APPLICATION_STATUSES: ApplicationStatus[] = ["planned", "sent", "interview", "offer", "rejected", "declined"];

export function findApplicationsGoal(trackers: TrackerGoal[] | undefined): TrackerGoal | undefined {
  return trackers?.find(g => g.kind === "applications");
}

export function buildApplicationsGoal(title: string, description: string): TrackerGoal {
  return { id: crypto.randomUUID(), title, category: "education", description, streak: 0, progress: 0, items: [], createdAt: new Date().toISOString(), kind: "applications" };
}

/** Puts an item into the applications goal, creating the goal when needed. */
export function withApplicationItem(trackers: TrackerGoal[], goalTexts: { title: string; description: string }, item: TrackerChecklistItem): TrackerGoal[] {
  const existing = findApplicationsGoal(trackers);
  if (existing) return trackers.map(g => (g.id === existing.id ? addItem(g, item) : g));
  return [addItem(buildApplicationsGoal(goalTexts.title, goalTexts.description), item), ...trackers];
}

const normalizeName = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u00c0-\u024f]+/g, " ").trim();
export const firmKey = (firm: TrackerFirmRef): string => (firm.id ? `id:${firm.id}` : `name:${normalizeName(firm.name)}`);

export interface FirmSignal {
  status?: ApplicationStatus;
  rating?: number;
  wouldApply?: boolean;
  schnuppered: boolean;
}

/** What the user's tracker says about each firm: used to reorder the firm suggestions. */
export function firmSignals(trackers: TrackerGoal[] | undefined): Map<string, FirmSignal> {
  const map = new Map<string, FirmSignal>();
  for (const goal of trackers ?? []) {
    for (const item of goal.items) {
      if (!item.firm) continue;
      const key = firmKey(item.firm);
      const sig = map.get(key) ?? { schnuppered: false };
      if (item.kind === "application" && item.appStatus) sig.status = item.appStatus;
      if (item.kind === "schnupper") {
        sig.schnuppered = sig.schnuppered || item.completed || item.rating !== undefined;
        if (item.rating !== undefined) sig.rating = item.rating;
        if (item.wouldApply !== undefined) sig.wouldApply = item.wouldApply;
      }
      map.set(key, sig);
    }
  }
  return map;
}

/** The signal for one directory firm: by id when the tracker entry came from the directory, else by name. */
export function signalForFirm(signals: Map<string, FirmSignal>, firm: { id?: string; name: string }): FirmSignal | undefined {
  return (firm.id ? signals.get(`id:${firm.id}`) : undefined) ?? signals.get(`name:${normalizeName(firm.name)}`);
}

/** Score change for a firm from the user's own experience. */
export function firmSignalScore(sig: FirmSignal | undefined): number {
  if (!sig) return 0;
  let score = 0;
  if (sig.wouldApply === true || (sig.rating ?? 0) >= 4) score += 30;
  if (sig.wouldApply === false || (sig.rating !== undefined && sig.rating <= 2)) score -= 60;
  if (sig.status === "rejected" || sig.status === "declined") score -= 40;
  return score;
}

// ---------------------------------------------------------------------------
// Calendar export (.ics): reminders outside the site, no server needed
// ---------------------------------------------------------------------------

const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const icsDate = (iso: string) => iso.replace(/-/g, "");

/** An all-day event per dated item, each with a reminder the day before. */
export function buildIcs(entries: Array<{ item: TrackerChecklistItem; goalTitle: string }>, now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Inspirella//Tracker//EN", "CALSCALE:GREGORIAN"];
  for (const { item, goalTitle } of entries) {
    if (!item.dueAt) continue;
    const start = new Date(`${item.dueAt}T00:00:00Z`);
    if (Number.isNaN(start.getTime())) continue;
    const end = new Date(start.getTime() + DAY_MS).toISOString().slice(0, 10);
    const summary = item.firm ? `${item.text} (${item.firm.name})` : item.text;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${item.id}@inspirella`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${icsDate(item.dueAt)}`,
      `DTEND;VALUE=DATE:${icsDate(end)}`,
      `SUMMARY:${icsEscape(summary)}`,
      `DESCRIPTION:${icsEscape([goalTitle, item.note].filter(Boolean).join(" - "))}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${icsEscape(summary)}`,
      "TRIGGER:-P1D",
      "END:VALARM",
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
