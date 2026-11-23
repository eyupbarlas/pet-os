import i18next, { type i18n } from 'i18next';
import en_US from './locales/en_US.json';
import pl_PL from './locales/pl_PL.json';

export const LOCALES = ['pl_PL', 'en_US'] as const;
export type Locale = (typeof LOCALES)[number];
export const resources = { en_US: { translation: en_US }, pl_PL: { translation: pl_PL } } as const;

/** Device language -> app locale. Anything that is not Polish gets English. */
export function pickLocale(deviceTag: string | undefined): Locale {
  return deviceTag?.toLowerCase().startsWith('pl') ? 'pl_PL' : 'en_US';
}

// i18next maps the plural rules by language code, so the locale keys are mapped to 'pl' and 'en'.
// Hermes needs Intl.PluralRules (week-one check); see apps/mobile diagnostics.
export function createI18n(locale: Locale): i18n {
  const instance = i18next.createInstance();
  void instance.init({
    lng: locale === 'pl_PL' ? 'pl' : 'en',
    fallbackLng: 'en',
    resources: { en: resources.en_US, pl: resources.pl_PL },
    interpolation: { escapeValue: false },
    returnNull: false,
  });
  return instance;
}

export const toLanguage = (l: Locale) => (l === 'pl_PL' ? 'pl' : 'en');
