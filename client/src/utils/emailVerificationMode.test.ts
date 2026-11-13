// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";

vi.mock("../firebase", () => ({ auth: { currentUser: null } }));

import { openEmailVerificationDialog } from "./emailVerification";

function captureMode(open: () => void): unknown {
  let mode: unknown = "not fired";
  const listener = (event: Event) => {
    mode = (event as CustomEvent).detail?.mode;
  };
  window.addEventListener("bookguide:email-verification-required", listener);
  open();
  window.removeEventListener("bookguide:email-verification-required", listener);
  return mode;
}

describe("openEmailVerificationDialog", () => {
  it("opens in blocking mode by default (an exchange step is waiting)", () => {
    expect(captureMode(() => openEmailVerificationDialog())).toBe("blocking");
  });

  it("can open in optional mode (Home's Verify Email)", () => {
    expect(captureMode(() => openEmailVerificationDialog("optional"))).toBe("optional");
  });
});
