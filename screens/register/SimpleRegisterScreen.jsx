import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
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
import { logError, logInfo } from '../../utils/log_util';
import { useWindowInfo } from '../../context/windowContext';
import CustomTextInput from '../../components/ui/CustomTextInput';
import CustomPicker from '../../components/ui/CustomPicker';
import PhoneField from '../../components/ui/PhoneField';
import Step3_PhoneVerify from './Step3_PhoneVerify';
import { getAuthErrorMessage } from '../../src/auth/authErrors';
import { useNotification } from '../../src/render';

function PrimaryOutlineButton({ title, onPress, disabled, buttonStyle, textStyle }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[buttonStyle, { opacity: disabled ? 0.6 : 1 }]}>
      {typeof title === 'string' ? <Text style={textStyle}>{title}</Text> : title}
    </TouchableOpacity>
  );
}

const EMAIL_RE = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;

/**
 * Simplified registration (new flow): phone + email + password + confirmPassword
 * collected together, followed by a mandatory phone OTP step. Email
 * verification is not mandatory. Once the phone OTP is verified,
 * session.verifyRegistrationPhone already establishes the session and
 * refreshes nextStep — App.js's top-level routing takes over from there
 * (including MfaSetupScreen if the backend requires it), same as
 * MultiStepRegisterScreen.jsx today. If an email was given, a
 * "check your email to confirm" (or "confirmation failed") notice is shown
 * as a non-blocking toast (useNotification#showAlert) at the same moment —
 * it must never gate leaveRegisterScreen()/nextStep routing behind an "OK"
 * click, since nextStep (e.g. mfa_setup_required) is what the server
 * actually requires next.
 *
 * Steps: form | phone_otp
 */
