// @vitest-environment jsdom
import React, { StrictMode } from "react";
import { createRoot, Root } from "react-dom/client";
import { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const requestCode = vi.fn();

vi.mock("../firebase", () => ({ auth: { currentUser: { email: "new@member.test" } } }));
vi.mock("../utils/emailVerification", () => ({
  requestEmailVerificationCode: (...args: unknown[]) => requestCode(...args),
  confirmEmailVerificationCode: vi.fn(),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => (typeof fallback === "string" ? fallback : key),
  }),
}));

import EmailVerificationForm from "./EmailVerificationForm";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

async function render(ui: React.ReactElement) {
  await act(async () => {
    root.render(ui);
  });
  // Let the send promise settle.
  await act(async () => {
    await Promise.resolve();
  });
}

describe("EmailVerificationForm autoSend", () => {
  beforeEach(() => {
    requestCode.mockReset();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("sends the code once on its own, even in StrictMode", async () => {
    requestCode.mockResolvedValue(true);
    await render(
      <StrictMode>
        <EmailVerificationForm autoSend />
      </StrictMode>,
    );
    expect(requestCode).toHaveBeenCalledTimes(1);
  });

  it("does not send anything without autoSend", async () => {
    requestCode.mockResolvedValue(true);
    await render(<EmailVerificationForm />);
    expect(requestCode).not.toHaveBeenCalled();
  });

  it("treats the 60-second limit on the automatic send as 'already sent', with no error", async () => {
    requestCode.mockRejectedValue(
      new Error("Please wait before requesting another verification code"),
    );
    await render(<EmailVerificationForm autoSend />);
    expect(container.textContent).toContain("We've sent a 6-digit code");
    expect(container.textContent).not.toContain("Please wait");
  });

  it("says 'already sent' when Resend is tapped within the limit", async () => {
    requestCode.mockResolvedValueOnce(true);
    await render(<EmailVerificationForm autoSend />);
    requestCode.mockRejectedValueOnce(
      new Error("Please wait before requesting another verification code"),
    );
    const resend = Array.from(container.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Resend code"),
    );
    expect(resend).toBeTruthy();
    await act(async () => {
      resend!.click();
      await Promise.resolve();
    });
    expect(container.textContent).toContain("We've already sent a code. Check your inbox.");
  });

  it("puts the reason under the 'code sent' line", async () => {
    requestCode.mockResolvedValue(true);
    await render(<EmailVerificationForm autoSend reason="Because members email you." />);
    const text = container.textContent || "";
    expect(text.indexOf("We've sent a 6-digit code")).toBeLessThan(
      text.indexOf("Because members email you."),
    );
  });
});
