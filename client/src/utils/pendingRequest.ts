/**
 * Remembers that a signed-out person tapped "Request to borrow" on a book,
 * so the request can continue after they sign up or sign in.
 *
 * Signing up reloads the app while the new profile loads, which unmounts the
 * book page and loses any in-memory state. Session storage survives that
 * reload, stays in the current tab only, and clears when the tab closes.
 */

const STORAGE_KEY = "bookguide_pending_request";

/** A pending request older than this is ignored, so a stale tap never reopens a request later. */
export const PENDING_REQUEST_MAX_AGE_MS = 30 * 60 * 1000;

interface PendingRequest {
  itemId: string;
  savedAt: number;
}

function getStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

export function rememberPendingRequest(itemId: string): void {
  const storage = getStorage();
  if (!storage || !itemId) return;
  try {
    const value: PendingRequest = { itemId, savedAt: Date.now() };
    storage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Storage can be full or blocked (private mode). The request then simply
    // doesn't resume, which is today's behaviour.
  }
}

export function clearPendingRequest(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}

export function getPendingRequest(now: number = Date.now()): PendingRequest | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingRequest>;
    if (
      typeof parsed.itemId !== "string" ||
      typeof parsed.savedAt !== "number" ||
      now - parsed.savedAt > PENDING_REQUEST_MAX_AGE_MS
    ) {
      clearPendingRequest();
      return null;
    }
    return { itemId: parsed.itemId, savedAt: parsed.savedAt };
  } catch {
    clearPendingRequest();
    return null;
  }
}

/**
 * Returns true, and clears the record, if there is a fresh pending request for
 * this book. Clearing on read means the request resumes at most once.
 */
export function takePendingRequest(itemId: string, now: number = Date.now()): boolean {
  const pending = getPendingRequest(now);
  if (!pending || pending.itemId !== itemId) return false;
  clearPendingRequest();
  return true;
}
