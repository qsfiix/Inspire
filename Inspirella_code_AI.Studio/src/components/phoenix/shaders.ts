/**
 * GLSL for PhoenixScene. Kept in its own file so the scene logic stays
 * readable. Three.js injects the standard uniforms/attributes
 * (projectionMatrix, modelViewMatrix, position, ...) for ShaderMaterial.
 */

/* ---------------------------------------------------------------------- */
/* Particles: the home story (phoenix -> Switzerland -> staircase ->      */
/* globe -> phoenix again) plus the ambient galaxy behind app pages.      */
/* ---------------------------------------------------------------------- */

export const particleVertex = /* glsl */ `
uniform float uTime;
uniform float uIntro;
uniform float uStage;
uniform float uAmbient;
uniform float uFlap;
uniform float uSize;
uniform float uPixelRatio;
uniform float uHinge;
uniform vec2 uMouse;
uniform float uRepelR;
uniform float uMouseStrength;
uniform float uDark;

attribute vec3 aSwiss;
attribute vec3 aStairs;
attribute vec3 aGlobe;
attribute vec3 aGalaxy;
attribute vec3 aColor;
attribute float aWing;
attribute float aStar;
attribute vec4 aRand;

varying vec3 vColor;
varying float vAlpha;

mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float ease(float t) { return t * t * (3.0 - 2.0 * t); }
// Each particle starts its morph a little earlier/later - reads as a
// flowing wave instead of every point moving in lockstep.
float stagger(float s, float r) { return ease(clamp(s * 1.4 - r * 0.4, 0.0, 1.0)); }

void main() {
  // --- Phoenix with wing beat -------------------------------------------
  vec3 p = position;
  float side = p.x < 0.0 ? -1.0 : 1.0;
  float d = abs(p.x) - uHinge;
  // Outer feathers swing further than inner ones.
  float a = uFlap * aWing * (0.55 + 0.45 * clamp(d / 0.7, 0.0, 1.0));
  p.x = side * (uHinge + cos(a) * d);
  p.z += sin(a) * d * 1.1;
  p.y += sin(a) * abs(d) * 0.25;
  // Breathing shimmer
  p += 0.012 * vec3(
    sin(uTime * 1.3 + aRand.x * 6.2831),
    cos(uTime * 1.1 + aRand.y * 6.2831),
    sin(uTime * 0.9 + aRand.z * 6.2831)
  );

  // --- Switzerland, with the two education streams flowing across it -----
  // ~22% of particles leave the outline and flow west -> east along two
  // braided curves: vocational (gold) and academic (violet). The curves
  // cross once near the middle - the permeability "bridge".
  vec3 sw = aSwiss;
  sw.z += sin(uTime * 0.6 + aSwiss.x * 3.0) * 0.04;
  sw.y += sin(uTime * 0.8 + aSwiss.x * 2.0) * 0.015;
  float isStream = step(aRand.w, 0.22);
  float streamB = step(0.11, aRand.w); // 0 = vocational, 1 = academic
  float sx = mix(-1.05, 1.05, fract(uTime * (0.05 + aRand.y * 0.03) + aRand.z));
  float wave = 0.16 * sin(sx * 2.2 + 0.4);
  float sy = -0.05 + mix(wave, -wave, streamB) + (aRand.x - 0.5) * 0.035;
  vec3 streamPos = vec3(sx, sy, (aRand.y - 0.5) * 0.06);
  sw = mix(sw, streamPos, isStream);
  float crossing = exp(-pow((sx + 0.18) * 7.0, 2.0)) * isStream;

  // --- The staircase, lit step by step ------------------------------------
  vec3 st = aStairs;
  float stepIdx = floor(clamp((aStairs.x + 1.3) / 2.6, 0.0, 0.999) * 6.0);
  float climb = mod(uTime * 1.4, 8.0) - 0.5;
  float stepLight = exp(-pow(stepIdx - climb, 2.0) * 1.3);
  st.y += stepLight * 0.02;

  vec3 g = aGalaxy;
  g.xz = rot(uTime * 0.07 + length(aGalaxy.xz) * 0.15) * g.xz;
  g.yz = rot(1.05) * g.yz;

  // --- The globe with its orbit ring ("beyond Switzerland") ---------------
  vec3 gl = aGlobe;
  gl.xz = rot(uTime * 0.16) * gl.xz;
  gl.yz = rot(0.38) * gl.yz;

  // --- Intro: assemble out of a wide swirl ------------------------------
  vec3 start = aGalaxy * 2.6;
  start.xy = rot(aRand.w * 3.0 + (1.0 - uIntro) * 2.0) * start.xy;
  p = mix(start, p, stagger(uIntro, aRand.w));

  // --- Scroll morph: phoenix -> Switzerland -> stairs -> globe -> phoenix --
  float t1 = stagger(clamp(uStage, 0.0, 1.0), aRand.x);
  float t2 = stagger(clamp(uStage - 1.0, 0.0, 1.0), aRand.y);
  float t3 = stagger(clamp(uStage - 2.0, 0.0, 1.0), aRand.z);
  float t4 = stagger(clamp(uStage - 3.0, 0.0, 1.0), aRand.w);
  vec3 pos = mix(p, sw, t1);
  pos = mix(pos, st, t2);
  pos = mix(pos, gl, t3);
  pos = mix(pos, p, t4);
  // Ambient pages: everything becomes a slow galaxy behind the glass.
  float amb = stagger(uAmbient, aRand.w);
  pos = mix(pos, g, amb);
  float mid = sin(3.14159 * t1) + sin(3.14159 * t2) + sin(3.14159 * t3) + sin(3.14159 * t4) + sin(3.14159 * amb);
  // Mid-morph the cloud spirals (not a shapeless puff): each particle is
  // swung around the centre by an amount that peaks halfway through.
  pos.xy = rot(mid * (aRand.x - 0.35) * 2.2) * pos.xy;
  pos += normalize(aRand.xyz - 0.5 + 1e-3) * mid * 0.22;

  // --- Cursor: particles scatter away from the pointer --------------------
  vec4 world = modelMatrix * vec4(pos, 1.0);
  vec2 diff = world.xy - uMouse;
  float dist = length(diff);
  float push = (1.0 - smoothstep(0.0, uRepelR, dist)) * uMouseStrength;
  world.xy += normalize(diff + 1e-4) * push * 0.45 * (0.6 + aRand.x);
  world.z += push * 0.5 * (aRand.y - 0.3);

  vec4 mv = viewMatrix * world;
  gl_Position = projectionMatrix * mv;

  float phoenixShare = (1.0 - t1) + t4;
  float streamBoost = t1 * (1.0 - t2) * isStream * (0.35 + crossing * 0.9);
  float size = uSize * (0.55 + aRand.w * 0.9) * (1.0 + aStar * 0.9 * clamp(phoenixShare, 0.0, 1.0)) * (1.0 + streamBoost);
  gl_PointSize = size * uPixelRatio * (9.0 / -mv.z);

  // --- Colour: logo pixels -> per-shape palettes ---------------------------
  vec3 logo = pow(aColor, vec3(0.8)) * 1.55;
  vec3 star = vec3(0.95, 0.9, 1.0);
  logo = mix(logo, star, aStar * 0.7);
  vec3 vetCol = vec3(1.0, 0.62, 0.16);
  vec3 acadCol = vec3(0.62, 0.42, 1.0);
  vec3 swissCol = mix(vec3(0.62, 0.47, 1.0), vec3(0.95, 0.85, 1.0), step(0.8, aRand.y));
  swissCol = mix(swissCol, mix(vetCol, acadCol, streamB), isStream);
  swissCol += vec3(1.0, 0.95, 0.9) * crossing * 0.6;
  vec3 stairsCol = mix(vec3(0.55, 0.40, 1.0), vec3(0.88, 0.82, 1.0), step(0.88, aRand.x));
  stairsCol = mix(stairsCol, vec3(1.0, 0.72, 0.28), stepLight * 0.9);
  vec3 galaxyCol = mix(vec3(0.93, 0.42, 0.95), vec3(0.45, 0.42, 1.0), aRand.z);
  vec3 globeCol = mix(vec3(0.55, 0.45, 1.0), vec3(0.78, 0.86, 1.0), step(0.85, aRand.x));
  vec3 col = mix(logo, swissCol, t1);
  col = mix(col, stairsCol, t2);
  col = mix(col, globeCol, t3);
  col = mix(col, logo, t4);
  col = mix(col, galaxyCol, amb);
  // Light theme: deeper, inkier violets so particles read on a pale page.
  vColor = mix(col * vec3(0.55, 0.4, 0.8), col, uDark);

  float twinkle = 0.62 + 0.38 * sin(uTime * (1.2 + aRand.x * 2.5) + aRand.y * 6.2831);
  twinkle = mix(twinkle, 0.55 + 0.45 * sin(uTime * 4.0 + aRand.z * 6.2831), aStar * clamp(phoenixShare, 0.0, 1.0));
  vAlpha = twinkle * mix(0.25, 1.0, uIntro) * (1.0 + push * 0.8 + t2 * (1.0 - t3) * stepLight * 0.8) * (1.0 - t3 * (1.0 - t4) * 0.25);
}
`;

