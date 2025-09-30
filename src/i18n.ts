import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import locale files
import enTranslations from './locales/en.json';
import afTranslations from './locales/af.json';
import esTranslations from './locales/es.json';

const resources = {
  en: {
    translation: enTranslations
  },
  af: {
    translation: afTranslations
  },
  es: {
    translation: esTranslations
    
  }
};

// Function to get user's saved locale or detect browser locale
const getUserLocale = async (): Promise<string> => {
  try {
    // First, try to get saved user preference from Chrome storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(['quantum-tab-userLocale']);
      if (result[`quantum-tab-userLocale`] && resources[result[`quantum-tab-userLocale`] as keyof typeof resources]) {
        return result[`quantum-tab-userLocale`];
      }
    }
  } catch (error) {
    console.warn('Failed to get user locale from storage:', error);
  }

  // Fallback to browser locale detection
  try {
    const browserLang = navigator.language.split('-')[0]; // Get language code without region
    if (resources[browserLang as keyof typeof resources]) {
      return browserLang;
    }
  } catch (error) {
    console.warn('Failed to detect browser locale:', error);
  }

  // Final fallback to English
  return 'en';
};

// Initialize i18n with user's preferred locale
const initializeI18n = async () => {
  const userLocale = await getUserLocale();
  
  return i18n
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
      resources,
      lng: userLocale, // use detected/saved language
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
};

// Initialize immediately
initializeI18n().catch(console.error);

export default i18n;