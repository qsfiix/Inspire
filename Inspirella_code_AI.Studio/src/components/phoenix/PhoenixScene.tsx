import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import * as THREE from "three";
import {
  createRng,
  samplePhoenix,
  sampleSwitzerland,
  sampleGalaxy,
  sampleStairs,
  sampleGlobe,
  WING_HINGE
} from "./shapes";
import { backgroundFragment, backgroundVertex, dustFragment, dustVertex, particleFragment, particleVertex } from "./shaders";

/**
 * The home page's living backdrop (replaces the Spline model, 2026-09-28).
 *
 * One fixed full-screen WebGL canvas behind the whole home page:
 *  - a silk-aurora shader background in the brand violets, with a soft
 *    glow that follows the phoenix;
 *  - Sofiia's own phoenix logo rebuilt from thousands of glowing particles.
 *    It assembles out of a swirl on load, breathes, tilts towards the
 *    cursor, beats its wings when the cursor moves, and scatters particles
 *    away from the pointer;
 *  - a trail of violet dust behind the cursor;
 *  - a scroll story on home: the same particles morph phoenix ->
 *    Switzerland (with the vocational and academic streams crossing at the
 *    permeability "bridge") -> the My Path staircase, lit step by step ->
 *    the phoenix again at the finale. The aurora's colours follow the
 *    chapters and it brightens with scroll speed;
 *  - app pages (no anchors): an ambient galaxy that freezes after a moment
 *    to save battery (audit 2026-09-28: restraint inside the app makes the
 *    home and My Path moments land harder).
 *
 * Positioning is driven by the DOM, not hard-coded: each shape sits on the
 * element marked `data-scene-anchor="N"` (N = 0..3), so the layout stays in
 * sync with the page at every breakpoint.
 *
 * Accessibility/perf: purely decorative (aria-hidden, pointer-events none);
 * prefers-reduced-motion freezes everything into a still phoenix; the loop
 * pauses while the tab is hidden; fewer particles and a lower pixel ratio on
 * small or low-core devices; `onStatus("error")` lets the page fall back to
 * the CSS hero background if WebGL is unavailable.
 */

export type PhoenixSceneStatus = "loading" | "ready" | "error";

interface PhoenixSceneProps {
  isDark: boolean;
  /** false hides the canvas and stops rendering (e.g. on the Mapbox map page, which has its own WebGL). */
  enabled?: boolean;
  onStatus?: (status: PhoenixSceneStatus) => void;
}

// Pages without any data-scene-anchor get the "ambient" look: the particles
// become a large, dim, slowly turning galaxy behind the page's glass cards,
// which keeps turning slowly. Once it has settled (AMBIENT_QUIET_S) it
// renders at half rate - the motion is slow enough that 30fps looks the same
// and it halves the GPU cost. (It used to freeze completely, which read as
// "the spiral sometimes stops" - Sofiia 2026-09-28.)
const AMBIENT_OPACITY = 0.5;
const AMBIENT_HALF_WIDTH = 1.35;
const AMBIENT_QUIET_S = 2.5;

const FOV = 35;
const CAMERA_Z = 10;
const DUST_COUNT = 700;

