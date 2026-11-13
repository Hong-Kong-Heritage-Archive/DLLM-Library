/**
 * Tidies a suburb name the way Australian addresses write it:
 * "chatswood" -> "Chatswood", "st ives" -> "St Ives", "  north   ryde " -> "North Ryde".
 * Hyphenated and apostrophe names keep each part capitalised ("Kings-Langley", "O'Connor").
 */
export function formatSuburbName(input: string): string {
  return input
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(^|[\s\-'])([a-z])/g, (_match, sep: string, letter: string) => sep + letter.toUpperCase());
}

/**
 * BookGuide Sydney's state. The map service searches the whole world, so a
 * plain "Richmond" resolves to Richmond, Virginia and "Sdff" to San Diego.
 * Adding the state keeps the search in New South Wales.
 */
export const SUBURB_STATE = "NSW";

const STATE_SUFFIX = new RegExp(`\\s${SUBURB_STATE}$`, "i");

/** Rough bounds of New South Wales. */
const NSW_BOUNDS = { minLat: -37.6, maxLat: -28.0, minLng: 140.9, maxLng: 153.7 };

/**
 * When the map service can't find a place "in NSW", it returns the middle of
 * the state instead of nothing. Treat that point as "not found".
 */
const NSW_FALLBACK_POINT = { lat: -31.2532183, lng: 146.921099 };
const FALLBACK_TOLERANCE = 0.05;

/** "chatswood" -> "Chatswood NSW": the text that is searched and saved. */
export function suburbWithState(input: string): string {
  const name = formatSuburbName(input).replace(STATE_SUFFIX, "");
  return name ? `${name} ${SUBURB_STATE}` : "";
}

/** True if the map result is a real place inside NSW, not the state-wide fallback. */
export function isUsableSuburbLocation(latitude: number, longitude: number): boolean {
  const insideNsw =
    latitude >= NSW_BOUNDS.minLat &&
    latitude <= NSW_BOUNDS.maxLat &&
    longitude >= NSW_BOUNDS.minLng &&
    longitude <= NSW_BOUNDS.maxLng;
  const isFallback =
    Math.abs(latitude - NSW_FALLBACK_POINT.lat) < FALLBACK_TOLERANCE &&
    Math.abs(longitude - NSW_FALLBACK_POINT.lng) < FALLBACK_TOLERANCE;
  return insideNsw && !isFallback;
}
