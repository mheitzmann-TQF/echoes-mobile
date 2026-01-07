import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';
import de from './locales/de.json';
import it from './locales/it.json';

export const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'pt', 'de', 'it'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  de: 'Deutsch',
  it: 'Italiano',
};

const LANGUAGE_STORAGE_KEY = '@echoes_language';

const resources = {
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  pt: { translation: pt },
  de: { translation: de },
  it: { translation: it },
};

function getDeviceLanguage(): SupportedLanguage {
  try {
    const locales = Localization.getLocales();
    if (locales && locales.length > 0) {
      const langCode = locales[0].languageCode?.toLowerCase() || 'en';
      if (SUPPORTED_LANGUAGES.includes(langCode as SupportedLanguage)) {
        return langCode as SupportedLanguage;
      }
    }
  } catch (error) {
    console.log('[i18n] Error detecting device language:', error);
  }
  return 'en';
}

export async function getSavedLanguage(): Promise<SupportedLanguage | null> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.includes(saved as SupportedLanguage)) {
      return saved as SupportedLanguage;
    }
  } catch (error) {
    console.log('[i18n] Error reading saved language:', error);
  }
  return null;
}

export async function saveLanguage(lang: SupportedLanguage): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch (error) {
    console.log('[i18n] Error saving language:', error);
  }
}

export async function clearSavedLanguage(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LANGUAGE_STORAGE_KEY);
  } catch (error) {
    console.log('[i18n] Error clearing saved language:', error);
  }
}

export async function initI18n(): Promise<void> {
  if (i18n.isInitialized) {
    return;
  }
  
  const savedLanguage = await getSavedLanguage();
  const initialLanguage = savedLanguage || getDeviceLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
}

export async function changeLanguage(lang: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(lang);
  await saveLanguage(lang);
}

export function getCurrentLanguage(): SupportedLanguage {
  return (i18n.language as SupportedLanguage) || 'en';
}

export default i18n;
