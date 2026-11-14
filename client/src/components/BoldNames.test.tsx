// @vitest-environment jsdom
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, it, expect } from "vitest";
import BoldNames, { nameMarker } from "./BoldNames";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe("BoldNames", () => {
  it("puts each name in bold and keeps the sentence around it", () => {
    const el = document.createElement("div");
    const root = createRoot(el);
    const text = `Emails ${nameMarker("owner")} (owner) and ${nameMarker("holder")} (holder) now.`;
    act(() =>
      root.render(
        <BoldNames text={text} names={{ owner: "a.long.name@gmail.com", holder: "Gordon & Co" }} />,
      ),
    );
    expect(el.textContent).toBe("Emails a.long.name@gmail.com (owner) and Gordon & Co (holder) now.");
    expect(Array.from(el.querySelectorAll("strong")).map((s) => s.textContent)).toEqual([
      "a.long.name@gmail.com",
      "Gordon & Co",
    ]);
    act(() => root.unmount());
  });
});
