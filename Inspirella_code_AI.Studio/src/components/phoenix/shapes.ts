/**
 * Particle target shapes for the home page's scroll story (PhoenixScene).
 *
 * Every shape returns exactly `count` points so the GPU can morph between
 * them particle-for-particle: phoenix (hero) -> Switzerland (why section)
 * -> galaxy (how it works) -> globe (future scale). All shapes are
 * normalised to roughly a [-1, 1] box so the scene can size them from a
 * DOM anchor's height.
 *
 * Pure functions with a seeded RNG, so the layout is identical on every
 * load and can be unit-tested without WebGL.
 */

export type Rng = () => number;

/** Small deterministic PRNG (mulberry32). */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PhoenixSample {
  positions: Float32Array; // xyz, normalised
  colors: Float32Array; // rgb 0..1 from the logo's own pixels
  wing: Float32Array; // 0..1 how much each particle belongs to a wing (drives the flap)
  star: Float32Array; // 1 for the star above the phoenix (twinkles harder)
}

/**
 * Hinge line of the wings in normalised logo space (|x| from the body's
 * centre). Wing particles rotate around x = +-WING_HINGE.
 */
export const WING_HINGE = 0.13;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Wing membership for a point in the logo's 0..1 image space (u right,
 * v down). Tuned against public/logo-mark.png: the feathered wings span
 * roughly v 0.22-0.70 and |u-0.5| 0.07-0.31; the star (small |u|, high up)
 * and the laurel wreath (|u-0.5| > ~0.32) are excluded.
 */
export function wingWeight(u: number, v: number): number {
  const dx = Math.abs(u - 0.5);
  if (v < 0.37 && dx < 0.11) return 0; // star
  return (
    smoothstep(0.06, 0.13, dx) *
    (1 - smoothstep(0.28, 0.325, dx)) *
    smoothstep(0.2, 0.27, v) *
    (1 - smoothstep(0.64, 0.72, v))
  );
}

/**
 * Sample `count` particles from an RGBA image (the logo). Opaque pixels
 * are candidates; each particle picks one and jitters inside it, keeps its
 * colour, and gets a little depth so the phoenix has volume when it turns.
 */
export function samplePhoenix(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  count: number,
  rng: Rng = createRng(7)
): PhoenixSample {
  const candidates: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 110) candidates.push(y * width + x);
    }
  }

  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const wing = new Float32Array(count);
  const star = new Float32Array(count);
  const aspect = width / height;

  for (let i = 0; i < count; i++) {
    const idx = candidates.length ? candidates[Math.floor(rng() * candidates.length)] : 0;
    const px = (idx % width) + rng();
    const py = Math.floor(idx / width) + rng();
    const u = px / width;
    const v = py / height;

    const x = (u - 0.5) * 2 * aspect;
    const y = -(v - 0.5) * 2;
    // Depth: the body bulges towards the viewer, wings and wreath sit a
    // bit behind - reads as volume when the cursor tilts the model.
    const centre = Math.exp(-((u - 0.5) ** 2) / 0.01);
    const z = centre * 0.18 + (rng() - 0.5) * 0.08;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const p = idx * 4;
    colors[i * 3] = data[p] / 255;
    colors[i * 3 + 1] = data[p + 1] / 255;
    colors[i * 3 + 2] = data[p + 2] / 255;

    wing[i] = wingWeight(u, v);
    star[i] = v < 0.37 && Math.abs(u - 0.5) < 0.11 ? 1 : 0;
  }

  return { positions, colors, wing, star };
}

/**
 * Switzerland silhouette - same outline points as HeroBackground.tsx and
 * MapboxMap.tsx's fallback illustration (1000x500 canvas), so every
 * Switzerland drawing on the site agrees.
 */
export const SWITZERLAND_POLYGON: [number, number][] = [
  [100, 300], [170, 220], [280, 180], [350, 150], [480, 100], [650, 110], [850, 80],
  [920, 130], [950, 230], [840, 320], [750, 420], [580, 450], [420, 400], [320, 420], [180, 380]
];