// Per-stage look (0 phoenix, 1 Switzerland, 2 staircase, 3 globe, 4 phoenix
// finale): how big the shape is relative to its anchor, how strongly it shows.
const STAGE_SCALE = [0.46, 0.44, 0.44, 0.36, 0.46];
const STAGE_OPACITY = [1, 0.95, 0.95, 0.95, 1];
// Half-width of each shape in its own units - keeps shapes inside narrow screens.
const STAGE_HALF_WIDTH = [1.1, 1.4, 1.35, 1.22, 1.1];
const STAGE_COUNT = STAGE_SCALE.length;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export default function PhoenixScene({ isDark, enabled = true, onStatus }: PhoenixSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDarkRef = useRef(isDark);
  const applyThemeRef = useRef<((dark: boolean) => void) | null>(null);
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    isDarkRef.current = isDark;
    applyThemeRef.current?.(isDark);
  }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.innerWidth < 768;
    const lowPower = small || (navigator.hardwareConcurrency ?? 8) <= 4;
    const count = lowPower ? 9000 : 22000;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
    } catch {
      onStatusRef.current?.("error");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.25 : 1.5));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
    camera.position.z = CAMERA_Z;

    // --- Background: full-screen aurora quad (drawn first, no depth) ---
    const bgUniforms = {
      uTime: { value: 0 },
      uStage: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uGlow: { value: new THREE.Vector3(0.7, 0.5, 0.35) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uDark: { value: isDarkRef.current ? 1 : 0 },
      uVelocity: { value: 0 }
    };
    const bgMaterial = new THREE.ShaderMaterial({
      vertexShader: backgroundVertex,
      fragmentShader: backgroundFragment,
      uniforms: bgUniforms,
      depthTest: false,
      depthWrite: false
    });
    const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMaterial);
    bgMesh.frustumCulled = false;
    bgMesh.renderOrder = -1;
    scene.add(bgMesh);

    // --- Particle shape (geometry filled once the logo image is sampled) ---
    const group = new THREE.Group();
    scene.add(group);

    const particleUniforms = {
      uTime: { value: 0 },
      uIntro: { value: reduceMotion ? 1 : 0 },
      uStage: { value: 0 },
      uAmbient: { value: 0 },
      uFlap: { value: 0 },
      uSize: { value: small ? 3.4 : 3.2 },
      uPixelRatio: { value: renderer.getPixelRatio() },
      uHinge: { value: WING_HINGE },
      uMouse: { value: new THREE.Vector2(999, 999) },
      uRepelR: { value: 0.9 },
      uMouseStrength: { value: 0 },
      uOpacity: { value: 1 },
      uDark: { value: isDarkRef.current ? 1 : 0 }
    };
    const particleMaterial = new THREE.ShaderMaterial({
      vertexShader: particleVertex,
      fragmentShader: particleFragment,
      uniforms: particleUniforms,
      transparent: true,
      depthWrite: false
    });
    let particles: THREE.Points | null = null;
    // Set whenever something visible changes (theme, size) so the next frame
    // is drawn even in half-rate quiet mode.
    let needsRender = true;

    // --- Cursor dust ---
    const dustPos = new Float32Array(DUST_COUNT * 3);
    const dustVel = new Float32Array(DUST_COUNT * 3);
    const dustAge = new Float32Array(DUST_COUNT).fill(1);
    const dustLife = new Float32Array(DUST_COUNT).fill(1);
    const dustSeed = new Float32Array(DUST_COUNT);
    const seedRng = createRng(99);
    for (let i = 0; i < DUST_COUNT; i++) dustSeed[i] = seedRng();
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    dustGeometry.setAttribute("aAge", new THREE.BufferAttribute(dustAge, 1));
    dustGeometry.setAttribute("aSeed", new THREE.BufferAttribute(dustSeed, 1));
    const dustUniforms = {
      uPixelRatio: { value: renderer.getPixelRatio() },
      uDark: { value: isDarkRef.current ? 1 : 0 }
    };
    const dustMaterial = new THREE.ShaderMaterial({
      vertexShader: dustVertex,
      fragmentShader: dustFragment,
      uniforms: dustUniforms,
      transparent: true,
      depthWrite: false
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    dust.frustumCulled = false;
    if (!reduceMotion) scene.add(dust);
    let dustCursor = 0;

    const applyTheme = (dark: boolean) => {
      const blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
      particleMaterial.blending = blending;
      dustMaterial.blending = blending;
      particleMaterial.needsUpdate = true;
      dustMaterial.needsUpdate = true;
      bgUniforms.uDark.value = dark ? 1 : 0;
      particleUniforms.uDark.value = dark ? 1 : 0;
      dustUniforms.uDark.value = dark ? 1 : 0;
      needsRender = true;
    };
    applyTheme(isDarkRef.current);
    applyThemeRef.current = applyTheme;

    // --- Build particle geometry from the logo ---
    let disposed = false;
    const img = new Image();
    img.onload = () => {
      if (disposed) return;
      const w = 220;
      const h = Math.round((img.naturalHeight / img.naturalWidth) * w);
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const ctx = off.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        onStatusRef.current?.("error");
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      const phoenix = samplePhoenix(data, w, h, count);

      const rng = createRng(3);
      const rand = new Float32Array(count * 4);
      for (let i = 0; i < rand.length; i++) rand[i] = rng();

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(phoenix.positions, 3));
      geometry.setAttribute("aColor", new THREE.BufferAttribute(phoenix.colors, 3));
      geometry.setAttribute("aWing", new THREE.BufferAttribute(phoenix.wing, 1));
      geometry.setAttribute("aStar", new THREE.BufferAttribute(phoenix.star, 1));
      geometry.setAttribute("aSwiss", new THREE.BufferAttribute(sampleSwitzerland(count), 3));
      geometry.setAttribute("aGalaxy", new THREE.BufferAttribute(sampleGalaxy(count), 3));
      geometry.setAttribute("aStairs", new THREE.BufferAttribute(sampleStairs(count), 3));
      geometry.setAttribute("aGlobe", new THREE.BufferAttribute(sampleGlobe(count), 3));
      geometry.setAttribute("aRand", new THREE.BufferAttribute(rand, 4));

      particles = new THREE.Points(geometry, particleMaterial);
      particles.frustumCulled = false;
      group.add(particles);
      introStart = performance.now();
      onStatusRef.current?.("ready");
    };
    img.onerror = () => onStatusRef.current?.("error");
    img.src = "/logo-mark.png";

    // --- Input ---
    const pointer = { x: 0, y: 0, nx: 0, ny: 0, inside: false, lastX: 0, lastY: 0, lastT: 0 };
    let flapEnergy = 0;
    let halfH = CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    let halfW = halfH;

    const toWorld = (clientX: number, clientY: number) => ({
      x: ((clientX / window.innerWidth) * 2 - 1) * halfW,
      y: -((clientY / window.innerHeight) * 2 - 1) * halfH
    });

    const emitDust = (clientX: number, clientY: number, amount: number) => {
      const wp = toWorld(clientX, clientY);
      for (let k = 0; k < amount; k++) {
        const i = dustCursor;
        dustCursor = (dustCursor + 1) % DUST_COUNT;
        dustPos[i * 3] = wp.x + (Math.random() - 0.5) * 0.08;
        dustPos[i * 3 + 1] = wp.y + (Math.random() - 0.5) * 0.08;
        dustPos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
        const a = Math.random() * Math.PI * 2;
        const s = 0.15 + Math.random() * 0.45;
        dustVel[i * 3] = Math.cos(a) * s;
        dustVel[i * 3 + 1] = Math.sin(a) * s + 0.25;
        dustVel[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
        dustAge[i] = 0;
        dustLife[i] = 1.1 + Math.random() * 1.3;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.nx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ny = -((e.clientY / window.innerHeight) * 2 - 1);
      pointer.inside = true;
      if (pointer.lastT) {
        const dist = Math.hypot(e.clientX - pointer.lastX, e.clientY - pointer.lastY);
        const dt = Math.max(8, now - pointer.lastT);
        const speed = dist / dt; // px per ms
        flapEnergy = Math.max(flapEnergy, Math.min(1, speed / 1.6));
        if (!reduceMotion && e.pointerType !== "touch") {
          emitDust(e.clientX, e.clientY, Math.min(10, Math.ceil(dist / 5)));
        }
      }
      pointer.lastX = e.clientX;
      pointer.lastY = e.clientY;
      pointer.lastT = now;
    };
    const onPointerLeave = () => {
      pointer.inside = false;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);

    // --- Layout ---
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      halfH = CAMERA_Z * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
      halfW = halfH * camera.aspect;
      const pr = renderer.getPixelRatio();
      bgUniforms.uRes.value.set(w * pr, h * pr);
      particleUniforms.uPixelRatio.value = pr;
      dustUniforms.uPixelRatio.value = pr;
      needsRender = true;
    };
    resize();
    window.addEventListener("resize", resize);

    /** Pick the visible anchor element for each stage (0..STAGE_COUNT-1). */
    const readAnchors = () => {
      const result: (DOMRect | null)[] = new Array(STAGE_COUNT).fill(null);
      document.querySelectorAll<HTMLElement>("[data-scene-anchor]").forEach(el => {
        const i = Number(el.dataset.sceneAnchor);
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && i >= 0 && i < STAGE_COUNT && !result[i]) result[i] = r;
      });
      return result;
    };

    // Smoothed scene state (eased towards per-frame targets for a floaty feel)
    const current = { x: 0, y: 0, scale: 1, stage: 0, opacity: 1, rotX: 0, rotY: 0, ambient: 0, velocity: 0 };
    let lastScrollY = window.scrollY;
    let ambientSettled = 0;
    let prevPage = "";
    let portalUntil = 0;
    let quiet = false;
    let frameCount = 0;
    let first = true;
    let introStart = 0;
    let last = performance.now();
    let raf = 0;
    let running = true;
    const frozenTime = 12.0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      if (!running || !enabledRef.current) {
        last = now;
        return;
      }
      frameCount++;
      // Quiet ambient page: draw every second frame (time keeps running, so the
      // galaxy keeps turning at the same speed, just at 30fps).
      if (quiet && frameCount % 2 === 1 && !needsRender) return;
      needsRender = false;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const time = reduceMotion ? frozenTime : now / 1000;

      // Stage + placement from the DOM anchors
      const anchors = readAnchors();
      const vh = window.innerHeight;
      // Trigger line sits mid-screen, sliding lower near the page bottom so
      // the last shape (whose section can't scroll up to mid-screen on a
      // short page) still fully forms.
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
      const line = vh * (0.5 + 0.32 * smooth(0.55, 1, window.scrollY / maxScroll));
      const worldPerPx = (2 * halfH) / vh;
      const placement = (r: DOMRect, stage: number) => ({
        x: (r.left + r.width / 2 - window.innerWidth / 2) * worldPerPx,
        y: -(r.top + r.height / 2 - vh / 2) * worldPerPx,
        scale: Math.min(
          Math.min(r.width, r.height) * worldPerPx * STAGE_SCALE[stage],
          (window.innerWidth * 0.46 * worldPerPx) / STAGE_HALF_WIDTH[stage]
        )
      });

      let stage = 0;
      let target = anchors[0] ? placement(anchors[0], 0) : { x: 0, y: 0, scale: 1 };
      if (!reduceMotion) {
        const present = anchors.map((r, i) => (r ? i : -1)).filter(i => i >= 0);
        for (let k = 0; k < present.length - 1; k++) {
          const i = present[k];
          const j = present[k + 1];
          const ci = anchors[i]!.top + anchors[i]!.height / 2;
          const cj = anchors[j]!.top + anchors[j]!.height / 2;
          if (line <= ci) break;
          const f = smooth(0.15, 0.85, (line - ci) / Math.max(1, cj - ci));
          stage = i + (j - i) * f;
          const a = placement(anchors[i]!, i);
          const b = placement(anchors[j]!, j);
          target = { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, scale: a.scale + (b.scale - a.scale) * f };
          if (f < 1) break;
        }
      }
      const si = Math.min(STAGE_COUNT - 1, Math.floor(stage));
      const sf = stage - si;
      let targetOpacity =
        STAGE_OPACITY[si] + (STAGE_OPACITY[Math.min(STAGE_COUNT - 1, si + 1)] - STAGE_OPACITY[si]) * sf;

      const isAmbient = !anchors.some(Boolean);
      // Portal: right after leaving a story page (e.g. login -> dashboard) the
      // phoenix first flies into the element marked data-scene-portal (the My
      // Path staircase) and only then dissolves into the ambient galaxy.
      // The flight only makes sense when the dashboard (which has the staircase) is the next
      // page; on onboarding, login and the like the phoenix used to hang in front of the form
      // for 2.6 s waiting for a staircase that never comes.
      const page = document.body.dataset.scenePage ?? "";
      if (isAmbient && page === "dashboard" && prevPage !== "dashboard" && ["home", "login", "onboarding", ""].includes(prevPage) && !first) portalUntil = now + 2600;
      prevPage = page;
      const inPortalWindow = isAmbient && now < portalUntil && !reduceMotion;
      const portalEl = inPortalWindow ? document.querySelector<HTMLElement>("[data-scene-portal]") : null;
      let portalRect = portalEl?.getBoundingClientRect();
      if (portalRect && portalRect.width === 0) portalRect = undefined;
      // The staircase renders a moment after the page (it waits for data):
      // until it exists, the phoenix just holds where it is, then flies in.
      const holding = inPortalWindow && !portalRect;
      if (holding) {
        stage = 0;
        target = { x: current.x, y: current.y, scale: current.scale };
        targetOpacity = current.opacity;
      } else if (portalRect) {
        stage = 0;
        target = {
          x: (portalRect.left + portalRect.width * 0.2 - window.innerWidth / 2) * worldPerPx,
          y: -(portalRect.top + portalRect.height * 0.75 - vh / 2) * worldPerPx,
          scale: Math.min(portalRect.width, portalRect.height) * worldPerPx * 0.12
        };
        targetOpacity = 1;
      } else if (isAmbient) {
        // Ambient page: big dim galaxy, right of centre on wide screens.
        stage = 0;
        target = {
          x: small ? 0 : halfW * 0.38,
          y: small ? halfH * 0.2 : -halfH * 0.05,
          scale: Math.min(halfH * 0.95, (halfW * 0.95) / AMBIENT_HALF_WIDTH)
        };
        // The old shape must not linger over the new page: stay invisible until the particles
        // have turned into the galaxy, then fade it in (the galaxy keeps its usual brightness).
        targetOpacity = reduceMotion ? AMBIENT_OPACITY : AMBIENT_OPACITY * smooth(0.25, 0.9, current.ambient);
      }
      current.ambient += ((isAmbient && !portalRect && !holding && !reduceMotion ? 1 : 0) - current.ambient) * (1 - Math.exp(-dt * 3));
      ambientSettled = isAmbient && current.ambient > 0.985 ? ambientSettled + dt : 0;
      quiet = ambientSettled > AMBIENT_QUIET_S;

      // Scroll speed stirs the aurora: rises quickly, settles slowly.
      const scrollY = window.scrollY;
      const speed = Math.min(1, Math.abs(scrollY - lastScrollY) / Math.max(dt, 0.001) / 2500);
      lastScrollY = scrollY;
      current.velocity += (speed - current.velocity) * (1 - Math.exp(-dt * (speed > current.velocity ? 8 : 1.5)));

      const k = first ? 1 : 1 - Math.exp(-dt * 9);
      first = false;
      current.x += (target.x - current.x) * k;
      current.y += (target.y - current.y) * k;
      current.scale += (target.scale - current.scale) * k;
      current.stage += (stage - current.stage) * (1 - Math.exp(-dt * 6));
      current.opacity += (targetOpacity * (small && stage > 0.5 ? 0.6 : 1) - current.opacity) * (1 - Math.exp(-dt * 4));

      // Cursor tilt (subtle) - the whole model turns to "look" at you
      const tiltK = 1 - Math.exp(-dt * 3);
      current.rotY += ((reduceMotion ? 0 : pointer.nx * 0.35) - current.rotY) * tiltK;
      current.rotX += ((reduceMotion ? 0 : -pointer.ny * 0.18) - current.rotX) * tiltK;

      group.position.set(current.x, current.y, 0);
      group.scale.setScalar(Math.max(0.001, current.scale));
      group.rotation.set(current.rotX, current.rotY + (reduceMotion ? 0 : Math.sin(time * 0.3) * 0.08), 0);

      // Wing beat: a slow idle glide, beating harder the faster the cursor moves
      flapEnergy *= Math.exp(-dt * 1.1);
      flapPhase += dt * (2.0 + 9 * flapEnergy);
      const flap = reduceMotion ? 0 : Math.sin(flapPhase) * (0.12 + 0.8 * flapEnergy) - 0.1 * flapEnergy;

      particleUniforms.uTime.value = time;
      particleUniforms.uStage.value = current.stage;
      particleUniforms.uAmbient.value = current.ambient;
      particleUniforms.uFlap.value = flap;
      particleUniforms.uOpacity.value = current.opacity;
      particleUniforms.uIntro.value = reduceMotion || !introStart ? (reduceMotion ? 1 : 0) : Math.min(1, (now - introStart) / 2600);
      if (pointer.inside && !reduceMotion) {
        const wp = toWorld(pointer.x, pointer.y);
        particleUniforms.uMouse.value.set(wp.x, wp.y);
        particleUniforms.uMouseStrength.value += (1 - particleUniforms.uMouseStrength.value) * tiltK;
      } else {
        particleUniforms.uMouseStrength.value *= 1 - tiltK;
      }

      bgUniforms.uTime.value = time;
      bgUniforms.uStage.value = current.stage;
      bgUniforms.uVelocity.value = reduceMotion ? 0 : current.velocity;
      // Glow follows the shape's on-screen position
      const gx = (current.x / (2 * halfW)) + 0.5;
      const gy = (current.y / (2 * halfH)) + 0.5;
      bgUniforms.uGlow.value.set(gx, gy, Math.max(0.12, (current.scale / (2 * halfH)) * 1.2));
      bgUniforms.uMouse.value.set(pointer.x / window.innerWidth, 1 - pointer.y / window.innerHeight);

      // Dust physics
      if (!reduceMotion) {
        for (let i = 0; i < DUST_COUNT; i++) {
          if (dustAge[i] >= 1) continue;
          dustAge[i] = Math.min(1, dustAge[i] + dt / dustLife[i]);
          const drag = Math.exp(-dt * 1.6);
          dustVel[i * 3] *= drag;
          dustVel[i * 3 + 1] = dustVel[i * 3 + 1] * drag + dt * 0.12;
          dustVel[i * 3 + 2] *= drag;
          // gentle swirl
          const sx = Math.sin(time * 1.7 + dustSeed[i] * 20) * 0.12;
          dustPos[i * 3] += (dustVel[i * 3] + sx) * dt;
          dustPos[i * 3 + 1] += dustVel[i * 3 + 1] * dt;
          dustPos[i * 3 + 2] += dustVel[i * 3 + 2] * dt;
        }
        dustGeometry.attributes.position.needsUpdate = true;
        dustGeometry.attributes.aAge.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };
    let flapPhase = 0;
    raf = requestAnimationFrame(frame);

    const onVisibility = () => {
      running = !document.hidden;
      last = performance.now();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      onStatusRef.current?.("error");
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      applyThemeRef.current = null;
      particles?.geometry.dispose();
      particleMaterial.dispose();
      dustGeometry.dispose();
      dustMaterial.dispose();
      bgMesh.geometry.dispose();
      bgMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return createPortal(
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 h-full w-full pointer-events-none"
      style={{ zIndex: -1, display: enabled ? "block" : "none" }}
    />,
    document.body
  );
}
