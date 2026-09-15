import { Animated, Platform, View } from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import { useWindowInfo } from '../context/windowContext';
import AppModal from './ui/AppModal';
import { MODAL_SLIDE_OFFSET, useModalTransition } from './ui/useModalTransition';

export default function JobModalWrapper({ visible, children, main = true }) {
  const { themeController } = useComponentContext();
  const { effectiveSidebarWidth, width, height } = useWindowInfo();

  const isWebLandscape = Platform.OS === 'web' && width > height;

  const { rendered, opacity, translateY } = useModalTransition(visible);

  if (!isWebLandscape) {
    // --- Стандартный Modal для мобилы и портретного веба
    return (
      <AppModal visible={visible}>
        <View
          style={{
            flex: 1,
            backgroundColor: themeController.current?.backgroundColor,
          }}
        >
          {children}
        </View>
      </AppModal>
    );
  }

  // --- Кастомный оверлей для web-landscape
  if (!rendered) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: main ? -(height * 0.07) : 0,
        bottom: 0,
        left: 0,
        right: 0,
        width: width - effectiveSidebarWidth,
        zIndex: 999,
      }}
    >
      <Animated.View
        style={{
          // See AppModal.jsx: grown upward by the slide offset so the
          // backdrop never exposes an empty strip above it mid-slide.
          position: 'absolute',
          top: -MODAL_SLIDE_OFFSET,
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: themeController.current?.backgroundColor,
          opacity,
          transform: [{ translateY }],
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
}
