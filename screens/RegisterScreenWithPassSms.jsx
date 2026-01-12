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

export default function RegisterScreenWithPassSms() {
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

  const [step, setStep] = useState('register'); // 'register', 'otp'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');

  // ERRORS
  const [phoneError, setPhoneError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordRepeatError, setPasswordRepeatError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  // OTP State
  const [otp, setOtp] = useState(Array.from({ length: OTP_LENGTH }, () => ''));
  const inputsRef = useRef([]);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (cooldown > 0) {
      timerRef.current = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [cooldown]);

  const validatePhone = (value) => {
    if (!value) return false;
    // Basic validation for E.164 format starting with +
    return /^\+[1-9]\d{1,14}$/.test(value.trim());
  };

  const validatePassword = (pwd) => pwd && pwd.trim().length >= 6;
  const passwordsMatch = () =>
    password.trim() !== '' &&
    passwordRepeat.trim() !== '' &&
    password.trim() === passwordRepeat.trim();

  const phoneInputRef = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (step === 'register') {
        phoneInputRef.current?.focus();
      } else {
        inputsRef.current[0]?.focus();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [step]);

  async function handleRegisterSubmit() {
    setGeneralError(null);
    setPhoneError(null);
    setPasswordError(null);
    setPasswordRepeatError(null);

    let ok = true;

    if (!validatePhone(phone)) {
      setPhoneError('Please enter a valid phone number in E.164 format (e.g., +1234567890)');
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
      const res = await session.createUserWithPhone(phone.trim(), password);

      if (res.isUserExists) {
        setPhoneError('A user with this phone number already exists.');
        setLoading(false);
        return;
      }

      if (!res.success) {
        setGeneralError(res.error || 'An unexpected error occurred.');
        setLoading(false);
        return;
      }

      setStep('otp');
      setCooldown(60);
    } catch (e) {
      setGeneralError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (verifying) return;
    const token = otp.join('');
    if (token.length !== OTP_LENGTH) {
      setOtpError('Please enter the complete 6-digit code.');
      return;
    }

    setVerifying(true);
    setOtpError(null);

    try {
      const res = await session.verifyPhoneOtp(phone.trim(), token);
      if (res.success) {
        setFinished(true);
      } else {
        setOtpError(res.error || 'Invalid OTP. Please try again.');
        setOtp(Array.from({ length: OTP_LENGTH }, () => ''));
        inputsRef.current[0]?.focus();
      }
    } catch (e) {
      setOtpError(String(e.message || e));
    } finally {
      setVerifying(false);
    }
  }

  async function handleResendCode() {
    if (loading || cooldown > 0) return;

    setLoading(true);
    setOtpError(null);
    try {
      const res = await session.createUserWithPhone(phone.trim(), password); // This will re-send the OTP
      if (res.success) {
        setCooldown(60);
      } else {
        setOtpError(res.error || 'Failed to resend code.');
      }
    } catch (e) {
      setOtpError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  const onChangeOtpCell = (text, idx) => {
    const value = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp];
    next[idx] = value;
    setOtp(next);
    if (otpError) setOtpError(null);

    if (value && idx < OTP_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const onKeyPressOtp = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };

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
      otpRowMarginTop: isWebLandscape
        ? scaleByHeight(4, height)
        : scaleByHeightMobile(6, height),
      otpRowMarginBottom: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(12, height),
      otpRowWidth: isWebLandscape ? scaleByHeight(314, height) : '90%',
      otpRowHeight: isWebLandscape
        ? scaleByHeight(74, height)
        : scaleByHeightMobile(74, height),
      otpCellHeight: isWebLandscape
        ? scaleByHeight(74, height)
        : scaleByHeightMobile(74, height),
      otpCellFontSize: isWebLandscape
        ? scaleByHeight(20, height)
        : scaleByHeightMobile(20, height),
      otpCellLineHeight: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(18, height),
      otpCellBorderRadius: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(8, height),
      linksRowMarginBottom: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(12, height),
      linksRowWidth: isWebLandscape ? scaleByHeight(314, height) : '90%',
      linkIconWidth: isWebLandscape
        ? scaleByHeight(16, height)
        : scaleByHeightMobile(22, height),
      linkIconHeight: isWebLandscape
        ? scaleByHeight(16, height)
        : scaleByHeightMobile(22, height),
      linkFontSize: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(14, height),
      linkWithIconPaddingHorizontal: isWebLandscape
        ? scaleByHeight(3, height)
        : scaleByHeightMobile(3, height),
      errorFontSize: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(14, height),
      sentCodeTimerFontSize: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(14, height),
      modalCardPadding: isWebLandscape
        ? scaleByHeight(12, height)
        : scaleByHeightMobile(18, height),
      modalCardBorderRadius: isWebLandscape
        ? scaleByHeight(10, height)
        : scaleByHeightMobile(14, height),
      modalTextFontSize: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(18, height),
      modalTextMarginBottom: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(8, height),
      emailDescriptionFontSize: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(14, height),
      emailDescriptionLineHeight: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(18, height),
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
      finishTitleMarginBottom: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(8, height),
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
      otpRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: sizes.otpRowMarginTop,
        marginBottom: sizes.otpRowMarginBottom,
        width: sizes.otpRowWidth,
        height: sizes.otpRowHeight,
      },
      otpCell: {
        height: sizes.otpCellHeight,
        width: `${100 / OTP_LENGTH - 2}%`,
        fontSize: sizes.otpCellFontSize,
        lineHeight: sizes.otpCellLineHeight,
        borderRadius: sizes.otpCellBorderRadius,
        textAlign: 'center',
        borderWidth: 1,
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

  const renderRegisterStep = () => (
    <>
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
      {/* PHONE FIELD */}
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
          ]}
        >
          Phone Number
        </Text>
        <TextInput
          ref={phoneInputRef}
          style={[
            styles.input,
            dynamicStyles.input,
            {
              backgroundColor: 'transparent',
              borderColor: theme.borderColor,
              color: theme.formInputTextColor,
              textAlign: isRTL ? 'right' : 'left',
              borderWidth: 0,
            },
            Platform.OS === 'web' && { outlineStyle: 'none' },
          ]}
          placeholder='+1234567890'
          placeholderTextColor={theme.formInputPlaceholderColor}
          keyboardType='phone-pad'
          autoCapitalize='none'
          autoCorrect={false}
          value={phone}
          onChangeText={(txt) => {
            setPhone(txt);
            setPhoneError(null);
          }}
          returnKeyType='done'
        />
        {phoneError && (
          <Text style={{ color: theme.errorTextColor, marginTop: 4, fontSize: dynamicStyles.label.fontSize }}>
            {phoneError}
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
        <Text style={[styles.label, dynamicStyles.label, { color: theme.formInputLabelColor, textAlign: isRTL ? 'right' : 'left' }]}>
          {t('register.password')}
        </Text>
        <TextInput
          style={[
            styles.input,
            dynamicStyles.input,
            {
              backgroundColor: 'transparent',
              borderColor: theme.borderColor,
              color: theme.formInputTextColor,
              textAlign: isRTL ? 'right' : 'left',
              borderWidth: 0,
            },
            Platform.OS === 'web' && { outlineStyle: 'none' },
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
          <Text style={{ color: theme.errorTextColor, marginTop: 4, fontSize: dynamicStyles.label.fontSize }}>
            {passwordError}
          </Text>
        )}
        <TouchableOpacity
          onPress={() => setShowPassword((prev) => !prev)}
          style={{ position: 'absolute', right: sizes.eyeIconPosition, top: sizes.eyeIconTop, width: sizes.eyeIconSize, height: sizes.eyeIconSize, justifyContent: 'center', alignItems: 'center' }}
        >
          <Image
            source={showPassword ? icons.eyeOpen : icons.eyeClosed}
            style={{ width: sizes.eyeIconSize, height: sizes.eyeIconSize, tintColor: theme.formInputLabelColor }}
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
        <Text style={[styles.label, dynamicStyles.label, { color: theme.formInputLabelColor, textAlign: isRTL ? 'right' : 'left' }]}>
          {t('register.repeat_password')}
        </Text>
        <TextInput
          style={[
            styles.input,
            dynamicStyles.input,
            {
              backgroundColor: 'transparent',
              borderColor: theme.borderColor,
              color: theme.formInputTextColor,
              textAlign: isRTL ? 'right' : 'left',
              borderWidth: 0,
            },
            Platform.OS === 'web' && { outlineStyle: 'none' },
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
          <Text style={{ color: theme.errorTextColor, marginTop: 4, fontSize: dynamicStyles.label.fontSize }}>
            {passwordRepeatError}
          </Text>
        )}
      </View>

      {generalError && (
        <Text style={{ textAlign: 'center', color: theme.errorTextColor, marginTop: 8, fontSize: dynamicStyles.label.fontSize }}>
          {generalError}
        </Text>
      )}

      <View style={[styles.linksRow, dynamicStyles.linksRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <TouchableOpacity onPress={() => registerControl.leaveRegisterScreen()} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.link, dynamicStyles.link, { color: theme.formInputLabelColor, textDecorationLine: 'none' }]}>
            {t('auth.back_to_sign_in')}
          </Text>
        </TouchableOpacity>
      </View>

      <PrimaryOutlineButton
        isLandscape={isLandscape}
        height={height}
        theme={theme}
        title={loading ? <ActivityIndicator color={theme.primaryColor} /> : t('common.create')}
        onPress={handleRegisterSubmit}
        disabled={loading || !validatePhone(phone) || !validatePassword(password) || !passwordsMatch()}
      />
    </>
  );

  const renderOtpStep = () => (
    <>
      <Text style={[styles.title, dynamicStyles.title, { color: theme.unactiveTextColor, textAlign: 'center' }]}>
        Enter Confirmation Code
      </Text>
      <Text style={[styles.subtitle, dynamicStyles.subtitle, { color: theme.unactiveTextColor, textAlign: 'center' }]}>
        Enter the 6-digit code sent to {phone}
      </Text>
      <View style={dynamicStyles.otpRow}>
        {otp.map((digit, idx) => (
          <TextInput
            key={idx}
            ref={(ref) => (inputsRef.current[idx] = ref)}
            style={[
              dynamicStyles.otpCell,
              {
                borderColor: otpError ? theme.errorTextColor : theme.borderColor,
                color: theme.formInputTextColor,
                backgroundColor: theme.formInputBackground,
              },
            ]}
            keyboardType='number-pad'
            maxLength={1}
            value={digit}
            onChangeText={(text) => onChangeOtpCell(text, idx)}
            onKeyPress={(e) => onKeyPressOtp(e, idx)}
          />
        ))}
      </View>
      {otpError && (
        <Text style={{ textAlign: 'center', color: theme.errorTextColor, marginTop: 8, fontSize: dynamicStyles.label.fontSize }}>
          {otpError}
        </Text>
      )}
      <View style={[styles.linksRow, dynamicStyles.linksRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }]}>
        <TouchableOpacity onPress={() => setStep('register')}>
          <Text style={[styles.link, dynamicStyles.link, { color: theme.formInputLabelColor }]}>
            Back
          </Text>
        </TouchableOpacity>
        {cooldown > 0 ? (
          <Text style={[styles.link, dynamicStyles.link, { color: theme.unactiveTextColor }]}>
            Resend code in {cooldown}s
          </Text>
        ) : (
          <TouchableOpacity onPress={handleResendCode} disabled={loading}>
            <Text style={[styles.link, dynamicStyles.link, { color: theme.primaryColor }]}>
              Resend code
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <PrimaryOutlineButton
        isLandscape={isLandscape}
        height={height}
        theme={theme}
        title={verifying ? <ActivityIndicator color={theme.primaryColor} /> : 'Confirm'}
        onPress={handleVerifyOtp}
        disabled={verifying || otp.join('').length !== OTP_LENGTH}
      />
    </>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={[styles.root, { backgroundColor: theme.backgroundColor }]}
      keyboardVerticalOffset={sizes.keyboardVerticalOffset}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingVertical: sizes.containerPaddingVertical },
          isWebLandscape && { justifyContent: 'center', alignItems: 'center', flex: 1 },
        ]}
        keyboardShouldPersistTaps='handled'
      >
        {finished ? (
          <Animated.View
            style={[
              styles.contentBlock,
              isWebLandscape ? { width: height * 0.5 } : { width: '100%' },
              { opacity: fadeAnim },
            ]}
          >
            <Text style={[styles.title, dynamicStyles.title, { color: theme.unactiveTextColor, textAlign: 'center', fontSize: dynamicStyles.title.fontSize * 1.5, marginBottom: sizes.finishTitleMarginBottom, fontFamily: 'Rubik-SemiBold' }]}>
              Registration Successful!
            </Text>
            <Text style={[styles.subtitle, dynamicStyles.subtitle, { color: theme.unactiveTextColor, textAlign: 'center' }]}>
              You can now log in with your phone number and password.
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
              isWebLandscape ? { width: height * 0.5 } : { width: '100%' },
              { opacity: fadeAnim },
            ]}
          >
            <Text style={[styles.brand, dynamicStyles.brand, { color: theme.primaryColor }]}>
              {t('auth.app_name')}
            </Text>
            {step === 'register' ? renderRegisterStep() : renderOtpStep()}
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

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  },
  link: {
    textDecorationLine: 'underline',
  },
});
