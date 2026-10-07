import React, { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";
import type { LanguageCode, LearningPathStep, Profession, RouteBackground, TrackerChecklistItem, UserProfile } from "../types";
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
}

/** The micro steps of one ladder phase: tick, read the step, see the personal extras. */
export default function LadderSubsteps({ step, items, canTick, onToggle, profession, profile, route, language, isDark, alternatives }: Props) {
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
                  <span className={`mr-1.5 font-mono text-[10px] ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>{i + 1}.</span>
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
                <LadderExtras step={sub} profession={profession} profile={profile} route={route} language={language} isDark={isDark} alternatives={alternatives} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
