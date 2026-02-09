import React, { createContext, useContext, useEffect, useState } from 'react';
import { Dimensions, Platform } from 'react-native';
import { scaleByHeight } from '../utils/resizeFuncs';
import { useKeyboardListener } from '../utils/useKeyboardListener';

const WindowContext = createContext(null);

export function WindowProvider({ children }) {
  const { isKeyboardVisible } = useKeyboardListener();

  const getWindow = () => {
    const { width, height } = Dimensions.get('window');
    const isLandscape = width > height;

    // 👇 вычисляем sidebarWidth сразу тут
    const sidebarWidth =
      Platform.OS === 'web' && isLandscape ? scaleByHeight(220, height) : 0;

    return { width, height, isLandscape, sidebarWidth,  };
  };

  const [windowInfo, setWindowInfo] = useState(getWindow());

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      const isLandscape = window.width > window.height;
      // if (
      //   (Platform.OS !== 'web' && isKeyboardVisible) ||
      //   (Platform.OS === 'web' && !isLandscape && isKeyboardVisible)
      // ) {
      //   return;
      // }

      setWindowInfo({
        width: window.width,
        height: window.height,
        isLandscape,
        sidebarWidth:
          Platform.OS === 'web' && isLandscape
            ? Math.max(90, Math.min(280, window.height * 0.22))
            : 0,
        isKeyboardVisible, // Добавляем isKeyboardVisible в состояние
      });
    });

    if (Platform.OS === 'web') {
      const onResize = () => {
        const { innerWidth, innerHeight } = window;
        const isLandscape = innerWidth > innerHeight;

        setWindowInfo({
          width: innerWidth,
          height: innerHeight,
          isLandscape,
          sidebarWidth:
            Platform.OS === 'web' && isLandscape
              ? Math.max(90, Math.min(280, innerHeight * 0.22))
              : 0, 
          isKeyboardVisible, // Добавляем isKeyboardVisible в состояние
        });
      };
      window.addEventListener('resize', onResize);
      return () => {
        sub?.remove?.();
        window.removeEventListener('resize', onResize);
      };
    }

    return () => sub?.remove?.();
  }, [isKeyboardVisible]);

  return (
    <WindowContext.Provider value={windowInfo}>
      {children}
    </WindowContext.Provider>
  );
}

export const useWindowInfo = () => useContext(WindowContext);
