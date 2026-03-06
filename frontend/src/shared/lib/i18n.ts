import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: 'US' },
  { code: 'es', label: 'Español', flag: 'ES' },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const DEFAULT_NAMESPACE = 'common';

export const NAMESPACES = [
  'common',
  'auth',
  'tasks',
  'projects',
  'settings',
  'dashboard',
  'notifications',
] as const;

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    defaultNS: DEFAULT_NAMESPACE,
    ns: [...NAMESPACES],

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false,
    },

    load: 'languageOnly',

    react: {
      useSuspense: true,
    },
  });

export default i18n;
