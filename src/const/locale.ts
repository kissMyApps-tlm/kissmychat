import { supportLocales } from '@/locales/resources';

export const DEFAULT_LANG = 'ru-RU';
export const LOBE_LOCALE_COOKIE = 'LOBE_LOCALE';

/**
 * Check if the language is supported
 * @param locale
 */
export const isLocaleNotSupport = (locale: string) => !supportLocales.includes(locale);
