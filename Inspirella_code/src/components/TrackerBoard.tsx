import React, { useState } from "react";
import { ExternalLink, Plus, Star, Trash2 } from "lucide-react";
import type { ApplicationStatus, LanguageCode, TrackerChecklistItem, TrackerGoal } from "../types";
import { APPLICATION_STATUSES, findApplicationsGoal, newItem, patchItem, removeItem, withApplicationItem } from "../lib/trackerOps";
import { trackerUi } from "./trackerUi";

interface Props {
  language: LanguageCode;
  isDark: boolean;
  trackers: TrackerGoal[];
  onTrackersChange: (updated: TrackerGoal[]) => void;
}

const COLUMNS: Array<{ id: string; statuses: ApplicationStatus[] }> = [
  { id: "planned", statuses: ["planned"] },
  { id: "sent", statuses: ["sent"] },
  { id: "interview", statuses: ["interview"] },
  { id: "offer", statuses: ["offer"] },
  { id: "closed", statuses: ["rejected", "declined"] }
];

/** The application board (one card per firm, by status) and the Schnupperlehre diary. Both live in one tracker goal. */
export default function TrackerBoard({ language, isDark, trackers, onTrackersChange }: Props) {
  const ui = trackerUi(language);
  const goal = findApplicationsGoal(trackers);
  const apps = (goal?.items ?? []).filter(i => i.kind === "application");
  const log = (goal?.items ?? []).filter(i => i.kind === "schnupper").sort((a, b) => (b.dueAt ?? "").localeCompare(a.dueAt ?? ""));

  const [firmName, setFirmName] = useState("");
  const [logFirm, setLogFirm] = useState("");
  const [logDate, setLogDate] = useState("");
  const [logRating, setLogRating] = useState(0);
  const [logWould, setLogWould] = useState<boolean | undefined>(undefined);
  const [logNote, setLogNote] = useState("");

  const texts = { title: ui.boardTitle, description: ui.boardHint };
  const edit = (item: TrackerChecklistItem, patch: Partial<TrackerChecklistItem>) => {
    if (!goal) return;
    onTrackersChange(trackers.map(g => (g.id === goal.id ? patchItem(g, item.id, patch) : g)));
  };
  const remove = (item: TrackerChecklistItem) => {
    if (!goal) return;
    onTrackersChange(trackers.map(g => (g.id === goal.id ? removeItem(g, item.id) : g)));
  };

  const addApplication = (e: React.FormEvent) => {
    e.preventDefault();
    const name = firmName.trim();
    if (!name) return;
    onTrackersChange(withApplicationItem(trackers, texts, newItem(name, { kind: "application", appStatus: "planned", firm: { name } })));
    setFirmName("");
  };

  const addLog = (e: React.FormEvent) => {
    e.preventDefault();
    const name = logFirm.trim();
    if (!name) return;
    const rated = logRating > 0;
    onTrackersChange(
      withApplicationItem(
        trackers,
        texts,
        newItem(`${ui.kindLabel.schnupper} · ${name}`, {
          kind: "schnupper",
          firm: { name },
          dueAt: logDate || undefined,
          rating: rated ? logRating : undefined,
          wouldApply: logWould,
          note: logNote.trim() || undefined,
          completed: rated
        })
      )
    );
    setLogFirm("");
    setLogDate("");
    setLogRating(0);
    setLogWould(undefined);
    setLogNote("");
  };

  const card = isDark ? "border-white/10 bg-white/[0.03]" : "border-violet-200 bg-white";
  const muted = isDark ? "text-zinc-400" : "text-zinc-600";
  const input = `rounded-lg border px-2.5 py-1.5 text-[12px] outline-none ${isDark ? "bg-white/5 border-white/10 text-white placeholder-zinc-500" : "bg-white border-violet-200 text-black placeholder-zinc-500"}`;
  const head = `text-[13px] font-bold ${isDark ? "text-violet-100" : "text-violet-950"}`;
  const pill = (on: boolean) =>
    `rounded-full border px-3 py-1 text-[11px] font-semibold cursor-pointer ${on ? (isDark ? "bg-violet-500/25 border-violet-400/50 text-white" : "bg-violet-100 border-violet-300 text-violet-900") : isDark ? "border-white/10 text-zinc-300" : "border-zinc-200 text-zinc-700"}`;

  const stars = (value: number, onPick: (n: number) => void) => (
    <span className="inline-flex" role="group" aria-label={ui.logRating}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onPick(n === value ? 0 : n)} aria-label={`${n}`} className="cursor-pointer p-0.5">
          <Star className={`h-4 w-4 ${n <= value ? "fill-amber-400 text-amber-400" : isDark ? "text-zinc-600" : "text-zinc-300"}`} />
        </button>
      ))}
    </span>
  );

  return (
    <div className="grid gap-6 text-left lg:grid-cols-1">
      <section className={`rounded-xl border p-4 ${card}`} aria-label={ui.boardTitle}>
        <h3 className={head}>{ui.boardTitle}</h3>
        <p className={`mb-3 text-[11px] ${muted}`}>{ui.boardHint}</p>
        <form onSubmit={addApplication} className="mb-3 flex flex-wrap gap-2">
          <input value={firmName} onChange={e => setFirmName(e.target.value)} placeholder={ui.firmPlaceholder} className={`${input} min-w-[12rem] flex-1`} />
          <button type="submit" className="btn-primary inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px]">
            <Plus className="h-3.5 w-3.5" /> {ui.addFirm}
          </button>
        </form>
        {apps.length === 0 ? (
          <p className={`text-[12px] ${muted}`}>{ui.boardEmpty}</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            {COLUMNS.map(col => {
              const cards = apps.filter(a => col.statuses.includes(a.appStatus ?? "planned"));
              return (
                <div key={col.id} className={`rounded-lg border p-2 ${isDark ? "border-white/10 bg-black/10" : "border-violet-100 bg-violet-50/50"}`}>
                  <div className={`mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide ${isDark ? "text-zinc-300" : "text-violet-900"}`}>
                    <span>{col.id === "closed" ? `${ui.statusLabel.rejected} / ${ui.statusLabel.declined}` : ui.statusLabel[col.statuses[0]]}</span>
                    <span className={muted}>{cards.length}</span>
                  </div>
                  <div className="space-y-2">
                    {cards.map(a => (
                      <div key={a.id} className={`rounded-lg border p-2 ${card}`}>
                        <div className="flex items-start justify-between gap-1">
                          <div className={`text-[12px] font-semibold ${isDark ? "text-white" : "text-violet-950"}`}>
                            {a.firm?.name ?? a.text}
                            {a.firm?.url && (
                              <a href={a.firm.url} target="_blank" rel="noreferrer" className="ml-1 inline-block align-middle" aria-label={a.firm.name}>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          <button type="button" onClick={() => remove(a)} aria-label={ui.remove} className="cursor-pointer text-red-500">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <select
                          value={a.appStatus ?? "planned"}
                          onChange={e => edit(a, { appStatus: e.target.value as ApplicationStatus, completed: ["offer", "rejected", "declined"].includes(e.target.value) })}
                          className={`${input} mt-1.5 w-full`}
                        >
                          {APPLICATION_STATUSES.map(s => (
                            <option key={s} value={s}>{ui.statusLabel[s]}</option>
                          ))}
                        </select>
                        <input type="date" value={a.dueAt ?? ""} onChange={e => edit(a, { dueAt: e.target.value || undefined })} aria-label={ui.date} className={`${input} mt-1.5 w-full`} />
                        <input value={a.note ?? ""} onChange={e => edit(a, { note: e.target.value || undefined })} placeholder={ui.notePlaceholder} aria-label={ui.note} className={`${input} mt-1.5 w-full`} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className={`rounded-xl border p-4 ${card}`} aria-label={ui.logTitle}>
        <h3 className={head}>{ui.logTitle}</h3>
        <p className={`mb-3 text-[11px] ${muted}`}>{ui.logHint}</p>
        <form onSubmit={addLog} className="mb-3 grid gap-2 sm:grid-cols-2">
          <input value={logFirm} onChange={e => setLogFirm(e.target.value)} placeholder={ui.logFirm} aria-label={ui.logFirm} className={input} />
          <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} aria-label={ui.logDate} className={input} />
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] ${muted}`}>{ui.logRating}</span>
            {stars(logRating, setLogRating)}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] ${muted}`}>{ui.logWould}</span>
            <button type="button" className={pill(logWould === true)} onClick={() => setLogWould(logWould === true ? undefined : true)}>{ui.logYes}</button>
            <button type="button" className={pill(logWould === false)} onClick={() => setLogWould(logWould === false ? undefined : false)}>{ui.logNo}</button>
          </div>
          <input value={logNote} onChange={e => setLogNote(e.target.value)} placeholder={ui.logNoteHint} aria-label={ui.note} className={`${input} sm:col-span-2`} />
          <button type="submit" className="btn-primary inline-flex w-fit items-center gap-1.5 px-3 py-1.5 text-[11px]">
            <Plus className="h-3.5 w-3.5" /> {ui.logSave}
          </button>
        </form>
        {log.length === 0 ? (
          <p className={`text-[12px] ${muted}`}>{ui.logEmpty}</p>
        ) : (
          <ul className="space-y-2">
            {log.map(entry => (
              <li key={entry.id} className={`rounded-lg border p-2.5 ${card}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className={`text-[12px] font-semibold ${isDark ? "text-white" : "text-violet-950"}`}>
                    {entry.firm?.name ?? entry.text}
                    {entry.dueAt && <span className={`ml-2 font-normal ${muted}`}>{new Date(`${entry.dueAt}T00:00:00`).toLocaleDateString(language)}</span>}
                  </div>
                  <button type="button" onClick={() => remove(entry)} aria-label={ui.remove} className="cursor-pointer text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  {stars(entry.rating ?? 0, n => edit(entry, { rating: n || undefined, completed: n > 0 }))}
                  <span className="inline-flex items-center gap-1.5">
                    <button type="button" className={pill(entry.wouldApply === true)} onClick={() => edit(entry, { wouldApply: entry.wouldApply === true ? undefined : true })}>{ui.logYes}</button>
                    <button type="button" className={pill(entry.wouldApply === false)} onClick={() => edit(entry, { wouldApply: entry.wouldApply === false ? undefined : false })}>{ui.logNo}</button>
                  </span>
                </div>
                <input value={entry.note ?? ""} onChange={e => edit(entry, { note: e.target.value || undefined })} placeholder={ui.logNoteHint} aria-label={ui.note} className={`${input} mt-1.5 w-full`} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
