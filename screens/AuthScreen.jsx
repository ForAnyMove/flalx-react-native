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
  Modal,
  useWindowDimensions,
  Animated,
  ActivityIndicator,
  Image,
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

export default function AuthScreen() {
  const { t } = useTranslation();
  const { session, themeController, languageController } =
    useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [sending, setSending] = useState(false);

  const [otp, setOtp] = useState(Array.from({ length: OTP_LENGTH }, () => ''));
  const inputsRef = useRef([]);
  const [showResentModal, setShowResentModal] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [focusedOtpIndex, setFocusedOtpIndex] = useState(null);

  // Анимации
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const dynamicStyles = useMemo(() => {
    return {
      brand: {
        fontSize: getResponsiveSize(45, scaleByHeight(57, height)),
        letterSpacing: getResponsiveSize(3, scaleByHeight(5, height)),
        marginBottom: getResponsiveSize(18, scaleByHeight(35, height)),
      },
      title: {
        fontSize: getResponsiveSize(18, scaleByHeight(18, height)),
      },
      subtitle: {
        fontSize: getResponsiveSize(13, scaleByHeight(18, height)),
        marginBottom: getResponsiveSize(18, scaleByHeight(25, height)),
      },
      fieldBlock: {
        marginBottom: getResponsiveSize(16, scaleByHeight(14, height)),
      },
      label: {
        fontSize: getResponsiveSize(12, scaleByHeight(14, height)),
        marginBottom: getResponsiveSize(6, scaleByHeight(4, height)),
      },
      input: {
        paddingHorizontal: getResponsiveSize(12, scaleByHeight(14, height)),
        fontSize: getResponsiveSize(14, scaleByHeight(18, height)),
        marginBottom: getResponsiveSize(8, scaleByHeight(2, height)),
      },
      outlineBtnText: {
        fontSize: getResponsiveSize(15, scaleByHeight(20, height)),
        lineHeight: getResponsiveSize(17, scaleByHeight(20, height)),
        borderRadius: getResponsiveSize(12, scaleByHeight(8, height)),
      },
      otpRow: {
        marginTop: getResponsiveSize(6, scaleByHeight(4, height)),
        marginBottom: getResponsiveSize(12, scaleByHeight(8, height)),
        width: getResponsiveSize( '100%', scaleByHeight(314, height)),
        height: getResponsiveSize(52, scaleByHeight(74, height)),
      },
      otpCell: {
        height: getResponsiveSize(52, scaleByHeight(74, height)),
        fontSize: getResponsiveSize(18, scaleByHeight(20, height)),
        lineHeight: getResponsiveSize(19, scaleByHeight(18, height)),
        borderRadius: getResponsiveSize(10, scaleByHeight(8, height)),
      },
      linksRow: {
        marginBottom: getResponsiveSize(10, scaleByHeight(8, height)),
        width: getResponsiveSize( '100%', scaleByHeight(314, height)),
      },
      linkIcon: {
        width: getResponsiveSize(22, scaleByHeight(24, height)),
        height: getResponsiveSize(22, scaleByHeight(24, height)),
      },
      link: {
        fontSize: getResponsiveSize(13, scaleByHeight(14, height)),
      },
      error: {
        fontSize: getResponsiveSize(13, scaleByHeight(12, height)),
      },
      modalCard: {
        padding: getResponsiveSize(18, scaleByHeight(12, height)),
        borderRadius: getResponsiveSize(14, scaleByHeight(10, height)),
      },
      modalText: {
        fontSize: getResponsiveSize(14, scaleByHeight(12, height)),
        marginBottom: getResponsiveSize(10, scaleByHeight(8, height)),
      },
      emailDescription: {
        fontSize: getResponsiveSize(12, scaleByHeight(14, height)),
        lineHeight: getResponsiveSize(16, scaleByHeight(18, height)),
      },
      // Динамические стили для web-landscape
      webLandscapeFieldBlock: {
        borderRadius: getResponsiveSize(12, scaleByHeight(8, height)),
        paddingTop: getResponsiveSize(10, scaleByHeight(8, height)),
        width: scaleByHeight(330, height),
        height: scaleByHeight(76, height),
      },
      webLandscapeLabel: {
        paddingLeft: isRTL
          ? 0
          : getResponsiveSize(12, scaleByHeight(14, height)),
        paddingRight: isRTL
          ? getResponsiveSize(12, scaleByHeight(14, height))
          : 0,
        marginBottom: getResponsiveSize(4, scaleByHeight(7, height)),
      },
      webLandscapeInput: {
        marginBottom: getResponsiveSize(4, scaleByHeight(3, height)),
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

  // Отправка кода
  const onSendCode = async () => {
    if (!isValidEmail) {
      setEmailError(t('auth.invalid_email'));
      return;
    }
    setEmailError(null);
    try {
      setSending(true);
      await session?.sendCode(email.trim());
      animateStepChange('otp');
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
          Platform.OS === 'web' && isLandscape
            ? { justifyContent: 'center', alignItems: 'center', flex: 1 }
            : {},
        ]}
        keyboardShouldPersistTaps='handled'
      >
        <Animated.View
          style={[
            styles.contentBlock,
            Platform.OS === 'web' && isLandscape
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
          {step === 'email' ? (
            <>
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
                {t('auth.email_subtitle')}
              </Text>

              <View
                style={[
                  styles.fieldBlock,
                  dynamicStyles.fieldBlock,
                  Platform.OS === 'web' && isLandscape
                    ? {
                        backgroundColor: theme.formInputBackground,
                        borderRadius: getResponsiveSize(
                          12,
                          scaleByHeight(8, height)
                        ),
                        paddingHorizontal: getResponsiveSize(12, 0),
                        paddingTop: getResponsiveSize(
                          10,
                          scaleByHeight(8, height)
                        ),
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
                    Platform.OS === 'web' && isLandscape
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
                      marginBottom: getResponsiveSize(
                        4,
                        scaleByHeight(3, height)
                      ),
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

              <Text
                style={[
                  styles.emailDescription,
                  dynamicStyles.emailDescription,
                  { color: theme.unactiveTextColor },
                ]}
              >
                {t('auth.email_description')}
              </Text>
              {!!emailError && (
                <Text
                  style={[
                    styles.error,
                    dynamicStyles.error,
                    { color: '#D32F2F' },
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
                    t('auth.send_code')
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
                  dynamicStyles.title,
                  { color: theme.unactiveTextColor, textAlign: 'center' },
                ]}
              >
                {t('auth.otp_title')} {email}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  dynamicStyles.subtitle,
                  { color: theme.unactiveTextColor, textAlign: 'center' },
                ]}
              >
                {t('auth.otp_subtitle')}
              </Text>

              <Text
                style={[
                  styles.label,
                  dynamicStyles.label,
                  {
                    color: theme.unactiveTextColor,
                    textAlign: 'center',
                    // alignSelf: isRTL ? 'flex-end' : 'flex-start',
                  },
                ]}
              >
                {t('auth.otp_label')}
              </Text>

              <Animated.View
                style={[
                  styles.otpRow,
                  dynamicStyles.otpRow,
                  {
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
                      dynamicStyles.otpCell,
                      {
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
                    dynamicStyles.error,
                    { color: '#D32F2F', textAlign: 'center' },
                  ]}
                >
                  {otpError}
                </Text>
              )}

              {/* Линки: back + resend (зеркалим порядок через isRTL) */}
              <View
                style={[
                  styles.linksRow,
                  dynamicStyles.linksRow,
                  { flexDirection: 'row' },
                  // { flexDirection: isRTL ? 'row' : 'row-reverse' },
                ]}
              >
                <TouchableOpacity onPress={backToEmail} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Image source={icons.arrowLeft} style={dynamicStyles.linkIcon} />
                  <Text
                    style={[
                      styles.link,
                      dynamicStyles.link,
                      {
                        color: theme.unactiveTextColor,
                        textDecorationLine: 'none',
                      },
                    ]}
                  >
                    {t('auth.back_to_email')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleResend}>
                  <Text
                    style={[
                      styles.link,
                      dynamicStyles.link,
                      {
                        color: theme.unactiveTextColor,
                        textDecorationLine: 'none',
                      },
                    ]}
                  >
                    {t('auth.resend_code')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Кнопка подтверждения/очистки */}
              {otpError ? (
                <PrimaryOutlineButton
                  isLandscape={isLandscape}
                  height={height}
                  theme={theme}
                  title={t('auth.clear_code')}
                  onPress={clearOtp}
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
                />
              )}
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Модалка "код отправлен" — вернул */}
      <Modal visible={showResentModal} transparent animationType='fade'>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              dynamicStyles.modalCard,
              { backgroundColor: theme.defaultBlocksBackground },
            ]}
          >
            <Text
              style={[
                styles.modalText,
                dynamicStyles.modalText,
                { color: theme.textColor },
              ]}
            >
              {t('auth.resend_modal_text')}
            </Text>
            <PrimaryOutlineButton
              isLandscape={isLandscape}
              height={height}
              theme={theme}
              title={t('auth.ok')}
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
  isLandscape,
  height,
}) {  
  const buttonDynamicStyles = useMemo(() => ({
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
      }
  }), [height]);
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
      ]}
    >
      {typeof title === 'string' ? (
        <Text style={[styles.outlineBtnText, buttonDynamicStyles.outlineBtnText, { color: theme.primaryColor }]}>
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
