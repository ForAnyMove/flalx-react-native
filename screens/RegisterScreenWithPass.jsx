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

  const sizes = useMemo(
    () => ({
      brandFontSize: isWebLandscape
        ? scaleByHeight(57, height)
        : scaleByHeightMobile(45, height),
      brandLetterSpacing: isWebLandscape
        ? scaleByHeight(5, height)
        : scaleByHeightMobile(3, height),
      brandMarginBottom: isWebLandscape
        ? scaleByHeight(35, height)
        : scaleByHeightMobile(18, height),
      titleFontSize: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(18, height),
      subtitleFontSize: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(13, height),
      subtitleMarginBottom: isWebLandscape
        ? scaleByHeight(25, height)
        : scaleByHeightMobile(18, height),
      fieldBlockMarginBottom: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(16, height),
      labelFontSize: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(12, height),
      labelMarginBottom: isWebLandscape
        ? scaleByHeight(4, height)
        : scaleByHeightMobile(6, height),
      inputPaddingHorizontal: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(12, height),
      inputFontSize: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(14, height),
      inputMarginBottom: isWebLandscape
        ? scaleByHeight(2, height)
        : scaleByHeightMobile(8, height),
      outlineBtnTextFontSize: isWebLandscape
        ? scaleByHeight(20, height)
        : scaleByHeightMobile(15, height),
      outlineBtnTextLineHeight: isWebLandscape
        ? scaleByHeight(20, height)
        : scaleByHeightMobile(16, height),
      outlineBtnBorderRadius: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(7, height),
      otpRowMarginTop: isWebLandscape
        ? scaleByHeight(4, height)
        : scaleByHeightMobile(6, height),
      otpRowMarginBottom: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(12, height),
      otpRowWidth: isWebLandscape ? scaleByHeight(314, height) : '100%',
      otpRowHeight: isWebLandscape
        ? scaleByHeight(74, height)
        : scaleByHeightMobile(52, height),
      otpCellHeight: isWebLandscape
        ? scaleByHeight(74, height)
        : scaleByHeightMobile(52, height),
      otpCellFontSize: isWebLandscape
        ? scaleByHeight(20, height)
        : scaleByHeightMobile(18, height),
      otpCellLineHeight: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(19, height),
      otpCellBorderRadius: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(7, height),
      linksRowMarginBottom: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(10, height),
      linksRowWidth: isWebLandscape ? scaleByHeight(314, height) : '100%',
      linkIconWidth: isWebLandscape
        ? scaleByHeight(16, height)
        : scaleByHeightMobile(22, height),
      linkIconHeight: isWebLandscape
        ? scaleByHeight(16, height)
        : scaleByHeightMobile(22, height),
      linkFontSize: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(13, height),
      linkWithIconPaddingHorizontal: isWebLandscape
        ? scaleByHeight(3, height)
        : scaleByHeightMobile(3, height),
      errorFontSize: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(13, height),
      sentCodeTimerFontSize: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(13, height),
      modalCardPadding: isWebLandscape
        ? scaleByHeight(12, height)
        : scaleByHeightMobile(18, height),
      modalCardBorderRadius: isWebLandscape
        ? scaleByHeight(10, height)
        : scaleByHeightMobile(14, height),
      modalTextFontSize: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(13, height),
      modalTextMarginBottom: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(10, height),
      emailDescriptionFontSize: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(12, height),
      emailDescriptionLineHeight: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(16, height),
      webLandscapeFieldBlockWidth: scaleByHeight(330, height),
      webLandscapeFieldBlockHeight: scaleByHeight(76, height),
      webLandscapeFieldBlockBorderRadius: scaleByHeight(8, height),
      webLandscapeFieldBlockPaddingTop: scaleByHeight(8, height),
      webLandscapeLabelPaddingLeft: scaleByHeight(14, height),
      webLandscapeLabelPaddingRight: scaleByHeight(14, height),
      webLandscapeLabelMarginBottom: scaleByHeight(7, height),
      webLandscapeInputMarginBottom: scaleByHeight(3, height),
      multilineInputMarginBottom: isWebLandscape
        ? scaleByHeight(10, height)
        : scaleByHeightMobile(25, height),
      finishTitleMarginBottom: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(8, height),
      keyboardVerticalOffset: isWebLandscape ? 0 : scaleByHeightMobile(10, height),
      eyeIconPosition: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(12, height),
      eyeIconTop: isWebLandscape
        ? scaleByHeight(26, height)
        : scaleByHeightMobile(38, height),
      eyeIconSize: isWebLandscape
        ? scaleByHeight(24, height)
        : scaleByHeightMobile(22, height),
    }),
    [isWebLandscape, height]
  );

  const dynamicStyles = useMemo(() => {
    return {
      brand: {
        fontSize: sizes.brandFontSize,
        letterSpacing: sizes.brandLetterSpacing,
        marginBottom: sizes.brandMarginBottom,
      },
      title: {
        fontSize: sizes.titleFontSize,
      },
      subtitle: {
        fontSize: sizes.subtitleFontSize,
        marginBottom: sizes.subtitleMarginBottom,
      },
      fieldBlock: {
        marginBottom: sizes.fieldBlockMarginBottom,
      },
      label: {
        fontSize: sizes.labelFontSize,
        marginBottom: sizes.labelMarginBottom,
      },
      input: {
        paddingHorizontal: sizes.inputPaddingHorizontal,
        fontSize: sizes.inputFontSize,
        marginBottom: sizes.inputMarginBottom,
      },
      outlineBtnText: {
        fontSize: sizes.outlineBtnTextFontSize,
        lineHeight: sizes.outlineBtnTextLineHeight,
        borderRadius: sizes.outlineBtnBorderRadius,
      },
      otpRow: {
        marginTop: sizes.otpRowMarginTop,
        marginBottom: sizes.otpRowMarginBottom,
        width: sizes.otpRowWidth,
        height: sizes.otpRowHeight,
      },
      otpCell: {
        height: sizes.otpCellHeight,
        fontSize: sizes.otpCellFontSize,
        lineHeight: sizes.otpCellLineHeight,
        borderRadius: sizes.otpCellBorderRadius,
      },
      linksRow: {
        marginBottom: sizes.linksRowMarginBottom,
        width: sizes.linksRowWidth,
      },
      linkIcon: {
        width: sizes.linkIconWidth,
        height: sizes.linkIconHeight,
      },
      link: {
        fontSize: sizes.linkFontSize,
      },
      linkWithIcon: {
        paddingHorizontal: sizes.linkWithIconPaddingHorizontal,
      },
      error: {
        fontSize: sizes.errorFontSize,
      },
      sentCodeTimer: {
        fontSize: sizes.sentCodeTimerFontSize,
      },
      modalCard: {
        padding: sizes.modalCardPadding,
        borderRadius: sizes.modalCardBorderRadius,
      },
      modalText: {
        fontSize: sizes.modalTextFontSize,
        marginBottom: sizes.modalTextMarginBottom,
      },
      emailDescription: {
        fontSize: sizes.emailDescriptionFontSize,
        lineHeight: sizes.emailDescriptionLineHeight,
      },
      // Динамические стили для web-landscape
      webLandscapeFieldBlock: {
        width: sizes.webLandscapeFieldBlockWidth,
        height: sizes.webLandscapeFieldBlockHeight,
        borderRadius: sizes.webLandscapeFieldBlockBorderRadius,
        paddingTop: sizes.webLandscapeFieldBlockPaddingTop,
      },
      webLandscapeLabel: {
        paddingLeft: isRTL ? 0 : sizes.webLandscapeLabelPaddingLeft,
        paddingRight: isRTL ? sizes.webLandscapeLabelPaddingRight : 0,
        marginBottom: sizes.webLandscapeLabelMarginBottom,
      },
      webLandscapeInput: {
        marginBottom: sizes.webLandscapeInputMarginBottom,
      },
    };
  }, [sizes, isRTL]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={[styles.root, { backgroundColor: theme.backgroundColor }]}
      keyboardVerticalOffset={sizes.keyboardVerticalOffset}
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
                        paddingLeft: isRTL ? 0 : sizes.webLandscapeLabelPaddingLeft,
                        paddingRight: isRTL
                          ? sizes.webLandscapeLabelPaddingRight
                          : 0,
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
                  dynamicStyles.input,
                  {
                    backgroundColor: theme.defaultBlocksBackground,
                    borderColor: theme.borderColor,
                    color: theme.formInputTextColor,
                    textAlign: isRTL ? 'right' : 'left',
                    // прозрачный инпут внутри окрашенного fieldBlock
                    backgroundColor: 'transparent',
                    borderWidth: 0,
                    marginBottom: isWebLandscape
                      ? sizes.webLandscapeInputMarginBottom
                      : sizes.inputMarginBottom,
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
                        paddingLeft: isRTL ? 0 : sizes.webLandscapeLabelPaddingLeft,
                        paddingRight: isRTL
                          ? sizes.webLandscapeLabelPaddingRight
                          : 0,
                        marginBottom: sizes.webLandscapeLabelMarginBottom,
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
                    marginBottom: isWebLandscape
                      ? sizes.webLandscapeInputMarginBottom
                      : sizes.inputMarginBottom,
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
                  right: isRTL ? undefined : sizes.eyeIconPosition,
                  left: isRTL ? sizes.eyeIconPosition : undefined,
                  top: sizes.eyeIconTop,
                  width: sizes.eyeIconSize,
                  height: sizes.eyeIconSize,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Image
                  source={showPassword ? icons.eyeOpen : icons.eyeClosed}
                  style={{
                    width: sizes.eyeIconSize,
                    height: sizes.eyeIconSize,
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
                        paddingLeft: isRTL ? 0 : sizes.webLandscapeLabelPaddingLeft,
                        paddingRight: isRTL
                          ? sizes.webLandscapeLabelPaddingRight
                          : 0,
                        marginBottom: sizes.webLandscapeLabelMarginBottom,
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
                    marginBottom: isWebLandscape
                      ? sizes.webLandscapeInputMarginBottom
                      : sizes.inputMarginBottom,
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
  const { width } = useWindowDimensions();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const buttonSizes = useMemo(
    () => ({
      height: isWebLandscape
        ? scaleByHeight(62, height)
        : scaleByHeightMobile(48, height),
      marginTop: isWebLandscape
        ? scaleByHeight(38, height)
        : scaleByHeightMobile(12, height),
      borderRadius: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(12, height),
      fontSize: isWebLandscape
        ? scaleByHeight(20, height)
        : scaleByHeightMobile(15, height),
      lineHeight: isWebLandscape
        ? scaleByHeight(20, height)
        : scaleByHeightMobile(17, height),
      width: isWebLandscape ? scaleByHeight(330, height) : '100%',
    }),
    [isWebLandscape, height]
  );

  const buttonDynamicStyles = useMemo(
    () => ({
      outlineBtn: {
        height: buttonSizes.height,
        marginTop: buttonSizes.marginTop,
        borderRadius: buttonSizes.borderRadius,
        width: buttonSizes.width,
      },
      outlineBtnText: {
        fontSize: buttonSizes.fontSize,
        lineHeight: buttonSizes.lineHeight,
      },
    }),
    [buttonSizes]
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
    paddingVertical: 24, // Replaced RFValue(24)
  },
  contentBlock: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  brand: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Rubik-Bold',
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Rubik-SemiBold',
  },
  subtitle: {
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'Rubik-SemiBold',
  },
  fieldBlock: {},
  label: {
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8, // Replaced getResponsiveSize(10, 8)
    fontWeight: '500',
  },
  outlineBtn: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  outlineBtnText: {
    fontFamily: 'Rubik-Medium',
  },
  otpRow: {
    width: '100%',
    justifyContent: 'space-between',
  },
  otpCell: {
    width: `${100 / OTP_LENGTH - 2}%`,
    borderWidth: 1,
    textAlign: 'center',
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
  },
  link: {},
  error: {
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
    alignItems: 'center',
  },
  modalText: {
    textAlign: 'center',
  },
  emailDescription: {
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: 'Rubik-Medium',
  },
});
