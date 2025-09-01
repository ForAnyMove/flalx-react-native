import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  I18nManager,
  Modal,
  useWindowDimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { useTranslation } from "react-i18next";
import { useComponentContext } from "../context/globalAppContext";

const OTP_LENGTH = 6;

// Адаптив размеров (mobile => RFValue, web => уменьшенный фикс)
const getResponsiveSize = (mobileSize, webSize) => {
  if (Platform.OS === "web") return webSize;
  return RFValue(mobileSize);
};

export default function AuthScreen() {
  const { t } = useTranslation();
  const { session, themeController, languageController } = useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(null);
  const [sending, setSending] = useState(false);

  const [otp, setOtp] = useState(Array.from({ length: OTP_LENGTH }, () => ""));
  const inputsRef = useRef([]);
  const [showResentModal, setShowResentModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState(null);

  // Анимации
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Автофокус
  const emailInputRef = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (step === "email") {
        emailInputRef.current?.focus();
      } else {
        inputsRef.current[0]?.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [step]);

  const isValidEmail = useMemo(() => {
    const re =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
    return re.test(email.trim());
  }, [email]);

  // Плавный переход между шагами
  const animateStepChange = (newStep) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setStep(newStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  // Встряска при ошибке OTP
  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  // Отправка кода
  const onSendCode = async () => {
    if (!isValidEmail) {
      setEmailError(t("auth.invalid_email"));
      return;
    }
    setEmailError(null);
    try {
      setSending(true);
      await session?.sendCode(email.trim());
      animateStepChange("otp");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  // Переотправка
  const handleResend = async () => {
    try {
      await session?.sendCode(email.trim());
      setShowResentModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  // Обработка ввода OTP
  const onChangeOtpCell = (text, idx) => {
    const value = text.replace(/\s+/g, "").slice(-1);
    const next = [...otp];
    next[idx] = value;
    setOtp(next);
    if (otpError) setOtpError(null); // любая правка сбрасывает ошибку

    if (value && idx < OTP_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const onKeyPressOtp = (e, idx) => {
    if (e.nativeEvent.key === "Backspace" && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const joinedCode = useMemo(() => otp.join(""), [otp]);
  const canConfirm = joinedCode.length === OTP_LENGTH;

  const clearOtp = () => {
    setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
    setOtpError(null);
    inputsRef.current[0]?.focus();
  };

  const onConfirm = async () => {
    if (!canConfirm) return;
    try {
      setVerifying(true);
      await session?.checkCode(joinedCode);
      // успешный вход → навигация во внешней логике
    } catch (e) {
      // например: 403 Forbidden / Token has expired or is invalid
      console.error("Ошибка проверки кода:", e);
      setOtpError(t("auth.invalid_code"));
      triggerShake();
    } finally {
      setVerifying(false);
    }
  };

  // Назад к email (через анимацию + очистки)
  const backToEmail = () => {
    clearOtp();
    animateStepChange("email");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={[styles.root, { backgroundColor: theme.backgroundColor }]}
      keyboardVerticalOffset={Platform.select({ ios: RFValue(10), android: 0 })}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          Platform.OS === "web" && isLandscape
            ? { justifyContent: "center", alignItems: "center", flex: 1 }
            : {},
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.contentBlock,
            Platform.OS === "web" && isLandscape
              ? { width: Math.min(height * 0.5, 500) } // ≤ 50% высоты экрана
              : { width: "100%" },
            { opacity: fadeAnim },
          ]}
        >
          {/* Бренд */}
          <Text style={[styles.brand, { color: theme.primaryColor }]}>
            {t("auth.app_name")}
          </Text>

          {/* Шаг EMAIL */}
          {step === "email" ? (
            <>
              <Text style={[styles.title, { color: theme.textColor, textAlign: "center" }]}>
                {t("auth.email_title")}
              </Text>
              <Text style={[styles.subtitle, { color: theme.unactiveTextColor, textAlign: "center" }]}>
                {t("auth.email_subtitle")}
              </Text>

              <View style={styles.fieldBlock}>
                <Text
                  style={[
                    styles.label,
                    { color: theme.formInputLabelColor, textAlign: isRTL ? "right" : "left" },
                  ]}
                >
                  {t("auth.email_label")}
                </Text>
                <TextInput
                  ref={emailInputRef}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.defaultBlocksBackground,
                      borderColor: theme.borderColor,
                      color: theme.formInputTextColor,
                      textAlign: isRTL ? "right" : "left",
                    },
                  ]}
                  placeholder="name@example.com"
                  placeholderTextColor={theme.formInputPlaceholderColor}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  returnKeyType="done"
                />
                {!!emailError && (
                  <Text style={[styles.error, { color: "#D32F2F" }]}>{emailError}</Text>
                )}
              </View>

              <PrimaryOutlineButton
                theme={theme}
                title={sending ? <ActivityIndicator color={theme.primaryColor} /> : t("auth.send_code")}
                onPress={onSendCode}
                disabled={sending}
              />
            </>
          ) : (
            /* Шаг OTP */
            <>
              <Text style={[styles.title, { color: theme.textColor, textAlign: "center" }]}>
                {t("auth.otp_title")} {email}
              </Text>
              <Text style={[styles.subtitle, { color: theme.unactiveTextColor, textAlign: "center" }]}>
                {t("auth.otp_subtitle")}
              </Text>

              <Text
                style={[
                  styles.label,
                  {
                    color: theme.formInputLabelColor,
                    textAlign: isRTL ? "right" : "left",
                    alignSelf: isRTL ? "flex-end" : "flex-start",
                  },
                ]}
              >
                {t("auth.otp_label")}
              </Text>

              <Animated.View
                style={[
                  styles.otpRow,
                  { transform: [{ translateX: shakeAnim }], flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                  <TextInput
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    style={[
                      styles.otpCell,
                      {
                        backgroundColor: theme.defaultBlocksBackground,
                        borderColor: theme.borderColor,
                        color: theme.textColor,
                      },
                    ]}
                    value={otp[i]}
                    onChangeText={(txt) => onChangeOtpCell(txt, i)}
                    onKeyPress={(e) => onKeyPressOtp(e, i)}
                    keyboardType={Platform.OS === "web" ? "default" : "number-pad"}
                    maxLength={1}
                    textContentType="oneTimeCode"
                  />
                ))}
              </Animated.View>

              {!!otpError && (
                <Text style={[styles.error, { color: "#D32F2F", textAlign: "center" }]}>
                  {otpError}
                </Text>
              )}

              {/* Линки: back + resend (зеркалим порядок через isRTL) */}
              <View
                style={[
                  styles.linksRow,
                  { flexDirection: isRTL ? "row" : "row-reverse" },
                ]}
              >
                <TouchableOpacity onPress={backToEmail}>
                  <Text style={[styles.link, { color: theme.primaryColor }]}>
                    {t("auth.back_to_email")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleResend}>
                  <Text style={[styles.link, { color: theme.primaryColor }]}>
                    {t("auth.resend_code")}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Кнопка подтверждения/очистки */}
              {otpError ? (
                <PrimaryOutlineButton
                  theme={theme}
                  title={t("auth.clear_code")}
                  onPress={clearOtp}
                />
              ) : (
                <PrimaryOutlineButton
                  theme={theme}
                  title={
                    verifying ? <ActivityIndicator color={theme.primaryColor} /> : t("auth.confirm")
                  }
                  onPress={onConfirm}
                  disabled={!canConfirm || verifying}
                />
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Модалка "код отправлен" — вернул */}
      <Modal visible={showResentModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.defaultBlocksBackground },
            ]}
          >
            <Text style={[styles.modalText, { color: theme.textColor }]}>
              {t("auth.resend_modal_text")}
            </Text>
            <PrimaryOutlineButton
              theme={theme}
              title={t("auth.ok")}
              onPress={() => setShowResentModal(false)}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function PrimaryOutlineButton({ title, onPress, disabled, theme }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.outlineBtn,
        { borderColor: theme.primaryColor, opacity: disabled ? 0.6 : 1 },
      ]}
    >
      {typeof title === "string" ? (
        <Text style={[styles.outlineBtnText, { color: theme.primaryColor }]}>{title}</Text>
      ) : (
        title
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: "6%",
    paddingVertical: RFValue(24),
  },
  contentBlock: {
    alignSelf: "center",
  },
  brand: {
    fontSize: getResponsiveSize(28, 24),
    fontWeight: "800",
    letterSpacing: getResponsiveSize(3, 2),
    textAlign: "center",
    marginBottom: getResponsiveSize(18, 12),
  },
  title: {
    fontSize: getResponsiveSize(18, 16),
    fontWeight: "700",
    textAlign: "center",
    marginBottom: getResponsiveSize(6, 4),
  },
  subtitle: {
    fontSize: getResponsiveSize(13, 12),
    textAlign: "center",
    marginBottom: getResponsiveSize(18, 12),
  },
  fieldBlock: {
    marginBottom: getResponsiveSize(16, 10),
  },
  label: {
    fontSize: getResponsiveSize(12, 11),
    marginBottom: getResponsiveSize(6, 4),
  },
  input: {
    height: getResponsiveSize(48, 40),
    borderWidth: 1,
    borderRadius: getResponsiveSize(10, 8),
    paddingHorizontal: getResponsiveSize(12, 10),
    fontSize: getResponsiveSize(14, 13),
  },
  outlineBtn: {
    height: getResponsiveSize(48, 40),
    borderWidth: 1.5,
    borderRadius: getResponsiveSize(12, 8),
    alignItems: "center",
    justifyContent: "center",
    marginTop: getResponsiveSize(12, 8),
    backgroundColor: "transparent",
  },
  outlineBtnText: {
    fontSize: getResponsiveSize(15, 13),
    fontWeight: "700",
  },
  otpRow: {
    width: "100%",
    justifyContent: "space-between",
    marginTop: getResponsiveSize(6, 4),
    marginBottom: getResponsiveSize(12, 8),
  },
  otpCell: {
    width: `${100 / OTP_LENGTH - 2}%`,
    height: getResponsiveSize(52, 42),
    borderWidth: 1,
    borderRadius: getResponsiveSize(10, 8),
    textAlign: "center",
    fontSize: getResponsiveSize(18, 16),
    fontWeight: "700",
  },
  linksRow: {
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: getResponsiveSize(10, 8),
  },
  link: {
    fontSize: getResponsiveSize(13, 12),
    textDecorationLine: "underline",
  },
  error: {
    fontSize: getResponsiveSize(13, 12),
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: "10%",
  },
  modalCard: {
    width: "100%",
    borderRadius: getResponsiveSize(14, 10),
    padding: getResponsiveSize(18, 12),
  },
  modalText: {
    fontSize: getResponsiveSize(14, 12),
    textAlign: "center",
    marginBottom: getResponsiveSize(10, 8),
  },
});
