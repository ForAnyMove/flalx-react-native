import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';

const OTP_LENGTH = 6;

const LoginStep2_PhoneVerify = ({ onNext, onBack, phone, factorId, challengeId }) => {
  const { t } = useTranslation();
  const { themeController, session } = useComponentContext();
  const theme = themeController.current;

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState(null);
  const inputsRef = useRef([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const dynamicStyles = useMemo(() => {
    const h = height;
    const baseDimension = isWebLandscape ? scaleByHeight(1, h) : scaleByHeightMobile(1, h);

    return StyleSheet.create({
      container: {
        flex: 1,
        justifyContent: 'center',
        padding: baseDimension * 20,
        backgroundColor: theme.backgroundColor,
        width: '100%',
      },
      title: {
        fontSize: baseDimension * 22,
        fontFamily: 'Rubik-Bold',
        color: theme.textColor,
        textAlign: 'center',
        marginBottom: baseDimension * 10,
      },
      subtitle: {
        fontSize: baseDimension * 16,
        fontFamily: 'Rubik-Regular',
        color: theme.unactiveTextColor,
        textAlign: 'center',
        marginBottom: baseDimension * 30,
      },
      otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: baseDimension * 20,
      },
      otpInput: {
        width: baseDimension * 45,
        height: baseDimension * 55,
        borderWidth: 1.5,
        borderColor: theme.formInputColor,
        borderRadius: baseDimension * 8,
        textAlign: 'center',
        fontSize: baseDimension * 24,
        fontFamily: 'Rubik-Medium',
        color: theme.textColor,
        backgroundColor: theme.formInputBackground,
      },
      otpInputFocused: {
        borderColor: theme.primaryColor,
      },
      errorText: {
        color: theme.errorTextColor,
        textAlign: 'center',
        marginBottom: baseDimension * 20,
        fontFamily: 'Rubik-Regular',
        fontSize: baseDimension * 14,
      },
      button: {
        height: baseDimension * 56,
        borderRadius: baseDimension * 8,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        borderColor: theme.primaryColor,
        marginBottom: baseDimension * 15,
      },
      buttonText: {
        fontSize: baseDimension * 18,
        fontFamily: 'Rubik-Medium',
        color: theme.primaryColor,
      },
      backButtonText: {
        color: theme.unactiveTextColor,
        textAlign: 'center',
        fontFamily: 'Rubik-Medium',
        fontSize: baseDimension * 16,
      },
    });
  }, [theme, height, width]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

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

    const { success, error } = await session.verifyPhoneNumber(factorId, challengeId, code);

    setVerifying(false);

    if (success) {
      onNext();
    } else {
      setOtpError(error || t('login.otp.verification_failed'));
      triggerShake();
    }
  };

  return (
    <View style={dynamicStyles.container}>
      <Text style={dynamicStyles.title}>{t('login.otp.title')}</Text>
      <Text style={dynamicStyles.subtitle}>
        {t('login.otp.subtitle', { phone: phone })}
      </Text>

      <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
        <View style={dynamicStyles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputsRef.current[index] = ref)}
              style={dynamicStyles.otpInput}
              keyboardType="number-pad"
              maxLength={1}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              value={digit}
            />
          ))}
        </View>
      </Animated.View>

      {otpError && <Text style={dynamicStyles.errorText}>{otpError}</Text>}

      <TouchableOpacity
        style={dynamicStyles.button}
        onPress={handleVerify}
        disabled={verifying}
      >
        {verifying ? (
          <ActivityIndicator color={theme.primaryColor} />
        ) : (
          <Text style={dynamicStyles.buttonText}>{t('login.otp.verify_button')}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={onBack} disabled={verifying}>
        <Text style={dynamicStyles.backButtonText}>{t('common.back')}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginStep2_PhoneVerify;
