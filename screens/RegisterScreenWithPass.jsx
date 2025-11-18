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

  const [sending, setSending] = useState(false);

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');

  // ERRORS
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordRepeatError, setPasswordRepeatError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  const validateEmail = (value) => {
    if (!value) return false;
    const re =
      /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i;

    return re.test(String(value).trim().toLowerCase());
  };

  const validatePassword = (pwd) => pwd && pwd.trim().length >= 6;
  const passwordsMatch = () =>
    password.trim() !== '' &&
    passwordRepeat.trim() !== '' &&
    password.trim() === passwordRepeat.trim();

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

  async function handleSubmit() {
    setGeneralError(null);
    setEmailError(null);
    setPasswordError(null);
    setPasswordRepeatError(null);

    let ok = true;

    if (!validateEmail(email)) {
      setEmailError(t('register.email_invalid'));
      ok = false;
    }
    if (!validatePassword(password)) {
      setPasswordError(t('register.password_invalid'));
      ok = false;
    }
    if (!passwordsMatch()) {
      setPasswordRepeatError(t('register.password_mismatch'));
      ok = false;
    }
    if (!ok) return;
    try {
      setLoading(true);

      const res = await session.createUser(email.trim(), password);

      if (!res.success) {
        const err = String(res.error || '').toLowerCase();

        if (err.includes('already') || err.includes('exists')) {
          setEmailError(t('register.email_busy'));
        } else {
          setGeneralError(res.error);
        }

        setLoading(false);
        return;
      }

      setFinished(true);
      // registerControl.leaveRegisterScreen();
    } catch (e) {
      const err = String(e.message || e).toLowerCase();
      console.error('❌ Ошибка при обновлении:', e);
      if (err.includes('already') || err.includes('exists')) {
        setEmailError(t('register.email_busy'));
      } else {
        setGeneralError(String(e));
      }
    } finally {
      setLoading(false);
    }
  }

  // Анимации
  const fadeAnim = useRef(new Animated.Value(1)).current;
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

  const sizes = {
    multilineInputMarginBottom: isWebLandscape
      ? scaleByHeight(10, height)
      : RFValue(25),
    finishTitleMarginBottom: isWebLandscape
      ? scaleByHeight(18, height)
      : RFValue(8),
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
        {finished ? (
          <Animated.View
            style={[
              styles.contentBlock,
              isWebLandscape
                ? { width: height * 0.5 } // ≤ 50% высоты экрана
                : { width: '100%' },
              { opacity: fadeAnim },
            ]}
          >
            <Text
              style={[
                styles.title,
                dynamicStyles.title,
                {
                  color: theme.unactiveTextColor,
                  textAlign: 'center',
                  fontSize: dynamicStyles.title.fontSize * 1.5,
                  marginBottom: sizes.finishTitleMarginBottom,
                  fontWeight: '500',
                },
              ]}
            >
              {t('auth.verify_email')}
            </Text>
            <Text
              style={[
                styles.subtitle,
                dynamicStyles.subtitle,
                {
                  color: theme.unactiveTextColor,
                  textAlign: 'center',
                  fontWeight: '500',
                },
              ]}
            >
              {t('auth.verify_message_sended')}
            </Text>
            <PrimaryOutlineButton
              isLandscape={isLandscape}
              height={height}
              theme={theme}
              title={t('common.close')}
              onPress={() => registerControl.leaveRegisterScreen()}
            />
          </Animated.View>
        ) : (
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
              {t('auth.create_user_title')}
            </Text>
            <Text
              style={[
                styles.subtitle,
                dynamicStyles.subtitle,
                { color: theme.unactiveTextColor, textAlign: 'center' },
              ]}
            >
              {t('auth.create_user_subtitle')}
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
                onChangeText={(txt) => {
                  setEmail(txt);
                  setEmailError(null);
                }}
                returnKeyType='done'
              />

              {emailError && (
                <Text
                  style={{
                    color: theme.errorTextColor,
                    marginTop: sizes.multilineInputMarginBottom,
                    fontSize: dynamicStyles.label.fontSize,
                  }}
                >
                  {emailError}
                </Text>
              )}
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
                {t('register.password')}
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
                placeholder='******'
                placeholderTextColor={theme.formInputPlaceholderColor}
                secureTextEntry={!showPassword}
                autoCapitalize='none'
                autoCorrect={false}
                value={password}
                onChangeText={(txt) => {
                  setPassword(txt);
                  setPasswordError(null);
                }}
                returnKeyType='done'
              />

              {passwordError && (
                <Text
                  style={{
                    color: theme.errorTextColor,
                    marginTop: sizes.multilineInputMarginBottom,
                    fontSize: dynamicStyles.label.fontSize,
                  }}
                >
                  {passwordError}
                </Text>
              )}
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
                  width: isWebLandscape
                    ? scaleByHeight(24, height)
                    : RFValue(22),
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
            {/* PASSWORD REPEAT */}
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
                {t('register.repeat_password')}
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
                placeholder='******'
                placeholderTextColor={theme.formInputPlaceholderColor}
                secureTextEntry={true}
                autoCapitalize='none'
                autoCorrect={false}
                value={passwordRepeat}
                onChangeText={(txt) => {
                  setPasswordRepeat(txt);
                  setPasswordRepeatError(null);
                }}
                returnKeyType='done'
              />

              {passwordRepeatError && (
                <Text
                  style={{
                    color: theme.errorTextColor,
                    marginTop: sizes.multilineInputMarginBottom,
                    fontSize: dynamicStyles.label.fontSize,
                  }}
                >
                  {passwordRepeatError}
                </Text>
              )}
            </View>

            {/* ERROR under form */}
            {generalError && (
              <Text
                style={{
                  textAlign: 'center',
                  color: theme.errorTextColor,
                  marginTop: sizes.multilineInputMarginBottom,
                  fontSize: dynamicStyles.label.fontSize,
                }}
              >
                {generalError}
              </Text>
            )}

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
                onPress={() => registerControl.leaveRegisterScreen()}
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
                  {t('auth.back_to_sign_in')}
                </Text>
              </TouchableOpacity>
            </View>

            <PrimaryOutlineButton
              isLandscape={isLandscape}
              height={height}
              theme={theme}
              title={
                sending ? (
                  <ActivityIndicator color={theme.primaryColor} />
                ) : (
                  t('common.create')
                )
              }
              onPress={handleSubmit}
              disabled={
                sending ||
                !validateEmail(email) ||
                !validatePassword(password) ||
                !passwordsMatch()
              }
            />
          </Animated.View>
        )}
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
