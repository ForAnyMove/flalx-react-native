import { useEffect, useState } from "react";
import { Platform, I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "../utils/i18n/i18n";
import { translations } from "../utils/i18n/translations";

// Languages we actually ship translations for — same source utils/i18n/i18n.js
// itself already guards its own detection against. This file has its own,
// separate detection (used everywhere via languageController.current) that
// was missing that guard: an unsupported device/browser locale (e.g. "ru")
// went straight into i18n.changeLanguage()/AsyncStorage, and from there into
// any API call that reads i18n.language directly (e.g. authApi's
// change-email `language` field) — even though the UI itself looked fine,
// since i18next's fallbackLng silently covers missing "ru" resource keys.
const supportedLanguages = Object.keys(translations);
const fallbackLng = "en";

export default function languageManager() {
  const [currentLang, setCurrentLang] = useState("en");
  const [rtl, setRtl] = useState(false);

  useEffect(() => {
    loadLang();
  }, []);

  async function loadLang() {
    let saved;
    if (Platform.OS === "web") {
      saved = localStorage.getItem("app_language");
    } else {
      saved = await AsyncStorage.getItem("app_language");
    }

    // Определяем системный язык
    let systemLang = fallbackLng;

    if (Platform.OS === "web") {
      // Для веба используем navigator.language
      systemLang = navigator.language?.split("-")[0] || fallbackLng;
    } else {
      // Для мобильных используем expo-localization (системный язык устройства)
      const locales = Localization.getLocales();
      systemLang = locales?.length ? locales[0].languageCode : fallbackLng;
    }

    // Device/browser locale (and a previously-saved value, in case this ran
    // once before the check below existed) can be a language we don't ship
    // (e.g. "ru") — only trust either one if we actually have translations
    // for it, otherwise fall back to English rather than silently adopting
    // an unsupported code.
    if (!supportedLanguages.includes(systemLang)) {
      systemLang = fallbackLng;
    }
    const lang = (saved && supportedLanguages.includes(saved)) ? saved : systemLang;
    applyLang(lang);
  }

  function applyLang(lang) {
    setCurrentLang(lang);
    i18n.changeLanguage(lang);

    const isRTL = ["he", "ar"].includes(lang);
    setRtl(isRTL);

    // if (Platform.OS !== "web") {
    //   I18nManager.allowRTL(isRTL);
    //   I18nManager.forceRTL(isRTL);
    // }

    if (Platform.OS === "web") {
      localStorage.setItem("app_language", lang);
    } else {
      AsyncStorage.setItem("app_language", lang);
    }
  }

  return {
    current: currentLang,
    isRTL: rtl,
    setLang: (lang) => applyLang(lang),
  };
}
