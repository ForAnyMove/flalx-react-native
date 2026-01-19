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
import { useComponentContext } from '../../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { icons } from '../../constants/icons';

const OTP_LENGTH = 6;

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
        height: isLandscape && Platform.OS === 'web' ? scaleByHeight(62, height) : scaleByHeightMobile(62, height),
        width: isLandscape && Platform.OS === 'web' ? scaleByHeight(330, height) : '100%',
        marginTop: isLandscape && Platform.OS === 'web' ? scaleByHeight(38, height) : scaleByHeightMobile(12, height),
        borderRadius: isLandscape && Platform.OS === 'web' ? scaleByHeight(8, height) : scaleByHeightMobile(12, height),  
      },
      outlineBtnText: {
        fontSize: isLandscape && Platform.OS === 'web' ? scaleByHeight(20, height) : scaleByHeightMobile(20, height),
        lineHeight: isLandscape && Platform.OS === 'web' ? scaleByHeight(20, height) : scaleByHeightMobile(20, height),
      },
      webLandscapeButton: {
        width: scaleByHeight(330, height),
        height: scaleByHeight(62, height),
      },
    }),
    [height, isLandscape]
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

export default function Step3_PhoneVerify({ factorId, phone, onNext, onBack }) {
  const { t } = useTranslation();
  const { session, themeController, languageController } = useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [otp, setOtp] = useState(Array.from({ length: OTP_LENGTH }, () => ''));
  const inputsRef = useRef([]);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const [cooldown, setCooldown] = useState(60);
  const [resending, setResending] = useState(false);
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
  
  useEffect(() => {
    const timer = setTimeout(() => {
        inputsRef.current[0]?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const handleVerify = async () => {
    if (verifying) return;
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setOtpError('Please enter the complete 6-digit code.');
      return;
    }

    setVerifying(true);
    setOtpError(null);

    try {
      // The challengeId is created and used on the same step, so we get it here
      const challengeResult = await session.challengePhoneNumber(factorId);
      if (!challengeResult.success) {
        throw new Error(challengeResult.error);
      }
      const challengeId = challengeResult.challengeId;

      const verifyResult = await session.verifyPhoneNumber(factorId, challengeId, code);

      if (verifyResult.success) {
        onNext(); // Success, move to the finished screen
      } else {
        setOtpError(verifyResult.error || 'Invalid OTP. Please try again.');
        setOtp(Array.from({ length: OTP_LENGTH }, () => ''));
        inputsRef.current[0]?.focus();
      }
    } catch (e) {
      setOtpError(String(e.message || e));
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resending || cooldown > 0) return;

    setResending(true);
    setOtpError(null);
    try {
      const challengeResult = await session.challengePhoneNumber(factorId);
      if (challengeResult.success) {
        setCooldown(60); // Reset cooldown
      } else {
        setOtpError(challengeResult.error || 'Failed to resend code.');
      }
    } catch (e) {
      setOtpError(String(e.message || e));
    } finally {
      setResending(false);
    }
  };

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
      brandFontSize: isWebLandscape ? scaleByHeight(57, height) : scaleByHeightMobile(68, height),
      brandLetterSpacing: isWebLandscape ? scaleByHeight(5, height) : scaleByHeightMobile(5, height),
      brandMarginBottom: isWebLandscape ? scaleByHeight(35, height) : scaleByHeightMobile(22, height),
      titleFontSize: isWebLandscape ? scaleByHeight(18, height) : scaleByHeightMobile(18, height),
      subtitleFontSize: isWebLandscape ? scaleByHeight(18, height) : scaleByHeightMobile(18, height),
      subtitleMarginBottom: isWebLandscape ? scaleByHeight(25, height) : scaleByHeightMobile(28, height),
      otpRowMarginTop: isWebLandscape ? scaleByHeight(4, height) : scaleByHeightMobile(6, height),
      otpRowMarginBottom: isWebLandscape ? scaleByHeight(8, height) : scaleByHeightMobile(12, height),
      otpRowWidth: isWebLandscape ? scaleByHeight(314, height) : '90%',
      otpRowHeight: isWebLandscape ? scaleByHeight(74, height) : scaleByHeightMobile(74, height),
      otpCellHeight: isWebLandscape ? scaleByHeight(74, height) : scaleByHeightMobile(74, height),
      otpCellFontSize: isWebLandscape ? scaleByHeight(20, height) : scaleByHeightMobile(20, height),
      otpCellLineHeight: isWebLandscape ? scaleByHeight(18, height) : scaleByHeightMobile(18, height),
      otpCellBorderRadius: isWebLandscape ? scaleByHeight(8, height) : scaleByHeightMobile(8, height),
      linksRowMarginBottom: isWebLandscape ? scaleByHeight(8, height) : scaleByHeightMobile(12, height),
      linksRowMarginTop: isWebLandscape ? scaleByHeight(10, height) : scaleByHeightMobile(10, height),
      linksRowWidth: isWebLandscape ? scaleByHeight(314, height) : '90%',
      linkFontSize: isWebLandscape ? scaleByHeight(14, height) : scaleByHeightMobile(14, height),
      errorFontSize: isWebLandscape ? scaleByHeight(14, height) : scaleByHeightMobile(14, height),
      errorMarginTop: isWebLandscape ? scaleByHeight(8, height) : scaleByHeightMobile(8, height),
      keyboardVerticalOffset: isWebLandscape ? 0 : scaleByHeightMobile(10, height),
      containerPaddingVertical: isWebLandscape ? 0 : scaleByHeightMobile(80, height),
    }),
    [isWebLandscape, height]
  );

  const dynamicStyles = useMemo(() => {
    return {
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
      link: {
        fontSize: sizes.linkFontSize,
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
          { paddingVertical: sizes.containerPaddingVertical },
          isWebLandscape && { justifyContent: 'center', alignItems: 'center', flex: 1 },
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
          <Text style={[styles.brand, { fontSize: sizes.brandFontSize, letterSpacing: sizes.brandLetterSpacing, marginBottom: sizes.brandMarginBottom, color: theme.primaryColor }]}>
            {t('auth.app_name')}
          </Text>
          <Text style={[styles.title, { fontSize: sizes.titleFontSize, color: theme.unactiveTextColor, textAlign: 'center' }]}>
            {t('register.mfa_verify_title')}
          </Text>
          <Text style={[styles.subtitle, { fontSize: sizes.subtitleFontSize, marginBottom: sizes.subtitleMarginBottom, color: theme.unactiveTextColor, textAlign: 'center' }]}>
            {t('register.mfa_verify_subtitle', { phone })}
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
            <Text style={{ textAlign: 'center', color: theme.errorTextColor, marginTop: sizes.errorMarginTop, fontSize: sizes.errorFontSize }}>
              {otpError}
            </Text>
          )}
          <View style={[styles.linksRow, dynamicStyles.linksRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: sizes.linksRowMarginTop }]}>
            <TouchableOpacity onPress={onBack}>
              <Text style={[styles.link, dynamicStyles.link, { color: theme.formInputLabelColor, textDecorationLine: 'none' }]}>
                {t('register.back_to_phone')}
              </Text>
            </TouchableOpacity>
            {cooldown > 0 ? (
              <Text style={[styles.link, dynamicStyles.link, { color: theme.unactiveTextColor, textDecorationLine: 'none' }]}>
                {t('register.resend_in', { count: cooldown })}
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendCode} disabled={resending}>
                <Text style={[styles.link, dynamicStyles.link, { color: theme.primaryColor, textDecorationLine: 'underline' }]}>
                  {t('register.resend_code')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <PrimaryOutlineButton
            isLandscape={isLandscape}
            height={height}
            theme={theme}
            title={verifying ? <ActivityIndicator color={theme.primaryColor} /> : t('common.confirm')}
            onPress={handleVerify}
            disabled={verifying || otp.join('').length !== OTP_LENGTH}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  link: {},
});