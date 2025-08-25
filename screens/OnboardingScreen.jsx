import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  I18nManager,
  Animated,
  Easing,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { useTranslation } from "react-i18next";
import { useComponentContext } from "../context/globalAppContext";

export default function OnboardingScreen({ onFinish }) {
  const { t } = useTranslation();
  const { themeController } = useComponentContext();
  const { width, height } = useWindowDimensions();
  const isRTL = I18nManager.isRTL;

  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const slides = [
    {
      image: require("../assets/onboarding/onboarding-img-1.png"),
      title: t("onboarding.first_slide_title"),
      text: t("onboarding.first_slide_text"),
      button: t("onboarding.first_slide_btn_text"),
    },
    {
      image: require("../assets/onboarding/onboarding-img-2.png"),
      title: t("onboarding.second_slide_title"),
      text: t("onboarding.second_slide_text"),
      button: t("onboarding.second_slide_btn_text"),
    },
  ];

  const isLandscape = width > height;
  
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

  return (
    <View style={[styles.container, { backgroundColor: themeController.current.backgroundColor }]}>
      {/* Кнопка пропуска */}
      <TouchableOpacity
        onPress={onFinish}
        style={[
          styles.skipButton,
          isRTL ? { left: RFValue(16) } : { right: RFValue(16) },
        ]}
      >
        <Text style={[styles.skipText, { color: themeController.current.textColor }]}>
          {t("onboarding.skip")}
        </Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.content,
          isLandscape ? styles.contentLandscape : styles.contentPortrait,
          { opacity: fadeAnim },
        ]}
      >
        {/* Картинка */}
        <View style={styles.imageContainer}>
          <Image source={slides[step].image} style={styles.image} resizeMode="contain" />
        </View>

        {/* Текстовый блок */}
        <View style={styles.textContainer}>
          <View style={styles.partContainer}>
            <Text style={[styles.title, { color: themeController.current.primaryColor }]}>
              {slides[step].title}
            </Text>
            <Text style={[styles.description, { color: themeController.current.unactiveTextColor }]}>
              {slides[step].text}
            </Text>
          </View>
          <View style={styles.partContainer}>
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
                            : themeController.current.primaryColor + "80", // полупрозрачный
                      },
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Кнопка */}
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.button, { backgroundColor: themeController.current.buttonColorPrimaryDefault }]}
            >
              <Text style={[styles.buttonText, { color: themeController.current.buttonTextColorPrimary }]}>
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
  container: {
    flex: 1,
  },
  skipButton: {
    position: "absolute",
    top: RFValue(20),
    zIndex: 10,
  },
  skipText: {
    fontSize: RFValue(14),
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  contentPortrait: {
    flexDirection: "column",
  },
  contentLandscape: {
    flexDirection: "row",
  },
  imageContainer: {
    flex: 1.5,
    justifyContent: "flex-end",
    alignItems: "center",
    padding: RFValue(10),
  },
  image: {
    width: "90%",
    height: "90%",
  },
  textContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    padding: RFValue(20),
  },
  partContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: RFValue(20),
    fontWeight: "700",
    textAlign: "center",
    marginBottom: RFValue(12),
  },
  description: {
    fontSize: RFValue(14),
    textAlign: "center",
    lineHeight: RFValue(20),
    marginBottom: RFValue(24),
  },
  indicatorContainer: {
    flexDirection: "row",
    gap: RFValue(8),
    marginBottom: RFValue(24),
  },
  indicator: {
    width: RFValue(20),
    height: RFValue(6),
    borderRadius: RFValue(3),
  },
  button: {
    width: "100%",
    paddingVertical: RFValue(12),
    borderRadius: RFValue(8),
    alignItems: "center",
  },
  buttonText: {
    fontSize: RFValue(16),
    fontWeight: "600",
  },
});
