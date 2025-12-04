import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { icons } from '../constants/icons';

const OTP_LENGTH = 6;

export default function AuthScreenWithPass() {
  const { t } = useTranslation();
  const {
    themeController,
    languageController,
    registerControl,
    authControl,
    forgotPassControl,
    session,
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
    const h = height;

    return {
      root: {
        flex: 1,
        backgroundColor: theme.backgroundColor,
      },
      keyboardAvoiding: {
        flex: 1,
      },
      scroll: {
        paddingHorizontal: '6%',
        paddingVertical: isWebLandscape ? scaleByHeight(24, h) : scaleByHeightMobile(24, h),
        flexGrow: 1,
        justifyContent: isWebLandscape ? 'center' : 'flex-start',
      },
      contentBlock: {
        alignSelf: 'center',
        alignItems: 'center',
        width: isWebLandscape ? h * 0.5 : '100%',
      },
      brand: {
        fontSize: isWebLandscape ? scaleByHeight(57, h) : scaleByHeightMobile(45, h),
        letterSpacing: isWebLandscape ? scaleByHeight(5, h) : scaleByHeightMobile(3, h),
        marginBottom: isWebLandscape ? scaleByHeight(35, h) : scaleByHeightMobile(18, h),
        color: theme.primaryColor,
        fontFamily: 'Rubik-Bold',
        textAlign: 'center',
      },
      title: {
        fontSize: isWebLandscape ? scaleByHeight(18, h) : scaleByHeightMobile(18, h),
        color: theme.unactiveTextColor,
        textAlign: 'center',
        fontFamily: 'Rubik-SemiBold',
      },
      subtitle: {
        fontSize: isWebLandscape ? scaleByHeight(18, h) : scaleByHeightMobile(13, h),
        marginBottom: isWebLandscape ? scaleByHeight(25, h) : scaleByHeightMobile(18, h),
        color: theme.unactiveTextColor,
        textAlign: 'center',
        fontFamily: 'Rubik-SemiBold',
      },
      fieldContainer: {
        backgroundColor: theme.formInputBackground,
        borderRadius: isWebLandscape ? scaleByHeight(8, h) : scaleByHeightMobile(12, h),
        paddingHorizontal: isWebLandscape ? scaleByHeight(14, h) : scaleByHeightMobile(12, h),
        paddingTop: isWebLandscape ? scaleByHeight(8, h) : scaleByHeightMobile(10, h),
        marginBottom: isWebLandscape ? scaleByHeight(14, h) : scaleByHeightMobile(16, h),
        width: isWebLandscape ? scaleByHeight(330, h) : '100%',
        height: isWebLandscape ? scaleByHeight(76, h) : undefined,
      },
      label: {
        fontSize: isWebLandscape ? scaleByHeight(14, h) : scaleByHeightMobile(12, h),
        marginBottom: isWebLandscape ? scaleByHeight(4, h) : scaleByHeightMobile(6, h),
        color: theme.formInputLabelColor,
        textAlign: isRTL ? 'right' : 'left',
        fontFamily: 'Rubik-Medium',
      },
      input: {
        fontSize: isWebLandscape ? scaleByHeight(18, h) : scaleByHeightMobile(14, h),
        color: theme.formInputTextColor,
        textAlign: isRTL ? 'right' : 'left',
        fontFamily: 'Rubik-Medium',
        padding: 0,
        backgroundColor: 'transparent',
        borderWidth: 0,
        ...Platform.select({
          web: {
            outlineStyle: 'none',
          },
        }),
      },
      eyeIconContainer: {
        position: 'absolute',
        right: isWebLandscape ? scaleByHeight(14, h) : scaleByHeightMobile(12, h),
        top: isWebLandscape ? scaleByHeight(38, h) : scaleByHeightMobile(38, h),
        width: isWebLandscape ? scaleByHeight(24, h) : scaleByHeightMobile(22, h),
        height: isWebLandscape ? scaleByHeight(24, h) : scaleByHeightMobile(22, h),
        justifyContent: 'center',
        alignItems: 'center',
      },
      eyeIcon: {
        width: '100%',
        height: '100%',
        tintColor: theme.formInputLabelColor,
      },
      linksRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: isWebLandscape ? scaleByHeight(8, h) : scaleByHeightMobile(10, h),
        width: isWebLandscape ? scaleByHeight(330, h) : '100%',
      },
      link: {
        fontSize: isWebLandscape ? scaleByHeight(14, h) : scaleByHeightMobile(13, h),
        color: theme.formInputLabelColor,
        fontFamily: 'Rubik-Medium',
      },
      error: {
        fontSize: isWebLandscape ? scaleByHeight(14, h) : scaleByHeightMobile(13, h),
        color: theme.errorTextColor,
        marginTop: isWebLandscape ? scaleByHeight(4, h) : scaleByHeightMobile(4, h),
        textAlign: 'center',
      },
      primaryButton: {
        width: isWebLandscape ? scaleByHeight(330, h) : '100%',
        height: isWebLandscape ? scaleByHeight(62, h) : scaleByHeightMobile(48, h),
        marginTop: isWebLandscape ? scaleByHeight(38, h) : scaleByHeightMobile(12, h),
        borderRadius: isWebLandscape ? scaleByHeight(8, h) : scaleByHeightMobile(12, h),
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        borderColor: theme.primaryColor,
      },
      primaryButtonText: {
        fontSize: isWebLandscape ? scaleByHeight(20, h) : scaleByHeightMobile(15, h),
        lineHeight: isWebLandscape ? scaleByHeight(20, h) : scaleByHeightMobile(17, h),
        fontFamily: 'Rubik-Medium',
        color: theme.primaryColor,
      },
    };
  }, [width, height, isWebLandscape, isRTL, theme]);

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
      style={dynamicStyles.root}
      keyboardVerticalOffset={Platform.select({ ios: scaleByHeightMobile(10, height), android: 0 })}
    >
      <ScrollView
        contentContainerStyle={dynamicStyles.scroll}
        keyboardShouldPersistTaps='handled'
      >
        <Animated.View
          style={[
            dynamicStyles.contentBlock,
            { opacity: fadeAnim },
          ]}
        >
          <Text style={dynamicStyles.brand}>
            {t('auth.app_name')}
          </Text>

          <Text style={dynamicStyles.title}>
            {t('auth.email_title')}
          </Text>
          <Text style={dynamicStyles.subtitle}>
            {t('auth.email_password_subtitle')}
          </Text>

          {/* EMAIL FIELD */}
          <View style={dynamicStyles.fieldContainer}>
            <Text style={dynamicStyles.label}>
              {t('auth.email_label')}
            </Text>
            <TextInput
              ref={emailInputRef}
              style={dynamicStyles.input}
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
          <View style={dynamicStyles.fieldContainer}>
            <Text style={dynamicStyles.label}>
              {t('auth.password_label')}
            </Text>
            <TextInput
              style={dynamicStyles.input}
              placeholder='******'
              placeholderTextColor={theme.formInputPlaceholderColor}
              secureTextEntry={!showPassword}
              autoCapitalize='none'
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
              returnKeyType='done'
            />
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              style={dynamicStyles.eyeIconContainer}
            >
              <Image
                source={showPassword ? icons.eyeOpen : icons.eyeClosed}
                style={dynamicStyles.eyeIcon}
                resizeMode='contain'
              />
            </TouchableOpacity>
          </View>

          {/* LINKS ROW */}
          <View style={dynamicStyles.linksRow}>
            <TouchableOpacity onPress={() => forgotPassControl.switch()}>
              <Text style={dynamicStyles.link}>
                {t('auth.forgot_password')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => registerControl.goToRegisterScreen()}>
              <Text style={dynamicStyles.link}>
                {t('auth.create_user')}
              </Text>
            </TouchableOpacity>
          </View>

          {!!emailError && (
            <Text style={dynamicStyles.error}>
              {emailError}
            </Text>
          )}

          <PrimaryOutlineButton
            title={
              sending ? (
                <ActivityIndicator color={theme.primaryColor} />
              ) : (
                t('auth.sign_in')
              )
            }
            onPress={onPasswordSignIn}
            disabled={sending}
            buttonStyle={dynamicStyles.primaryButton}
            textStyle={dynamicStyles.primaryButtonText}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PrimaryOutlineButton({
  title,
  onPress,
  disabled,
  buttonStyle,
  textStyle,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[buttonStyle, { opacity: disabled ? 0.6 : 1 }]}
    >
      {typeof title === 'string' ? (
        <Text style={textStyle}>
          {title}
        </Text>
      ) : (
        title
      )}
    </TouchableOpacity>
  );
}
