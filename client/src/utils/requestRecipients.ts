/**
 * Who a borrow request emails, and how to name them in copy (Issue #258).
 *
 * Rules:
 * - Owner and holder are different people: name both.
 * - Same person, or no holder on record: name the owner once.
 * - A missing nickname falls back to the email (as elsewhere in the app),
 *   so names can be long and have no spaces. Callers must let them wrap.
 */
export interface Person {
  id?: string | null;
  nickname?: string | null;
  email?: string | null;
}

export interface RequestRecipients {
  ownerName: string;
  holderName: string | null; // null when owner and holder are the same
}

export function displayName(person?: Person | null): string {
  return person?.nickname?.trim() || person?.email?.trim() || "";
}

export function requestRecipients(
  owner?: Person | null,
  holder?: Person | null,
): RequestRecipients {
  const ownerName = displayName(owner);
  const same = !holder || (!!owner?.id && owner.id === holder.id);
  return { ownerName, holderName: same ? null : displayName(holder) };
}

/** Counts the member's own requests to decide if this was their first. */
export function isFirstRequest(
  transactions: { requestor?: { id?: string | null } | null }[],
  userId: string,
): boolean {
  return transactions.filter((tx) => tx.requestor?.id === userId).length <= 1;
}

/**
 * When a waiting request closes. The server closes a request 14 days after
 * it was sent (transactionService, `expired`); the date comes from expireAt.
 */
export function requestCloseInfo(
  expireAt: string | number | Date | null | undefined,
  now: Date = new Date(),
): { date: Date; daysLeft: number } | null {
  if (expireAt === null || expireAt === undefined || expireAt === "") return null;
  const date = new Date(expireAt);
  if (Number.isNaN(date.getTime())) return null;
  const daysLeft = Math.max(0, Math.ceil((date.getTime() - now.getTime()) / 86_400_000));
  return { date, daysLeft };
}
