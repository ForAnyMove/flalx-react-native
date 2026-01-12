import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Animated,
  ActivityIndicator,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { icons } from '../constants/icons';

const OTP_LENGTH = 6;

export default function ForgottenPasswordScreenSms() {
  const { t } = useTranslation();
  const { session, themeController, languageController, forgotPassControl } =
    useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState(null);
  const [sending, setSending] = useState(false);

  const [otp, setOtp] = useState(Array.from({ length: OTP_LENGTH }, () => ''));
  inputsRef = useRef([]);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [focusedOtpIndex, setFocusedOtpIndex] = useState(null);

  // --- Новая логика таймера ---
  const [cooldown, setCooldown] = useState(0); // Время в секундах
  const [cooldownMode, setCooldownMode] = useState('ready'); // 'standard', 'error', 'ready'
  const [showResendButton, setShowResendButton] = useState(false); // Показать кнопку "Отправить повторно"
  const timerRef = useRef(null);

  const [focusedInput, setFocusedInput] = useState(null);

  // Запускает и останавливает интервал таймера
  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      // Когда таймер дошел до нуля, переводим его в состояние "готов"
      if (cooldownMode !== 'ready') {
        setCooldownMode('ready');
      }
    }
    return () => clearInterval(timerRef.current);
  }, [cooldown, cooldownMode]);

  // Анимации
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      brandFontSize: isWebLandscape ? web(57) : mobile(68),
      brandLetterSpacing: isWebLandscape ? web(5) : mobile(5),
      brandMarginBottom: isWebLandscape ? web(35) : mobile(22),
      titleFontSize: isWebLandscape ? web(18) : mobile(18),
      subtitleFontSize: isWebLandscape ? web(18) : mobile(16),
      subtitleMarginBottom: isWebLandscape ? web(25) : mobile(28),
      fieldBlockMarginBottom: isWebLandscape ? web(14) : mobile(16),
      labelFontSize: isWebLandscape ? web(14) : mobile(14),
      labelMarginBottom: isWebLandscape ? web(4) : mobile(6),
      inputPaddingHorizontal: isWebLandscape ? web(16) : mobile(16),
      inputFontSize: isWebLandscape ? web(18) : mobile(18),
      inputMarginBottom: isWebLandscape ? web(2) : mobile(8),
      borderRadius: isWebLandscape ? web(8) : mobile(8),
      otpRowMarginTop: isWebLandscape ? web(4) : mobile(6),
      otpRowMarginBottom: isWebLandscape ? web(8) : mobile(12),
      otpRowWidth: isWebLandscape ? web(314) : '90%',
      otpRowHeight: isWebLandscape ? web(74) : mobile(74),
      otpCellHeight: isWebLandscape ? web(74) : mobile(74),
      otpCellFontSize: isWebLandscape ? web(20) : mobile(20),
      otpCellLineHeight: isWebLandscape ? web(18) : mobile(18),
      linksRowMarginBottom: isWebLandscape ? web(8) : mobile(12),
      linksRowWidth: isWebLandscape ? web(314) : '90%',
      linkIconSize: isWebLandscape ? web(24) : mobile(22),
      linkFontSize: isWebLandscape ? web(14) : mobile(14),
      errorFontSize: isWebLandscape ? web(14) : mobile(14),
      sentCodeTimerFontSize: isWebLandscape ? web(14) : mobile(14),
      emailDescriptionFontSize: isWebLandscape ? web(14) : mobile(14),
      emailDescriptionLineHeight: isWebLandscape ? web(18) : mobile(18),
      webLandscapeFieldBlockWidth: isWebLandscape ? web(330) : '100%',
      webLandscapeFieldBlockHeight: isWebLandscape ? web(76) : mobile(75),
      webLandscapeFieldBlockPaddingTop: web(8),
      webLandscapeLabelPadding: web(14),
      webLandscapeLabelMarginBottom: web(7),
      webLandscapeInputMarginBottom: web(3),
      keyboardVerticalOffset: mobile(10),
      scrollPaddingVertical: isWebLandscape ? web(24) : mobile(80),
      buttonMarginTop: isWebLandscape ? web(16) : mobile(16),
      fieldBlockPaddingHorizontal: isWebLandscape ? web(16) : mobile(16),
    };
  }, [isWebLandscape, height]);

  // Автофокус
  const phoneInputRef = useRef(null);
  useEffect(() => {
    if (step === 'phone' && phoneInputRef.current) {
      setTimeout(() => phoneInputRef.current.focus(), 150);
    } else if (step === 'OTP' && inputsRef.current[0]) {
      setTimeout(() => inputsRef.current[0].focus(), 150);
    }
  }, [step]);

  const isValidPhone = useMemo(() => {
    // Простая проверка на наличие хотя бы 7 цифр
    return /^\+?[0-9]{7,}$/.test(phone.trim());
  }, [phone]);

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
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 6,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -6,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // --- Новая логика отправки и переотправки кода ---

  // Обработчик ошибки "Too Many Requests"
  const handleCooldownError = (error) => {
    const message = error.message || '';
    // Ищем число в строке "For security purposes, you can only request this after 56 seconds."
    const match = message.match(/after (\d+) seconds/);
    const seconds = match ? parseInt(match[1], 10) : 60;

    setCooldown(seconds);
    setCooldownMode('error');
    setShowResendButton(true); // Сразу показываем кнопку в режиме ошибки
  };

  // Запуск таймера
  const startTimer = (seconds, mode = 'standard') => {
    setCooldown(seconds);
    setCooldownMode(mode);
  };

  // Отправка кода (первичная)
  const onSendCode = async () => {
    if (!isValidPhone || sending) return;

    setSending(true);
    setPhoneError(null);

    try {
      const { success, error } = await session.resetPasswordWithPhone(
        phone.trim()
      );

      if (success) {
        animateStepChange('OTP');
        startTimer(60); // Запускаем стандартный таймер на 60 секунд
      } else {
        // Обрабатываем ошибку
        if (error && error.includes('rate limit')) {
          handleCooldownError(error);
        } else {
          setPhoneError(error || t('errors.unexpected_error'));
        }
      }
    } catch (e) {
      setPhoneError(e.message || t('errors.unexpected_error'));
    } finally {
      setSending(false);
    }
  };

  // Переотправка кода
  const handleResend = async () => {
    if (cooldown > 0) return; // Не отправлять, если таймер активен

    setOtpError(null);
    // Можно добавить состояние загрузки для кнопки повторной отправки
    try {
      const { success, error } = await session.resetPasswordWithPhone(
        phone.trim()
      );
      if (success) {
        startTimer(60); // Перезапускаем таймер
        setShowResendButton(false); // Скрываем кнопку до окончания таймера
      } else {
        if (error && error.includes('rate limit')) {
          handleCooldownError(error);
        } else {
          setOtpError(error || t('errors.unexpected_error'));
        }
      }
    } catch (e) {
      setOtpError(e.message || t('errors.unexpected_error'));
    }
  };

  // Обработка ввода OTP
  const onChangeOtpCell = (text, idx) => {
    const value = text.replace(/\s+/g, '').slice(-1);
    const next = [...otp];
    next[idx] = value;
    setOtp(next);
    if (otpError) setOtpError(null); // любая правка сбрасывает ошибку

    if (value && idx < OTP_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const onKeyPressOtp = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const joinedCode = useMemo(() => otp.join(''), [otp]);
  const canConfirm = joinedCode.length === OTP_LENGTH;

  const clearOtp = () => {
    setOtp(Array.from({ length: OTP_LENGTH }, () => ''));
  };

  const onConfirm = async () => {
    if (!canConfirm || verifying) return;

    setVerifying(true);
    setOtpError(null);

    try {
      await session.checkCodeForPasswordResetWithPhone(joinedCode);
      // Успех! Перенаправляем на экран сброса пароля
      forgotPassControl.setCanReset(true);
    } catch (e) {
      setOtpError(e.message);
      triggerShake();
      clearOtp();
      inputsRef.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  // Назад к вводу телефона (через анимацию + очистки)
  const backToPhone = () => {
    animateStepChange('phone');
  };

  const renderTimerText = () => {
    if (cooldownMode === 'ready') {
      return null;
    }

    return (
      <Text
        style={[
          styles.timerText,
          {
            color:
              cooldownMode === 'error'
                ? theme.errorTextColor
                : theme.textColor,
          },
        ]}
      >
        {t(
          cooldown > 0
            ? `auth.sent_code_timer_${cooldownMode}_text`
            : 'auth.sent_code_timer_ready_text',
          { count: cooldown }
        )}
      </Text>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={[styles.root, { backgroundColor: theme.backgroundColor }]}
      keyboardVerticalOffset={Platform.select({
        ios: sizes.keyboardVerticalOffset,
        android: 0,
      })}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingVertical: sizes.scrollPaddingVertical },
          isWebLandscape
            ? { justifyContent: 'center', alignItems: 'center', flex: 1 }
            : {},
        ]}
        keyboardShouldPersistTaps='handled'
      >
        <View style={styles.contentBlock}>
          <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
            {step === 'phone' ? (
              <>
                <Text style={styles.brand}>{t('auth.app_name')}</Text>
                <Text style={[styles.title, { marginTop: sizes.titleTopMargin }]}
                >
                  {t('auth.forgot_pass_title')}
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    {
                      marginTop: sizes.subtitleTopMargin,
                      marginBottom: sizes.subtitleBottomMargin,
                    },
                  ]}
                >
                  {t('auth.forgot_pass_subtitle_sms')}
                </Text>

                <View style={styles.fieldBlock}>
                  <Text
                    style={[
                      styles.label,
                      {
                        color: theme.textColor,
                        marginBottom: sizes.labelBottomMargin,
                        textAlign: isRTL ? 'right' : 'left',
                      },
                    ]}
                  >
                    {t('my_profile.phone')}
                  </Text>
                  <TextInput
                    ref={phoneInputRef}
                    style={[
                      styles.input,
                      {
                        height: sizes.inputHeight,
                        fontSize: sizes.inputFontSize,
                        borderRadius: sizes.inputRadius,
                        borderColor: phoneError
                          ? theme.error
                          : focusedInput === 'phone'
                          ? theme.primary
                          : theme.border,
                        color: theme.textColor,
                        textAlign: isRTL ? 'right' : 'left',
                        paddingHorizontal: sizes.inputPaddingH,
                      },
                    ]}
                    placeholder={t('settings.feedback.phone.placeholder')}
                    placeholderTextColor={theme.unactiveTextColor}
                    keyboardType='phone-pad'
                    value={phone}
                    onChangeText={setPhone}
                    onSubmitEditing={onSendCode}
                    onFocus={() => setFocusedInput('phone')}
                    onBlur={() => setFocusedInput(null)}
                  />
                  {phoneError && (
                    <Text
                      style={[
                        styles.error,
                        { color: theme.error, fontSize: sizes.errorFontSize },
                      ]}
                    >
                      {phoneError}
                    </Text>
                  )}
                </View>

                <PrimaryOutlineButton
                  title={
                    sending
                      ? t('auth.sending')
                      : t('auth.send_reset_code')
                  }
                  onPress={onSendCode}
                  disabled={!isValidPhone || sending || cooldown > 0}
                  theme={theme}
                  isLandscape={isWebLandscape}
                  height={height}
                  containerStyle={{ marginTop: sizes.mainBtnTopMargin }}
                />
                <Text
                  style={[
                    styles.emailDescription,
                    {
                      color: theme.unactiveTextColor,
                      fontSize: sizes.descrFontSize,
                      marginTop: sizes.descrTopMargin,
                    },
                  ]}
                >
                  {t('auth.sms_description')}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.brand}>{t('auth.app_name')}</Text>
                <Text
                  style={[
                    styles.title,
                    {
                      marginTop: sizes.titleTopMargin,
                      marginBottom: sizes.otpTitleBottomMargin,
                    },
                  ]}
                >
                  {t('auth.otp_title')}
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    {
                      color: theme.unactiveTextColor,
                      marginBottom: sizes.subtitleBottomMargin,
                    },
                  ]}
                >
                  {phone}
                </Text>

                <View style={styles.fieldBlock}>
                  <View style={styles.otpRow}>
                    {otp.map((digit, idx) => (
                      <TextInput
                        key={idx}
                        ref={(ref) => (inputsRef.current[idx] = ref)}
                        style={[
                          styles.otpCell,
                          {
                            height: sizes.otpCellSize,
                            fontSize: sizes.otpFontSize,
                            borderRadius: sizes.inputRadius,
                            borderColor: otpError
                              ? theme.error
                              : focusedOtpIndex === idx
                              ? theme.primary
                              : theme.border,
                            color: theme.textColor,
                          },
                        ]}
                        keyboardType='number-pad'
                        maxLength={1}
                        value={digit}
                        onChangeText={(text) => onChangeOtpCell(text, idx)}
                        onKeyPress={(e) => onKeyPressOtp(e, idx)}
                        onFocus={() => setFocusedOtpIndex(idx)}
                        onBlur={() => setFocusedOtpIndex(null)}
                      />
                    ))}
                  </View>
                  {otpError && (
                    <Text
                      style={[
                        styles.error,
                        {
                          color: theme.error,
                          fontSize: sizes.errorFontSize,
                          textAlign: 'center',
                          width: '100%',
                        },
                      ]}
                    >
                      {otpError}
                    </Text>
                  )}
                </View>

                <PrimaryOutlineButton
                  title={
                    verifying
                      ? t('auth.sending')
                      : t('auth.confirm')
                  }
                  onPress={onConfirm}
                  disabled={!canConfirm || verifying}
                  theme={theme}
                  isLandscape={isWebLandscape}
                  height={height}
                  containerStyle={{ marginTop: sizes.mainBtnTopMargin }}
                />

                <View
                  style={[
                    styles.linksRow,
                    { marginTop: sizes.linksTopMargin, height: sizes.inputHeight },
                  ]}
                >
                  <TouchableOpacity onPress={backToPhone}>
                    <Text
                      style={[
                        styles.link,
                        {
                          color: theme.primary,
                          fontSize: sizes.linksFontSize,
                        },
                      ]}
                    >
                      {t('auth.back_to_phone')}
                    </Text>
                  </TouchableOpacity>
                  {renderTimerText()}
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PrimaryOutlineButton({
  title,
  onPress,
  disabled,
  theme,
  isLandscape,
  height,
  containerStyle = {},
}) {
  const buttonDynamicStyles = useMemo(
    () => ({
      outlineBtn: {
        height: isLandscape && Platform.OS === 'web' ? scaleByHeight(62, height) : scaleByHeightMobile(62, height),
        width: isLandscape && Platform.OS === 'web' ? scaleByHeight(330, height) : '100%',
        marginTop: isLandscape && Platform.OS === 'web' ? scaleByHeight(38, height) : scaleByHeightMobile(12, height),
        borderRadius: isLandscape && Platform.OS === 'web' ? scaleByHeight(8, height) : scaleByHeightMobile(12, height),  
      },
      outlineBtnText: {
        fontSize: isLandscape && Platform.OS === 'web' ? scaleByHeight(20, height) : scaleByHeightMobile(20, height),
        lineHeight: isLandscape && Platform.OS === 'web' ? scaleByHeight(20, height) : scaleByHeightMobile(20, height),
      },
      webLandscapeButton: {
        width: scaleByHeight(330, height),
        height: scaleByHeight(62, height),
      },
    }),
    [height, isLandscape]
  );
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.outlineBtn,
        buttonDynamicStyles.outlineBtn,
        { borderColor: theme.primaryColor, opacity: disabled ? 0.6 : 1 },
        isLandscape &&
          Platform.OS === 'web' && {
            width: scaleByHeight(330, height),
            height: scaleByHeight(62, height),
          },
        containerStyle,
      ]}
    >
      {typeof title === 'string' ? (
        <Text
          style={[
            styles.outlineBtnText,
            buttonDynamicStyles.outlineBtnText,
            { color: theme.primaryColor },
          ]}
        >
          {title}
        </Text>
      ) : (
        title
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: '6%',
    // paddingVertical: RFValue(24),
  },
  contentBlock: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  brand: {
    // fontSize: getResponsiveSize(45, scaleByHeight(57)),
    fontWeight: 'bold',
    // letterSpacing: getResponsiveSize(3, scaleByHeight(5)),
    textAlign: 'center',
    // marginBottom: getResponsiveSize(18, scaleByHeight(35)),
    fontFamily: 'Rubik-Bold',
  },
  title: {
    // fontSize: getResponsiveSize(18, scaleByHeight(18)),
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Rubik-SemiBold',
  },
  subtitle: {
    // fontSize: getResponsiveSize(13, scaleByHeight(18)),
    textAlign: 'center',
    fontWeight: '600',
    // marginBottom: getResponsiveSize(18, scaleByHeight(25)),
    fontFamily: 'Rubik-SemiBold',
  },
  fieldBlock: {
    // marginBottom: getResponsiveSize(16, scaleByHeight(14)),
  },
  label: {
    // fontSize: getResponsiveSize(12, scaleByHeight(14)),
    // marginBottom: getResponsiveSize(6, scaleByHeight(4)),
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    // borderRadius: getResponsiveSize(10, 8),
    // paddingHorizontal: getResponsiveSize(12, scaleByHeight(14)),
    // fontSize: getResponsiveSize(14, scaleByHeight(18)),
    // marginBottom: getResponsiveSize(8, scaleByHeight(2)),
    // lineHeight: getResponsiveSize(20, scaleByHeight(22)),
    fontWeight: '500',
  },
  outlineBtn: {
    // height: getResponsiveSize(48, scaleByHeight(40)),
    borderWidth: 1.5,
    // borderRadius: getResponsiveSize(12, 8),
    alignItems: 'center',
    justifyContent: 'center',
    // marginTop: getResponsiveSize(12, scaleByHeight(38)),
    backgroundColor: 'transparent',
  },
  outlineBtnText: {
    // fontSize: getResponsiveSize(15, scaleByHeight(20)),
    // lineHeight: getResponsiveSize(17, scaleByHeight(20)),
    fontFamily: 'Rubik-Medium',
  },
  otpRow: {
    width: '100%',
    justifyContent: 'space-between',
    // marginTop: getResponsiveSize(6, scaleByHeight(4)),
    // marginBottom: getResponsiveSize(12, scaleByHeight(8)),
  },
  otpCell: {
    width: `${100 / OTP_LENGTH - 2}%`,
    // height: getResponsiveSize(52, scaleByHeight(42)),
    borderWidth: 1,
    // borderRadius: getResponsiveSize(10, 8),
    textAlign: 'center',
    // fontSize: getResponsiveSize(18, scaleByHeight(16)),
    fontWeight: '700',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
    }),
  },
  linksRow: {
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'Rubik-Medium',
    // marginBottom: getResponsiveSize(10, scaleByHeight(8)),
  },
  link: {
    // fontSize: getResponsiveSize(13, scaleByHeight(12)),
    textDecorationLine: 'underline',
  },
  error: {
    // fontSize: getResponsiveSize(13, scaleByHeight(12)),
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '10%',
  },
  modalCard: {
    width: '100%',
    // borderRadius: getResponsiveSize(14, 10),
    // padding: getResponsiveSize(18, scaleByHeight(12)),
    alignItems: 'center',
  },
  modalText: {
    // fontSize: getResponsiveSize(14, scaleByHeight(12)),
    textAlign: 'center',
    // marginBottom: getResponsiveSize(10, scaleByHeight(8)),
  },
  emailDescription: {
    // fontSize: getResponsiveSize(12, scaleByHeight(14)),
    // lineHeight: getResponsiveSize(16, scaleByHeight(18)),
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: 'Rubik-Medium',
  },
  timerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  titleTopMargin: {
    marginTop: 24,
  },
  subtitleTopMargin: {
    marginTop: 8,
  },
  subtitleBottomMargin: {
    marginBottom: 16,
  },
  labelBottomMargin: {
    marginBottom: 8,
  },
  inputHeight: {
    height: 54,
  },
  inputRadius: {
    borderRadius: 8,
  },
  inputPaddingH: {
    paddingHorizontal: 16,
  },
  mainBtnTopMargin: {
    marginTop: 16,
  },
  descrFontSize: {
    fontSize: 12,
  },
  descrTopMargin: {
    marginTop: 8,
  },
  otpTitleBottomMargin: {
    marginBottom: 24,
  },
  linksTopMargin: {
    marginTop: 16,
  },
  linksFontSize: {
    fontSize: 14,
  },
});
