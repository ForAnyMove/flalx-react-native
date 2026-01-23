import React, { useMemo, useRef, useState, useEffect } from 'react';
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
import { useComponentContext } from '../../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { icons } from '../../constants/icons';

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

export default function LoginStep1_EmailPassword({ onNext, onGoToRegister, onGoToForgottenPassword }) {
  const { t } = useTranslation();
  const {
    themeController,
    languageController,
    session,
  } = useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [sending, setSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  const dynamicStyles = useMemo(() => {
    const h = height;

    return {
      root: {
        flex: 1,
        backgroundColor: theme.backgroundColor,
        width: '100%',
      },
      keyboardAvoiding: {
        flex: 1,
      },
      scroll: {
        paddingHorizontal: '6%',
        paddingVertical: isWebLandscape ? scaleByHeight(24, h) : scaleByHeightMobile(80, h),
        flexGrow: 1,
        justifyContent: isWebLandscape ? 'center' : 'flex-start',
      },
      contentBlock: {
        alignSelf: 'center',
        alignItems: 'center',
        width: isWebLandscape ? h * 0.5 : '100%',
      },
      brand: {
        fontSize: isWebLandscape ? scaleByHeight(57, h) : scaleByHeightMobile(68, h),
        letterSpacing: isWebLandscape ? scaleByHeight(5, h) : scaleByHeightMobile(5, h),
        marginBottom: isWebLandscape ? scaleByHeight(35, h) : scaleByHeightMobile(22, h),
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
        fontSize: isWebLandscape ? scaleByHeight(18, h) : scaleByHeightMobile(16, h),
        marginBottom: isWebLandscape ? scaleByHeight(25, h) : scaleByHeightMobile(28, h),
        color: theme.unactiveTextColor,
        textAlign: 'center',
        fontFamily: 'Rubik-SemiBold',
      },
      fieldContainer: {
        backgroundColor: theme.formInputBackground,
        borderRadius: isWebLandscape ? scaleByHeight(8, h) : scaleByHeightMobile(8, h),
        paddingHorizontal: isWebLandscape ? scaleByHeight(16, h) : scaleByHeightMobile(16, h),
        paddingTop: isWebLandscape ? scaleByHeight(14, h) : scaleByHeightMobile(14, h),
        marginBottom: isWebLandscape ? scaleByHeight(14, h) : scaleByHeightMobile(16, h),
        width: isWebLandscape ? scaleByHeight(330, h) : '100%',
        height: isWebLandscape ? scaleByHeight(76, h) : scaleByHeightMobile(75, h),
      },
      label: {
        fontSize: isWebLandscape ? scaleByHeight(14, h) : scaleByHeightMobile(14, h),
        marginBottom: isWebLandscape ? scaleByHeight(4, h) : scaleByHeightMobile(6, h),
        color: theme.formInputLabelColor,
        textAlign: isRTL ? 'right' : 'left',
        fontFamily: 'Rubik-Medium',
      },
      input: {
        fontSize: isWebLandscape ? scaleByHeight(18, h) : scaleByHeightMobile(18, h),
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
        right: isWebLandscape ? scaleByHeight(14, h) : scaleByHeightMobile(14, h),
        top: isWebLandscape ? scaleByHeight(35, h) : scaleByHeightMobile(35, h),
        width: isWebLandscape ? scaleByHeight(24, h) : scaleByHeightMobile(24, h),
        height: isWebLandscape ? scaleByHeight(24, h) : scaleByHeightMobile(24, h),
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
        marginBottom: isWebLandscape ? scaleByHeight(8, h) : scaleByHeightMobile(30, h),
        width: isWebLandscape ? scaleByHeight(330, h) : '100%',
      },
      link: {
        fontSize: isWebLandscape ? scaleByHeight(14, h) : scaleByHeightMobile(14, h),
        color: theme.formInputLabelColor,
        fontFamily: 'Rubik-Medium',
      },
      error: {
        fontSize: isWebLandscape ? scaleByHeight(14, h) : scaleByHeightMobile(14, h),
        color: theme.errorTextColor,
        marginTop: isWebLandscape ? scaleByHeight(4, h) : scaleByHeightMobile(4, h),
        textAlign: 'center',
      },
      primaryButton: {
        width: isWebLandscape ? scaleByHeight(330, h) : '100%',
        height: isWebLandscape ? scaleByHeight(62, h) : scaleByHeightMobile(62, h),
        marginTop: isWebLandscape ? scaleByHeight(38, h) : scaleByHeightMobile(10, h),
        borderRadius: isWebLandscape ? scaleByHeight(8, h) : scaleByHeightMobile(8, h),
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        borderColor: theme.primaryColor,
      },
      primaryButtonText: {
        fontSize: isWebLandscape ? scaleByHeight(20, h) : scaleByHeightMobile(20, h),
        lineHeight: isWebLandscape ? scaleByHeight(20, h) : scaleByHeightMobile(20, h),
        fontFamily: 'Rubik-Medium',
        color: theme.primaryColor,
      },
    };
  }, [width, height, isWebLandscape, isRTL, theme]);

  const emailInputRef = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => {
        emailInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const isValidEmail = useMemo(() => {
    const re =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
    return re.test(email.trim());
  }, [email]);

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
    setEmailError(null);

    const { success, error, mfaRequired, phone, factorId, challengeId } = await session.signInWithPassword(
      email,
      password
    );

    if (mfaRequired) {
        onNext({phone, factorId, challengeId});
    } else if (!success) {
      setEmailError(error || t('auth.login_error'));
    }

    setSending(false);
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
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError(null);
              }}
              returnKeyType='next'
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
              onChangeText={(text) => {
                setPassword(text);
                if (emailError) setEmailError(null);
              }}
              returnKeyType='done'
              onSubmitEditing={onPasswordSignIn}
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
            <TouchableOpacity onPress={onGoToForgottenPassword}>
              <Text style={dynamicStyles.link}>
                {t('auth.forgot_password')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onGoToRegister}>
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
