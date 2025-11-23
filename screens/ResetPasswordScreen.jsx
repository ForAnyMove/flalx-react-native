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
import { RFValue } from 'react-native-responsive-fontsize';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import { scaleByHeight } from '../utils/resizeFuncs';
import { icons } from '../constants/icons';

// Адаптив размеров (mobile => RFValue, web => уменьшенный фикс)
const getResponsiveSize = (mobileSize, webSize) => {
  if (Platform.OS === 'web') return webSize;
  return RFValue(mobileSize);
};

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
    };
  }, [height]);

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
              {
                color: theme.unactiveTextColor,
                textAlign: 'center',
              },
            ]}
          >
            {t('reset.title')}
          </Text>

          <Text
            style={[
              styles.subtitle,
              dynamicStyles.subtitle,
              {
                color: theme.unactiveTextColor,
                textAlign: 'center',
              },
            ]}
          >
            {t('reset.subtitle')}
          </Text>

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
              {t('reset.password')}
            </Text>

            <TextInput
              style={[
                styles.input,
                dynamicStyles.input,
                {
                  borderColor: theme.borderColor,
                  color: theme.formInputTextColor,
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  textAlign: isRTL ? 'right' : 'left',
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
                  fontSize: dynamicStyles.label.fontSize,
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

          {/* REPEAT PASSWORD FIELD */}
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
              {t('reset.repeat_password')}
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
                  fontSize: dynamicStyles.label.fontSize,
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
                fontSize: dynamicStyles.label.fontSize,
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
    borderRadius: RFValue(10),
    fontWeight: '500',
  },
  outlineBtn: {
    marginTop: RFValue(20),
    height: RFValue(48),
    borderWidth: 1.5,
    borderRadius: RFValue(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: {
    fontSize: RFValue(15),
    fontFamily: 'Rubik-Medium',
  },
});
