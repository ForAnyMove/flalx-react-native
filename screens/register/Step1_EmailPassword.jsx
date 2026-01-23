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
  Linking,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { icons } from '../../constants/icons';
import { logError } from '../../utils/log_util';

// Re-using the button component from the original file
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
        : scaleByHeightMobile(62, height),
      marginTop: isWebLandscape
        ? scaleByHeight(38, height)
        : scaleByHeightMobile(12, height),
      borderRadius: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(8, height),
      fontSize: isWebLandscape
        ? scaleByHeight(20, height)
        : scaleByHeightMobile(20, height),
      lineHeight: isWebLandscape
        ? scaleByHeight(20, height)
        : scaleByHeightMobile(20, height),
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


export default function Step1_EmailPassword({ onNext }) {
  const { t } = useTranslation();
  const {
    session,
    themeController,
    languageController,
    registerControl,
  } = useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

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

  const validateEmail = (value) => {
    if (!value) return false;
    const re =
      /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i;
    return re.test(String(value).trim().toLowerCase());
  };

  const tryGetReferralCode = async () => {
    const url = await Linking.getInitialURL();
    if (url) {
      const match = url.match(/[?&]ref=([^&]+)/);
      if (match) return match[1];
    }
  }

  const validatePassword = (pwd) => pwd && pwd.trim().length >= 6;
  const passwordsMatch = () =>
    password.trim() !== '' &&
    passwordRepeat.trim() !== '' &&
    password.trim() === passwordRepeat.trim();

  const emailInputRef = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      emailInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

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

      const referralCode = await tryGetReferralCode();
      const res = await session.createUser(email.trim(), password, {}, referralCode);

      if (res.isUserExists) {
        setEmailError(t('register.email_busy'));
        setLoading(false);
        return;
      }

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

      // Call the onNext callback to proceed to the next step
      onNext();

    } catch (e) {
      const err = String(e.message || e).toLowerCase();
      logError('❌ Registration error:', e);
      if (err.includes('already') || err.includes('exists')) {
        setEmailError(t('register.email_busy'));
      } else {
        setGeneralError(String(e));
      }
    } finally {
      setLoading(false);
    }
  }

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const sizes = useMemo(
    () => ({
      brandFontSize: isWebLandscape
        ? scaleByHeight(57, height)
        : scaleByHeightMobile(68, height),
      brandLetterSpacing: isWebLandscape
        ? scaleByHeight(5, height)
        : scaleByHeightMobile(5, height),
      brandMarginBottom: isWebLandscape
        ? scaleByHeight(35, height)
        : scaleByHeightMobile(22, height),
      titleFontSize: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(18, height),
      subtitleFontSize: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(18, height),
      subtitleMarginBottom: isWebLandscape
        ? scaleByHeight(25, height)
        : scaleByHeightMobile(28, height),
      fieldBlockMarginBottom: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(16, height),
      labelFontSize: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(14, height),
      labelMarginBottom: isWebLandscape
        ? scaleByHeight(4, height)
        : scaleByHeightMobile(6, height),
      inputPaddingHorizontal: isWebLandscape
        ? scaleByHeight(16, height)
        : scaleByHeightMobile(16, height),
      inputFontSize: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(18, height),
      inputMarginBottom: isWebLandscape
        ? scaleByHeight(2, height)
        : scaleByHeightMobile(8, height),
      outlineBtnTextFontSize: isWebLandscape
        ? scaleByHeight(20, height)
        : scaleByHeightMobile(20, height),
      outlineBtnTextLineHeight: isWebLandscape
        ? scaleByHeight(20, height)
        : scaleByHeightMobile(20, height),
      outlineBtnBorderRadius: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(8, height),
      linksRowMarginBottom: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(12, height),
      linksRowWidth: isWebLandscape ? scaleByHeight(314, height) : '90%',
      linkFontSize: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(14, height),
      errorFontSize: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(14, height),
      webLandscapeFieldBlockWidth: scaleByHeight(330, height),
      webLandscapeFieldBlockHeight: scaleByHeight(76, height),
      webLandscapeFieldBlockBorderRadius: scaleByHeight(8, height),
      webLandscapeFieldBlockPaddingTop: scaleByHeight(8, height),
      webLandscapeLabelPaddingLeft: 0,
      webLandscapeLabelPaddingRight: 0,
      webLandscapeLabelMarginBottom: scaleByHeight(7, height),
      webLandscapeInputMarginBottom: scaleByHeight(3, height),
      multilineInputMarginBottom: isWebLandscape
        ? scaleByHeight(11, height)
        : scaleByHeightMobile(25, height),
      keyboardVerticalOffset: isWebLandscape
        ? 0
        : scaleByHeightMobile(10, height),
      eyeIconPosition: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(12, height),
      eyeIconTop: isWebLandscape
        ? scaleByHeight(26, height)
        : scaleByHeightMobile(35, height),
      eyeIconSize: isWebLandscape
        ? scaleByHeight(24, height)
        : scaleByHeightMobile(24, height),
      fieldBlockPaddingTop: isWebLandscape
        ? scaleByHeight(10, height)
        : scaleByHeightMobile(12, height),
      fieldBlockWidth: isWebLandscape ? scaleByHeight(330, height) : '100%',
      fieldBlockHeight: isWebLandscape
        ? scaleByHeight(76, height)
        : scaleByHeightMobile(75, height),
      borderRadius: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(8, height),
      containerPaddingVertical: isWebLandscape
        ? 0
        : scaleByHeightMobile(80, height),
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
        fontSize: sizes.inputFontSize,
        marginBottom: sizes.inputMarginBottom,
      },
      outlineBtnText: {
        fontSize: sizes.outlineBtnTextFontSize,
        lineHeight: sizes.outlineBtnTextLineHeight,
        borderRadius: sizes.outlineBtnBorderRadius,
      },
      linksRow: {
        marginBottom: sizes.linksRowMarginBottom,
        width: sizes.linksRowWidth,
      },
      link: {
        fontSize: sizes.linkFontSize,
      },
      error: {
        fontSize: sizes.errorFontSize,
      },
      webLandscapeFieldBlock: {
        width: sizes.webLandscapeFieldBlockWidth,
        height: sizes.webLandscapeFieldBlockHeight,
        borderRadius: sizes.webLandscapeFieldBlockBorderRadius,
        paddingTop: sizes.webLandscapeFieldBlockPaddingTop,
      },
      webLandscapeLabel: {
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
          {
            paddingVertical: sizes.containerPaddingVertical,
          },
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
              ? { width: height * 0.5 }
              : { width: '100%' },
            { opacity: fadeAnim },
          ]}
        >
          <Text
            style={[
              styles.brand,
              dynamicStyles.brand,
              { color: theme.primaryColor },
            ]}
          >
            {t('auth.app_name')}
          </Text>

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
                borderRadius: sizes.borderRadius,
                paddingHorizontal: sizes.inputPaddingHorizontal,
                paddingTop: sizes.fieldBlockPaddingTop,
                width: sizes.fieldBlockWidth,
                height: sizes.fieldBlockHeight,
              },
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
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  color: theme.formInputTextColor,
                  textAlign: isRTL ? 'right' : 'left',
                  marginBottom: isWebLandscape
                    ? sizes.webLandscapeInputMarginBottom
                    : sizes.inputMarginBottom,
                },
                Platform.OS === 'web' && {
                  outlineStyle: 'none',
                },
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
                borderRadius: sizes.borderRadius,
                paddingHorizontal: sizes.inputPaddingHorizontal,
                paddingTop: sizes.fieldBlockPaddingTop,
                width: sizes.fieldBlockWidth,
                height: sizes.fieldBlockHeight,
              },
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
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  color: theme.formInputTextColor,
                  textAlign: isRTL ? 'right' : 'left',
                  marginBottom: isWebLandscape
                    ? sizes.webLandscapeInputMarginBottom
                    : sizes.inputMarginBottom,
                },
                Platform.OS === 'web' && {
                  outlineStyle: 'none',
                },
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
                borderRadius: sizes.borderRadius,
                paddingHorizontal: sizes.inputPaddingHorizontal,
                paddingTop: sizes.fieldBlockPaddingTop,
                width: sizes.fieldBlockWidth,
                height: sizes.fieldBlockHeight,
              },
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
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  color: theme.formInputTextColor,
                  textAlign: isRTL ? 'right' : 'left',
                  marginBottom: isWebLandscape
                    ? sizes.webLandscapeInputMarginBottom
                    : sizes.inputMarginBottom,
                },
                Platform.OS === 'web' && {
                  outlineStyle: 'none',
                },
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
            <TouchableOpacity
              onPress={() => registerControl.leaveRegisterScreen()}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Text
                style={[
                  styles.link,
                  dynamicStyles.link,
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
              loading ? (
                <ActivityIndicator color={theme.primaryColor} />
              ) : (
                t('common.create')
              )
            }
            onPress={handleSubmit}
            disabled={
              loading ||
              !validateEmail(email) ||
              !validatePassword(password) ||
              !passwordsMatch()
            }
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%' },
  scroll: {
    paddingHorizontal: '6%',
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
    borderRadius: 8,
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
  linksRow: {
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'Rubik-Medium',
  },
  link: {},
});