export const particleFragment = /* glsl */ `
uniform float uOpacity;
uniform float uDark;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  // Soft halo + bright core: reads as glowing dust without a bloom pass.
  float halo = pow(1.0 - d * 2.0, 2.2);
  float core = smoothstep(0.14, 0.0, d);
  float a = (halo * 0.95 + core * 0.8) * vAlpha * uOpacity;
  vec3 col = vColor + vec3(1.0) * core * 0.35 * uDark;
  gl_FragColor = vec4(col, min(1.0, a * mix(1.4, 1.0, uDark)));
}
`;

/* ---------------------------------------------------------------------- */
/* Cursor dust                                                             */
/* ---------------------------------------------------------------------- */

export const dustVertex = /* glsl */ `
uniform float uPixelRatio;
attribute float aAge;
attribute float aSeed;
varying float vAge;
varying float vSeed;

void main() {
  vAge = aAge;
  vSeed = aSeed;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  float life = 1.0 - aAge;
  gl_PointSize = aAge >= 1.0 ? 0.0 : (4.0 + aSeed * 8.0) * (0.35 + 0.65 * life) * uPixelRatio * (9.0 / -mv.z);
}
`;

export const dustFragment = /* glsl */ `
uniform float uDark;
varying float vAge;
varying float vSeed;

void main() {
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5 || vAge >= 1.0) discard;
  float glow = pow(1.0 - d * 2.0, 1.8);
  vec3 col = mix(vec3(0.78, 0.6, 1.0), vec3(0.98, 0.55, 0.95), vSeed);
  col = mix(col, vec3(1.0), smoothstep(0.12, 0.0, d) * 0.5);
  col = mix(col * vec3(0.5, 0.35, 0.8), col, uDark);
  float a = glow * pow(1.0 - vAge, 1.2);
  gl_FragColor = vec4(col, a);
}
`;

