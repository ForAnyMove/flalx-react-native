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
import { RFValue } from 'react-native-responsive-fontsize';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import { scaleByHeight } from '../utils/resizeFuncs';
import { icons } from '../constants/icons';

const OTP_LENGTH = 6;

// Адаптив размеров (mobile => RFValue, web => уменьшенный фикс)
const getResponsiveSize = (mobileSize, webSize) => {
  if (Platform.OS === 'web') return webSize;
  return RFValue(mobileSize);
};

export default function AuthScreenWithPass() {
  const { t } = useTranslation();
  const {
    session,
    themeController,
    languageController,
    registerControl,
    authControl,
  } = useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [sending, setSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
  const dynamicStyles = useMemo(() => {
    return {
      brand: {
        fontSize: isWebLandscape ? scaleByHeight(57, height) : RFValue(45),
        letterSpacing: isWebLandscape ? scaleByHeight(5, height) : RFValue(3),
        marginBottom: isWebLandscape ? scaleByHeight(35, height) : RFValue(18),
      },
      title: {
        fontSize: isWebLandscape ? scaleByHeight(18, height) : RFValue(18),
      },
      subtitle: {
        fontSize: isWebLandscape ? scaleByHeight(18, height) : RFValue(13),
        marginBottom: isWebLandscape ? scaleByHeight(25, height) : RFValue(18),
      },
      fieldBlock: {
        marginBottom: isWebLandscape ? scaleByHeight(14, height) : RFValue(16),
      },
      label: {
        fontSize: isWebLandscape ? scaleByHeight(14, height) : RFValue(12),
        marginBottom: isWebLandscape ? scaleByHeight(4, height) : RFValue(6),
      },
      input: {
        paddingHorizontal: isWebLandscape
          ? scaleByHeight(14, height)
          : RFValue(12),
        fontSize: isWebLandscape ? scaleByHeight(18, height) : RFValue(14),
        marginBottom: isWebLandscape ? scaleByHeight(2, height) : RFValue(8),
      },
      outlineBtnText: {
        fontSize: isWebLandscape ? scaleByHeight(20, height) : RFValue(15),
        lineHeight: isWebLandscape ? scaleByHeight(20, height) : RFValue(16),
        borderRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(7),
      },
      otpRow: {
        marginTop: isWebLandscape ? scaleByHeight(4, height) : RFValue(6),
        marginBottom: isWebLandscape ? scaleByHeight(8, height) : RFValue(12),
        width: isWebLandscape ? scaleByHeight(314, height) : '100%',
        height: isWebLandscape ? scaleByHeight(74, height) : RFValue(52),
      },
      otpCell: {
        height: isWebLandscape ? scaleByHeight(74, height) : RFValue(52),
        fontSize: isWebLandscape ? scaleByHeight(20, height) : RFValue(18),
        lineHeight: isWebLandscape ? scaleByHeight(18, height) : RFValue(19),
        borderRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(7),
      },
      linksRow: {
        marginBottom: isWebLandscape ? scaleByHeight(8, height) : RFValue(10),
        width: isWebLandscape ? scaleByHeight(314, height) : '100%',
      },
      linkIcon: {
        width: isWebLandscape ? scaleByHeight(16, height) : RFValue(22),
        height: isWebLandscape ? scaleByHeight(16, height) : RFValue(22),
      },
      link: {
        fontSize: isWebLandscape ? scaleByHeight(14, height) : RFValue(13),
      },
      linkWithIcon: {
        paddingHorizontal: isWebLandscape
          ? scaleByHeight(3, height)
          : RFValue(3),
      },
      error: {
        fontSize: isWebLandscape ? scaleByHeight(14, height) : RFValue(13),
      },
      sentCodeTimer: {
        fontSize: isWebLandscape ? scaleByHeight(14, height) : RFValue(13),
      },
      modalCard: {
        padding: isWebLandscape ? scaleByHeight(12, height) : RFValue(18),
        borderRadius: isWebLandscape ? scaleByHeight(10, height) : RFValue(14),
      },
      modalText: {
        fontSize: isWebLandscape ? scaleByHeight(18, height) : RFValue(13),
        marginBottom: isWebLandscape ? scaleByHeight(8, height) : RFValue(10),
      },
      emailDescription: {
        fontSize: isWebLandscape ? scaleByHeight(14, height) : RFValue(12),
        lineHeight: isWebLandscape ? scaleByHeight(18, height) : RFValue(16),
      },
      // Динамические стили для web-landscape
      webLandscapeFieldBlock: {
        width: scaleByHeight(330, height),
        height: scaleByHeight(76, height),
        borderRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(7),
        paddingTop: isWebLandscape ? scaleByHeight(8, height) : RFValue(10),
      },
      webLandscapeLabel: {
        paddingLeft: isRTL
          ? 0
          : isWebLandscape
          ? scaleByHeight(14, height)
          : RFValue(12),
        paddingRight: isRTL
          ? isWebLandscape
            ? scaleByHeight(14, height)
            : RFValue(12)
          : 0,
        marginBottom: isWebLandscape ? scaleByHeight(7, height) : RFValue(4),
      },
      webLandscapeInput: {
        marginBottom: isWebLandscape ? scaleByHeight(3, height) : RFValue(4),
      },
    };
  }, [height, isRTL]);

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

  // Авторизация с паролем
  const onPasswordSignIn = async () => {
    if (!isValidEmail) {
      setEmailError(t('auth.invalid_email'));
      return;
    }

    if (!password || password.length < 6) {
      setEmailError(t('auth.invalid_password'));
      return;
    }

    setSending(true);
    const { success, error } = await session.signInWithPassword(
      email,
      password
    );

    if (!success) {
      setEmailError(error || t('auth.login_error'));
    }

    setSending(false);
  };

  // Переотправка кода
  const handleResend = async () => {
    if (cooldown > 0 && cooldownMode === 'error') return; // Защита от случайного клика
    setSending(true);
    setOtpError(null); // Сбрасываем ошибку OTP при переотправке
    try {
      const { success, error } = await session?.sendCode(email.trim());
      if (!success) {
        throw new Error(error);
      }
      startTimer(60, 'standard'); // Сбрасываем таймер на 60 секунд в стандартном режиме
    } catch (e) {
      console.error('Ошибка при переотправке кода:', e.message);
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
      await session?.checkCode(joinedCode);
      // успешный вход → навигация во внешней логике
    } catch (e) {
      // например: 403 Forbidden / Token has expired or is invalid
      console.error('Ошибка проверки кода:', e);
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
      keyboardVerticalOffset={Platform.select({ ios: RFValue(10), android: 0 })}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
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
              dynamicStyles.brand,
              { color: theme.primaryColor },
            ]}
          >
            {t('auth.app_name')}
          </Text>

          {/* Шаг EMAIL */}
          <Text
            style={[
              styles.title,
              dynamicStyles.title,
              { color: theme.unactiveTextColor, textAlign: 'center' },
            ]}
          >
            {t('auth.email_title')}
          </Text>
          <Text
            style={[
              styles.subtitle,
              dynamicStyles.subtitle,
              { color: theme.unactiveTextColor, textAlign: 'center' },
            ]}
          >
            {t('auth.email_password_subtitle')}
          </Text>
          {/* EMAIL FIELD */}
          <View
            style={[
              styles.fieldBlock,
              dynamicStyles.fieldBlock,
              {
                backgroundColor: theme.formInputBackground,
              },
              isWebLandscape
                ? {
                    borderRadius: getResponsiveSize(
                      12,
                      scaleByHeight(8, height)
                    ),
                    paddingHorizontal: getResponsiveSize(12, 0),
                    paddingTop: getResponsiveSize(10, scaleByHeight(8, height)),
                    width: scaleByHeight(330, height),
                    height: scaleByHeight(76, height),
                  }
                : null,
            ]}
          >
            <Text
              style={[
                styles.label,
                dynamicStyles.label,
                {
                  color: theme.formInputLabelColor,
                  textAlign: isRTL ? 'right' : 'left',
                },
                isWebLandscape
                  ? {
                      paddingLeft: isRTL
                        ? 0
                        : getResponsiveSize(12, scaleByHeight(14, height)),
                      paddingRight: isRTL
                        ? getResponsiveSize(12, scaleByHeight(14, height))
                        : 0,
                      marginBottom: getResponsiveSize(
                        4,
                        scaleByHeight(7, height)
                      ),
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
                dynamicStyles.input,
                {
                  backgroundColor: theme.defaultBlocksBackground,
                  borderColor: theme.borderColor,
                  color: theme.formInputTextColor,
                  textAlign: isRTL ? 'right' : 'left',
                  // прозрачный инпут внутри окрашенного fieldBlock
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  marginBottom: getResponsiveSize(4, scaleByHeight(3, height)),
                },
                Platform.OS === 'web' && isLandscape
                  ? {
                      // убираем чёрную обводку (RN Web)
                      outlineStyle: 'none',
                      outlineWidth: 0,
                      outlineColor: 'transparent',
                      boxShadow: 'none',
                    }
                  : null,
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
          {/* PASSWORD FIELD */}
          <View
            style={[
              styles.fieldBlock,
              dynamicStyles.fieldBlock,
              {
                backgroundColor: theme.formInputBackground,
                position: 'relative',
              },
              isWebLandscape
                ? {
                    borderRadius: getResponsiveSize(
                      12,
                      scaleByHeight(8, height)
                    ),
                    paddingHorizontal: getResponsiveSize(12, 0),
                    paddingTop: getResponsiveSize(10, scaleByHeight(8, height)),
                    width: scaleByHeight(330, height),
                    height: scaleByHeight(76, height),
                  }
                : null,
            ]}
          >
            <Text
              style={[
                styles.label,
                dynamicStyles.label,
                {
                  color: theme.formInputLabelColor,
                  textAlign: isRTL ? 'right' : 'left',
                },
                isWebLandscape
                  ? {
                      paddingLeft: isRTL
                        ? 0
                        : getResponsiveSize(12, scaleByHeight(14, height)),
                      paddingRight: isRTL
                        ? getResponsiveSize(12, scaleByHeight(14, height))
                        : 0,
                      marginBottom: getResponsiveSize(
                        4,
                        scaleByHeight(7, height)
                      ),
                    }
                  : null,
              ]}
            >
              {t('auth.password_label')}
            </Text>
            <TextInput
              style={[
                styles.input,
                dynamicStyles.input,
                {
                  backgroundColor: theme.defaultBlocksBackground,
                  borderColor: theme.borderColor,
                  color: theme.formInputTextColor,
                  textAlign: isRTL ? 'right' : 'left',
                  // прозрачный инпут внутри окрашенного fieldBlock
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  marginBottom: getResponsiveSize(4, scaleByHeight(3, height)),
                },
                Platform.OS === 'web' && isLandscape
                  ? {
                      // убираем чёрную обводку (RN Web)
                      outlineStyle: 'none',
                      outlineWidth: 0,
                      outlineColor: 'transparent',
                      boxShadow: 'none',
                    }
                  : null,
              ]}
              placeholder='******'
              placeholderTextColor={theme.formInputPlaceholderColor}
              secureTextEntry={!showPassword}
              autoCapitalize='none'
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
              returnKeyType='done'
            />
            {/* ICON EYE */}
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              style={{
                position: 'absolute',
                right: isRTL
                  ? undefined
                  : isWebLandscape
                  ? scaleByHeight(14, height)
                  : RFValue(12),
                left: isRTL
                  ? isWebLandscape
                    ? scaleByHeight(14, height)
                    : RFValue(12)
                  : undefined,
                top: isWebLandscape ? scaleByHeight(26, height) : RFValue(38),
                width: isWebLandscape ? scaleByHeight(24, height) : RFValue(22),
                height: isWebLandscape
                  ? scaleByHeight(24, height)
                  : RFValue(22),
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Image
                source={showPassword ? icons.eyeOpen : icons.eyeClosed}
                style={{
                  width: isWebLandscape
                    ? scaleByHeight(24, height)
                    : RFValue(22),
                  height: isWebLandscape
                    ? scaleByHeight(24, height)
                    : RFValue(22),
                  tintColor: theme.formInputLabelColor,
                }}
                resizeMode='contain'
              />
            </TouchableOpacity>
          </View>
          {/* Линки и таймер */}
          <View
            style={[
              styles.linksRow,
              dynamicStyles.linksRow,
              {
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              },
            ]}
          >
            {/* Ссылка "Назад" */}
            <TouchableOpacity
              onPress={() => authControl.switch()}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              {/* <Image
                              source={icons.emailClear}
                              style={[dynamicStyles.linkIcon, {tintColor: theme.formInputLabelColor}]}
                            /> */}
              <Text
                style={[
                  styles.link,
                  dynamicStyles.link,
                  // dynamicStyles.linkWithIcon,
                  {
                    color: theme.formInputLabelColor,
                    textDecorationLine: 'none',
                  },
                ]}
              >
                {t('auth.otp_sign_in')}
              </Text>
            </TouchableOpacity>

            {/* Блок переотправки: при нажатии показывается кнопка */}
            <TouchableOpacity
              onPress={() => registerControl.goToRegisterScreen()}
            >
              <Text
                style={[
                  styles.link,
                  dynamicStyles.link,
                  {
                    color: theme.formInputLabelColor,
                    // textDecorationLine: 'underline',
                  },
                ]}
              >
                {t('auth.create_user')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* <Text
                style={[
                  styles.emailDescription,
                  dynamicStyles.emailDescription,
                  { color: theme.unactiveTextColor },
                ]}
              >
                {t('auth.email_description')}
              </Text> */}
          {!!emailError && (
            <Text
              style={[
                styles.error,
                dynamicStyles.error,
                { color: theme.errorTextColor },
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
                t('auth.sign_in')
              )
            }
            onPress={onPasswordSignIn}
            disabled={sending}
          />
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
        height: getResponsiveSize(48, scaleByHeight(40, height)),
        marginTop: getResponsiveSize(12, scaleByHeight(38, height)),
        borderRadius: getResponsiveSize(12, scaleByHeight(8, height)),
      },
      outlineBtnText: {
        fontSize: getResponsiveSize(15, scaleByHeight(20, height)),
        lineHeight: getResponsiveSize(17, scaleByHeight(20, height)),
      },
      webLandscapeButton: {
        width: scaleByHeight(330, height),
        height: scaleByHeight(62, height),
      },
    }),
    [height]
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
    paddingVertical: RFValue(24),
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
    borderRadius: getResponsiveSize(10, 8),
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
    // textDecorationLine: 'underline',
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