export function pointInPolygon(x: number, y: number, poly: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Switzerland: ~35% of particles trace the border (bright outline), the rest fill the interior. */
export function sampleSwitzerland(count: number, rng: Rng = createRng(11)): Float32Array {
  const out = new Float32Array(count * 3);
  const poly = SWITZERLAND_POLYGON;
  const edgeLengths = poly.map((p, i) => {
    const q = poly[(i + 1) % poly.length];
    return Math.hypot(q[0] - p[0], q[1] - p[1]);
  });
  const perimeter = edgeLengths.reduce((a, b) => a + b, 0);
  const toX = (x: number) => ((x - 525) / 425) * 1.35;
  const toY = (y: number) => -((y - 265) / 425) * 1.35;

  for (let i = 0; i < count; i++) {
    let x: number;
    let y: number;
    if (rng() < 0.35) {
      let d = rng() * perimeter;
      let e = 0;
      while (d > edgeLengths[e]) d -= edgeLengths[e++];
      const p = poly[e];
      const q = poly[(e + 1) % poly.length];
      const t = d / edgeLengths[e];
      x = p[0] + (q[0] - p[0]) * t + (rng() - 0.5) * 6;
      y = p[1] + (q[1] - p[1]) * t + (rng() - 0.5) * 6;
    } else {
      do {
        x = 100 + rng() * 850;
        y = 80 + rng() * 370;
      } while (!pointInPolygon(x, y, poly));
    }
    out[i * 3] = toX(x);
    out[i * 3 + 1] = toY(y);
    out[i * 3 + 2] = (rng() - 0.5) * 0.12;
  }
  return out;
}

/** A three-armed spiral galaxy, slightly tilted by the scene. */
export function sampleGalaxy(count: number, rng: Rng = createRng(23)): Float32Array {
  const out = new Float32Array(count * 3);
  const arms = 3;
  for (let i = 0; i < count; i++) {
    const r = Math.pow(rng(), 0.7) * 1.25;
    const arm = Math.floor(rng() * arms);
    const angle = (arm / arms) * Math.PI * 2 + r * 3.2 + (rng() - 0.5) * (0.5 / (r + 0.3));
    const spread = 0.05 + r * 0.08;
    out[i * 3] = Math.cos(angle) * r + (rng() - 0.5) * spread;
    out[i * 3 + 1] = (rng() - 0.5) * spread * 0.9;
    out[i * 3 + 2] = Math.sin(angle) * r + (rng() - 0.5) * spread;
  }
  return out;
}

/** Number of steps in the particle staircase (matches a typical learning path). */
export const STAIR_STEPS = 6;

/**
 * The My Path staircase as a particle sculpture: STAIR_STEPS ascending
 * blocks (left low -> right high) seen slightly from the side. ~32% of the
 * particles trace the block edges (crisp silhouette), the rest fill the top
 * faces and fronts. x in [-1.3, 1.3], y in [-0.9, 0.9]. The shader lights
 * the steps one after another by x, so no extra attribute is needed.
 */
export function sampleStairs(count: number, rng: Rng = createRng(41)): Float32Array {
  const out = new Float32Array(count * 3);
  const n = STAIR_STEPS;
  const w = 2.6 / n; // block width
  const depth = 0.35; // block depth along z
  const ground = -0.9;
  const rise = 1.6 / n;
  for (let i = 0; i < count; i++) {
    const k = Math.floor(rng() * n);
    const x0 = -1.3 + k * w;
    const top = ground + rise * (k + 1);
    const r = rng();
    let x: number, y: number, z: number;
    if (r < 0.32) {
      // edges of the top face and the front-top edge
      const e = Math.floor(rng() * 4);
      const t = rng();
      if (e === 0) { x = x0 + t * w; y = top; z = depth / 2; }
      else if (e === 1) { x = x0 + t * w; y = top; z = -depth / 2; }
      else if (e === 2) { x = x0; y = ground + t * (top - ground); z = depth / 2; }
      else { x = x0 + w; y = ground + t * (top - ground); z = depth / 2; }
    } else if (r < 0.74) {
      // top face (the tread you stand on)
      x = x0 + rng() * w;
      y = top;
      z = (rng() - 0.5) * depth;
    } else {
      // front face, fading towards the ground
      x = x0 + rng() * w;
      y = top - Math.pow(rng(), 0.5) * (top - ground);
      z = depth / 2;
    }
    out[i * 3] = x + (rng() - 0.5) * 0.012;
    out[i * 3 + 1] = y + (rng() - 0.5) * 0.012;
    out[i * 3 + 2] = z + (rng() - 0.5) * 0.02;
  }
  return out;
}

/** A glowing globe (Fibonacci sphere) with an orbit ring - "beyond Switzerland". */
export function sampleGlobe(count: number, rng: Rng = createRng(31)): Float32Array {
  const out = new Float32Array(count * 3);
  const ringShare = Math.floor(count * 0.22);
  const sphereCount = count - ringShare;
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < sphereCount; i++) {
    const y = 1 - (i / (sphereCount - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const r = 0.78 + (rng() - 0.5) * 0.02;
    out[i * 3] = Math.cos(theta) * radius * r;
    out[i * 3 + 1] = y * r;
    out[i * 3 + 2] = Math.sin(theta) * radius * r;
  }
  for (let i = sphereCount; i < count; i++) {
    const a = rng() * Math.PI * 2;
    const r = 1.18 + (rng() - 0.5) * 0.06;
    out[i * 3] = Math.cos(a) * r;
    out[i * 3 + 1] = (rng() - 0.5) * 0.02;
    out[i * 3 + 2] = Math.sin(a) * r;
  }
  return out;
}
