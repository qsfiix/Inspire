import { LanguageCode } from "../types";

/**
 * Canonical helpers for multilingual product text.
 *
 * PRODUCT RULE (02_Product/Requirements/Modules Requirements.md - Language module):
 * - supported languages are en / de / fr / it;
 * - fallback to English only when a translation is absent;
 * - never display raw translation keys or `undefined` to the user.
 *
 * These helpers exist so that no screen has to repeat
 * `field[lang] || field.en` and no screen can crash on a partially
 * translated database record.
 */

export const SUPPORTED_LANGUAGES: LanguageCode[] = ["en", "de", "fr", "it"];

export function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === "string" && (SUPPORTED_LANGUAGES as string[]).includes(value);
}

/**
 * Reads a localized text field safely.
 *
 * Accepts a plain string, a partial `Record<LanguageCode, string>` or anything
 * unexpected coming from a database row, and always returns a string.
 * Order: requested language -> English -> first available translation -> "".
 */
export function localizedText(
  field: string | Partial<Record<LanguageCode, string>> | null | undefined,
  lang: LanguageCode
): string {
  if (field === null || field === undefined) return "";
  if (typeof field === "string") return field;
  if (typeof field !== "object") return "";

  const requested = field[lang];
  if (typeof requested === "string" && requested.trim()) return requested;

  const english = field.en;
  if (typeof english === "string" && english.trim()) return english;

  for (const code of SUPPORTED_LANGUAGES) {
    const value = field[code];
    if (typeof value === "string" && value.trim()) return value;
  }

  return "";
}

/**
 * Same as `localizedText` but for localized string arrays (e.g. skills, key facts).
 */
export function localizedList(
  field: string[] | Partial<Record<LanguageCode, string[]>> | null | undefined,
  lang: LanguageCode
): string[] {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field !== "object") return [];

  const requested = field[lang];
  if (Array.isArray(requested) && requested.length > 0) return requested;

  const english = field.en;
  if (Array.isArray(english) && english.length > 0) return english;

  for (const code of SUPPORTED_LANGUAGES) {
    const value = field[code];
    if (Array.isArray(value) && value.length > 0) return value;
  }

  return [];
}

/**
 * Case-insensitive "does this localized field contain the query" check.
 * Used by catalogue search so that search never throws on missing translations.
 */
export function localizedMatches(
  field: string | Partial<Record<LanguageCode, string>> | null | undefined,
  lang: LanguageCode,
  query: string
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return localizedText(field, lang).toLowerCase().includes(needle);
}
