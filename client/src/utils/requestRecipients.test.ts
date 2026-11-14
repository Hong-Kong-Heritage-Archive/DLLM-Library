import { describe, it, expect } from "vitest";
import {
  displayName,
  requestRecipients,
  isFirstRequest,
  requestCloseInfo,
  formatCloseDate,
} from "./requestRecipients";

describe("requestRecipients", () => {
  it("names both when owner and holder differ", () => {
    expect(
      requestRecipients({ id: "o", nickname: "Gordon Yau" }, { id: "h", nickname: "Gordon for Dev" }),
    ).toEqual({ ownerName: "Gordon Yau", holderName: "Gordon for Dev" });
  });

  it("names the owner once when they are the same person", () => {
    expect(requestRecipients({ id: "o", nickname: "Gordon" }, { id: "o", nickname: "Gordon" }))
      .toEqual({ ownerName: "Gordon", holderName: null });
  });

  it("treats a missing holder as the owner", () => {
    expect(requestRecipients({ id: "o", nickname: "Gordon" }, null).holderName).toBeNull();
  });

  it("falls back to the email when there is no nickname", () => {
    expect(displayName({ nickname: " ", email: "a.long.name@gmail.com" })).toBe("a.long.name@gmail.com");
  });
});

describe("isFirstRequest", () => {
  it("is true when the only request is the one just sent", () => {
    expect(isFirstRequest([{ requestor: { id: "me" } }, { requestor: { id: "other" } }], "me")).toBe(true);
  });

  it("is false once the member has sent another request before", () => {
    expect(isFirstRequest([{ requestor: { id: "me" } }, { requestor: { id: "me" } }], "me")).toBe(false);
  });
});

describe("requestCloseInfo", () => {
  const now = new Date("2026-11-13T13:00:00+11:00");
  it("counts whole days left, rounding up", () => {
    expect(requestCloseInfo("2026-11-27T13:00:00+11:00", now)?.daysLeft).toBe(14);
    expect(requestCloseInfo("2026-11-13T20:00:00+11:00", now)?.daysLeft).toBe(1);
  });
  it("never goes below zero and ignores missing dates", () => {
    expect(requestCloseInfo("2026-11-01T00:00:00+11:00", now)?.daysLeft).toBe(0);
    expect(requestCloseInfo(null, now)).toBeNull();
    expect(requestCloseInfo("not a date", now)).toBeNull();
  });
});

describe("formatCloseDate", () => {
  const date = new Date("2026-11-27T12:00:00+11:00");
  it("follows the app's language, not the browser's", () => {
    expect(formatCloseDate(date, "en")).toContain("Nov");
    expect(formatCloseDate(date, "zh-HK")).toContain("11");
    expect(formatCloseDate(date, "zh-HK")).not.toContain("Nov");
  });
});
