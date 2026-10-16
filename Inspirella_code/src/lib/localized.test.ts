import { describe, it, expect } from "vitest";
import { localizedText, localizedList, localizedMatches, isLanguageCode } from "./localized";

describe("localizedText", () => {
  it("returns the requested language when present", () => {
    expect(localizedText({ en: "Hello", de: "Hallo" }, "de")).toBe("Hallo");
  });

  it("falls back to English when the requested language is missing", () => {
    expect(localizedText({ en: "Hello" }, "fr")).toBe("Hello");
  });

  it("falls back to any available translation when English is also missing", () => {
    // This is the exact bug class documented in AdvisorReport's history:
    // many learning_paths are German-only, and a naive field[lang] || field.en
    // chain rendered blank for every other UI language.
    expect(localizedText({ de: "Nur Deutsch" }, "fr")).toBe("Nur Deutsch");
  });

  it("returns an empty string rather than undefined for a fully empty field", () => {
    expect(localizedText({}, "en")).toBe("");
    expect(localizedText(undefined, "en")).toBe("");
    expect(localizedText(null, "en")).toBe("");
  });

  it("passes plain strings through unchanged", () => {
    expect(localizedText("Just a string", "de")).toBe("Just a string");
  });

  it("ignores a blank string for the requested language and falls through", () => {
    expect(localizedText({ fr: "   ", en: "Fallback" }, "fr")).toBe("Fallback");
  });
});

describe("localizedList", () => {
  it("returns the requested language's list when present", () => {
    expect(localizedList({ en: ["a", "b"], de: ["x"] }, "de")).toEqual(["x"]);
  });

  it("falls back to English then any available list", () => {
    expect(localizedList({ it: ["solo italiano"] }, "fr")).toEqual(["solo italiano"]);
  });

  it("passes a plain array through unchanged", () => {
    expect(localizedList(["a", "b"], "en")).toEqual(["a", "b"]);
  });

  it("returns an empty array rather than throwing on missing data", () => {
    expect(localizedList(undefined, "en")).toEqual([]);
    expect(localizedList({}, "en")).toEqual([]);
  });

  it("skips an empty array for the requested language and falls through", () => {
    expect(localizedList({ de: [], en: ["ok"] }, "de")).toEqual(["ok"]);
  });
});

describe("localizedMatches", () => {
  it("matches case-insensitively against the resolved text", () => {
    expect(localizedMatches({ en: "Software Engineer" }, "en", "software")).toBe(true);
    expect(localizedMatches({ en: "Software Engineer" }, "en", "SOFTWARE")).toBe(true);
  });

  it("returns true for an empty query (no filter applied)", () => {
    expect(localizedMatches({ en: "Anything" }, "en", "  ")).toBe(true);
  });

  it("never throws when the field has no data for the query language", () => {
    expect(localizedMatches({ de: "Softwareentwickler" }, "fr", "software")).toBe(true);
    expect(localizedMatches(undefined, "en", "anything")).toBe(false);
  });
});

describe("isLanguageCode", () => {
  it("accepts the four supported codes", () => {
    expect(isLanguageCode("en")).toBe(true);
    expect(isLanguageCode("de")).toBe(true);
    expect(isLanguageCode("fr")).toBe(true);
    expect(isLanguageCode("it")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isLanguageCode("es")).toBe(false);
    expect(isLanguageCode(42)).toBe(false);
    expect(isLanguageCode(undefined)).toBe(false);
  });
});
