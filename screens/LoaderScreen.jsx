import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';

export default function LoadingStub() {
  const { t } = useTranslation();
  const { themeController } = useComponentContext();
  const theme = themeController.current;

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  // --- АНИМАЦИЯ ПУЛЬСА ---
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0.6,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      fontSize: isWebLandscape ? web(48) : mobile(40),
      letterSpacing: isWebLandscape ? web(4) : mobile(2),
      indicatorMarginTop: isWebLandscape ? web(20) : mobile(20),
    };
  }, [isWebLandscape, height]);

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <Animated.Text
        style={[
          styles.text,
          {
            opacity: pulse,
            color: theme.primaryColor,
            fontSize: sizes.fontSize,
            letterSpacing: sizes.letterSpacing,
          },
        ]}
      >
        FLALX
      </Animated.Text>

      <ActivityIndicator
        size={isLandscape ? 'large' : 'small'}
        color={theme.primaryColor}
        style={{ marginTop: sizes.indicatorMarginTop }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    fontFamily: 'Rubik-Bold',
    fontWeight: '700',
    textAlign: 'center'
  }
});
