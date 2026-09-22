import { describe, it, expect } from "vitest";
import {
  resolveQualityState,
  isTrusted,
  isProvisional,
  isPubliclyRecommendable,
  recordConfidence,
  combineConfidence
} from "./quality";

describe("resolveQualityState", () => {
  it("maps known status aliases onto the canonical vocabulary", () => {
    expect(resolveQualityState({ status: "official" })).toBe("verified");
    expect(resolveQualityState({ status: "published" })).toBe("usable");
    expect(resolveQualityState({ status: "needs_review" })).toBe("review_needed");
    expect(resolveQualityState({ status: "staging" })).toBe("draft");
    expect(resolveQualityState({ status: "rejected" })).toBe("archived");
  });

  it("is case- and whitespace-insensitive", () => {
    expect(resolveQualityState({ status: "  Official  " })).toBe("verified");
  });

  it("treats a bare verified:true as usable, not verified - a boolean alone is not provenance", () => {
    expect(resolveQualityState({ verified: true })).toBe("usable");
  });

  it("treats verified:false with an unmapped status as provisional", () => {
    expect(resolveQualityState({ verified: false, status: "something_unmapped" })).toBe("provisional");
  });

  it("returns unknown for a record with no signal at all", () => {
    expect(resolveQualityState({})).toBe("unknown");
    expect(resolveQualityState(null)).toBe("unknown");
    expect(resolveQualityState(undefined)).toBe("unknown");
  });

  it("prefers the status column over a conflicting verified boolean", () => {
    expect(resolveQualityState({ status: "draft", verified: true })).toBe("draft");
  });
});

describe("isTrusted / isProvisional / isPubliclyRecommendable", () => {
  it("isTrusted is true only for verified/usable states", () => {
    expect(isTrusted({ status: "verified" })).toBe(true);
    expect(isTrusted({ status: "published" })).toBe(true);
    expect(isTrusted({ status: "draft" })).toBe(false);
    expect(isTrusted({})).toBe(false);
  });

  it("isProvisional accepts either a raw status string or a full record", () => {
    expect(isProvisional("partial")).toBe(true);
    expect(isProvisional({ status: "review_needed" })).toBe(true);
    expect(isProvisional({ status: "verified" })).toBe(false);
  });

  it("isPubliclyRecommendable excludes draft/review_needed/archived but allows unknown", () => {
    expect(isPubliclyRecommendable({ status: "draft" })).toBe(false);
    expect(isPubliclyRecommendable({ status: "archived" })).toBe(false);
    expect(isPubliclyRecommendable({ status: "verified" })).toBe(true);
    // No recorded quality state is allowed through per the documented policy
    // (excluding it entirely would empty the catalogue today).
    expect(isPubliclyRecommendable({})).toBe(true);
  });
});

describe("recordConfidence", () => {
  it("is high only for verified with no incomplete fields", () => {
    expect(recordConfidence({ status: "verified" })).toBe("high");
    expect(recordConfidence({ status: "verified", incompleteFields: ["email"] })).not.toBe("high");
  });

  it("degrades to low for provisional/unknown states", () => {
    expect(recordConfidence({ status: "provisional" })).toBe("low");
    expect(recordConfidence({})).toBe("low");
  });

  it("degrades a trusted record with many missing fields", () => {
    expect(recordConfidence({ status: "usable", incompleteFields: ["a", "b", "c"] })).toBe("low");
  });
});

describe("combineConfidence", () => {
  it("the lowest confidence in the list wins", () => {
    expect(combineConfidence(["high", "high", "low"])).toBe("low");
    expect(combineConfidence(["high", "medium"])).toBe("medium");
    expect(combineConfidence(["high", "high"])).toBe("high");
  });

  it("an empty shortlist is treated as low confidence", () => {
    expect(combineConfidence([])).toBe("low");
  });
});
