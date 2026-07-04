import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import CustomPicker from '../../components/ui/CustomPicker';

import LoginStep1_EmailPassword from './LoginStep1_EmailPassword';
import Step2_PhoneEnroll from '../register/Step2_PhoneEnroll';
import Step3_PhoneVerify from '../register/Step3_PhoneVerify';
import { useWindowInfo } from '../../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { getAuthErrorMessage } from '../../src/auth/authErrors';

/**
 * Login state machine (backend-driven).
 *
 * Default method is `phone`, switchable to email. On `mfa_required` the backend
 * returns the available factors; the user picks one (auto-selected if single),
 * we challenge it, then verify the code -> session upgraded to aal2.
 *
 * Steps: phone_input | phone_otp | email_input | mfa_select | mfa_verify
 */
export default function MultiStepLoginScreen({ onGoToRegister, onGoToForgottenPassword }) {
  const { t } = useTranslation();
  const { session, themeController, languageController } = useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const { height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [method, setMethod] = useState('phone'); // 'phone' | 'email'
  const [step, setStep] = useState('phone_input');
  const [phone, setPhone] = useState('');
  const [emailError, setEmailError] = useState(null);

  // MFA (login) state
  const [factors, setFactors] = useState([]);
  const [factor, setFactor] = useState(null);
  const [challengeId, setChallengeId] = useState(null);

  const sizes = useMemo(() => ({
    skipBtnTop: isWebLandscape ? scaleByHeight(103) : scaleByHeightMobile(10),
  }), [isWebLandscape]);

  // Begin the MFA step once the backend requires it after the first factor.
  const beginMfa = useCallback(async (mfa) => {
    const available = mfa?.availableFactors || [];
    setFactors(available);
    if (available.length === 1) {
      // Single factor -> challenge immediately.
      const f = available[0];
      try {
        const ch = await session.challengeMfa({ factorId: f.id });
        setFactor(f);
        setChallengeId(ch.challengeId);
        setStep('mfa_verify');
      } catch (e) {
        setEmailError(getAuthErrorMessage(e));
        setStep(method === 'phone' ? 'phone_input' : 'email_input');
      }
    } else {
      setStep('mfa_select');
    }
  }, [session, method]);

  const routeAfterAuth = useCallback(async (resp) => {
    if (resp?.status === 'mfa_required') {
      await beginMfa(resp.mfa);
      return { success: true };
    }
    // authenticated -> App.js re-renders to the app automatically.
    return { success: true };
  }, [beginMfa]);

  // --- Email login ---
  const handleEmailSubmit = useCallback(async (email, password) => {
    try {
      const resp = await session.loginEmail({ email, password });
      console.log(resp);

      return routeAfterAuth(resp);
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, [session, routeAfterAuth]);

  // --- Phone login ---
  const handlePhoneSubmit = useCallback(async (phoneValue) => {
    try {
      await session.startPhoneLogin({ phone: phoneValue });
      setPhone(phoneValue);
      setStep('phone_otp');
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, [session]);

  const handlePhoneResend = useCallback(async () => {
    try {
      await session.startPhoneLogin({ phone });
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, [session, phone]);

  const handlePhoneVerify = useCallback(async (code) => {
    try {
      const resp = await session.verifyPhoneLogin({ phone, code });
      return routeAfterAuth(resp);
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, [session, phone, routeAfterAuth]);

  // --- MFA verify ---
  const selectFactor = useCallback(async (f) => {
    setEmailError(null);
    try {
      const ch = await session.challengeMfa({ factorId: f.id });
      setFactor(f);
      setChallengeId(ch.challengeId);
      setStep('mfa_verify');
    } catch (e) {
      setEmailError(getAuthErrorMessage(e));
    }
  }, [session]);

  const handleMfaVerify = useCallback(async (code) => {
    try {
      await session.verifyMfa({ factorId: factor.id, challengeId, code });
      // Authenticated at aal2 -> App.js routes to the app.
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, [session, factor, challengeId]);

  const handleMfaResend = useCallback(async () => {
    // Re-issue the challenge (meaningful for phone factors).
    try {
      const ch = await session.challengeMfa({ factorId: factor.id });
      setChallengeId(ch.challengeId);
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, [session, factor]);

  const switchToEmail = useCallback(() => {
    setMethod('email');
    setStep('email_input');
    setEmailError(null);
  }, []);

  const switchToPhone = useCallback(() => {
    setMethod('phone');
    setStep('phone_input');
    setEmailError(null);
  }, []);

  const renderStep = () => {
    switch (step) {
      case 'phone_input':
        return (
          <Step2_PhoneEnroll
            onSubmit={handlePhoneSubmit}
            onSwitchMethod={switchToEmail}
            title={t('auth.email_title')}
            subtitle={t('auth.sms_description')}
            switchLabel={t('auth.login_with_email')}
            error={emailError}
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
          <LoginStep1_EmailPassword
            onSubmit={handleEmailSubmit}
            onSwitchMethod={switchToPhone}
            onGoToRegister={() => onGoToRegister?.('email')}
            onGoToForgottenPassword={onGoToForgottenPassword}
            apiError={emailError}
          />
        );
      case 'mfa_select':
        return (
          <View style={styles.centerBlock}>
            <Text style={[styles.title, { color: theme.unactiveTextColor }]}>
              {t('auth.select_factor')}
            </Text>
            {factors.map((f) => (
              <TouchableOpacity
                key={f.id}
                onPress={() => selectFactor(f)}
                style={[styles.factorBtn, { borderColor: theme.primaryColor }]}
              >
                <Text style={{ color: theme.primaryColor, fontFamily: 'Rubik-Medium' }}>
                  {f.type === 'phone' ? (f.phone || t('auth.phone_label')) : f.type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
            {!!emailError && (
              <Text style={{ color: theme.errorTextColor, textAlign: 'center' }}>
                {emailError}
              </Text>
            )}
          </View>
        );
      case 'mfa_verify':
        return (
          <Step3_PhoneVerify
            phone={factor?.phone || ''}
            onVerify={handleMfaVerify}
            onResend={handleMfaResend}
            onBack={() => {
              setEmailError(null);
              setStep(factors.length > 1 ? 'mfa_select' : (method === 'phone' ? 'phone_input' : 'email_input'));
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
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
  centerBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: '6%',
    gap: 12,
  },
  title: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  factorBtn: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    minWidth: 220,
  },
});
