// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  PENDING_REQUEST_MAX_AGE_MS,
  clearPendingRequest,
  getPendingRequest,
  rememberPendingRequest,
  takePendingRequest,
} from "./pendingRequest";

describe("pendingRequest", () => {
  beforeEach(() => {
    clearPendingRequest();
  });

  it("resumes the same book once, then forgets it", () => {
    rememberPendingRequest("book-1");
    expect(takePendingRequest("book-1")).toBe(true);
    expect(takePendingRequest("book-1")).toBe(false);
  });

  it("does not resume on a different book, and keeps the record for the right one", () => {
    rememberPendingRequest("book-1");
    expect(takePendingRequest("book-2")).toBe(false);
    expect(getPendingRequest()?.itemId).toBe("book-1");
  });

  it("ignores a request older than the time limit", () => {
    rememberPendingRequest("book-1");
    const later = Date.now() + PENDING_REQUEST_MAX_AGE_MS + 1000;
    expect(takePendingRequest("book-1", later)).toBe(false);
    expect(getPendingRequest()).toBeNull();
  });

  it("is cleared when the person closes sign-up without finishing", () => {
    rememberPendingRequest("book-1");
    clearPendingRequest();
    expect(takePendingRequest("book-1")).toBe(false);
  });

  it("treats damaged data as no pending request", () => {
    window.sessionStorage.setItem("bookguide_pending_request", "{not json");
    expect(getPendingRequest()).toBeNull();
  });
});
