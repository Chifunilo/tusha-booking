// i18n/config.ts
// Locale configuration for internationalization

export const locales = ['en', 'fr', 'es', 'pt', 'sw'] as const;
export type Locale = typeof locales[number];

export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  es: 'Español',
  pt: 'Português',
  sw: 'Kiswahili',
};