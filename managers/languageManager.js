import { useEffect, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n from "../utils/i18n/i18n";

export default function languageManager() {
  const [currentLang, setCurrentLang] = useState("en");

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

    if (saved) {
      setCurrentLang(saved);
      i18n.changeLanguage(saved);
    } else {
      // если ничего не сохранено — используем язык браузера/системы
      const browserLang = Platform.OS === "web" 
        ? navigator.language.split("-")[0] 
        : "en";
      setCurrentLang(browserLang);
      i18n.changeLanguage(browserLang);
    }
  }

  async function changeLang(lang) {
    setCurrentLang(lang);
    i18n.changeLanguage(lang);

    if (Platform.OS === "web") {
      localStorage.setItem("app_language", lang);
    } else {
      await AsyncStorage.setItem("app_language", lang);
    }
  }

  return {
    current: currentLang,
    setLang: (lang) => changeLang(lang),
  };
}
