import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
  Animated,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { icons } from '../constants/icons';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { session, themeController, languageController } =
    useComponentContext();

  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [repeatPasswordError, setRepeatPasswordError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [generalError, setGeneralError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const validatePassword = (pwd) => pwd && pwd.trim().length >= 6;
  const passwordsMatch = () =>
    password.trim() !== '' &&
    repeatPassword.trim() !== '' &&
    password.trim() === repeatPassword.trim();

  async function handleSubmit() {
    setGeneralError(null);
    setPasswordError(null);
    setRepeatPasswordError(null);

    let ok = true;

    if (!validatePassword(password)) {
      setPasswordError(t('reset.password_invalid'));
      ok = false;
    }
    if (!passwordsMatch()) {
      setRepeatPasswordError(t('reset.password_mismatch'));
      ok = false;
    }
    if (!ok) return;

    try {
      setLoading(true);

      const res = await session.setNewPassword(password);
      if (!res.success) {
        setGeneralError(res.error);
        setLoading(false);
        return;
      }

      // Успешно — isInPasswordReset станет false → экран закроется
    } catch (e) {
      setGeneralError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      // from dynamicStyles
      brandFontSize: isWebLandscape ? web(57) : mobile(45),
      brandLetterSpacing: isWebLandscape ? web(5) : mobile(3),
      brandMarginBottom: isWebLandscape ? web(35) : mobile(18),
      titleFontSize: isWebLandscape ? web(18) : mobile(18),
      subtitleFontSize: isWebLandscape ? web(18) : mobile(13),
      subtitleMarginBottom: isWebLandscape ? web(25) : mobile(18),
      fieldBlockMarginBottom: isWebLandscape ? web(14) : mobile(16),
      labelFontSize: isWebLandscape ? web(14) : mobile(12),
      labelMarginBottom: isWebLandscape ? web(4) : mobile(6),
      inputPaddingHorizontal: isWebLandscape ? web(14) : mobile(12),
      inputFontSize: isWebLandscape ? web(18) : mobile(14),
      inputMarginBottom: isWebLandscape ? web(2) : mobile(8),
      outlineBtnTextFontSize: isWebLandscape ? web(20) : mobile(15),
      outlineBtnTextLineHeight: isWebLandscape ? web(20) : mobile(16),
      outlineBtnBorderRadius: isWebLandscape ? web(8) : mobile(7),

      // from old sizes
      multilineInputMarginBottom: isWebLandscape ? web(10) : mobile(25),
      finishTitleMarginBottom: isWebLandscape ? web(18) : mobile(8),

      // from getResponsiveSize
      keyboardVerticalOffset: isWebLandscape ? 0 : mobile(10),
      fieldBlockBorderRadius: isWebLandscape ? web(8) : mobile(12),
      fieldBlockPaddingHorizontal: isWebLandscape ? 0 : mobile(12),
      fieldBlockPaddingTop: isWebLandscape ? web(8) : mobile(10),
      fieldBlockWidth: isWebLandscape ? web(330) : undefined,
      fieldBlockHeight: isWebLandscape ? web(76) : undefined,
      labelPaddingLeft: isWebLandscape ? web(14) : mobile(12),
      labelPaddingRight: isWebLandscape ? web(14) : mobile(12),
      labelWebMarginBottom: isWebLandscape ? web(7) : mobile(4),
      inputWebMarginBottom: isWebLandscape ? web(3) : mobile(4),
      eyeIconRight: isWebLandscape ? web(14) : mobile(12),
      eyeIconTop: isWebLandscape ? web(26) : mobile(38),
      eyeIconWidth: isWebLandscape ? web(24) : mobile(22),
      eyeIconHeight: isWebLandscape ? web(24) : mobile(22),

      // from PrimaryOutlineButton
      outlineBtnHeight: isWebLandscape ? web(40) : mobile(48),
      outlineBtnMarginTop: isWebLandscape ? web(38) : mobile(12),
      outlineBtnBorderRadius2: isWebLandscape ? web(8) : mobile(12),
      outlineBtnTextFontSize2: isWebLandscape ? web(20) : mobile(15),
      outlineBtnTextLineHeight2: isWebLandscape ? web(20) : mobile(17),
      webLandscapeButtonWidth: isWebLandscape ? web(330) : undefined,
      webLandscapeButtonHeight: isWebLandscape ? web(62) : undefined,
    };
  }, [isWebLandscape, height]);

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
        <Animated.View
          style={[
            styles.contentBlock,
            isWebLandscape ? { width: height * 0.5 } : { width: '100%' },
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
            {t('reset.title')}
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
            {t('reset.subtitle')}
          </Text>

          {/* PASSWORD FIELD */}
          <View
            style={[
              styles.fieldBlock,
              {
                backgroundColor: theme.formInputBackground,
                position: 'relative',
                marginBottom: sizes.fieldBlockMarginBottom,
              },
              isWebLandscape
                ? {
                    borderRadius: sizes.fieldBlockBorderRadius,
                    paddingHorizontal: sizes.fieldBlockPaddingHorizontal,
                    paddingTop: sizes.fieldBlockPaddingTop,
                    width: sizes.fieldBlockWidth,
                    height: sizes.fieldBlockHeight,
                  }
                : null,
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: theme.formInputLabelColor,
                  textAlign: isRTL ? 'right' : 'left',
                  fontSize: sizes.labelFontSize,
                  marginBottom: sizes.labelMarginBottom,
                },
                isWebLandscape
                  ? {
                      paddingLeft: isRTL ? 0 : sizes.labelPaddingLeft,
                      paddingRight: isRTL ? sizes.labelPaddingRight : 0,
                      marginBottom: sizes.labelWebMarginBottom,
                    }
                  : null,
              ]}
            >
              {t('reset.password')}
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.borderColor,
                  color: theme.formInputTextColor,
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  textAlign: isRTL ? 'right' : 'left',
                  paddingHorizontal: sizes.inputPaddingHorizontal,
                  fontSize: sizes.inputFontSize,
                  marginBottom: sizes.inputWebMarginBottom,
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
            />

            {passwordError && (
              <Text
                style={{
                  color: theme.errorTextColor,
                  marginTop: sizes.multilineInputMarginBottom,
                  fontSize: sizes.labelFontSize,
                }}
              >
                {passwordError}
              </Text>
            )}

            {/* EYE ICON */}
            <TouchableOpacity
              onPress={() => setShowPassword((p) => !p)}
              style={{
                position: 'absolute',
                right: isRTL ? undefined : sizes.eyeIconRight,
                left: isRTL ? sizes.eyeIconRight : undefined,
                top: sizes.eyeIconTop,
                width: sizes.eyeIconWidth,
                height: sizes.eyeIconHeight,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Image
                source={showPassword ? icons.eyeOpen : icons.eyeClosed}
                style={{
                  width: sizes.eyeIconWidth,
                  height: sizes.eyeIconHeight,
                  tintColor: theme.formInputLabelColor,
                }}
                resizeMode='contain'
              />
            </TouchableOpacity>
          </View>

          {/* REPEAT PASSWORD FIELD */}
          <View
            style={[
              styles.fieldBlock,
              {
                backgroundColor: theme.formInputBackground,
                position: 'relative',
                marginBottom: sizes.fieldBlockMarginBottom,
              },
              isWebLandscape
                ? {
                    borderRadius: sizes.fieldBlockBorderRadius,
                    paddingHorizontal: sizes.fieldBlockPaddingHorizontal,
                    paddingTop: sizes.fieldBlockPaddingTop,
                    width: sizes.fieldBlockWidth,
                    height: sizes.fieldBlockHeight,
                  }
                : null,
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: theme.formInputLabelColor,
                  textAlign: isRTL ? 'right' : 'left',
                  fontSize: sizes.labelFontSize,
                  marginBottom: sizes.labelMarginBottom,
                },
                isWebLandscape
                  ? {
                      paddingLeft: isRTL ? 0 : sizes.labelPaddingLeft,
                      paddingRight: isRTL ? sizes.labelPaddingRight : 0,
                      marginBottom: sizes.labelWebMarginBottom,
                    }
                  : null,
              ]}
            >
              {t('reset.repeat_password')}
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.defaultBlocksBackground,
                  borderColor: theme.borderColor,
                  color: theme.formInputTextColor,
                  textAlign: isRTL ? 'right' : 'left',
                  // прозрачный инпут внутри окрашенного fieldBlock
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  paddingHorizontal: sizes.inputPaddingHorizontal,
                  fontSize: sizes.inputFontSize,
                  marginBottom: sizes.inputWebMarginBottom,
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
              value={repeatPassword}
              onChangeText={(txt) => {
                setRepeatPassword(txt);
                setRepeatPasswordError(null);
              }}
              returnKeyType='done'
            />

            {repeatPasswordError && (
              <Text
                style={{
                  color: theme.errorTextColor,
                  marginTop: sizes.multilineInputMarginBottom,
                  fontSize: sizes.labelFontSize,
                }}
              >
                {repeatPasswordError}
              </Text>
            )}
          </View>

          {/* GENERAL ERROR */}
          {generalError && (
            <Text
              style={{
                textAlign: 'center',
                color: theme.errorTextColor,
                marginTop: sizes.multilineInputMarginBottom,
                fontSize: sizes.labelFontSize,
              }}
            >
              {generalError}
            </Text>
          )}

          {/* SUBMIT */}
          <PrimaryOutlineButton
            isLandscape={isLandscape}
            height={height}
            theme={theme}
            sizes={sizes}
            title={
              loading ? (
                <ActivityIndicator color={theme.primaryColor} />
              ) : (
                t('reset.submit')
              )
            }
            onPress={handleSubmit}
            disabled={
              loading || !validatePassword(password) || !passwordsMatch()
            }
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
  theme,
  isLandscape,
  height,
  sizes,
  containerStyle = {},
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
          height: sizes.outlineBtnHeight,
          marginTop: sizes.outlineBtnMarginTop,
          borderRadius: sizes.outlineBtnBorderRadius2,
        },
        isLandscape &&
          Platform.OS === 'web' && {
            width: sizes.webLandscapeButtonWidth,
            height: sizes.webLandscapeButtonHeight,
          },
        containerStyle,
      ]}
    >
      {typeof title === 'string' ? (
        <Text
          style={[
            styles.outlineBtnText,
            {
              color: theme.primaryColor,
              fontSize: sizes.outlineBtnTextFontSize2,
              lineHeight: sizes.outlineBtnTextLineHeight2,
            },
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
    paddingVertical: 24,
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
    borderRadius: 10,
    fontWeight: '500',
  },
  outlineBtn: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontFamily: 'Rubik-Medium',
  },
});