/* ---------------------------------------------------------------------- */
/* Background: silk aurora + stars + glow behind the phoenix              */
/* ---------------------------------------------------------------------- */

export const backgroundVertex = /* glsl */ `
void main() {
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const backgroundFragment = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uStage;
uniform vec2 uRes;
uniform vec3 uGlow;
uniform vec2 uMouse;
uniform float uDark;
uniform float uVelocity;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + 17.0; a *= 0.5; }
  return v;
}

// Palette per chapter: violet (phoenix) -> violet + warm VET gold
// (Switzerland) -> indigo/fuchsia (the climb) -> blue-violet (the globe) ->
// violet dawn (the finale).
vec3 pal5(float s, vec3 c0, vec3 c1, vec3 c2, vec3 c3, vec3 c4) {
  return s < 1.0 ? mix(c0, c1, s) : s < 2.0 ? mix(c1, c2, s - 1.0) : s < 3.0 ? mix(c2, c3, s - 2.0) : mix(c3, c4, clamp(s - 3.0, 0.0, 1.0));
}
vec3 paletteA(float s) {
  return pal5(s, vec3(0.42, 0.16, 0.85), vec3(0.55, 0.30, 0.80), vec3(0.32, 0.22, 0.92), vec3(0.28, 0.30, 0.95), vec3(0.50, 0.20, 0.88));
}
vec3 paletteB(float s) {
  return pal5(s, vec3(0.78, 0.22, 0.85), vec3(0.85, 0.55, 0.35), vec3(0.75, 0.25, 0.90), vec3(0.60, 0.35, 1.00), vec3(0.95, 0.60, 0.45));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime * 0.035;

  // Silk ribbons: two warped bands drifting across the screen.
  float n1 = fbm(vec2(p.x * 1.1 + t * 2.0, p.y * 1.6 - t));
  float n2 = fbm(vec2(p.x * 0.9 - t * 1.5, p.y * 1.3 + t * 0.7) + 5.0);
  float y1 = p.y - 0.18 - 0.22 * sin(p.x * 1.4 + t * 5.0 + n1 * 2.4);
  float y2 = p.y + 0.28 - 0.18 * sin(p.x * 1.1 - t * 4.0 + n2 * 2.8);
  float band1 = exp(-y1 * y1 * 14.0) * (0.55 + 0.45 * n1);
  float band2 = exp(-y2 * y2 * 18.0) * (0.5 + 0.5 * n2);
  // Fine silk striations inside the bands
  float silk = 0.9 + 0.1 * sin((p.y * 3.0 + p.x + n1 * 0.6) * 22.0 + t * 8.0);

  vec3 ca = paletteA(uStage);
  vec3 cb = paletteB(uStage);

  // Glow behind the phoenix / current shape
  vec2 g = uv - uGlow.xy;
  g.x *= uRes.x / uRes.y;
  float glow = exp(-dot(g, g) / (uGlow.z * uGlow.z));

  // Very soft light following the cursor
  vec2 m = uv - uMouse;
  m.x *= uRes.x / uRes.y;
  float cursor = exp(-dot(m, m) * 9.0);

  // Scrolling "stirs" the aurora: ribbons brighten and swell with speed.
  float stir = 1.0 + uVelocity * 0.9;

  vec3 dark = vec3(0.016, 0.010, 0.035);
  vec3 col = dark;
  col += ca * band1 * silk * 0.20 * stir;
  col += cb * band2 * silk * 0.14 * stir;
  col += mix(ca, vec3(0.75, 0.55, 1.0), 0.35) * glow * 0.26;
  col += cb * cursor * 0.05;

  // Sparse twinkling stars - round points inside a coarse cell grid (the
  // old 3px cells rendered as visible little squares).
  vec2 cell = floor(gl_FragCoord.xy / 7.0);
  float s = hash(cell);
  vec2 inCell = fract(gl_FragCoord.xy / 7.0) - 0.5;
  float starShape = smoothstep(0.32, 0.0, length(inCell));
  float star = step(0.992, s) * starShape * (0.4 + 0.6 * sin(uTime * (0.5 + s * 3.0) + s * 40.0));
  col += vec3(0.8, 0.75, 1.0) * max(star, 0.0) * 0.6;

  // Vignette + film grain
  float vig = smoothstep(1.25, 0.25, length(p * vec2(0.85, 1.0)));
  col *= mix(0.55, 1.0, vig);
  col += (hash(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5) * 0.018;

  // Light theme: pale lavender page with the same ribbons, lighter touch
  vec3 light = vec3(0.961, 0.953, 1.0);
  light -= (1.0 - ca) * band1 * silk * 0.10;
  light -= (1.0 - cb) * band2 * silk * 0.07;
  light -= (1.0 - vec3(0.75, 0.55, 1.0)) * glow * 0.12;

  gl_FragColor = vec4(mix(light, col, uDark), 1.0);
}
`;
