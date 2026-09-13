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
 * Verified 2026-09-14: the script and scene data both load successfully
 * (confirmed via direct fetch - 200 OK, ~1.9MB), but this session's sandboxed
 * preview browser has no WebGL2 support, so the scene itself never finished
 * initializing here. The code is written to work in a normal browser
 * regardless - Sofiia needs to confirm in her own browser whether it renders.
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
        viewerEl.addEventListener("load", () => {
          if (!cancelled) updateStatus("ready");
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
