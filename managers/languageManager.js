import { useEffect, useState } from "react";
import { Platform, I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "../utils/i18n/i18n";

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
    let systemLang = "en"; // fallback

    if (Platform.OS === "web") {
      // Для веба используем navigator.language
      systemLang = navigator.language?.split("-")[0] || "en";
    } else {
      // Для мобильных используем expo-localization (системный язык устройства)
      const locales = Localization.getLocales();
      systemLang = locales?.length ? locales[0].languageCode : "en";
    }

    const lang = saved || systemLang;
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
