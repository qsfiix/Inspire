/**
 * The hero's visual signature (ambient violet glow + a fragment of the
 * constellation network), extracted into a small reusable piece so the
 * rest of the site can carry the same "this is Inspirella" feel without
 * copy-pasting HeroBackground's full 200+ lines everywhere.
 *
 * Deliberately lighter than the hero version: one glow blob (not three)
 * and a small handful of nodes (not the full 20-node network) - this is
 * meant as a quiet accent behind a page's intro section, not a second
 * hero. Sofiia's request (2026-09-14): carry the hero's glow+network
 * style across the site, "without overload" ("без перегруза").
 *
 * Purely decorative - absolutely positioned behind content, pointer-events
 * none, respects prefers-reduced-motion via the shared hero-* keyframes
 * already defined in index.css.
 */

interface SectionGlowProps {
  isDark: boolean;
  /** Where the glow blob sits within its positioned parent. */
  corner?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
  /** Show a tiny constellation fragment alongside the glow. Off by default - most spots only need the glow. */
  showNodes?: boolean;
  className?: string;
}

const CORNER_CLASSES: Record<NonNullable<SectionGlowProps["corner"]>, string> = {
  "top-left": "-top-24 -left-24",
  "top-right": "-top-24 -right-24",
  "bottom-left": "-bottom-24 -left-24",
  "bottom-right": "-bottom-24 -right-24",
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
};

// A small 6-node fragment (not the hero's full network) - just enough to
// read as "the same visual language", on a 300x200 local canvas.
const MINI_NODES: { x: number; y: number }[] = [
  { x: 30, y: 150 },
  { x: 90, y: 60 },
  { x: 160, y: 110 },
  { x: 220, y: 40 },
  { x: 270, y: 130 },
  { x: 150, y: 180 }
];
const MINI_EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [2, 5]
];

export default function SectionGlow({ isDark, corner = "top-right", showNodes = false, className = "" }: SectionGlowProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`} aria-hidden="true">
      <div
        className={`hero-blob absolute ${CORNER_CLASSES[corner]} h-80 w-80 rounded-full blur-[100px]`}
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(139,92,246,0.22) 0%, rgba(99,102,241,0) 70%)"
            : "radial-gradient(circle, rgba(139,92,246,0.16) 0%, rgba(99,102,241,0) 70%)",
          animationName: "hero-drift-a",
          animationDuration: "24s"
        }}
      />
      {showNodes && (
        <svg
          viewBox="0 0 300 200"
          preserveAspectRatio="xMidYMid slice"
          className={`absolute h-56 w-72 opacity-70 ${
            corner === "top-left" || corner === "bottom-left" ? "-left-6" : "-right-6"
          } ${corner.startsWith("top") ? "-top-4" : "-bottom-4"} ${corner === "center" ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" : ""}`}
        >
          {MINI_EDGES.map(([a, b], i) => {
            const nodeA = MINI_NODES[a];
            const nodeB = MINI_NODES[b];
            return (
              <line
                key={i}
                className="hero-line"
                x1={nodeA.x}
                y1={nodeA.y}
                x2={nodeB.x}
                y2={nodeB.y}
                stroke={isDark ? "rgba(196,181,253,0.7)" : "rgba(109,40,217,0.6)"}
                strokeWidth="1"
                style={{
                  animationName: "hero-line-shimmer",
                  animationDuration: `${7 + (i % 4)}s`,
                  animationIterationCount: "infinite",
                  animationTimingFunction: "ease-in-out",
                  animationDelay: `${(i % 5) * 0.4}s`,
                  "--line-opacity-min": isDark ? 0.08 : 0.1,
                  "--line-opacity-max": isDark ? 0.28 : 0.3
                }}
              />
            );
          })}
          {MINI_NODES.map((node, i) => (
            <circle
              key={i}
              className="hero-node"
              cx={node.x}
              cy={node.y}
              r={2.6}
              fill={isDark ? "#c4b5fd" : "#6d28d9"}
              style={{
                animationName: "hero-node-pulse",
                animationDuration: `${5 + (i % 3)}s`,
                animationIterationCount: "infinite",
                animationTimingFunction: "ease-in-out",
                animationDelay: `${(i % 4) * 0.5}s`,
                "--node-opacity-min": isDark ? 0.3 : 0.35,
                "--node-opacity-max": isDark ? 0.8 : 0.75,
                "--node-r-min": 2.2,
                "--node-r-max": 3.2
              }}
            />
          ))}
        </svg>
      )}
    </div>
  );
}
