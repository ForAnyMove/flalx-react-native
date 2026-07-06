import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, Animated, TouchableOpacity, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';

import CustomPicker from '../../components/ui/CustomPicker';
import Step1_EmailPassword from './Step1_EmailPassword';
import Step2_PhoneEnroll from './Step2_PhoneEnroll';
import Step3_PhoneVerify from './Step3_PhoneVerify';
import { useWindowInfo } from '../../context/windowContext';
import { getAuthErrorMessage } from '../../src/auth/authErrors';

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

/**
 * Registration state machine (backend-driven).
 *
 * Default method is `phone`. The user can switch phone <-> email at the first
 * step. Once the backend returns an authenticated session, this screen exits
 * (registerControl.leaveRegisterScreen()) and App.js's top-level nextStep
 * routing takes over — including showing MfaSetupScreen if the backend
 * requires it. This screen doesn't need its own MFA-routing logic.
 *
 * Steps: phone_input | phone_otp | email_input | email_confirmation
 */
export default function MultiStepRegisterScreen({ initialMethod = null }) {
  const { t } = useTranslation();
  const { session, themeController, registerControl, languageController } = useComponentContext();
  const isRTL = languageController.isRTL;
  const theme = themeController.current;

  const { height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  // Default method is 'phone' per the standard registration flow, unless the
  // caller explicitly requested email (e.g. "Create new user" from the email
  // login screen should open email registration, not phone-default).
  const startMethod = initialMethod === 'email' ? 'email' : 'phone';
  const [method, setMethod] = useState(startMethod); // 'phone' | 'email'
  const [step, setStep] = useState(startMethod === 'email' ? 'email_input' : 'phone_input');
  const [phone, setPhone] = useState('');

  const tryGetReferralCode = useCallback(async () => {
    try {
      const url = await Linking.getInitialURL();
      if (url) {
        const match = url.match(/[?&]ref=([^&]+)/);
        if (match) return match[1];
      }
    } catch {
      // ignore
    }
    return null;
  }, []);

  // Once the backend returns an authenticated session, exit this screen —
  // App.js's top-level nextStep routing takes over from here (including
  // showing MfaSetupScreen/MfaVerifyScreen if the backend requires it).
  const routeAfterAuth = useCallback(() => {
    registerControl.leaveRegisterScreen();
  }, [registerControl]);

  const switchToEmail = useCallback(() => {
    setMethod('email');
    setStep('email_input');
  }, []);

  const switchToPhone = useCallback(() => {
    setMethod('phone');
    setStep('phone_input');
  }, []);

  // --- Phone registration ---

  const handlePhoneSubmit = useCallback(async (phoneValue) => {
    try {
      await session.startPhoneRegistration({ phone: phoneValue });
      setPhone(phoneValue);
      setStep('phone_otp');
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, [session]);

  const handlePhoneResend = useCallback(async () => {
    try {
      await session.startPhoneRegistration({ phone });
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, [session, phone]);

  const handlePhoneVerify = useCallback(async (code) => {
    try {
      const resp = await session.verifyPhoneRegistration({ phone, code });
      if (resp?.status === 'authenticated') {
        routeAfterAuth();
        return { success: true };
      }
      return { success: false, error: getAuthErrorMessage({ code: 'OTP_INVALID' }) };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, [session, phone, routeAfterAuth]);

  // --- Email registration ---

  const handleEmailSubmit = useCallback(async (email, password) => {
    try {
      const inviteCode = await tryGetReferralCode();
      const resp = await session.registerEmail({ email, password, inviteCode });
      if (resp?.status === 'email_confirmation_required') {
        setStep('email_confirmation');
        return { success: true };
      }
      if (resp?.status === 'authenticated') {
        routeAfterAuth();
        return { success: true };
      }
      return { success: false, error: getAuthErrorMessage({ code: resp?.status }) };
    } catch (e) {
      const isExists = String(e?.message || '').toLowerCase().includes('exist');
      return { success: false, error: getAuthErrorMessage(e), isUserExists: isExists };
    }
  }, [session, tryGetReferralCode, routeAfterAuth]);

  const sizes = useMemo(
    () => ({
      skipBtnTop: isWebLandscape ? scaleByHeight(103) : scaleByHeightMobile(10),
      titleFontSize: isWebLandscape ? scaleByHeight(18, height) : scaleByHeightMobile(18, height),
      subtitleFontSize: isWebLandscape ? scaleByHeight(18, height) : scaleByHeightMobile(18, height),
      finishTitleMarginBottom: isWebLandscape ? scaleByHeight(18, height) : scaleByHeightMobile(8, height),
    }),
    [isWebLandscape, height]
  );

  const renderStep = () => {
    switch (step) {
      case 'phone_input':
        return (
          <Step2_PhoneEnroll
            onSubmit={handlePhoneSubmit}
            onSwitchMethod={switchToEmail}
          />
        );
      case 'phone_otp':
        return (
          <Step3_PhoneVerify
            phone={phone}
            onVerify={handlePhoneVerify}
            onResend={handlePhoneResend}
            onBack={() => setStep('phone_input')}
          />
        );
      case 'email_input':
        return (
          <Step1_EmailPassword
            onSubmit={handleEmailSubmit}
            onSwitchMethod={switchToPhone}
          />
        );
      case 'email_confirmation':
        return (
          <Animated.View
            style={[
              styles.contentBlock,
              isWebLandscape ? { width: height * 0.5 } : { width: '100%' },
            ]}
          >
            <Text
              style={[
                styles.title,
                {
                  color: theme.unactiveTextColor,
                  textAlign: 'center',
                  fontSize: sizes.titleFontSize * 1.5,
                  marginBottom: sizes.finishTitleMarginBottom,
                },
              ]}
            >
              {t('auth.check_email_title')}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: theme.unactiveTextColor, textAlign: 'center', fontSize: sizes.subtitleFontSize },
              ]}
            >
              {t('auth.check_email_subtitle')}
            </Text>
            <PrimaryOutlineButton
              isLandscape={isLandscape}
              height={height}
              theme={theme}
              title={t('common.close')}
              onPress={() => registerControl.leaveRegisterScreen()}
            />
          </Animated.View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <View style={{ position: 'absolute', top: sizes.skipBtnTop, left: isRTL ? undefined : '5%', right: isRTL ? '5%' : undefined, zIndex: 100 }}>
        <CustomPicker
          options={[
            { label: t('settings.lang_en', 'English'), value: 'en' },
            { label: t('settings.lang_he', 'עברית'), value: 'he' },
          ]}
          selectedValue={languageController.current}
          onValueChange={(val) => languageController.setLang(val)}
          isRTL={isRTL}
          headerStyle={true}
          iconOnly={true}
        />
      </View>
      {renderStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  contentBlock: {
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: '6%',
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
});
