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
import { logError } from '../utils/log_util';

const OTP_LENGTH = 6;

export default function ForgottenPasswordScreen() {
  const { t } = useTranslation();
  const { session, themeController, languageController, forgotPassControl } =
    useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [step, setStep] = useState('email');
  // const [step, setStep] = useState('OTP');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [sending, setSending] = useState(false);

  const [otp, setOtp] = useState(Array.from({ length: OTP_LENGTH }, () => ''));
  const inputsRef = useRef([]);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [focusedOtpIndex, setFocusedOtpIndex] = useState(null);

  // --- Новая логика таймера ---
  const [cooldown, setCooldown] = useState(0); // Время в секундах
  const [cooldownMode, setCooldownMode] = useState('ready'); // 'standard', 'error', 'ready'
  const [showResendButton, setShowResendButton] = useState(false); // Показать кнопку "Отправить повторно"
  const timerRef = useRef(null);

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
  const emailInputRef = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (step === 'email') {
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
    if (!isValidEmail) {
      setEmailError(t('auth.invalid_email'));
      return;
    }
    setEmailError(null);
    setSending(true);
    try {
      await session?.resetPasswordWithEmail(email.trim());
      startTimer(60, 'standard');
      setShowResendButton(false); // Начинаем с ссылки "Не получил код"
      animateStepChange('otp');
    } catch (e) {
      logError('Ошибка при отправке кода:', e.message);
      if (e.message && e.message.includes('after')) {
        handleCooldownError(e);
        animateStepChange('otp'); // Все равно переходим на экран OTP
      } else {
        setEmailError(e.message || t('auth.send_code_error'));
      }
    } finally {
      setSending(false);
    }
  };

  // Переотправка кода
  const handleResend = async () => {
    if (cooldown > 0 && cooldownMode === 'error') return; // Защита от случайного клика
    setSending(true);
    setOtpError(null); // Сбрасываем ошибку OTP при переотправке
    try {
      const { success, error } = await session?.resetPasswordWithEmail(
        email.trim()
      );
      if (!success) {
        throw new Error(error);
      }
      startTimer(60, 'standard'); // Сбрасываем таймер на 60 секунд в стандартном режиме
    } catch (e) {
      logInfo('Ошибка при переотправке кода:', e.message);
      if (e.message && e.message.includes('after')) {
        handleCooldownError(e);
      } else {
        // Показываем ошибку в поле OTP, как просили
        setOtpError(e.message || t('auth.send_code_error'));
      }
    } finally {
      setSending(false);
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
    setOtpError(null);
    inputsRef.current[0]?.focus();
  };

  const onConfirm = async () => {
    if (!canConfirm) return;
    try {
      setVerifying(true);
      await session?.checkCodeForPaswordReset(joinedCode);
      // успешный вход → навигация во внешней логике
      await forgotPassControl?.switch();
    } catch (e) {
      // например: 403 Forbidden / Token has expired or is invalid
      logInfo('Ошибка проверки кода:', e);
      setOtpError(t('auth.invalid_code'));
      triggerShake();
    } finally {
      setVerifying(false);
    }
  };

  // Назад к email (через анимацию + очистки)
  const backToEmail = () => {
    clearOtp();
    animateStepChange('email');
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
        <Animated.View
          style={[
            styles.contentBlock,
            isWebLandscape
              ? { width: height * 0.5 } // ≤ 50% высоты экрана
              : { width: '100%' },
            { opacity: fadeAnim },
          ]}
        >
          {/* Бренд */}
          <Text
            style={[
              styles.brand,
              {
                color: theme.primaryColor,
                fontSize: sizes.brandFontSize,
                letterSpacing: sizes.brandLetterSpacing,
                marginBottom: sizes.brandMarginBottom,
              },
            ]}
          >
            {t('auth.app_name')}
          </Text>

          {/* Шаг EMAIL */}
          {step === 'email' ? (
            <>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.unactiveTextColor,
                    textAlign: 'center',
                    fontSize: sizes.titleFontSize,
                  },
                ]}
              >
                {t('auth.forgot_pass_title')}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  {
                    color: theme.unactiveTextColor,
                    textAlign: 'center',
                    fontSize: sizes.subtitleFontSize,
                    marginBottom: sizes.subtitleMarginBottom,
                  },
                ]}
              >
                {t('auth.forgot_pass_subtitle')}
              </Text>

              <View
                style={[
                  styles.fieldBlock,
                  {
                    marginBottom: sizes.fieldBlockMarginBottom,
                    backgroundColor: theme.formInputBackground,
                    width: sizes.webLandscapeFieldBlockWidth,
                    borderRadius: sizes.borderRadius,
                    paddingTop: sizes.webLandscapeFieldBlockPaddingTop,
                    paddingHorizontal: sizes.fieldBlockPaddingHorizontal,
                    height: sizes.webLandscapeFieldBlockHeight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.label,
                    {
                      fontSize: sizes.labelFontSize,
                      marginBottom: sizes.labelMarginBottom,
                      color: theme.formInputLabelColor,
                      textAlign: isRTL ? 'right' : 'left',
                    },
                    isWebLandscape
                      ? {
                        marginBottom: sizes.webLandscapeLabelMarginBottom,
                      }
                      : null,
                  ]}
                >
                  {t('auth.email_label')}
                </Text>
                <TextInput
                  ref={emailInputRef}
                  style={[
                    styles.input,
                    {
                      // paddingHorizontal: sizes.inputPaddingHorizontal,
                      fontSize: sizes.inputFontSize,
                      marginBottom: sizes.inputMarginBottom,
                      backgroundColor: theme.defaultBlocksBackground,
                      borderColor: theme.borderColor,
                      color: theme.formInputTextColor,
                      textAlign: isRTL ? 'right' : 'left',
                      backgroundColor: 'transparent',
                      borderWidth: 0,
                      marginBottom: sizes.webLandscapeInputMarginBottom,
                    },
                    Platform.OS === 'web' &&
                    isLandscape && {
                      outlineStyle: 'none',
                      outlineWidth: 0,
                      outlineColor: 'transparent',
                      boxShadow: 'none',
                    },
                  ]}
                  placeholder='name@example.com'
                  placeholderTextColor={theme.formInputPlaceholderColor}
                  keyboardType='email-address'
                  autoCapitalize='none'
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                  returnKeyType='done'
                />
              </View>
              <View
                style={[
                  styles.linksRow,
                  {
                    marginBottom: sizes.linksRowMarginBottom,
                    width: sizes.linksRowWidth,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  },
                ]}
              >
                {/* Ссылка "Назад" */}
                <TouchableOpacity
                  onPress={() => forgotPassControl.switch()}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <Text
                    style={[
                      styles.link,
                      {
                        fontSize: sizes.linkFontSize,
                        color: theme.formInputLabelColor,
                        textDecorationLine: 'none',
                      },
                    ]}
                  >
                    {t('auth.back_to_sign_in')}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text
                style={[
                  styles.emailDescription,
                  {
                    fontSize: sizes.emailDescriptionFontSize,
                    lineHeight: sizes.emailDescriptionLineHeight,
                    color: theme.unactiveTextColor,
                  },
                ]}
              >
                {t('auth.email_description')}
              </Text>
              {!!emailError && (
                <Text
                  style={[
                    styles.error,
                    {
                      fontSize: sizes.errorFontSize,
                      color: theme.errorTextColor,
                    },
                  ]}
                >
                  {emailError}
                </Text>
              )}
              <PrimaryOutlineButton
                isLandscape={isLandscape}
                height={height}
                theme={theme}
                title={
                  sending ? (
                    <ActivityIndicator color={theme.primaryColor} />
                  ) : (
                    t('auth.send_reset_code')
                  )
                }
                onPress={onSendCode}
                disabled={sending}
              />
            </>
          ) : (
            /* Шаг OTP */
            <>
              <Text
                style={[
                  styles.title,
                  {
                    fontSize: sizes.titleFontSize,
                    color: theme.unactiveTextColor,
                    textAlign: 'center',
                  },
                ]}
              >
                {t('auth.otp_title')} {email}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  {
                    fontSize: sizes.subtitleFontSize,
                    marginBottom: sizes.subtitleMarginBottom,
                    color: theme.unactiveTextColor,
                    textAlign: 'center',
                  },
                ]}
              >
                {t('auth.otp_subtitle')}
              </Text>

              <Text
                style={[
                  styles.label,
                  {
                    fontSize: sizes.labelFontSize,
                    marginBottom: sizes.labelMarginBottom,
                    color: theme.unactiveTextColor,
                    textAlign: 'center',
                  },
                ]}
              >
                {t('auth.otp_label')}
              </Text>

              <Animated.View
                style={[
                  styles.otpRow,
                  {
                    marginTop: sizes.otpRowMarginTop,
                    marginBottom: sizes.otpRowMarginBottom,
                    width: sizes.otpRowWidth,
                    height: sizes.otpRowHeight,
                    transform: [{ translateX: shakeAnim }],
                    flexDirection: 'row',
                  },
                ]}
              >
                {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                  <TextInput
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    style={[
                      styles.otpCell,
                      {
                        height: sizes.otpCellHeight,
                        fontSize: sizes.otpCellFontSize,
                        lineHeight: sizes.otpCellLineHeight,
                        borderRadius: sizes.borderRadius,
                        backgroundColor: theme.formInputBackground,
                        borderColor:
                          focusedOtpIndex === i
                            ? theme.primaryColor
                            : theme.formInputBackground,
                        color: theme.textColor,
                      },
                    ]}
                    value={otp[i]}
                    onChangeText={(txt) => onChangeOtpCell(txt, i)}
                    onKeyPress={(e) => onKeyPressOtp(e, i)}
                    onFocus={() => setFocusedOtpIndex(i)}
                    onBlur={() => setFocusedOtpIndex(null)}
                    keyboardType={
                      Platform.OS === 'web' ? 'default' : 'number-pad'
                    }
                    maxLength={1}
                    textContentType='oneTimeCode'
                  />
                ))}
              </Animated.View>

              {!!otpError && (
                <Text
                  style={[
                    styles.error,
                    {
                      fontSize: sizes.errorFontSize,
                      color: theme.errorTextColor,
                      textAlign: 'center',
                    },
                  ]}
                >
                  {otpError}
                </Text>
              )}

              {/* Линки и таймер */}
              <View
                style={[
                  styles.linksRow,
                  {
                    marginBottom: sizes.linksRowMarginBottom,
                    width: sizes.linksRowWidth,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  },
                ]}
              >
                {/* Ссылка "Назад" */}
                <TouchableOpacity
                  onPress={backToEmail}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  <Image
                    source={icons.arrowLeft}
                    style={{
                      width: sizes.linkIconSize,
                      height: sizes.linkIconSize,
                    }}
                  />
                  <Text
                    style={[
                      styles.link,
                      {
                        fontSize: sizes.linkFontSize,
                        color: theme.formInputLabelColor,
                        textDecorationLine: 'none',
                      },
                    ]}
                  >
                    {t('auth.back_to_email')}
                  </Text>
                </TouchableOpacity>

                {/* Блок переотправки: при нажатии показывается кнопка */}
                {!showResendButton && cooldownMode !== 'ready' && (
                  <TouchableOpacity onPress={() => setShowResendButton(true)}>
                    <Text
                      style={[
                        styles.link,
                        {
                          fontSize: sizes.linkFontSize,
                          color: theme.formInputLabelColor,
                          textDecorationLine: 'underline',
                        },
                      ]}
                    >
                      {t('auth.resend_code')}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Таймер */}
              <View style={{ justifyContent: 'center' }}>
                <Text
                  style={[
                    styles.sentCodeTimer,
                    {
                      fontSize: sizes.sentCodeTimerFontSize,
                      color:
                        cooldownMode === 'error'
                          ? theme.errorTextColor
                          : theme.textColor,
                      textAlign: 'center',
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
              </View>

              {/* Кнопка переотправки - УДАЛЕНА */}
              {(showResendButton || cooldownMode === 'ready') && (
                <PrimaryOutlineButton
                  isLandscape={isLandscape}
                  height={height}
                  theme={theme}
                  title={
                    sending ? t('auth.sending') : t('auth.resent_code_text')
                  }
                  onPress={handleResend}
                  disabled={cooldown > 0 && cooldownMode === 'error'}
                  containerStyle={{
                    marginTop: sizes.buttonMarginTop,
                  }}
                />
              )}

              {/* Кнопка подтверждения/очистки */}
              {otpError ? (
                <PrimaryOutlineButton
                  isLandscape={isLandscape}
                  height={height}
                  theme={theme}
                  title={t('auth.clear_code')}
                  onPress={clearOtp}
                  containerStyle={{
                    marginTop: sizes.buttonMarginTop,
                  }}
                />
              ) : (
                <PrimaryOutlineButton
                  isLandscape={isLandscape}
                  height={height}
                  theme={theme}
                  title={
                    verifying ? (
                      <ActivityIndicator color={theme.primaryColor} />
                    ) : (
                      t('auth.confirm')
                    )
                  }
                  onPress={onConfirm}
                  disabled={!canConfirm || verifying}
                  containerStyle={{
                    marginTop: sizes.buttonMarginTop,
                  }}
                />
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Модалка "код отправлен" - УДАЛЕНА */}
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
});
