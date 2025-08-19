import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { I18nManager } from "react-native";
import * as Localization from "expo-localization";
import { translations } from "./translations";

// Твои переводы
const resources = {
  en: {
    translation: {
      hello: "Hello, {{name}}!",
      messages: "You have {{count}} message",
      messages_plural: "You have {{count}} messages",
      settings: "Settings",
    },
  },
  he: {
    translation: {
      hello: "שלום, {{name}}!",
      messages: "יש לך הודעה אחת",
      messages_plural: "יש לך {{count}} הודעות",
      settings: "הגדרות",
    },
  },
  ru: {
    translation: {
      hello: "Привет, {{name}}!",
      messages: "У вас {{count}} сообщение",
      messages_plural: "У вас {{count}} сообщений",
      settings: "Настройки",
    },
  },
};

// Языки, которые мы реально поддерживаем
const supportedLanguages = Object.keys(translations);
const fallbackLng = "en";

// Берём первый системный язык
const locales = Localization.getLocales();
let systemLang = locales?.length ? locales[0].languageCode : fallbackLng;

// Если язык не поддерживается → fallback
if (!supportedLanguages.includes(systemLang)) {
  systemLang = fallbackLng;
}

// Проверка RTL
const isRTL = systemLang === "he" || systemLang === "ar";
I18nManager.allowRTL(isRTL);
I18nManager.forceRTL(isRTL);

i18n.use(initReactI18next).init({
  compatibilityJSON: "v3",
  lng: systemLang,
  fallbackLng,
  translations,
  interpolation: { escapeValue: false },
});

export default i18n;
