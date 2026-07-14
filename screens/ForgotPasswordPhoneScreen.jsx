import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { icons } from '../constants/icons';
import { useWindowInfo } from '../context/windowContext';
import CustomTextInput from '../components/ui/CustomTextInput';
import PhoneOrEmailInput from '../components/ui/PhoneOrEmailInput';
import Step3_PhoneVerify from './register/Step3_PhoneVerify';

const EMAIL_RE = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;

function PrimaryOutlineButton({ title, onPress, disabled, theme, isLandscape, height }) {
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.outlineBtn,
        {
          borderColor: theme.primaryColor,
          opacity: disabled ? 0.6 : 1,
          height: isWebLandscape ? scaleByHeight(62, height) : scaleByHeightMobile(62, height),
          width: isWebLandscape ? scaleByHeight(330, height) : '100%',
          marginTop: isWebLandscape ? scaleByHeight(38, height) : scaleByHeightMobile(12, height),
          borderRadius: isWebLandscape ? scaleByHeight(8, height) : scaleByHeightMobile(8, height),
        },
      ]}
    >
      {typeof title === 'string' ? (
        <Text
          style={[
            styles.outlineBtnText,
            {
              color: theme.primaryColor,
              fontSize: isWebLandscape ? scaleByHeight(20, height) : scaleByHeightMobile(20, height),
              lineHeight: isWebLandscape ? scaleByHeight(20, height) : scaleByHeightMobile(20, height),
            },
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
 * Password reset (new flow): phone -> OTP -> new password, OR email -> a
 * magic link handled entirely on a backend-hosted page (POST
 * /auth/forgot-password, same as the legacy ForgottenPasswordScreen.jsx's
 * flow, just reachable from here too now via the mode tabs) — phone is the
 * primary channel since email verification isn't mandatory at registration
 * (see docs/rework_auth.md simplified-flow notes), but a user who does have
 * a confirmed email can reset with it instead of their phone.
 *
 * Steps: input | otp | new_password | success | email_sent
 */
export default function ForgotPasswordPhoneScreen() {
  const { t } = useTranslation();
  const { session, themeController, languageController, forgotPassControl } =
    useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const { height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [step, setStep] = useState('input'); // 'input' | 'otp' | 'new_password' | 'success' | 'email_sent'
  const [mode, setMode] = useState('phone'); // 'phone' | 'email'
  const [phone, setPhone] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  const [email, setEmail] = useState('');
  const [inputError, setInputError] = useState(null);
  const [sending, setSending] = useState(false);
  const [resetToken, setResetToken] = useState(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Seeded by the auto-check-on-mount effect below, once/if it resolves an
  // expiresInSeconds — forgot-phone's response is generic
  // (otp_sent_if_account_exists, see authApi.js) and may not always carry
  // one, so Step3_PhoneVerify falls back to its own 60s default otherwise.
  const [otpCooldown, setOtpCooldown] = useState(undefined);

  const isValidPassword = useMemo(() => newPassword.trim().length >= 6, [newPassword]);
  const passwordsMatch = useMemo(
    () => newPassword.trim() !== '' && newPassword.trim() === confirmPassword.trim(),
    [newPassword, confirmPassword]
  );
  const isValidEmail = useMemo(() => EMAIL_RE.test(email.trim()), [email]);

  const inputRef = useRef(null);
  useEffect(() => {
    if (step !== 'input') return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [step]);

  const handleSubmit = async () => {
    if (mode === 'phone') {
      if (!phoneValid) {
        setInputError(t('register.phone_invalid'));
        return;
      }
      setInputError(null);
      setSending(true);
      try {
        // Explicit button click -> manual:true (see authApi.js#forgotPasswordByPhone).
        const res = await session.forgotPasswordByPhone(phone.trim(), true);
        if (res.success) {
          setStep('otp');
        } else {
          setInputError(res.error);
        }
      } finally {
        setSending(false);
      }
      return;
    }

    if (!isValidEmail) {
      setInputError(t('auth.invalid_email'));
      return;
    }
    setInputError(null);
    setSending(true);
    try {
      // Confirmation-based magic-link flow, same as the legacy
      // ForgottenPasswordScreen.jsx — no in-app OTP/reset step for email.
      const res = await session.forgotPassword(email.trim());
      if (res.success) {
        setStep('email_sent');
      } else {
        setInputError(res.error);
      }
    } finally {
      setSending(false);
    }
  };

  // On entering the OTP step, auto-check with manual:false — mirrors
  // SimpleRegisterScreen's registration OTP step. Silent on failure; the
  // resend button surfaces any real error (including rate limiting) itself.
  useEffect(() => {
    if (step !== 'otp') return;
    let cancelled = false;
    (async () => {
      const res = await session.forgotPasswordByPhone(phone, false);
      if (cancelled) return;
      if (res.success && typeof res.expiresInSeconds === 'number') {
        setOtpCooldown(res.expiresInSeconds);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [step, phone, session]);

  const handleOtpResend = useCallback(async () => {
    return session.forgotPasswordByPhone(phone, true);
  }, [session, phone]);

  const handleOtpVerify = useCallback(async (code) => {
    const res = await session.verifyPasswordResetPhoneOtp(phone, code);
    if (res.success) {
      setResetToken(res.resetToken);
      setStep('new_password');
    }
    return res;
  }, [session, phone]);

  const handleResetPassword = async () => {
    setPasswordError(null);
    setConfirmPasswordError(null);

    let isValid = true;
    if (!isValidPassword) {
      setPasswordError(t('reset.password_invalid'));
      isValid = false;
    }
    if (!passwordsMatch) {
      setConfirmPasswordError(t('reset.password_mismatch'));
      isValid = false;
    }
    if (!isValid) return;

    setSubmitting(true);
    try {
      const res = await session.resetPasswordByPhone({
        resetToken,
        newPassword,
        confirmPassword,
      });
      if (res.success) {
        setStep('success');
      } else {
        setConfirmPasswordError(res.error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    return {
      titleFontSize: isWebLandscape ? web(18) : mobile(18),
      subtitleFontSize: isWebLandscape ? web(18) : mobile(16),
      subtitleMarginBottom: isWebLandscape ? web(25) : mobile(28),
      fieldBlockMarginBottom: isWebLandscape ? web(14) : mobile(16),
      labelFontSize: isWebLandscape ? web(14) : mobile(14),
      inputFontSize: isWebLandscape ? web(18) : mobile(18),
      borderRadius: isWebLandscape ? web(8) : mobile(8),
      fieldBlockWidth: isWebLandscape ? web(330) : '100%',
      fieldBlockHeight: isWebLandscape ? web(76) : mobile(75),
      phoneEmailfieldBlockHeight: isWebLandscape ? web(76 - 20) : mobile(75 - 20),
      fieldBlockPaddingHorizontal: isWebLandscape ? web(16) : mobile(16),
      fieldBlockPaddingTop: isWebLandscape ? web(14) : mobile(14),
      errorFontSize: isWebLandscape ? web(14) : mobile(14),
      scrollPaddingVertical: isWebLandscape ? web(24) : mobile(80),
      keyboardVerticalOffset: mobile(10),
      linksRowMarginBottom: isWebLandscape ? web(8) : mobile(12),
      linksRowWidth: isWebLandscape ? web(314) : '90%',
      linkFontSize: isWebLandscape ? web(14) : mobile(14),
      eyeIconPosition: isWebLandscape ? web(14) : mobile(12),
      eyeIconTop: isWebLandscape ? web(26) : mobile(35),
      eyeIconSize: isWebLandscape ? web(24) : mobile(24),
    };
  }, [isWebLandscape, height]);

  if (step === 'otp') {
    return (
      <View style={styles.root}>
        <Step3_PhoneVerify
          phone={phone}
          onVerify={handleOtpVerify}
          onResend={handleOtpResend}
          onBack={() => setStep('input')}
          backLabel={t('auth.back_to_phone')}
          initialCooldown={otpCooldown}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={[styles.root, { backgroundColor: theme.backgroundColor }]}
      keyboardVerticalOffset={Platform.select({ ios: sizes.keyboardVerticalOffset, android: 0 })}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingVertical: sizes.scrollPaddingVertical },
          isWebLandscape && { justifyContent: 'center', alignItems: 'center', flex: 1 },
        ]}
        keyboardShouldPersistTaps='handled'
      >
        <View style={[styles.contentBlock, isWebLandscape ? { width: height * 0.5 } : { width: '100%' }]}>
          {step === 'input' && (
            <>
              <Text style={[styles.title, { color: theme.unactiveTextColor, fontSize: sizes.titleFontSize }]}>
                {t('auth.forgot_pass_title')}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: theme.unactiveTextColor, fontSize: sizes.subtitleFontSize, marginBottom: sizes.subtitleMarginBottom },
                ]}
              >
                {mode === 'phone' ? t('auth.forgot_pass_subtitle_sms') : t('auth.forgot_pass_subtitle')}
              </Text>

              <PhoneOrEmailInput
                ref={inputRef}
                mode={mode}
                onModeChange={(m) => {
                  setMode(m);
                  setInputError(null);
                }}
                phoneValue={phone}
                onPhoneChange={(val) => {
                  setPhone(val);
                  setInputError(null);
                }}
                onPhoneValidityChange={setPhoneValid}
                emailValue={email}
                onEmailChange={(text) => {
                  setEmail(text);
                  setInputError(null);
                }}
                containerStyle={{
                  marginBottom: sizes.fieldBlockMarginBottom,
                  backgroundColor: theme.formInputBackground,
                  width: sizes.fieldBlockWidth,
                  height: sizes.phoneEmailfieldBlockHeight,
                  borderRadius: sizes.borderRadius,
                  paddingHorizontal: sizes.fieldBlockPaddingHorizontal,
                  paddingTop: sizes.fieldBlockPaddingTop,
                }}
                inputStyle={[
                  styles.input,
                  {
                    fontSize: sizes.inputFontSize,
                    color: theme.formInputTextColor,
                    textAlign: isRTL ? 'right' : 'left',
                    backgroundColor: 'transparent',
                    borderWidth: 0,
                  },
                  Platform.OS === 'web' && { outlineStyle: 'none' },
                ]}
                onSubmitEditing={handleSubmit}
                returnKeyType='done'
                autoFocus
              />

              {!!inputError && (
                <Text style={{ color: theme.errorTextColor, fontSize: sizes.errorFontSize, marginBottom: 8 }}>
                  {inputError}
                </Text>
              )}

              <View
                style={[
                  styles.linksRow,
                  { width: sizes.linksRowWidth, marginBottom: sizes.linksRowMarginBottom, flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
              >
                <TouchableOpacity onPress={() => forgotPassControl.switch()}>
                  <Text style={[styles.link, { fontSize: sizes.linkFontSize, color: theme.formInputLabelColor }]}>
                    {t('auth.back_to_sign_in')}
                  </Text>
                </TouchableOpacity>
              </View>

              <PrimaryOutlineButton
                isLandscape={isLandscape}
                height={height}
                theme={theme}
                title={sending ? <ActivityIndicator color={theme.primaryColor} /> : t('auth.send_reset_code')}
                onPress={handleSubmit}
                disabled={sending || (mode === 'phone' ? !phoneValid : !isValidEmail)}
              />
            </>
          )}

          {step === 'email_sent' && (
            <>
              <Text style={[styles.title, { color: theme.unactiveTextColor, fontSize: sizes.titleFontSize * 1.3 }]}>
                {t('auth.check_email_title')}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: theme.unactiveTextColor, fontSize: sizes.subtitleFontSize, marginBottom: sizes.subtitleMarginBottom },
                ]}
              >
                {t('auth.forgot_pass_check_email_subtitle')}
              </Text>
              <PrimaryOutlineButton
                isLandscape={isLandscape}
                height={height}
                theme={theme}
                title={t('auth.back_to_sign_in')}
                onPress={() => forgotPassControl.switch()}
              />
            </>
          )}

          {step === 'new_password' && (
            <>
              <Text style={[styles.title, { color: theme.unactiveTextColor, fontSize: sizes.titleFontSize }]}>
                {t('reset.title')}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: theme.unactiveTextColor, fontSize: sizes.subtitleFontSize, marginBottom: sizes.subtitleMarginBottom },
                ]}
              >
                {t('reset.subtitle')}
              </Text>

              <View
                style={[
                  styles.fieldBlock,
                  {
                    marginBottom: sizes.fieldBlockMarginBottom,
                    backgroundColor: theme.formInputBackground,
                    position: 'relative',
                    width: sizes.fieldBlockWidth,
                    height: sizes.fieldBlockHeight,
                    borderRadius: sizes.borderRadius,
                    paddingHorizontal: sizes.fieldBlockPaddingHorizontal,
                    paddingTop: sizes.fieldBlockPaddingTop,
                  },
                ]}
              >
                <Text style={[styles.label, { fontSize: sizes.labelFontSize, color: theme.formInputLabelColor, textAlign: isRTL ? 'right' : 'left' }]}>
                  {t('reset.password')}
                </Text>
                <CustomTextInput
                  style={[
                    styles.input,
                    {
                      fontSize: sizes.inputFontSize,
                      color: theme.formInputTextColor,
                      textAlign: isRTL ? 'right' : 'left',
                      backgroundColor: 'transparent',
                      borderWidth: 0,
                    },
                    Platform.OS === 'web' && { outlineStyle: 'none' },
                  ]}
                  placeholder='******'
                  placeholderTextColor={theme.formInputPlaceholderColor}
                  secureTextEntry={!showPassword}
                  autoCapitalize='none'
                  autoCorrect={false}
                  value={newPassword}
                  onChangeText={(txt) => {
                    setNewPassword(txt);
                    setPasswordError(null);
                  }}
                  returnKeyType='next'
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: 'absolute',
                    right: isRTL ? undefined : sizes.eyeIconPosition,
                    left: isRTL ? sizes.eyeIconPosition : undefined,
                    top: sizes.eyeIconTop,
                    width: sizes.eyeIconSize,
                    height: sizes.eyeIconSize,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <Image
                    source={showPassword ? icons.eyeOpen : icons.eyeClosed}
                    style={{ width: sizes.eyeIconSize, height: sizes.eyeIconSize, tintColor: theme.formInputLabelColor }}
                    resizeMode='contain'
                  />
                </TouchableOpacity>
              </View>
              {!!passwordError && (
                <Text style={{ color: theme.errorTextColor, fontSize: sizes.errorFontSize, marginBottom: 8 }}>
                  {passwordError}
                </Text>
              )}

              <View
                style={[
                  styles.fieldBlock,
                  {
                    marginBottom: sizes.fieldBlockMarginBottom,
                    backgroundColor: theme.formInputBackground,
                    width: sizes.fieldBlockWidth,
                    height: sizes.fieldBlockHeight,
                    borderRadius: sizes.borderRadius,
                    paddingHorizontal: sizes.fieldBlockPaddingHorizontal,
                    paddingTop: sizes.fieldBlockPaddingTop,
                  },
                ]}
              >
                <Text style={[styles.label, { fontSize: sizes.labelFontSize, color: theme.formInputLabelColor, textAlign: isRTL ? 'right' : 'left' }]}>
                  {t('reset.repeat_password')}
                </Text>
                <CustomTextInput
                  style={[
                    styles.input,
                    {
                      fontSize: sizes.inputFontSize,
                      color: theme.formInputTextColor,
                      textAlign: isRTL ? 'right' : 'left',
                      backgroundColor: 'transparent',
                      borderWidth: 0,
                    },
                    Platform.OS === 'web' && { outlineStyle: 'none' },
                  ]}
                  placeholder='******'
                  placeholderTextColor={theme.formInputPlaceholderColor}
                  secureTextEntry={!showPassword}
                  autoCapitalize='none'
                  autoCorrect={false}
                  value={confirmPassword}
                  onChangeText={(txt) => {
                    setConfirmPassword(txt);
                    setConfirmPasswordError(null);
                  }}
                  returnKeyType='done'
                  onSubmitEditing={handleResetPassword}
                />
              </View>
              {!!confirmPasswordError && (
                <Text style={{ color: theme.errorTextColor, fontSize: sizes.errorFontSize, marginBottom: 8 }}>
                  {confirmPasswordError}
                </Text>
              )}

              <PrimaryOutlineButton
                isLandscape={isLandscape}
                height={height}
                theme={theme}
                title={submitting ? <ActivityIndicator color={theme.primaryColor} /> : t('reset.submit')}
                onPress={handleResetPassword}
                disabled={submitting || !isValidPassword || !passwordsMatch}
              />
            </>
          )}

          {step === 'success' && (
            <>
              <Text style={[styles.title, { color: theme.unactiveTextColor, fontSize: sizes.titleFontSize * 1.3 }]}>
                {t('reset.success_title')}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: theme.unactiveTextColor, fontSize: sizes.subtitleFontSize, marginBottom: sizes.subtitleMarginBottom },
                ]}
              >
                {t('reset.success_subtitle')}
              </Text>
              <PrimaryOutlineButton
                isLandscape={isLandscape}
                height={height}
                theme={theme}
                title={t('reset.success_button')}
                onPress={() => forgotPassControl.switch()}
              />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%' },
  scroll: { paddingHorizontal: '6%' },
  contentBlock: { alignSelf: 'center', alignItems: 'center' },
  title: { fontWeight: '600', textAlign: 'center', fontFamily: 'Rubik-SemiBold' },
  subtitle: { textAlign: 'center', fontWeight: '600', fontFamily: 'Rubik-SemiBold' },
  fieldBlock: {},
  label: { fontWeight: '500' },
  input: { fontWeight: '500' },
  outlineBtn: { borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  outlineBtnText: { fontFamily: 'Rubik-Medium' },
  linksRow: { width: '100%', justifyContent: 'center', alignItems: 'center' },
  link: { textDecorationLine: 'underline' },
});
