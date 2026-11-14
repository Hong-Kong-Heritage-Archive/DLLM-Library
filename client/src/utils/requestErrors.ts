/**
 * Turns the server's raw error text for a failed borrow request into a kind
 * the request form can explain in plain words (Issue #258, R5 and R10).
 */
export type RequestErrorKind =
  | "verification" // email not verified yet
  | "capacity" // the book already has the maximum open requests
  | "unavailable" // the book (or its owner) no longer exists
  | "other"; // connection or anything unexpected

export interface RequestError {
  kind: RequestErrorKind;
  /** For "capacity": how many open requests the book already has. */
  count?: number;
}

export function classifyRequestError(message: string | null | undefined): RequestError {
  const text = message || "";
  if (/email verification required/i.test(text)) {
    return { kind: "verification" };
  }
  const capacity = text.match(/already (\d+) open transactions/i);
  if (capacity) {
    return { kind: "capacity", count: Number(capacity[1]) };
  }
  if (/(item|owner|exchange point) with id .+ not found/i.test(text)) {
    return { kind: "unavailable" };
  }
  return { kind: "other" };
}
