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
 * WebGL2 + WebGPU): the scene renders correctly, but the element's own
 * "load" DOM event fires unreliably - in an isolated test page it never
 * fired at all despite the phoenix being fully visible on screen. Relying
 * on "load" alone made the honest-timeout fallback trigger on a scene that
 * had actually already loaded. Fixed by also polling the viewer's internal
 * `.spline` property (set by Spline's own runtime once the scene object
 * exists), whichever signal - the event or the poll - arrives first wins.
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
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    const readyTimeout = setTimeout(() => {
      if (!cancelled && statusRef.current === "loading") updateStatus("error");
    }, READY_TIMEOUT_MS);

    const markReady = () => {
      if (cancelled) return;
      if (pollInterval) clearInterval(pollInterval);
      updateStatus("ready");
    };

    loadSplineViewerScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        viewerEl = document.createElement("spline-viewer");
        viewerEl.setAttribute("url", SPLINE_SCENE_URL);
        viewerEl.style.width = "100%";
        viewerEl.style.height = "100%";
        viewerEl.addEventListener("load", markReady);
        viewerEl.addEventListener("error", (event) => {
          if (!cancelled) {
            // eslint-disable-next-line no-console
            console.error("[SplineHero] viewer reported an error", event);
            updateStatus("error");
          }
        });
        containerRef.current.appendChild(viewerEl);

        // Belt-and-suspenders: the "load" event has proven unreliable in
        // testing (scene visibly rendered, event never fired), so also
        // poll the viewer's own `.spline` runtime property as a second,
        // more trustworthy readiness signal.
        pollInterval = setInterval(() => {
          if (cancelled) return;
          if ((viewerEl as unknown as { spline?: unknown })?.spline) markReady();
        }, 250);
      })
      .catch(() => {
        if (!cancelled) updateStatus("error");
      });

    return () => {
      cancelled = true;
      clearTimeout(readyTimeout);
      if (pollInterval) clearInterval(pollInterval);
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
