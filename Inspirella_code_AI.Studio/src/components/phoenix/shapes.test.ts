import { describe, expect, it } from "vitest";
import {
  createRng,
  pointInPolygon,
  sampleGalaxy,
  sampleGlobe,
  samplePhoenix,
  sampleStairs,
  sampleSwitzerland,
  STAIR_STEPS,
  SWITZERLAND_POLYGON,
  wingWeight
} from "./shapes";

/** A tiny fake "logo": opaque pixels only in the left half. */
function halfOpaqueImage(w: number, h: number) {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w / 2; x++) {
      const p = (y * w + x) * 4;
      data[p] = 160;
      data[p + 1] = 90;
      data[p + 2] = 240;
      data[p + 3] = 255;
    }
  }
  return data;
}

describe("phoenix particle shapes", () => {
  it("every shape returns exactly `count` points so particles can morph 1:1", () => {
    const count = 1234;
    expect(sampleSwitzerland(count).length).toBe(count * 3);
    expect(sampleGalaxy(count).length).toBe(count * 3);
    expect(sampleGlobe(count).length).toBe(count * 3);
    expect(sampleStairs(count).length).toBe(count * 3);
    const phoenix = samplePhoenix(halfOpaqueImage(20, 20), 20, 20, count);
    expect(phoenix.positions.length).toBe(count * 3);
    expect(phoenix.colors.length).toBe(count * 3);
    expect(phoenix.wing.length).toBe(count);
  });

  it("is deterministic for the same seed", () => {
    expect(Array.from(sampleGalaxy(50, createRng(5)))).toEqual(Array.from(sampleGalaxy(50, createRng(5))));
  });

  it("samples the logo only where it is opaque, keeping its colours", () => {
    const phoenix = samplePhoenix(halfOpaqueImage(40, 40), 40, 40, 500);
    for (let i = 0; i < 500; i++) {
      // Left half of the image maps to x <= 0 in normalised space.
      expect(phoenix.positions[i * 3]).toBeLessThanOrEqual(0.001);
      expect(phoenix.colors[i * 3 + 2]).toBeCloseTo(240 / 255, 5);
    }
  });

  it("marks the wings for flapping but not the body, star or wreath", () => {
    expect(wingWeight(0.3, 0.45)).toBeGreaterThan(0.9); // left wing
    expect(wingWeight(0.7, 0.45)).toBeGreaterThan(0.9); // right wing
    expect(wingWeight(0.5, 0.5)).toBe(0); // body centre line
    expect(wingWeight(0.5, 0.2)).toBe(0); // star
    expect(wingWeight(0.05, 0.5)).toBe(0); // laurel wreath
  });

  it("builds an ascending staircase: higher steps sit further right", () => {
    const pts = sampleStairs(3000);
    const topByStep = new Array(STAIR_STEPS).fill(-Infinity);
    for (let i = 0; i < 3000; i++) {
      const x = pts[i * 3];
      const y = pts[i * 3 + 1];
      const k = Math.min(STAIR_STEPS - 1, Math.max(0, Math.floor(((x + 1.3) / 2.6) * STAIR_STEPS)));
      topByStep[k] = Math.max(topByStep[k], y);
    }
    for (let k = 1; k < STAIR_STEPS; k++) expect(topByStep[k]).toBeGreaterThan(topByStep[k - 1]);
  });

  it("fills Switzerland only inside its outline", () => {
    expect(pointInPolygon(500, 250, SWITZERLAND_POLYGON)).toBe(true);
    expect(pointInPolygon(20, 20, SWITZERLAND_POLYGON)).toBe(false);
    const pts = sampleSwitzerland(400);
    for (let i = 0; i < 400; i++) {
      expect(Math.abs(pts[i * 3])).toBeLessThan(1.5);
      expect(Math.abs(pts[i * 3 + 1])).toBeLessThan(1.0);
    }
  });
});
