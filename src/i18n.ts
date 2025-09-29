import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import locale files
import enTranslations from './locales/en.json';

const resources = {
  en: {
    translation: enTranslations
  }
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en', // use en if detected lng is not available

    keySeparator: '.', // we use content as keys

    interpolation: {
      escapeValue: false // react already does escaping
    },

    // Additional options for Chrome extension environment
    debug: false, // Set to true for development debugging
    
    // Disable namespace feature for simplicity
    defaultNS: 'translation',
    
    // React specific options
    react: {
      useSuspense: false // Disable suspense for Chrome extension compatibility
    }
  });

export default i18n;