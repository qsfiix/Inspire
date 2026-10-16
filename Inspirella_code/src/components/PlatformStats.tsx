import { useEffect, useState } from "react";
import { DataRepository } from "../data/Repository";

interface PlatformStatsProps {
  isDark: boolean;
  labels: { institutions: string; professions: string; learningPaths: string; languages: string };
  /** "left" centers on mobile and left-aligns from the lg breakpoint up, to match a two-column hero layout. Defaults to always-centered. */
  align?: "center" | "left";
}

/**
 * Real, live row counts from Supabase, animated as a count-up strip under
 * the hero CTAs. Exists to answer "is this actually a real, substantial
 * project?" at a glance - with true numbers, not a decorative placeholder.
 * Renders nothing if Supabase isn't reachable (DataRepository.getPlatformStats
 * returns null) rather than showing a fabricated or zeroed-out figure.
 */
export default function PlatformStats({ isDark, labels, align = "center" }: PlatformStatsProps) {
  const [stats, setStats] = useState<{ institutions: number; professions: number; learningPaths: number } | null>(null);

  useEffect(() => {
    let active = true;
    DataRepository.getPlatformStats().then(result => {
      if (active) setStats(result);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!stats) return null;

  const items = [
    { value: stats.institutions, label: labels.institutions, plus: true },
    { value: stats.professions, label: labels.professions, plus: true },
    { value: stats.learningPaths, label: labels.learningPaths, plus: true },
    { value: 4, label: labels.languages, plus: false } // exactly four: no "+"
  ];

  return (
    <div className={`flex flex-wrap items-center gap-x-8 gap-y-4 pt-6 ${
      align === "left" ? "justify-center lg:justify-start" : "justify-center"
    }`}>
      {items.map((item, idx) => (
        <div key={item.label} className="flex items-center gap-x-8">
          <StatCount value={item.value} label={item.label} plus={item.plus} isDark={isDark} delay={idx * 120} />
          {idx < items.length - 1 && (
            <span className={`hidden sm:block h-8 w-px ${isDark ? "bg-white/10" : "bg-violet-950/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function StatCount({ value, label, plus, isDark, delay }: { value: number; label: string; plus: boolean; isDark: boolean; delay: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }

    const duration = 1200;
    let raf: number;
    const timer = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
        setDisplay(Math.round(eased * value));
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [value, delay]);

  return (
    <div className="text-center">
      <span className={`block font-mono text-2xl md:text-3xl font-black tabular-nums ${isDark ? "text-white" : "text-violet-950"}`}>
        {display}
        {plus && <span className={isDark ? "text-violet-400" : "text-violet-600"}>+</span>}
      </span>
      <span className={`block text-[11px] font-mono uppercase tracking-widest mt-0.5 ${isDark ? "text-zinc-400" : "text-violet-950/70 font-bold"}`}>
        {label}
      </span>
    </div>
  );
}
