import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import locale files
import en from '../locales/en.json';
import pl from '../locales/pl.json';

const resources = {
  en: {
    translation: en
  },
  pl: {
    translation: pl
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // React already escapes values
    },
    debug: process.env.NODE_ENV === 'development'
  });

export default i18n; 