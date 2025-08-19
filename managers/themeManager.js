import { useEffect, useState } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DARK_THEME, LIGHT_THEME } from "../constants/themes";

export default function themeManager() {
  const [activeTheme, setActiveTheme] = useState(LIGHT_THEME);
  const [isLightActive, setLightActive] = useState(true);

  // Загружаем тему при старте
  useEffect(() => {
    loadTheme();
  }, []);

  async function loadTheme() {
    try {
      let savedTheme;
      if (Platform.OS === "web") {
        savedTheme = localStorage.getItem("app_theme");
      } else {
        savedTheme = await AsyncStorage.getItem("app_theme");
      }

      if (savedTheme === "dark") {
        setLightActive(false);
        setActiveTheme(DARK_THEME);
      } else if (savedTheme === "light") {
        setLightActive(true);
        setActiveTheme(LIGHT_THEME);
      }
    } catch (e) {
      console.error("Ошибка загрузки темы:", e);
    }
  }

  async function saveTheme(themeName) {
    try {
      if (Platform.OS === "web") {
        localStorage.setItem("app_theme", themeName);
      } else {
        await AsyncStorage.setItem("app_theme", themeName);
      }
    } catch (e) {
      console.error("Ошибка сохранения темы:", e);
    }
  }

  function switchTheme() {
    if (isLightActive) {
      setLightActive(false);
      setActiveTheme(DARK_THEME);
      saveTheme("dark");
    } else {
      setLightActive(true);
      setActiveTheme(LIGHT_THEME);
      saveTheme("light");
    }
  }

  function setTheme(themeName) {
    if (themeName === "dark") {
      setLightActive(false);
      setActiveTheme(DARK_THEME);
    } else {
      setLightActive(true);
      setActiveTheme(LIGHT_THEME);
    }
    saveTheme(themeName);
  }

  return {
    isTheme: isLightActive ? "light" : "dark",
    current: activeTheme,
    switchTheme,
    setTheme,
  };
}
