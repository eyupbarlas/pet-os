import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { getLocales } from 'expo-localization';
import { createI18n, pickLocale, type Locale } from '@petos/i18n';

const device = getLocales()[0]?.languageTag;
export const deviceLocale: Locale = pickLocale(device);
const instance = createI18n(deviceLocale);

const Ctx = createContext(instance);
export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const value = useMemo(() => instance, []);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
/** t('today.streak', { count: 3 }); plural suffixes are resolved by i18next. */
export const useT = () => useContext(Ctx).t.bind(useContext(Ctx));
