import { MultilingualText } from '../schemas/tft-champion.schema';

// Supported languages
export type SupportedLanguage = 'en' | 'vi';

/**
 * Validate and normalize language parameter
 * @param lang Language code
 * @returns Validated language code (defaults to 'en' if invalid)
 */
export function validateLanguage(lang?: string): SupportedLanguage {
  return lang === 'vi' ? 'vi' : 'en';
}

/**
 * Convert a string to MultilingualText format
 * For now, we'll use the same text for both languages if only one is provided
 */
export function stringToMultilingualText(text: string): MultilingualText {
  return {
    en: text,
    vi: text,
  };
}

/**
 * Convert array of strings to array of MultilingualText
 */
export function stringsToMultilingualTexts(
  texts: string[],
): MultilingualText[] {
  return texts.map((text) => stringToMultilingualText(text));
}

/**
 * Create MultilingualText from English and Vietnamese strings
 */
export function createMultilingualText(
  en: string,
  vi?: string,
): MultilingualText {
  return {
    en,
    vi: vi || en,
  };
}

/**
 * Transform multilingual text to single language
 * @param text Multilingual text object or string
 * @param lang Language code
 * @returns Single language string
 */
export function transformText(
  text: MultilingualText | string,
  lang: SupportedLanguage = 'en',
): string {
  if (typeof text === 'string') {
    return text;
  }

  if (text && typeof text === 'object') {
    return text[lang] || text.en || '';
  }

  return '';
}

/**
 * Transform TFT champion ability with multilingual support
 * @param ability Ability object with multilingual name and description
 * @param lang Language code
 * @returns Transformed ability object
 */
export function transformAbility(
  ability: {
    name: MultilingualText;
    description: MultilingualText;
    mana: string;
  },
  lang: SupportedLanguage = 'en',
) {
  return {
    name: transformText(ability.name, lang),
    description: transformText(ability.description, lang),
    mana: ability.mana,
  };
}

/**
 * Transform TFT champion traits array with multilingual support
 * @param traits Array of multilingual traits
 * @param lang Language code
 * @returns Array of transformed trait strings
 */
export function transformTraits(
  traits: MultilingualText[],
  lang: SupportedLanguage = 'en',
): string[] {
  if (!Array.isArray(traits)) return [];

  return traits.map((trait) => transformText(trait, lang));
}

/**
 * Transform recommended items array with multilingual support
 * @param items Array of multilingual recommended items
 * @param lang Language code
 * @returns Array of transformed item strings
 */
export function transformRecommendedItems(
  items: MultilingualText[],
  lang: SupportedLanguage = 'en',
): string[] {
  if (!Array.isArray(items)) return [];

  return items.map((item) => transformText(item, lang));
}

/**
 * Transform recommended items data with multilingual support
 * @param items Array of recommended items with multilingual names
 * @param lang Language code
 * @returns Array of transformed items
 */
export function transformRecommendedItemsData(
  items: { name: MultilingualText; imageUrl: string }[],
  lang: SupportedLanguage = 'en',
) {
  if (!Array.isArray(items)) return [];

  return items.map((item) => ({
    name: transformText(item.name, lang),
    imageUrl: item.imageUrl,
  }));
}

/**
 * Transform TFT champion object with multilingual support
 * @param champion Champion object with multilingual fields
 * @param lang Language code
 * @returns Transformed champion object
 */
export function transformTftChampion(
  champion: any,
  lang: SupportedLanguage = 'en',
) {
  if (!champion) return null;

  return {
    ...champion,
    name: transformText(champion.name, lang),
    traits: transformTraits(champion.traits, lang),
    ability: champion.ability
      ? transformAbility(champion.ability, lang)
      : champion.ability,
    recommendedItems: transformRecommendedItems(
      champion.recommendedItems,
      lang,
    ),
    recommendedItemsData: transformRecommendedItemsData(
      champion.recommendedItemsData,
      lang,
    ),
  };
}

/**
 * Transform array of TFT champions with multilingual support
 * @param champions Array of champion objects
 * @param lang Language code
 * @returns Transformed array of champions
 */
export function transformTftChampions(
  champions: any[],
  lang: SupportedLanguage = 'en',
): any[] {
  if (!Array.isArray(champions)) return [];

  return champions.map((champion) => transformTftChampion(champion, lang));
}

/**
 * Transform TFT item object with multilingual support
 * @param item Item object with multilingual fields
 * @param lang Language code
 * @returns Transformed item object
 */
export function transformTftItem(item: any, lang: SupportedLanguage = 'en') {
  if (!item) return null;

  return {
    ...item,
    name: transformText(item.name, lang),
    description: transformText(item.description, lang),
  };
}

/**
 * Transform array of TFT items with multilingual support
 * @param items Array of item objects
 * @param lang Language code
 * @returns Transformed array of items
 */
export function transformTftItems(
  items: any[],
  lang: SupportedLanguage = 'en',
): any[] {
  if (!Array.isArray(items)) return [];

  return items.map((item) => transformTftItem(item, lang));
}
