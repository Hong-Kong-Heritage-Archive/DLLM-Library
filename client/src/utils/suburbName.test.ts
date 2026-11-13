import { describe, it, expect } from "vitest";
import { formatSuburbName, isUsableSuburbLocation, suburbWithState, suggestSuburbs } from "./suburbName";
import { NSW_SUBURBS } from "../data/nswSuburbs";

describe("formatSuburbName", () => {
  it("capitalises a single-word suburb", () => {
    expect(formatSuburbName("chatswood")).toBe("Chatswood");
    expect(formatSuburbName("ASHFIELD")).toBe("Ashfield");
  });

  it("capitalises each word and tidies spaces", () => {
    expect(formatSuburbName("  north   ryde ")).toBe("North Ryde");
    expect(formatSuburbName("st ives")).toBe("St Ives");
  });

  it("keeps hyphen and apostrophe parts capitalised", () => {
    expect(formatSuburbName("kings-langley")).toBe("Kings-Langley");
    expect(formatSuburbName("o'connor")).toBe("O'Connor");
  });

  it("leaves non-Latin text unchanged", () => {
    expect(formatSuburbName("車士活")).toBe("車士活");
  });

  it("returns an empty string for blank input", () => {
    expect(formatSuburbName("   ")).toBe("");
  });
});

describe("suburbWithState", () => {
  it("adds the state once", () => {
    expect(suburbWithState("chatswood")).toBe("Chatswood NSW");
    expect(suburbWithState("Chatswood NSW")).toBe("Chatswood NSW");
    expect(suburbWithState("chatswood nsw")).toBe("Chatswood NSW");
    expect(suburbWithState("north ryde")).toBe("North Ryde NSW");
  });

  it("returns empty for blank input", () => {
    expect(suburbWithState("  ")).toBe("");
  });
});

describe("isUsableSuburbLocation", () => {
  it("accepts real Sydney suburbs", () => {
    expect(isUsableSuburbLocation(-33.7960696, 151.1780469)).toBe(true); // Chatswood
    expect(isUsableSuburbLocation(-33.5991852, 150.7519067)).toBe(true); // Richmond NSW
  });

  it("rejects the state-wide fallback returned for unknown names", () => {
    expect(isUsableSuburbLocation(-31.2532183, 146.921099)).toBe(false); // "Sdff NSW"
  });

  it("rejects places outside NSW", () => {
    expect(isUsableSuburbLocation(32.75457, -117.1021041)).toBe(false); // San Diego
    expect(isUsableSuburbLocation(37.5407246, -77.4360481)).toBe(false); // Richmond, Virginia
  });
});

describe("suggestSuburbs", () => {
  it("suggests suburbs that start with what was typed", () => {
    const found = suggestSuburbs("chats", NSW_SUBURBS);
    expect(found).toContain("Chatswood");
    expect(found).toContain("Chatswood West");
    expect(found.every((name) => name.toLowerCase().startsWith("chats"))).toBe(true);
  });

  it("still finds the suburb after a small typo", () => {
    expect(suggestSuburbs("chatswoods", NSW_SUBURBS)[0]).toBe("Chatswood");
    expect(suggestSuburbs("eastwoods", NSW_SUBURBS)).toContain("Eastwood");
  });

  it("matches a later word too", () => {
    expect(suggestSuburbs("ives", NSW_SUBURBS)).toContain("St Ives");
  });

  it("ignores a typed NSW and needs at least two letters", () => {
    expect(suggestSuburbs("rhodes nsw", NSW_SUBURBS)).toContain("Rhodes");
    expect(suggestSuburbs("c", NSW_SUBURBS)).toEqual([]);
  });

  it("returns nothing for gibberish", () => {
    expect(suggestSuburbs("sdff", NSW_SUBURBS)).toEqual([]);
  });
});
