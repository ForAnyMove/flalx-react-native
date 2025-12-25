import { Modal, Platform, View, Animated, Easing, useWindowDimensions } from 'react-native';
import { useEffect, useRef } from 'react';
import { useComponentContext } from '../context/globalAppContext';
import { useWindowInfo } from '../context/windowContext';

export default function JobModalWrapper({ visible, children, main=true}) {
  const { height, width } = useWindowDimensions();
  const { themeController, languageController } = useComponentContext();
  const isRTL = languageController.isRTL;
  const { sidebarWidth } = useWindowInfo();

  const isWebLandscape = Platform.OS === 'web' && width > height;

  // --- Анимация прозрачности и смещения
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!isWebLandscape) {
    // --- Стандартный Modal для мобилы и портретного веба
    return (
      <Modal visible={visible} animationType='slide' transparent>
        <View
          style={{
            flex: 1,
            backgroundColor: themeController.current?.backgroundColor,
          }}
        >
          {children}
        </View>
      </Modal>
    );
  }

  // --- Кастомный оверлей для web-landscape
  if (!visible) return null;

  return (
    <View
      style={{
        position: 'absolute',
        top: main ? -(height * 0.07) : 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        width:isWebLandscape ? width - sidebarWidth : width,
        zIndex: 999,
      }}
    >
      <Animated.View
        style={{
          flex: 1,
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
