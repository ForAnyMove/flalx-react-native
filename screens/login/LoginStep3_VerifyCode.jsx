import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { useWindowInfo } from '../../context/windowContext';
import CustomTextInput from '../../components/ui/CustomTextInput';

const OTP_LENGTH = 6;

function PrimaryOutlineButton({
  title,
  onPress,
  disabled,
  theme,
  isLandscape,
  height,
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

const LoginStep3_VerifyCode = ({ onNext, onBack, phone, isExistingUserWithMfa }) => {
  const { t } = useTranslation();
  const { themeController, session, languageController } = useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const inputsRef = useRef([]);
  const [cooldown, setCooldown] = useState(60);
  const [resending, setResending] = useState(false);
  const timerRef = useRef(null);

  const { width, height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const fadeAnim = useRef(new Animated.Value(1)).current;

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

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);
    setOtpError(null);

    if (text && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setOtpError(t('login.otp.invalid_code'));
      return;
    }

    setVerifying(true);
    setOtpError(null);

    let result;
    if (isExistingUserWithMfa) {
      result = await session.verifyMfaLogin(code);
    } else {
      result = await session.verifyMfaSetup(phone, code);
    }

    setVerifying(false);

    if (result.success) {
      onNext();
    } else {
      setOtpError(result.error || t('login.otp.verification_failed'));
      setOtp(Array(OTP_LENGTH).fill(''));
      inputsRef.current[0]?.focus();
    }
  };

  const handleResendCode = async () => {
    if (resending || cooldown > 0) return;

    setResending(true);
    setOtpError(null);
    try {
      let result;
      if (isExistingUserWithMfa) {
        result = await session.sendMfaLoginCode();
      } else {
        result = await session.setupMfa(phone);
      }

      if (result.success) {
        setCooldown(60); // Reset cooldown
      } else {
        setOtpError(result.error || 'Failed to resend code.');
      }
    } catch (e) {
      setOtpError(String(e.message || e));
    } finally {
      setResending(false);
    }
  };

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
            {t('login.otp.title')}
          </Text>
          <Text style={[styles.subtitle, { fontSize: sizes.subtitleFontSize, marginBottom: sizes.subtitleMarginBottom, color: theme.unactiveTextColor, textAlign: 'center' }]}>
            {t('login.otp.subtitle', { phone })}
          </Text>
          <View style={dynamicStyles.otpRow}>
            {otp.map((digit, idx) => (
              <CustomTextInput
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
                onChangeText={(text) => handleOtpChange(text, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
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
                {t('common.back')}
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
};

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

export default LoginStep3_VerifyCode;
