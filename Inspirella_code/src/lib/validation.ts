import { Coordinates, Institution } from "../types";

/**
 * Product-facing validation helpers.
 *
 * These implement the parts of 03_Data/SQL/Validation Rules.md that the
 * product layer must enforce before a record is shown to a user:
 *
 * - identity first, enrichment second;
 * - a contradiction is worse than an absence;
 * - coordinates without a check are more dangerous than no coordinates at all.
 */

/** Rough bounding box of Switzerland, used only to flag obviously wrong points. */
const SWITZERLAND_BOUNDS = {
  minLng: 5.9,
  maxLng: 10.6,
  minLat: 45.7,
  maxLat: 47.9
};

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * A usable identity is a non-empty, non-placeholder string.
 * Records without one are excluded instead of being given a random ID.
 */
export function normalizeId(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") return null;
  return trimmed;
}

export function normalizeText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * Accepts only http/https absolute URLs. A malformed or relative link is
 * treated as missing rather than silently replaced with a generic portal.
 */
export function normalizeUrl(value: unknown): string | undefined {
  const text = normalizeText(value);
  if (!text) return undefined;
  try {
    const url = new URL(text);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

/**
 * Validates a [lng, lat] pair.
 * Rejects non-numbers, out-of-range values and the classic [0, 0] null island.
 */
export function normalizeCoordinates(lng: unknown, lat: unknown): Coordinates | undefined {
  if (!isFiniteNumber(lng) || !isFiniteNumber(lat)) return undefined;
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return undefined;
  if (lng === 0 && lat === 0) return undefined;
  return [lng, lat];
}

export function hasCoordinates(
  institution: Institution
): institution is Institution & { coordinates: Coordinates } {
  return Array.isArray(institution.coordinates) && institution.coordinates.length === 2;
}

/**
 * True when a point lies inside the Swiss bounding box.
 * Used by the fallback projection map, which can only draw Switzerland.
 */
export function isWithinSwitzerland(coordinates: Coordinates): boolean {
  const [lng, lat] = coordinates;
  return (
    lng >= SWITZERLAND_BOUNDS.minLng &&
    lng <= SWITZERLAND_BOUNDS.maxLng &&
    lat >= SWITZERLAND_BOUNDS.minLat &&
    lat <= SWITZERLAND_BOUNDS.maxLat
  );
}

export const SWISS_BOUNDS = SWITZERLAND_BOUNDS;
