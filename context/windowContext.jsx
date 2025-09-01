import React, { createContext, useContext, useEffect, useState } from "react";
import { Dimensions, Platform } from "react-native";

const WindowContext = createContext(null);

export function WindowProvider({ children }) {
  const getWindow = () => {
    const { width, height } = Dimensions.get("window");
    return { width, height, isLandscape: width > height };
  };

  const [windowInfo, setWindowInfo] = useState(getWindow());

  useEffect(() => {
    // на native
    const sub = Dimensions.addEventListener("change", ({ window }) => {
      setWindowInfo({
        width: window.width,
        height: window.height,
        isLandscape: window.width > window.height,
      });
    });

    // на web ловим resize напрямую
    if (Platform.OS === "web") {
      const onResize = () => {
        const { innerWidth, innerHeight } = window;
        setWindowInfo({
          width: innerWidth,
          height: innerHeight,
          isLandscape: innerWidth > innerHeight,
        });
      };
      window.addEventListener("resize", onResize);
      return () => {
        sub?.remove?.();
        window.removeEventListener("resize", onResize);
      };
    }

    return () => sub?.remove?.();
  }, []);

  return (
    <WindowContext.Provider value={windowInfo}>
      {children}
    </WindowContext.Provider>
  );
}

export const useWindowInfo = () => useContext(WindowContext);
