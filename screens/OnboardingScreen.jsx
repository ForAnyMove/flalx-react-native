import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  I18nManager,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import { useWindowInfo } from '../context/windowContext'; // ✅ заменили useWindowDimensions

// универсальная функция адаптации размеров
const getResponsiveSize = (mobileSize, webSize) => {
  if (Platform.OS === 'web') {
    return webSize; // фикс/уменьшенный размер для веба
  }
  return RFValue(mobileSize);
};

export default function OnboardingScreen({ onFinish }) {
  const { t } = useTranslation();
  const { themeController, languageController } = useComponentContext();
  const { width, height, isLandscape } = useWindowInfo(); // ✅ теперь из контекста
  const isRTL = languageController.isRTL;

  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const slides = [
    {
      image: require('../assets/onboarding/onboarding-img-1.png'),
      title: t('onboarding.first_slide_title'),
      text: t('onboarding.first_slide_text'),
      button: t('onboarding.first_slide_btn_text'),
    },
    {
      image: require('../assets/onboarding/onboarding-img-2.png'),
      title: t('onboarding.second_slide_title'),
      text: t('onboarding.second_slide_text'),
      button: t('onboarding.second_slide_btn_text'),
    },
  ];

  const animateStepChange = (newStep) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start(() => {
      setStep(newStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }).start();
    });
  };

  const handleNext = () => {
    if (step < slides.length - 1) {
      animateStepChange(step + 1);
    } else {
      onFinish();
    }
  };

  const skipBtnStyle = useMemo(
    () =>
      isRTL
        ? { left: getResponsiveSize(16, height * 1.4 * 0.1) }
        : { right: getResponsiveSize(10, height * 1.4 * 0.1) },
    [isRTL, height]
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeController.current.backgroundColor },
        Platform.OS === 'web' && isLandscape && { justifyContent: 'center' },
      ]}
    >
      {/* Кнопка пропуска */}
      <TouchableOpacity
        onPress={onFinish}
        style={[
          styles.skipButton,
          skipBtnStyle,
          Platform.OS === 'web' &&
            isLandscape && {
              top: getResponsiveSize(30, 30),
            },
        ]}
      >
        <Text
          style={[
            styles.skipText,
            { color: themeController.current.textColor },
          ]}
        >
          {t('onboarding.skip')}
        </Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.content,
          isLandscape
            ? { flexDirection: isRTL ? 'row-reverse' : 'row' }
            : styles.contentPortrait,
          Platform.OS === 'web' && isLandscape
            ? styles.webLandscapeContent
            : null,
          { opacity: fadeAnim },
        ]}
      >
        {/* Картинка */}
        <View
          style={[
            styles.imageContainer,
            Platform.OS === 'web' && isLandscape && { flex: 0.9 },
          ]}
        >
          <Image
            source={slides[step].image}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* Текстовый блок */}
        <View
          style={[
            styles.textContainer,
            Platform.OS === 'web' &&
              isLandscape && { justifyContent: 'center', flex: 1 },
          ]}
        >
          <View style={[styles.partContainer]}>
            <Text
              style={[
                styles.title,
                { color: themeController.current.primaryColor },
              ]}
            >
              {slides[step].title}
            </Text>
            <Text
              style={[
                styles.description,
                { color: themeController.current.unactiveTextColor },
                Platform.OS === 'web' &&
                  isLandscape && {
                    marginBottom: getResponsiveSize(30, 20),
                    width: '90%',
                  },
              ]}
            >
              {slides[step].text}
            </Text>
          </View>
          <View style={[styles.partContainer]}>
            {/* Индикатор */}
            <View style={styles.indicatorContainer}>
              {slides.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => animateStepChange(i)}>
                  <View
                    style={[
                      styles.indicator,
                      {
                        backgroundColor:
                          i === step
                            ? themeController.current.primaryColor
                            : themeController.current.primaryColor + '80',
                      },
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Кнопка */}
            <TouchableOpacity
              onPress={handleNext}
              style={[
                styles.button,
                {
                  backgroundColor:
                    themeController.current.backgroundColor,
                  borderColor: themeController.current.buttonColorPrimaryDefault,
                },
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  { color: themeController.current.buttonColorPrimaryDefault },
                ]}
              >
                {slides[step].button}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipButton: {
    position: 'absolute',
    top: RFValue(20),
    zIndex: 10,
  },
  skipText: {
    fontSize: getResponsiveSize(14, 12),
    fontWeight: '500',
  },
  content: { flex: 1 },
  contentPortrait: { flexDirection: 'column' },
  webLandscapeContent: {
    aspectRatio: 2 / 1,
    maxHeight: '80%',
    maxWidth: '85%',
    paddingHorizontal: '5%',
    alignSelf: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    flex: 1.5,
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: RFValue(10),
  },
  image: { width: '90%', height: '90%' },
  textContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: RFValue(20),
  },
  partContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: getResponsiveSize(20, 18),
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: getResponsiveSize(12, 8),
  },
  description: {
    fontSize: getResponsiveSize(14, 13),
    textAlign: 'center',
    fontWeight: '600',
    lineHeight: getResponsiveSize(20, 18),
    marginBottom: getResponsiveSize(24, 16),
  },
  indicatorContainer: {
    flexDirection: 'row',
    gap: getResponsiveSize(8, 6),
    marginBottom: getResponsiveSize(24, 16),
  },
  indicator: {
    width: getResponsiveSize(20, 14),
    height: getResponsiveSize(6, 4),
    borderRadius: getResponsiveSize(3, 2),
  },
  button: {
    width: Platform.OS === 'web' ? '70%' : '100%',
    paddingVertical: getResponsiveSize(12, 10),
    borderRadius: getResponsiveSize(8, 6),
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1.5,
  },
  buttonText: {
    fontSize: getResponsiveSize(16, 14),
    fontWeight: '700',
    textTransform: 'uppercase'
  },
});
