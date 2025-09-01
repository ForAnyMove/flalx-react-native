import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import { translations } from "./translations";

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

i18n.use(initReactI18next).init({
  compatibilityJSON: "v3",
  lng: systemLang,
  fallbackLng,
  resources: translations,
  interpolation: { escapeValue: false },
});

export default i18n;
