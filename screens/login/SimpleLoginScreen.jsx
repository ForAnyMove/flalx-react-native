import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { icons } from '../../constants/icons';
import { useWindowInfo } from '../../context/windowContext';
import CustomTextInput from '../../components/ui/CustomTextInput';
import CustomPicker from '../../components/ui/CustomPicker';
import Step3_PhoneVerify from '../register/Step3_PhoneVerify';
import { getAuthErrorMessage } from '../../src/auth/authErrors';
import { toE164 } from '../../src/auth/phoneFormat';

function PrimaryOutlineButton({ title, onPress, disabled, buttonStyle, textStyle }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[buttonStyle, { opacity: disabled ? 0.6 : 1 }]}>
      {typeof title === 'string' ? <Text style={textStyle}>{title}</Text> : title}
    </TouchableOpacity>
  );
}

/**
 * Simplified login (new flow): a single phoneOrEmail + password form, no
 * login-time OTP step. If the backend still requires MFA post-login, this
 * reuses the same inline select -> challenge -> verify pattern as
 * MultiStepLoginScreen.jsx (same session.challengeMfa/verifyMfa calls). If
 * login instead reports an unconfirmed phone (nextStep/status
 * 'phone_verification_required', carrying a `phone` field), this reuses the
 * exact same verify/resend endpoints as the registration OTP step
 * (session.verifyRegistrationPhone / resendRegistrationPhoneOtp) — the
 * backend treats it as the same unfinished phone confirmation either way.
 *
 * Steps: form | mfa_select | mfa_verify | phone_verify
 */
