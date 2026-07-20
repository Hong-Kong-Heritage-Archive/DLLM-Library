/**
 * Fisher–Yates shuffle, then take up to `limit` items.
 * Used when Firestore cannot ORDER BY RANDOM().
 */
export function sampleRandom<T>(items: T[], limit: number): T[] {
  const shuffled = items.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, limit);
}
