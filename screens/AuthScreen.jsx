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
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import { useTranslation } from "react-i18next";
import { useComponentContext } from "../context/globalAppContext";

const OTP_LENGTH = 6;

export default function AuthScreen() {
  const { t } = useTranslation();
  const { session, themeController } = useComponentContext();
  const theme = themeController.current;
  const isRTL = I18nManager.isRTL;

  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(null);
  const [sending, setSending] = useState(false);

  const [otp, setOtp] = useState(
    Array.from({ length: OTP_LENGTH }, () => "")
  );
  const inputsRef = useRef([]);
  const [showResentModal, setShowResentModal] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Автофокус при смене шага
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
      setStep("otp");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

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
    // Разрешаем только цифры/буквы, но в UI ожидаем цифры
    const value = text.replace(/\s+/g, "").slice(-1);
    const next = [...otp];
    next[idx] = value;
    setOtp(next);

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

  const onConfirm = async () => {
    if (!canConfirm) return;
    try {
      setVerifying(true);
      await session?.checkCode(joinedCode);
      // дальнейшая навигация — во внешней логике
    } catch (e) {
      console.error(e);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={[styles.root, { backgroundColor: theme.backgroundColor }]}
      keyboardVerticalOffset={Platform.select({ ios: RFValue(10), android: 0 })}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Логотип/название */}
        <Text style={[styles.brand, { color: theme.primaryColor }]}>
          {t("auth.app_name")}
        </Text>

        {/* Заголовки */}
        {step === "email" ? (
          <>
            <Text
              style={[styles.title, { color: theme.textColor, textAlign: "center" }]}
            >
              {t("auth.email_title")}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: theme.unactiveTextColor, textAlign: "center" },
              ]}
            >
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
              title={t("auth.send_code")}
              onPress={onSendCode}
              disabled={sending}
            />
          </>
        ) : (
          <>
            <Text
              style={[styles.title, { color: theme.textColor, textAlign: "center" }]}
            >
              {t("auth.otp_title")} {email}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: theme.unactiveTextColor, textAlign: "center" },
              ]}
            >
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

            {/* 6 инпутов */}
            <View
              style={[
                styles.otpRow,
                { flexDirection: isRTL ? "row-reverse" : "row" },
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
                  returnKeyType="next"
                  textContentType="oneTimeCode"
                />
              ))}
            </View>

            {/* Линки */}
            <View
              style={[
                styles.linksRow,
                {
                  flexDirection: isRTL ? "row" : "row-reverse",
                },
              ]}
            >
              <TouchableOpacity onPress={() => setStep("email")}>
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

            <PrimaryOutlineButton
              theme={theme}
              title={t("auth.confirm")}
              onPress={onConfirm}
              disabled={!canConfirm || verifying}
            />
          </>
        )}
      </ScrollView>

      {/* Модалка "код отправлен" */}
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

function PrimaryOutlineButton({
  title,
  onPress,
  disabled,
  theme,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.outlineBtn,
        {
          borderColor: theme.primaryColor,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <Text style={[styles.outlineBtnText, { color: theme.primaryColor }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: "6%",
    paddingTop: RFValue(24),
    paddingBottom: RFValue(30),
    alignItems: "stretch",
  },
  brand: {
    fontSize: RFValue(28),
    fontWeight: "800",
    letterSpacing: RFValue(3),
    textAlign: "center",
    marginBottom: RFValue(18),
  },
  title: {
    fontSize: RFValue(18),
    fontWeight: "700",
    marginBottom: RFValue(6),
  },
  subtitle: {
    fontSize: RFValue(13),
    marginBottom: RFValue(18),
  },
  fieldBlock: {
    marginTop: RFValue(6),
    marginBottom: RFValue(16),
  },
  label: {
    fontSize: RFValue(12),
    marginBottom: RFValue(6),
  },
  input: {
    height: RFValue(48),
    borderWidth: 1,
    borderRadius: RFValue(10),
    paddingHorizontal: RFValue(12),
    fontSize: RFValue(14),
  },
  outlineBtn: {
    height: RFValue(48),
    borderWidth: 1.5,
    borderRadius: RFValue(12),
    alignItems: "center",
    justifyContent: "center",
    marginTop: RFValue(12),
    backgroundColor: "transparent",
  },
  outlineBtnText: {
    fontSize: RFValue(15),
    fontWeight: "700",
  },
  otpRow: {
    width: "100%",
    justifyContent: "space-between",
    marginTop: RFValue(6),
    marginBottom: RFValue(12),
  },
  otpCell: {
    width: `${100 / OTP_LENGTH - 2}%`,
    height: RFValue(52),
    borderWidth: 1,
    borderRadius: RFValue(10),
    textAlign: "center",
    fontSize: RFValue(18),
    fontWeight: "700",
  },
  linksRow: {
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: RFValue(10),
  },
  link: {
    fontSize: RFValue(13),
    textDecorationLine: "underline",
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
    borderRadius: RFValue(14),
    padding: RFValue(18),
  },
  modalText: {
    fontSize: RFValue(14),
    textAlign: "center",
    marginBottom: RFValue(10),
  },
});
