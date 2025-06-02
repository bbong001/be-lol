export type SupportedLanguage = 'en' | 'vi';

/**
 * Transform multilingual object to single language
 * @param data Object with multilingual structure {en: string, vi: string}
 * @param lang Language code
 * @returns Transformed string in requested language
 */
export function transformText(
  data: { en: string; vi: string },
  lang: SupportedLanguage = 'en',
): string {
  if (!data || typeof data !== 'object') {
    return '';
  }
  return data[lang] || data.en || '';
}

/**
 * Transform champion ability with multilingual support
 * @param ability Ability object with multilingual name and description
 * @param lang Language code
 * @returns Transformed ability object
 */
export function transformAbility(
  ability: {
    name: { en: string; vi: string };
    description: { en: string; vi: string };
    imageUrl?: string;
  },
  lang: SupportedLanguage = 'en',
) {
  return {
    name: transformText(ability.name, lang),
    description: transformText(ability.description, lang),
    imageUrl: ability.imageUrl,
  };
}

/**
 * Transform champion object with multilingual support
 * @param champion Champion object with multilingual fields
 * @param lang Language code
 * @returns Transformed champion object
 */
export function transformChampion(
  champion: any,
  lang: SupportedLanguage = 'en',
) {
  if (!champion) return null;

  return {
    ...champion,
    name: transformText(champion.name, lang),
    title: transformText(champion.title, lang),
    abilities:
      champion.abilities?.map((ability: any) =>
        transformAbility(ability, lang),
      ) || [],
  };
}

/**
 * Transform array of champions with multilingual support
 * @param champions Array of champion objects
 * @param lang Language code
 * @returns Transformed array of champions
 */
export function transformChampions(
  champions: any[],
  lang: SupportedLanguage = 'en',
): any[] {
  if (!Array.isArray(champions)) return [];

  return champions.map((champion) => transformChampion(champion, lang));
}

/**
 * Validate language parameter
 * @param lang Language parameter from query
 * @returns Valid language code
 */
export function validateLanguage(lang?: string): SupportedLanguage {
  if (lang === 'vi' || lang === 'en') {
    return lang;
  }
  return 'en'; // Default to English
}
