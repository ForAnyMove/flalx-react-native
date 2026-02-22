import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import { Dimensions, Platform } from 'react-native';
import { scaleByHeight } from '../utils/resizeFuncs';
import { useKeyboardListener } from '../utils/useKeyboardListener';

const WindowContext = createContext(null);

export function WindowProvider({ children }) {
  const { isKeyboardVisible } = useKeyboardListener();
  const [focusedInputs, setFocusedInputs] = useState([]);

  const addFocusedInput = useCallback((id) => {
    setFocusedInputs((prev) => [...prev, id]);
  }, []);

  const removeFocusedInput = useCallback((id) => {
    setFocusedInputs((prev) => prev.filter((inputId) => inputId !== id));
  }, []);

  const getWindow = () => {
    const { width, height } = Dimensions.get('window');
    const isLandscape = width > height;

    // 👇 вычисляем sidebarWidth сразу тут
    const sidebarWidth =
      Platform.OS === 'web' && isLandscape ? scaleByHeight(220, height) : 0;

    return {
      width,
      height,
      isLandscape,
      sidebarWidth,
      isKeyboardVisible: false,
      focusedInputs: [],
      addFocusedInput,
      removeFocusedInput,
    };
  };

  const [windowInfo, setWindowInfo] = useState(getWindow());

  useEffect(() => {
    const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
    const isMobileWeb = Platform.OS === 'web' && window.innerWidth < 892; // Примерный порог для мобильного веба

    const shouldBlockResize =
      (isMobile && isKeyboardVisible) ||
      (isMobileWeb && focusedInputs.length > 0);

    const sub = Dimensions.addEventListener('change', ({ window }) => {
      // if (shouldBlockResize) {
      //   return;
      // }

      const isLandscape = window.width > window.height;

      setWindowInfo((prev) => ({
        ...prev,
        width: window.width,
        height: shouldBlockResize ? prev.height : window.height,
        isLandscape: shouldBlockResize ? prev.isLandscape : isLandscape,
        sidebarWidth:
          Platform.OS === 'web' &&
          (shouldBlockResize ? prev.isLandscape : isLandscape)
            ? scaleByHeight(
                220,
                shouldBlockResize ? prev.height : window.height
              )
            : 0,
      }));
    });

    if (Platform.OS === 'web') {
      const onResize = () => {
        if (shouldBlockResize) {
          return;
        }
        const { innerWidth, innerHeight } = window;
        const isLandscape = innerWidth > innerHeight;

        setWindowInfo((prev) => ({
          ...prev,
          width: innerWidth,
          height: innerHeight,
          isLandscape,
          sidebarWidth:
            Platform.OS === 'web' && isLandscape
              ? scaleByHeight(
                  220,
                  shouldBlockResize ? prev.height : innerHeight
                )
              : 0,
        }));
      };
      window.addEventListener('resize', onResize);
      return () => {
        sub?.remove?.();
        window.removeEventListener('resize', onResize);
      };
    }

    return () => sub?.remove?.();
  }, [isKeyboardVisible, focusedInputs]);

  const value = useMemo(
    () => ({
      ...windowInfo,
      isKeyboardVisible,
      focusedInputs,
      addFocusedInput,
      removeFocusedInput,
    }),
    [
      windowInfo,
      isKeyboardVisible,
      focusedInputs,
      addFocusedInput,
      removeFocusedInput,
    ]
  );

  return (
    <WindowContext.Provider value={value}>{children}</WindowContext.Provider>
  );
}

export const useWindowInfo = () => useContext(WindowContext);
