import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from 'react-native';
// Optional reload support; we will dynamically import expo-updates if present
import en from "./translations/en.json";
import es from "./translations/es.json";
import pt from "./translations/pt.json";
import zh from "./translations/zh.json";
import ko from "./translations/ko.json";
import ja from "./translations/ja.json";
import hi from "./translations/hi.json";
import de from "./translations/de.json";
import sv from "./translations/sv.json";
import ms from "./translations/ms.json";
import ar from "./translations/ar.json";
import ne from "./translations/ne.json";
import fr from "./translations/fr.json";
import it from "./translations/it.json";

const resources = {
  en: { translation: en },
  es: { translation: es },
  pt: { translation: pt },
  zh: { translation: zh },
  ko: { translation: ko },
  ja: { translation: ja },
  hi: { translation: hi },
  de: { translation: de },
  sv: { translation: sv },
  ms: { translation: ms },
  ar: { translation: ar },
  ne: { translation: ne },
  fr: { translation: fr },
  it: { translation: it }
};

// Initialize i18n with proper configuration
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    returnNull: false,
    returnEmptyString: false,
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false,
    },
    // This is important for React Native
    compatibilityJSON: 'v3'
  });

// Function to save language
const saveLanguage = async (language) => {
  try {
    await AsyncStorage.setItem("userLanguage", language);
  } catch (error) {
    console.log("Error saving language:", error);
  }
};

// Apply layout direction (RTL/LTR) based on language code
const RTL_LANGS = ["ar", "fa", "he", "ur"]; // Nepali (ne) is LTR
const applyLayoutDirection = (language) => {
  const isRTL = RTL_LANGS.includes(language);
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    // Only force direction when switching into RTL; avoid unnecessary flips for LTR
    if (isRTL) {
      I18nManager.forceRTL(true);
    } else {
      I18nManager.forceRTL(false);
    }
  }
  return isRTL;
};

const reloadIfAvailable = async () => {
  try {
    // Dynamically import to avoid hard dependency
    const Updates = require('expo-updates');
    if (Updates?.reloadAsync) {
      await Updates.reloadAsync();
    }
  } catch (e) {
    // expo-updates not installed; skip reload
  }
};

// Override changeLanguage to save to storage
const originalChangeLanguage = i18n.changeLanguage.bind(i18n);
i18n.changeLanguage = async (language) => {
  try {
    const prevIsRTL = I18nManager.isRTL;
    await saveLanguage(language);
    const newIsRTL = applyLayoutDirection(language);
    const result = await originalChangeLanguage(language);
    
    // Only reload if RTL state changed and we're not in a critical state
    if (prevIsRTL !== newIsRTL) {
      // Use a timeout to avoid immediate reload during navigation
      setTimeout(async () => {
        try {
          await reloadIfAvailable();
        } catch (error) {
          console.log('Reload failed, continuing with current state:', error);
        }
      }, 1000);
    }
    return result;
  } catch (error) {
    console.error('Language change error:', error);
    // Fallback to original changeLanguage without RTL handling
    return await originalChangeLanguage(language);
  }
};

export { saveLanguage };
export default i18n;

// Apply saved language after initialization to avoid stale language states across screens
(async () => {
  try {
    const stored = await AsyncStorage.getItem("userLanguage");
    if (stored && stored !== i18n.language) {
      const prevIsRTL = I18nManager.isRTL;
      const newIsRTL = applyLayoutDirection(stored);
      await originalChangeLanguage(stored);
      
      // Only reload if RTL state changed and we're not in a critical state
      if (prevIsRTL !== newIsRTL) {
        // Use a timeout to avoid immediate reload during app startup
        setTimeout(async () => {
          try {
            await reloadIfAvailable();
          } catch (error) {
            console.log('Initial reload failed, continuing with current state:', error);
          }
        }, 2000);
      }
    }
  } catch (e) {
    console.log('Language initialization error:', e);
  }
})();