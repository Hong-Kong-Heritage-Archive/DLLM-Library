/**
 * Frontend mirror of functions/src/contentRatingDefaults.ts
 * Keep in sync with backend constants when they change.
 *
 * Hong Kong Motion Picture Rating System:
 *  - 0: Undefined
 *  - 1: Category I   — General audiences
 *  - 2: Category IIA — Not suitable for children
 *  - 3: Category IIB — Not suitable for young persons
 *  - 4: Category III — Adults only (requires admin approval)
 *  - 5: Category IV  — Explicitly restricted (requires admin approval)
 */

export const DEFAULT_CONTENT_RATING = 3;
export const CONTENT_RATING_CENSOR_THRESHOLD = 4;

export interface ContentRatingOption {
  value: number;
  labelKey: string;
  color: "success" | "info" | "warning" | "error" | "default";
  /** Public path to the official HK rating SVG, or empty string if none exists */
  svg: string;
}

export const CONTENT_RATING_OPTIONS: ContentRatingOption[] = [
  {
    value: 1,
    labelKey: "contentRating.cat1",
    color: "success",
    svg: "/hk_film_picture_rating/Category_One.svg",
  },
  {
    value: 2,
    labelKey: "contentRating.cat2a",
    color: "info",
    svg: "/hk_film_picture_rating/Category_Two-A.svg",
  },
  {
    value: 3,
    labelKey: "contentRating.cat2b",
    color: "warning",
    svg: "/hk_film_picture_rating/Category_Two-B.svg",
  },
  {
    value: 4,
    labelKey: "contentRating.cat3",
    color: "error",
    svg: "/hk_film_picture_rating/Category_Three.svg",
  },
];

export function getContentRatingOption(
  value: number
): ContentRatingOption | undefined {
  return CONTENT_RATING_OPTIONS.find((o) => o.value === value);
}

export function getContentRatingLabel(value: number, t: (key: string, fallback: string) => string): string {
  const option = getContentRatingOption(value);
  if (!option) return String(value);
  return t(option.labelKey, option.labelKey);
}

export function getContentRatingColor(
  value: number
): ContentRatingOption["color"] {
  return getContentRatingOption(value)?.color ?? "default";
}

/**
 * Returns the public URL path to the HK rating SVG, or null if none exists.
 */
export function getContentRatingSvg(value: number): string | null {
  const svg = getContentRatingOption(value)?.svg;
  return svg && svg.length > 0 ? svg : null;
}
