import { useEffect, useRef, useState } from "react";

/**
 * Sofiia's own 3D phoenix model (built in Spline), embedded via Spline's
 * official web-component viewer loaded from their CDN - no npm dependency
 * added, matching the project's "be deliberate about new dependencies"
 * habit (see Decisions.md) for what's otherwise a single decorative element.
 *
 * This is a genuine WebGL scene (~2MB of scene data, its own render loop),
 * so it's loaded lazily and given a hard timeout: if it hasn't reported
 * success by then, `onStatus("error")` fires and the caller falls back to
 * the flat 2D hero background instead of leaving an empty box on screen.
 * Verified 2026-09-13 in Sofiia's real Edge browser (hardware-accelerated
 * WebGL2 + WebGPU): the scene renders correctly. The bug was ours, twice:
 * the plain "load" DOM event this used to listen for is never dispatched
 * by the component at all (confirmed by reading spline-viewer.js's own
 * source) - the real completion event is "load-complete". A follow-up fix
 * that polled a `.spline` property was also wrong: that field exists only
 * as the private `_spline` internal, never a public `.spline`. Listening
 * for the correct "load-complete" event is the actual fix.
 */

const SPLINE_SCENE_URL = "https://prod.spline.design/F-79qzszcnNncEMu/scene.splinecode";
const SPLINE_VIEWER_SCRIPT = "https://cdn.spline.design/@splinetool/viewer@2.0.46/build/spline-viewer.js";
const READY_TIMEOUT_MS = 9000;

let scriptPromise: Promise<void> | null = null;
function loadSplineViewerScript(): Promise<void> {
  if (typeof window !== "undefined" && window.customElements?.get("spline-viewer")) {
    return Promise.resolve();
  }
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.type = "module";
      script.src = SPLINE_VIEWER_SCRIPT;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load the Spline viewer script"));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export type SplineHeroStatus = "loading" | "ready" | "error";

interface SplineHeroProps {
  onStatusChange?: (status: SplineHeroStatus) => void;
  className?: string;
}

export default function SplineHero({ onStatusChange, className }: SplineHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<SplineHeroStatus>("loading");
  const statusRef = useRef<SplineHeroStatus>("loading");

  const updateStatus = (next: SplineHeroStatus) => {
    statusRef.current = next;
    setStatus(next);
    onStatusChange?.(next);
  };

  useEffect(() => {
    let cancelled = false;
    let viewerEl: HTMLElement | null = null;
    const readyTimeout = setTimeout(() => {
      if (!cancelled && statusRef.current === "loading") updateStatus("error");
    }, READY_TIMEOUT_MS);

    loadSplineViewerScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        viewerEl = document.createElement("spline-viewer");
        viewerEl.setAttribute("url", SPLINE_SCENE_URL);
        viewerEl.style.width = "100%";
        viewerEl.style.height = "100%";
        // The real completion event - see the file header note. "load" is
        // NOT dispatched by this component and was the original bug here.
        viewerEl.addEventListener("load-complete", () => {
          if (!cancelled) updateStatus("ready");
        });
        viewerEl.addEventListener("error", (event) => {
          if (!cancelled) {
            // eslint-disable-next-line no-console
            console.error("[SplineHero] viewer reported an error", event);
            updateStatus("error");
          }
        });
        containerRef.current.appendChild(viewerEl);
      })
      .catch(() => {
        if (!cancelled) updateStatus("error");
      });

    return () => {
      cancelled = true;
      clearTimeout(readyTimeout);
      viewerEl?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ opacity: status === "ready" ? 1 : 0, transition: "opacity 0.6s ease" }}
      aria-hidden="true"
    />
  );
}
