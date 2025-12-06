import { CategoryMap } from "../generated/graphql";

/**
 * Translate a category key to the current language using categoryMaps
 * @param category - The category key (usually in English)
 * @param categoryMaps - The category map configuration from itemConfig
 * @param currentLang - The current language code (e.g., 'en', 'zh-TW')
 * @returns The translated category name, or the original if no translation found
 */
export const translateCategory = (
  category: string,
  categoryMaps: CategoryMap[][] | null | undefined,
  currentLang: string
): string => {
  if (!categoryMaps || !category) return category;

  // First try exact language match
  for (const mapGroup of categoryMaps) {
    const enMap = mapGroup.find((m) => m.language === "en");
    if (enMap?.value === category) {
      const translatedMap = mapGroup.find((m) => m.language === currentLang);
      if (translatedMap?.value) {
        return translatedMap.value;
      }
    }
  }

  // Then try language prefix match (e.g., 'zh-TW' -> 'zh')
  const langPrefix = currentLang.substring(0, 2);
  for (const mapGroup of categoryMaps) {
    const enMap = mapGroup.find((m) => m.language === "en");
    if (enMap?.value === category) {
      const translatedMap = mapGroup.find(
        (m) => m.language.substring(0, 2) === langPrefix
      );
      if (translatedMap?.value) {
        return translatedMap.value;
      }
    }
  }

  // If no translation found, return capitalized original
  return category.charAt(0).toUpperCase() + category.slice(1);
};

/**
 * Translate an array of category keys
 * @param categories - Array of category keys
 * @param categoryMaps - The category map configuration
 * @param currentLang - The current language code
 * @returns Array of translated category names
 */
export const translateCategories = (
  categories: string[],
  categoryMaps: CategoryMap[][] | null | undefined,
  currentLang: string
): string[] => {
  return categories.map((cat) =>
    translateCategory(cat, categoryMaps, currentLang)
  );
};

/**
 * Translate a classification path (e.g., "fiction/scifi/cyberpunk")
 * @param classificationPath - The classification path with segments separated by "/"
 * @param categoryMaps - The category map configuration
 * @param currentLang - The current language code
 * @param separator - The separator to use in the output (default: " → ")
 * @returns The translated classification path as a readable string
 */
export const translateClassificationPath = (
  classificationPath: string,
  categoryMaps: CategoryMap[][] | null | undefined,
  currentLang: string,
  separator: string = " → "
): string => {
  const segments = classificationPath.split("/").filter((seg) => seg.trim());
  const translatedSegments = segments.map((seg) =>
    translateCategory(seg, categoryMaps, currentLang)
  );
  return translatedSegments.join(separator);
};
