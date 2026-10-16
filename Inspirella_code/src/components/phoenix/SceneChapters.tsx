import { useEffect, useState } from "react";

/**
 * A slim "chapter" rail on the right edge of the home page (desktop only),
 * in the spirit of scroll-story sites: 01 Phoenix, 02 Switzerland, 03 Path,
 * 04 Beyond. Tracks the same `data-scene-anchor` elements PhoenixScene uses,
 * so the highlighted chapter always matches the shape on screen. Clicking a
 * chapter scrolls its anchor to the middle of the viewport.
 */
export default function SceneChapters({ labels, isDark }: { labels: string[]; isDark: boolean }) {
  const [active, setActive] = useState(0);
  // The active label flashes in for a moment whenever the chapter changes
  // (so the rail never reads as bare numbers), then gets out of the way.
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    setFlash(true);
    const id = window.setTimeout(() => setFlash(false), 2200);
    return () => window.clearTimeout(id);
  }, [active]);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = window.innerHeight * 0.5;
      let best = 0;
      let bestDist = Infinity;
      document.querySelectorAll<HTMLElement>("[data-scene-anchor]").forEach(el => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestDist) {
          bestDist = d;
          best = Number(el.dataset.sceneAnchor);
        }
      });
      setActive(best);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const goTo = (i: number) => {
    const el = [...document.querySelectorAll<HTMLElement>(`[data-scene-anchor="${i}"]`)].find(
      e => e.getBoundingClientRect().height > 0
    );
    if (!el) return;
    const r = el.getBoundingClientRect();
    const target = window.scrollY + r.top + r.height / 2 - window.innerHeight / 2;
    window.scrollTo({ top: i === 0 ? 0 : target, behavior: "smooth" });
  };

  return (
    <nav
      aria-label="Page chapters"
      className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-4"
    >
      {labels.map((label, i) => {
        const on = i === active;
        return (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-current={on ? "step" : undefined}
            className="group flex items-center justify-end gap-3 cursor-pointer"
          >
            <span
              className={`text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-500 ${
                on
                  ? `${flash ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"} group-hover:opacity-100 group-hover:translate-x-0 2xl:opacity-100 2xl:translate-x-0 rounded-full px-2 py-0.5 backdrop-blur-md ${isDark ? "text-violet-100 bg-black/40" : "text-violet-800 bg-white/70"}`
                  : `opacity-0 translate-x-2 group-hover:opacity-70 group-hover:translate-x-0 ${isDark ? "text-zinc-400" : "text-violet-900/60"}`
              }`}
            >
              {label}
            </span>
            <span className={`text-[11px] font-mono tabular-nums transition-colors duration-500 ${on ? "text-violet-300" : isDark ? "text-zinc-400" : "text-violet-900/60"}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span
              className={`block rounded-full transition-all duration-500 ${
                on
                  ? "h-8 w-[3px] bg-gradient-to-b from-violet-400 to-fuchsia-400 shadow-[0_0_12px_rgba(167,139,250,0.9)]"
                  : isDark ? "h-3 w-[3px] bg-white/20 group-hover:bg-white/40" : "h-3 w-[3px] bg-violet-900/20 group-hover:bg-violet-900/40"
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}
