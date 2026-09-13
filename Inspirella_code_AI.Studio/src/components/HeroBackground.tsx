/**
 * Ambient hero background: a slowly drifting violet gradient field with a
 * faint constellation of connected nodes over a barely-there Switzerland
 * silhouette (same outline coordinates as MapboxMap.tsx's fallback view,
 * for visual consistency between the two).
 *
 * Deliberately decorative, not data - no claim these nodes correspond to
 * real institutions (that would blur the line with the actual map feature
 * and its "never invent data" rule). Pure atmosphere behind the hero copy.
 *
 * Design intent (Sofiia, 2026-09-13): replace the flat static gradient with
 * something modern, premium and a little alive, without competing with the
 * headline for attention - every layer here stays low-opacity/low-contrast
 * so text legibility is untouched in both themes.
 */

interface HeroBackgroundProps {
  isDark: boolean;
}

// Same silhouette points as MapboxMap.tsx's fallback illustration (shared
// visual language between the hero and the map).
const SWITZERLAND_OUTLINE =
  "100,300 170,220 280,180 350,150 480,100 650,110 850,80 920,130 950,230 840,320 750,420 580,450 420,400 320,420 180,380";

// Node positions on a 1000x500 canvas: the outline ring plus a few interior
// "hub" nodes, hand-placed for a pleasing sparse network rather than a
// randomly generated one (keeps the layout identical on every render/SSR
// pass and avoids an accidental hairball of crossing lines).
const NODES: { x: number; y: number; hub?: boolean }[] = [
  { x: 180, y: 380 },
  { x: 320, y: 420 },
  { x: 420, y: 400 },
  { x: 580, y: 450 },
  { x: 750, y: 420 },
  { x: 840, y: 320 },
  { x: 950, y: 230 },
  { x: 920, y: 130 },
  { x: 850, y: 80 },
  { x: 650, y: 110 },
  { x: 480, y: 100 },
  { x: 350, y: 150 },
  { x: 280, y: 180 },
  { x: 170, y: 220 },
  { x: 100, y: 300 },
  { x: 500, y: 250, hub: true },
  { x: 630, y: 290 },
  { x: 380, y: 290 },
  { x: 700, y: 190 },
  { x: 260, y: 320 }
];

// Edges reference NODES indices: the perimeter ring (0-14) plus a few
// spokes through the interior "hub" nodes (15-19).
const EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 9],
  [9, 10], [10, 11], [11, 12], [12, 13], [13, 14], [14, 0],
  [15, 9], [15, 11], [15, 16], [15, 17],
  [16, 3], [16, 18], [18, 7],
  [17, 1], [17, 19], [19, 0], [19, 13]
];

export default function HeroBackground({ isDark }: HeroBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      {/* Layer 1: slow-drifting gradient blobs */}
      <div
        className="hero-blob absolute -top-24 -left-16 h-[26rem] w-[26rem] rounded-full blur-[110px]"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(139,92,246,0.22) 0%, rgba(99,102,241,0) 70%)"
            : "radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(99,102,241,0) 70%)",
          animationName: "hero-drift-a",
          animationDuration: "22s"
        }}
      />
      <div
        className="hero-blob absolute top-1/3 -right-20 h-[24rem] w-[24rem] rounded-full blur-[110px]"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(99,102,241,0.20) 0%, rgba(79,70,229,0) 70%)"
            : "radial-gradient(circle, rgba(99,102,241,0.16) 0%, rgba(79,70,229,0) 70%)",
          animationName: "hero-drift-b",
          animationDuration: "26s"
        }}
      />
      <div
        className="hero-blob absolute -bottom-28 left-1/4 h-[22rem] w-[22rem] rounded-full blur-[110px]"
        style={{
          background: isDark
            ? "radial-gradient(circle, rgba(192,132,252,0.16) 0%, rgba(168,85,247,0) 70%)"
            : "radial-gradient(circle, rgba(192,132,252,0.14) 0%, rgba(168,85,247,0) 70%)",
          animationName: "hero-drift-c",
          animationDuration: "19s"
        }}
      />

      {/* Layer 2: faint Switzerland outline + constellation network */}
      <svg
        viewBox="0 0 1000 500"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        <polygon
          points={SWITZERLAND_OUTLINE}
          fill="none"
          stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(109,40,217,0.08)"}
          strokeWidth="1.5"
        />

        {EDGES.map(([a, b], i) => {
          const nodeA = NODES[a];
          const nodeB = NODES[b];
          return (
            <line
              key={i}
              className="hero-line"
              x1={nodeA.x}
              y1={nodeA.y}
              x2={nodeB.x}
              y2={nodeB.y}
              stroke={isDark ? "rgba(196,181,253,0.9)" : "rgba(109,40,217,0.9)"}
              strokeWidth="1"
              style={{
                animationName: "hero-line-shimmer",
                animationDuration: `${6 + (i % 5)}s`,
                animationIterationCount: "infinite",
                animationTimingFunction: "ease-in-out",
                animationDelay: `${(i % 7) * 0.4}s`,
                "--line-opacity-min": isDark ? 0.08 : 0.1,
                "--line-opacity-max": isDark ? 0.26 : 0.3
              }}
            />
          );
        })}

        {NODES.map((node, i) => (
          <circle
            key={i}
            className="hero-node"
            cx={node.x}
            cy={node.y}
            r={node.hub ? 4.5 : 2.8}
            fill={isDark ? "#c4b5fd" : "#6d28d9"}
            style={{
              animationName: "hero-node-pulse",
              animationDuration: `${5 + (i % 4)}s`,
              animationIterationCount: "infinite",
              animationTimingFunction: "ease-in-out",
              animationDelay: `${(i % 6) * 0.5}s`,
              "--node-opacity-min": isDark ? 0.3 : 0.35,
              "--node-opacity-max": node.hub ? 1 : isDark ? 0.85 : 0.8,
              "--node-r-min": node.hub ? 4 : 2.4,
              "--node-r-max": node.hub ? 5.5 : 3.4
            }}
          />
        ))}
      </svg>

      {/* Layer 3: faint grain for tactile, non-flat premium finish */}
      <div
        className="absolute inset-0"
        style={{
          opacity: isDark ? 0.05 : 0.025,
          mixBlendMode: isDark ? "overlay" : "multiply",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"
        }}
      />

      {/* Layer 4: soft edge vignette so content stays the clear focal point */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "radial-gradient(ellipse at center, rgba(0,0,0,0) 40%, rgba(6,4,10,0.5) 100%)"
            : "radial-gradient(ellipse at center, rgba(245,243,255,0) 40%, rgba(245,243,255,0.7) 100%)"
        }}
      />
    </div>
  );
}
