// utils/responsive.js
import { RFValue } from "react-native-responsive-fontsize";
import { Platform } from "react-native";
import { useWindowInfo } from "../context/windowContext";

// Хук для адаптивных размеров
export function useResponsiveSize() {
  const { width, isLandscape } = useWindowInfo();

  return (mobileSize, baseRatio = 400) => {
    // На мобайле или в веб-портрете работаем как мобильное приложение
    if (Platform.OS !== "web" || !isLandscape) {
      return RFValue(mobileSize);
    }

    // Только веб + landscape → масштабируем
    const scale = width / baseRatio;
    return Math.max(10, mobileSize * scale);
  };
}
