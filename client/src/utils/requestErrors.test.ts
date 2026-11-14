import { describe, it, expect } from "vitest";
import { classifyRequestError } from "./requestErrors";

describe("classifyRequestError", () => {
  it("recognises the email verification gate", () => {
    expect(
      classifyRequestError(
        "Email verification required before starting or completing a transaction",
      ),
    ).toEqual({ kind: "verification" });
  });

  it("recognises a full book and keeps the number", () => {
    expect(
      classifyRequestError(
        "There are already 2 open transactions for item with id 72Y4yJJnLUpNxhaW4Af3",
      ),
    ).toEqual({ kind: "capacity", count: 2 });
  });

  it("recognises a removed book or owner", () => {
    expect(classifyRequestError("Item with id abc not found").kind).toBe("unavailable");
    expect(classifyRequestError("Owner with id xyz not found").kind).toBe("unavailable");
  });

  it("falls back to a general message for anything else", () => {
    expect(classifyRequestError("Failed to fetch").kind).toBe("other");
    expect(classifyRequestError("").kind).toBe("other");
    expect(classifyRequestError(undefined).kind).toBe("other");
  });
});
