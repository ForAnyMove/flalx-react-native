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
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';

export default function OnboardingScreen({ onFinish }) {
  const { t } = useTranslation();
  const { themeController, languageController } = useComponentContext();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isRTL = languageController.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

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

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      skipBtnTop: isWebLandscape ? web(103) : mobile(10),
      skipSideMove: isWebLandscape ? web(200) : mobile(16),
      skipTextSize: isWebLandscape ? web(18) : mobile(14),
      imageContainerPadding: isWebLandscape ? web(18) : mobile(10),
      textContainerPadding: isWebLandscape ? web(0) : mobile(10),
      titleTextSize: isWebLandscape ? web(18) : mobile(20),
      titleMarginBottom: isWebLandscape ? web(13) : mobile(12),
      descriptionTextSize: isWebLandscape ? web(16) : mobile(14),
      descriptionLineHeight: isWebLandscape ? web(17) : mobile(15),
      descriptionMarginBottom: isWebLandscape ? web(48) : mobile(24),
      indicatorContainerGap: isWebLandscape ? web(12) : mobile(6),
      indicatorContainerMarginBottom: isWebLandscape ? web(16) : mobile(24),
      indicatorWidth: isWebLandscape ? web(26) : mobile(20),
      indicatorHeight: isWebLandscape ? web(6) : mobile(6),
      indicatorBorderRadius: isWebLandscape ? web(4) : mobile(3),
      buttonPaddingVertical: isWebLandscape ? web(4) : mobile(12),
      buttonBorderRadius: isWebLandscape ? web(8) : mobile(8),
      buttonHeight: isWebLandscape ? web(62) : mobile(40),
      buttonWidth: isWebLandscape ? web(331) : '100%',
      buttonMarginBottom: isWebLandscape ? 0 : mobile(15),
      buttonTextSize: isWebLandscape ? web(20) : mobile(16),
    };
  }, [isWebLandscape, height]);

  const skipBtnStyle = useMemo(
    () =>
      isRTL ? { left: sizes.skipSideMove } : { right: sizes.skipSideMove },
    [isRTL, sizes.skipSideMove]
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeController.current.backgroundColor },
        isWebLandscape && { justifyContent: 'center' },
      ]}
    >
      {/* Кнопка пропуска */}
      <TouchableOpacity
        onPress={onFinish}
        style={[
          styles.skipButton,
          skipBtnStyle,
          {
            top: sizes.skipBtnTop,
          },
        ]}
      >
        <Text
          style={[
            styles.skipText,
            {
              color: themeController.current.textColor,
              fontSize: sizes.skipTextSize,
            },
          ]}
        >
          {t('onboarding.skip')}
        </Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.content,
          isWebLandscape
            ? { flexDirection: isRTL ? 'row-reverse' : 'row' }
            : styles.contentPortrait,
          isWebLandscape ? styles.webLandscapeContent : null,
          { opacity: fadeAnim },
        ]}
      >
        {/* Картинка */}
        <View
          style={[
            styles.imageContainer,
            {
              paddingHorizontal: sizes.imageContainerPadding,
            },
            isWebLandscape && { flex: 0.9 },
          ]}
        >
          <Image
            source={slides[step].image}
            style={styles.image}
            resizeMode='contain'
          />
        </View>

        {/* Текстовый блок */}
        <View
          style={[
            styles.textContainer,
            {
              paddingHorizontal: sizes.textContainerPadding,
              paddingBottom: sizes.textContainerPadding,
              paddingTop: isWebLandscape ? sizes.textContainerPadding : 0,
            },
            isWebLandscape && { justifyContent: 'center', flex: 1 },
          ]}
        >
          <View style={[styles.partContainer]}>
            <Text
              style={[
                styles.title,
                {
                  color: themeController.current.primaryColor,
                  fontSize: sizes.titleTextSize,
                  marginBottom: sizes.titleMarginBottom,
                },
              ]}
            >
              {slides[step].title}
            </Text>
            <Text
              style={[
                styles.description,
                {
                  color: themeController.current.unactiveTextColor,
                  fontSize: sizes.descriptionTextSize,
                  lineHeight: sizes.descriptionLineHeight,
                  marginBottom: sizes.descriptionMarginBottom,
                },
                isWebLandscape && {
                  width: '90%',
                },
              ]}
            >
              {slides[step].text}
            </Text>
          </View>
          <View style={[styles.partContainer]}>
            {/* Индикатор */}
            <View
              style={[
                styles.indicatorContainer,
                {
                  gap: sizes.indicatorContainerGap,
                  marginBottom: sizes.indicatorContainerMarginBottom,
                },
              ]}
            >
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
                        width: sizes.indicatorWidth,
                        height: sizes.indicatorHeight,
                        borderRadius: sizes.indicatorBorderRadius,
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
                isWebLandscape && {
                  height: sizes.buttonHeight,
                },
                {
                  backgroundColor: themeController.current.backgroundColor,
                  borderColor:
                    themeController.current.buttonColorPrimaryDefault,
                  width: sizes.buttonWidth,
                  borderRadius: sizes.buttonBorderRadius,
                  paddingVertical: sizes.buttonPaddingVertical,
                  marginBottom: sizes.buttonMarginBottom,
                },
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: themeController.current.buttonColorPrimaryDefault,
                    fontSize: sizes.buttonTextSize,
                  },
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
    zIndex: 10,
  },
  skipText: {},
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
  },
  image: { width: '90%', maxHeight: '90%', aspectRatio: 344 / 316 },
  textContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Rubik-SemiBold',
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
  },
  indicator: {},
  button: {
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    justifyContent: 'center',
  },
  buttonText: {
    textTransform: 'uppercase',
  },
});
