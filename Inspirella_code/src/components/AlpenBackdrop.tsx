import { useEffect, useRef } from "react";
import BrandMark from "./BrandMark";

/**
 * The misty mountain backdrop behind the app pages (Alpenglühen theme; not on home or the map).
 * Each page has its own time of day and the light moves between them when you navigate; scrolling
 * makes the range sink a little, as if you were climbing above it; a swift crosses the sky on arrival.
 */
const TIME_OF: Record<string, string> = {
  dashboard: "dawn", onboarding: "dawn", login: "dawn",
  pathmap: "morning", resources: "noon", tracker: "afternoon",
  profile: "evening", contact: "evening", about: "evening", privacy: "noon", impressum: "noon"
};

export default function AlpenBackdrop({ tab }: { tab: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const swiftRef = useRef<HTMLDivElement>(null);

  // the swift flies once per page change
  useEffect(() => {
    const s = swiftRef.current;
    if (!s || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // once per visit: a greeting, not something to sit through on every page change
    try {
      if (window.sessionStorage.getItem("alp-flyby")) return;
      window.sessionStorage.setItem("alp-flyby", "1");
    } catch { /* storage blocked: still fly once per mount */ }
    s.classList.remove("go");
    void s.offsetWidth;
    s.classList.add("go");
  }, [tab]);

  // the range sinks while you scroll down (capped), the sun rises a little
  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let ticking = false;
    const frame = () => {
      ticking = false;
      const vh = window.innerHeight || 800;
      const p = Math.min(1, (window.scrollY || 0) / (vh * 1.6));
      root.style.setProperty("--climb", p.toFixed(3));
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
    window.addEventListener("scroll", onScroll, { passive: true });
    frame();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="alp-backdrop" data-time={TIME_OF[tab] ?? "dawn"} ref={rootRef} aria-hidden="true">
      <div className="bd-sun"><i /></div>
      <svg className="bd-r r1" viewBox="0 0 1440 300" preserveAspectRatio="xMidYMax slice">
        <path d="M0 170L80 150L150 160L230 126L300 142L380 108L440 124L520 92L590 120L660 100L740 132L820 90L900 116L980 70L1040 96L1110 80L1180 112L1260 88L1340 120L1440 100V300H0Z" />
      </svg>
      <svg className="bd-r r2" viewBox="0 0 1440 300" preserveAspectRatio="xMidYMax slice">
        <path d="M0 220L110 190L200 204L300 160L360 128L420 150L500 120L560 92L610 116L690 146L780 124L860 82L930 108L1010 150L1100 118L1170 96L1240 128L1330 150L1440 136V300H0Z" />
      </svg>
      <svg className="bd-r r3" viewBox="0 0 1440 300" preserveAspectRatio="xMidYMax slice">
        <path d="M0 260L140 232L260 246L400 214L520 240L660 220L800 248L940 226L1080 252L1220 222L1340 240L1440 230V300H0Z" />
      </svg>
      <div className="bd-mist" />
      <div className="bd-swift" ref={swiftRef}><BrandMark /></div>
    </div>
  );
}
