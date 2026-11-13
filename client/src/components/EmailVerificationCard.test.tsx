// @vitest-environment jsdom
import React from "react";
import { createRoot, Root } from "react-dom/client";
import { act } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../firebase", () => ({ auth: { currentUser: { email: "new@member.test" } } }));
vi.mock("../utils/emailVerification", () => ({
  requestEmailVerificationCode: vi.fn().mockResolvedValue(true),
  confirmEmailVerificationCode: vi.fn(),
}));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: unknown) => (typeof fallback === "string" ? fallback : key),
  }),
}));

import EmailVerificationCard from "./EmailVerificationCard";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

async function render(ui: React.ReactElement) {
  await act(async () => {
    root.render(ui);
  });
  await act(async () => {
    await Promise.resolve();
  });
}

describe("EmailVerificationCard", () => {
  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("blocking mode offers 'Go back' and says nothing has happened yet", async () => {
    const onExit = vi.fn();
    await render(<EmailVerificationCard mode="blocking" onExit={onExit} />);
    expect(container.textContent).toContain("Verify your email");
    expect(container.textContent).toContain("Nothing is sent or changed until you verify.");
    const goBack = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "Go back",
    );
    expect(goBack).toBeTruthy();
    act(() => goBack!.click());
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("optional mode offers 'Later' with no warning note", async () => {
    await render(<EmailVerificationCard mode="optional" onExit={() => {}} />);
    expect(container.textContent).toContain("emailVerification.later");
    expect(container.textContent).not.toContain("Nothing is sent or changed");
  });

  it("shows the same reason line in both modes", async () => {
    await render(<EmailVerificationCard mode="optional" onExit={() => {}} />);
    expect(container.textContent).toContain(
      "A verified email lets you borrow and lend books, and lets members reach you.",
    );
  });

  async function enterCodeAndVerify() {
    const input = container.querySelector("input") as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    await act(async () => {
      setter.call(input, "123456");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const verify = Array.from(container.querySelectorAll("button")).find(
      (b) => b.textContent === "emailVerification.verify",
    );
    await act(async () => {
      verify!.click();
      await Promise.resolve();
    });
  }

  it("shows 'Email verified' with Done after a correct code", async () => {
    const onVerified = vi.fn();
    const onExit = vi.fn();
    await render(
      <EmailVerificationCard mode="optional" onVerified={onVerified} onExit={onExit} />,
    );
    await enterCodeAndVerify();
    expect(onVerified).toHaveBeenCalledTimes(1);
    expect(container.textContent).toContain("Email verified. You can now borrow and lend books.");
    const done = Array.from(container.querySelectorAll("button")).find((b) => b.textContent === "Done");
    act(() => done!.click());
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("skips the success screen in the request flow", async () => {
    const onVerified = vi.fn();
    await render(
      <EmailVerificationCard mode="blocking" showSuccess={false} onVerified={onVerified} onExit={() => {}} />,
    );
    await enterCodeAndVerify();
    expect(onVerified).toHaveBeenCalledTimes(1);
    expect(container.textContent).not.toContain("You can now borrow and lend books.");
  });
});