export default function SimpleLoginScreen({ onGoToRegister, onGoToForgottenPassword }) {
  const { t } = useTranslation();
  const { session, themeController, languageController } = useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const { width, height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [step, setStep] = useState('form');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // MFA (login) state — same shape as MultiStepLoginScreen.jsx.
  const [factors, setFactors] = useState([]);
  const [factor, setFactor] = useState(null);
  const [challengeId, setChallengeId] = useState(null);

  // Unconfirmed-phone (login) state — nextStep/status 'phone_verification_required'.
  const [verifyPhone, setVerifyPhone] = useState(null);
  const [otpCooldown, setOtpCooldown] = useState(undefined);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const loginInputRef = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => loginInputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const sizes = useMemo(() => ({
    skipBtnTop: isWebLandscape ? scaleByHeight(103) : scaleByHeightMobile(10),
  }), [isWebLandscape]);

  const dynamicStyles = useMemo(() => {
    const h = height;
    return {
      root: { flex: 1, backgroundColor: theme.backgroundColor, width: '100%' },
      scroll: {
        paddingHorizontal: '6%',
        paddingVertical: isWebLandscape ? scaleByHeight(24, h) : scaleByHeightMobile(80, h),
        flexGrow: 1,
        justifyContent: isWebLandscape ? 'center' : 'flex-start',
      },
      contentBlock: { alignSelf: 'center', alignItems: 'center', width: isWebLandscape ? h * 0.5 : '100%' },
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
        ...Platform.select({ web: { outlineStyle: 'none' } }),
      },
      eyeIconContainer: {
        position: 'absolute',
        right: isRTL ? undefined : (isWebLandscape ? scaleByHeight(14, h) : scaleByHeightMobile(14, h)),
        left: isRTL ? (isWebLandscape ? scaleByHeight(14, h) : scaleByHeightMobile(14, h)) : undefined,
        top: isWebLandscape ? scaleByHeight(35, h) : scaleByHeightMobile(35, h),
        width: isWebLandscape ? scaleByHeight(24, h) : scaleByHeightMobile(24, h),
        height: isWebLandscape ? scaleByHeight(24, h) : scaleByHeightMobile(24, h),
        justifyContent: 'center',
        alignItems: 'center',
      },
      eyeIcon: { width: '100%', height: '100%', tintColor: theme.formInputLabelColor },
      linksRow: {
        flexDirection: isRTL ? 'row-reverse' : 'row',
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

  // Begin the MFA step once the backend requires it after login.
  const beginMfa = useCallback(async (mfa) => {
    const available = mfa?.availableFactors || [];
    setFactors(available);
    if (available.length === 1) {
      const f = available[0];
      try {
        const ch = await session.challengeMfa({ factorId: f.id });
        setFactor(f);
        setChallengeId(ch.challengeId);
        setStep('mfa_verify');
      } catch (e) {
        setError(getAuthErrorMessage(e));
        setStep('form');
      }
    } else {
      setStep('mfa_select');
    }
  }, [session]);

  const onSubmit = async () => {
    if (!login.trim()) {
      setError(t('auth.invalid_email'));
      return;
    }
    if (!password) {
      setError(t('auth.invalid_password'));
      return;
    }
    setSending(true);
    setError(null);
    try {
      const resp = await session.loginUnified({ login: login.trim(), password });
      if (resp?.status === 'mfa_required') {
        await beginMfa(resp.mfa);
      } else if (resp?.nextStep === 'phone_verification_required') {
        // resp.phone comes straight from Supabase, which returns it without
        // a leading '+' — normalize to E.164 before it's ever sent back to
        // verify/resend, or the backend rejects it ("Phone must be in E.164
        // format").
        setVerifyPhone(toE164(resp.phone || login.trim()));
        setStep('phone_verify');
      }
      // authenticated -> App.js re-renders to the app automatically.
    } catch (e) {
      setError(getAuthErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  // On entering the phone_verify step, auto-check with manual:false — same
  // pattern as SimpleRegisterScreen's phone_otp step (see there for why:
  // this won't re-send if the code from login's own initial send is still
  // active, and either way returns expiresInSeconds for the countdown).
  useEffect(() => {
    if (step !== 'phone_verify' || !verifyPhone) return;
    let cancelled = false;
    (async () => {
      const res = await session.resendRegistrationPhoneOtp(verifyPhone, false);
      if (cancelled) return;
      if (res.success && typeof res.expiresInSeconds === 'number') {
        setOtpCooldown(res.expiresInSeconds);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, verifyPhone, session]);

  const handlePhoneVerifyResend = useCallback(async () => {
    return session.resendRegistrationPhoneOtp(verifyPhone, true);
  }, [session, verifyPhone]);

  const handlePhoneVerifyCode = useCallback(async (code) => {
    try {
      const resp = await session.verifyRegistrationPhone({ phone: verifyPhone, code });
      if (resp?.nextStep && resp.nextStep !== 'login_required') {
        // App.js stops rendering this screen automatically once nextStep
        // moves off 'login_required' — no manual dismissal needed here.
        return { success: true };
      }
      return { success: false, error: getAuthErrorMessage({ code: 'OTP_INVALID' }) };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, [session, verifyPhone]);

  const selectFactor = useCallback(async (f) => {
    setError(null);
    try {
      const ch = await session.challengeMfa({ factorId: f.id });
      setFactor(f);
      setChallengeId(ch.challengeId);
      setStep('mfa_verify');
    } catch (e) {
      setError(getAuthErrorMessage(e));
    }
  }, [session]);

  const handleMfaVerify = useCallback(async (code) => {
    try {
      await session.verifyMfa({ factorId: factor.id, challengeId, code });
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, [session, factor, challengeId]);

  const handleMfaResend = useCallback(async () => {
    try {
      const ch = await session.challengeMfa({ factorId: factor.id });
      setChallengeId(ch.challengeId);
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, [session, factor]);

  const renderStep = () => {
    if (step === 'mfa_select') {
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
          {!!error && (
            <Text style={{ color: theme.errorTextColor, textAlign: 'center' }}>
              {error}
            </Text>
          )}
        </View>
      );
    }

    if (step === 'phone_verify') {
      return (
        <Step3_PhoneVerify
          phone={verifyPhone || ''}
          onVerify={handlePhoneVerifyCode}
          onResend={handlePhoneVerifyResend}
          onBack={() => {
            setError(null);
            setStep('form');
          }}
          backLabel={t('auth.back_to_sign_in')}
          initialCooldown={otpCooldown}
        />
      );
    }

    if (step === 'mfa_verify') {
      const isTotp = factor?.type === 'totp';
      const goingToSelect = factors.length > 1;
      return (
        <Step3_PhoneVerify
          phone={factor?.phone || ''}
          onVerify={handleMfaVerify}
          onResend={handleMfaResend}
          onBack={() => {
            setError(null);
            setStep(goingToSelect ? 'mfa_select' : 'form');
          }}
          backLabel={goingToSelect ? t('common.back') : t('auth.back_to_sign_in')}
          title={isTotp ? t('auth.mfa_verify_title') : undefined}
          subtitle={isTotp ? t('auth.mfa_verify_subtitle') : undefined}
          showResend={!isTotp}
        />
      );
    }

    return (
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={dynamicStyles.root}
        keyboardVerticalOffset={Platform.select({ ios: scaleByHeightMobile(10, height), android: 0 })}
      >
        <ScrollView contentContainerStyle={dynamicStyles.scroll} keyboardShouldPersistTaps='handled'>
          <Animated.View style={[dynamicStyles.contentBlock, { opacity: fadeAnim }]}>
            <Text style={dynamicStyles.brand}>{t('auth.app_name')}</Text>
            <Text style={dynamicStyles.title}>{t('auth.email_title')}</Text>
            <Text style={dynamicStyles.subtitle}>{t('auth.email_password_subtitle')}</Text>

            {/* LOGIN FIELD (phone or email) */}
            <View style={dynamicStyles.fieldContainer}>
              <Text style={dynamicStyles.label}>{t('auth.login_label')}</Text>
              <CustomTextInput
                ref={loginInputRef}
                style={dynamicStyles.input}
                placeholder='name@example.com'
                placeholderTextColor={theme.formInputPlaceholderColor}
                autoCapitalize='none'
                autoCorrect={false}
                value={login}
                onChangeText={(text) => {
                  setLogin(text);
                  if (error) setError(null);
                }}
                returnKeyType='next'
              />
            </View>

            {/* PASSWORD FIELD */}
            <View style={dynamicStyles.fieldContainer}>
              <Text style={dynamicStyles.label}>{t('auth.password_label')}</Text>
              <CustomTextInput
                style={dynamicStyles.input}
                placeholder='******'
                placeholderTextColor={theme.formInputPlaceholderColor}
                secureTextEntry={!showPassword}
                autoCapitalize='none'
                autoCorrect={false}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError(null);
                }}
                returnKeyType='done'
                onSubmitEditing={onSubmit}
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
                <Text style={dynamicStyles.link}>{t('auth.forgot_password')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onGoToRegister?.()}>
                <Text style={dynamicStyles.link}>{t('auth.create_user')}</Text>
              </TouchableOpacity>
            </View>

            {!!error && <Text style={dynamicStyles.error}>{error}</Text>}

            <PrimaryOutlineButton
              title={sending ? <ActivityIndicator color={theme.primaryColor} /> : t('auth.sign_in')}
              onPress={onSubmit}
              disabled={sending}
              buttonStyle={dynamicStyles.primaryButton}
              textStyle={dynamicStyles.primaryButtonText}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
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
