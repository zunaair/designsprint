import en from './messages/en.json';
import ar from './messages/ar.json';

export type Locale = 'en' | 'ar';

export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALES: Locale[] = ['en', 'ar'];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
};

export const RTL_LOCALES: Locale[] = ['ar'];

const messages: Record<Locale, typeof en> = { en, ar };

/** Get translation messages for a locale */
export function getMessages(locale: Locale): typeof en {
  return messages[locale] ?? messages.en;
}

/** Check if a locale is RTL */
export function isRtl(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}