export default function SimpleRegisterScreen() {
  const { t } = useTranslation();
  const { session, themeController, registerControl, languageController } = useComponentContext();
  const { showAlert } = useNotification();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const { width, height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [step, setStep] = useState('form');
  const [phone, setPhone] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [phoneError, setPhoneError] = useState(null);
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState(null);
  const [generalError, setGeneralError] = useState(null);
  const [sending, setSending] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const phoneInputRef = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => phoneInputRef.current?.focus(), 50);
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
      fieldError: {
        fontSize: isWebLandscape ? scaleByHeight(13, h) : scaleByHeightMobile(13, h),
        color: theme.errorTextColor,
        marginTop: isWebLandscape ? scaleByHeight(2, h) : scaleByHeightMobile(2, h),
        textAlign: isRTL ? 'right' : 'left',
      },
      warningText: {
        fontSize: isWebLandscape ? scaleByHeight(13, h) : scaleByHeightMobile(13, h),
        color: theme.unactiveTextColor,
        marginBottom: isWebLandscape ? scaleByHeight(14, h) : scaleByHeightMobile(16, h),
        width: isWebLandscape ? scaleByHeight(330, h) : '100%',
        textAlign: 'center',
      },
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

  // Email is optional now — only invalid if something was typed and it
  // doesn't look like an email; empty is fine.
  const isValidEmail = useMemo(() => {
    const trimmed = email.trim();
    return trimmed === '' || EMAIL_RE.test(trimmed);
  }, [email]);
  const isValidPassword = useMemo(() => password.trim().length >= 6, [password]);
  const passwordsMatch = useMemo(
    () => password.trim() !== '' && password.trim() === confirmPassword.trim(),
    [password, confirmPassword]
  );

  // Seeded by the auto-check-on-mount effect below once it resolves the
  // backend's real expiresInSeconds; passed to Step3_PhoneVerify so its
  // countdown reflects the actual remaining time instead of a hardcoded 60s.
  const [otpCooldown, setOtpCooldown] = useState(undefined);

  // On entering the OTP step, auto-check with manual:false — if a previously
  // sent code is still active, the backend just replies with its remaining
  // expiresInSeconds and does NOT send another SMS (see
  // authApi.js#resendRegistrationPhoneOtp). Silent on failure (e.g. rate
  // limited from repeated remounts) — not worth surfacing an error for a
  // background sync the user didn't initiate; the resend button will surface
  // it for real if they then click it while still limited.
  useEffect(() => {
    if (step !== 'phone_otp') return;
    let cancelled = false;
    (async () => {
      const res = await session.resendRegistrationPhoneOtp(phone, false);
      if (cancelled) return;
      if (res.success && typeof res.expiresInSeconds === 'number') {
        setOtpCooldown(res.expiresInSeconds);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, phone, session]);

  const handleResend = useCallback(async () => {
    return session.resendRegistrationPhoneOtp(phone, true);
  }, [session, phone]);

  const handlePhoneVerify = useCallback(async (code) => {
    try {
      const resp = await session.verifyRegistrationPhone({ phone, code });
      logInfo('[SimpleRegisterScreen] verifyRegistrationPhone response:', resp);
      if (resp?.nextStep && resp.nextStep !== 'login_required') {
        // `emailConfirmationSent` is only present if an email was given at
        // registration — surface it as a non-blocking toast, never a step
        // that gates dismissal. nextStep (already applied by
        // session.verifyRegistrationPhone -> handleAuthResponse -> refreshMe)
        // is the single source of truth for what happens next — e.g.
        // MfaSetupScreen for 'mfa_setup_required' — and must not be delayed
        // behind an "OK" click on an informational notice.
        if (resp && 'emailConfirmationSent' in resp) {
          if (resp.emailConfirmationSent) {
            showAlert(t('register.email_confirmation_sent_subtitle', { email: email.trim() }), 'info');
          } else {
            showAlert(t('register.email_confirmation_failed_subtitle'), 'warning');
          }
        }
        registerControl.leaveRegisterScreen();
        return { success: true };
      }
      return { success: false, error: getAuthErrorMessage({ code: 'OTP_INVALID' }) };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  }, [session, phone, email, registerControl, showAlert, t]);

  const handleSubmit = async () => {
    setPhoneError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setGeneralError(null);

    let isValid = true;
    if (!phoneValid) {
      setPhoneError(t('register.phone_invalid'));
      isValid = false;
    }
    if (!isValidEmail) {
      setEmailError(t('register.email_invalid'));
      isValid = false;
    }
    if (!isValidPassword) {
      setPasswordError(t('register.password_invalid'));
      isValid = false;
    }
    if (!passwordsMatch) {
      setConfirmPasswordError(t('register.password_mismatch'));
      isValid = false;
    }
    if (!isValid) return;

    setSending(true);
    try {
      await session.registerUnified({
        phone: phone.trim(),
        // Omitted entirely (not sent as '') when left blank — email is
        // optional now, and the backend keys its `emailConfirmationSent`
        // response field on whether this was present at all.
        email: email.trim() || undefined,
        password,
        confirmPassword,
      });
      setStep('phone_otp');
    } catch (e) {
      const msg = getAuthErrorMessage(e);
      if (e?.message === 'phone_already_registered' || e?.code === 'PHONE_ALREADY_REGISTERED') {
        setPhoneError(msg);
      } else if (e?.message === 'email_already_registered' || e?.code === 'EMAIL_ALREADY_REGISTERED') {
        setEmailError(msg);
      } else {
        setGeneralError(msg);
      }
    } finally {
      setSending(false);
    }
  };

  if (step === 'phone_otp') {
    return (
      <View style={styles.container}>
        <Step3_PhoneVerify
          phone={phone}
          onVerify={handlePhoneVerify}
          onResend={handleResend}
          onBack={() => setStep('form')}
          backLabel={t('register.back_to_sign_up')}
          initialCooldown={otpCooldown}
        />
      </View>
    );
  }

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
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={dynamicStyles.root}
        keyboardVerticalOffset={Platform.select({ ios: scaleByHeightMobile(10, height), android: 0 })}
      >
        <ScrollView contentContainerStyle={dynamicStyles.scroll} keyboardShouldPersistTaps='handled'>
          <Animated.View style={[dynamicStyles.contentBlock, { opacity: fadeAnim }]}>
            <Text style={dynamicStyles.brand}>{t('auth.app_name')}</Text>
            <Text style={dynamicStyles.title}>{t('auth.create_user_title')}</Text>
            <Text style={dynamicStyles.subtitle}>{t('auth.create_user_subtitle')}</Text>

            {/* PHONE FIELD */}
            <PhoneField
              ref={phoneInputRef}
              value={phone}
              onChangeValue={(val) => {
                setPhone(val);
                if (phoneError) setPhoneError(null);
              }}
              onValidityChange={setPhoneValid}
              label={t('register.phone_label')}
              placeholder='50 123 4567'
              containerStyle={dynamicStyles.fieldContainer}
              labelStyle={dynamicStyles.label}
              inputStyle={dynamicStyles.input}
            />
            {!!phoneError && <Text style={dynamicStyles.fieldError}>{phoneError}</Text>}

            {/* EMAIL FIELD (optional) */}
            <View style={dynamicStyles.fieldContainer}>
              <Text style={dynamicStyles.label}>{t('register.email_optional_label')}</Text>
              <CustomTextInput
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
            {!!emailError && <Text style={dynamicStyles.fieldError}>{emailError}</Text>}
            <Text style={dynamicStyles.warningText}>{t('register.email_confirmation_hint')}</Text>

            {/* PASSWORD FIELD */}
            <View style={dynamicStyles.fieldContainer}>
              <Text style={dynamicStyles.label}>{t('register.password')}</Text>
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
                  if (passwordError) setPasswordError(null);
                }}
                returnKeyType='next'
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
            {!!passwordError && <Text style={dynamicStyles.fieldError}>{passwordError}</Text>}

            {/* CONFIRM PASSWORD FIELD */}
            <View style={dynamicStyles.fieldContainer}>
              <Text style={dynamicStyles.label}>{t('register.repeat_password')}</Text>
              <CustomTextInput
                style={dynamicStyles.input}
                placeholder='******'
                placeholderTextColor={theme.formInputPlaceholderColor}
                secureTextEntry={!showPassword}
                autoCapitalize='none'
                autoCorrect={false}
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (confirmPasswordError) setConfirmPasswordError(null);
                }}
                returnKeyType='done'
                onSubmitEditing={handleSubmit}
              />
            </View>
            {!!confirmPasswordError && <Text style={dynamicStyles.fieldError}>{confirmPasswordError}</Text>}

            <View style={dynamicStyles.linksRow}>
              <TouchableOpacity onPress={() => registerControl.leaveRegisterScreen()}>
                <Text style={dynamicStyles.link}>{t('auth.back_to_sign_in')}</Text>
              </TouchableOpacity>
            </View>

            {!!generalError && <Text style={dynamicStyles.error}>{generalError}</Text>}

            <PrimaryOutlineButton
              title={sending ? <ActivityIndicator color={theme.primaryColor} /> : t('register.create_account')}
              onPress={handleSubmit}
              disabled={sending}
              buttonStyle={dynamicStyles.primaryButton}
              textStyle={dynamicStyles.primaryButtonText}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
});
