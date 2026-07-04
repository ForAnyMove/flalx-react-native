import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { useWindowInfo } from '../context/windowContext';
import CustomTextInput from '../components/ui/CustomTextInput';
import { getAuthErrorMessage } from '../src/auth/authErrors';

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
        <Text style={[styles.outlineBtnText, { color: theme.primaryColor }]}>{title}</Text>
      ) : (
        title
      )}
    </TouchableOpacity>
  );
}

/**
 * Forgot-password: the app's only job is to fire POST /auth/forgot-password
 * and tell the user to check their email. The reset itself happens on a page
 * the backend hosts itself (reset-password.html) — there is no in-app OTP or
 * token step here.
 */
export default function ForgottenPasswordScreen() {
  const { t } = useTranslation();
  const { session, themeController, languageController, forgotPassControl } =
    useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const { height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [step, setStep] = useState('email'); // 'email' | 'sent'
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(null);
  const [sending, setSending] = useState(false);

  const isValidEmail = useMemo(() => {
    const re =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@"]+\.)+[^<>()[\]\\.,;:\s@"]{2,})$/i;
    return re.test(email.trim());
  }, [email]);

  const emailInputRef = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => emailInputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleSend = async () => {
    if (!isValidEmail) {
      setEmailError(t('auth.invalid_email'));
      return;
    }
    setEmailError(null);
    setSending(true);
    try {
      const res = await session.forgotPassword(email.trim());
      if (res.success) {
        setStep('sent');
      } else {
        setEmailError(res.error || getAuthErrorMessage({ code: 'AUTH_ERROR' }));
      }
    } finally {
      setSending(false);
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
      errorFontSize: isWebLandscape ? web(14) : mobile(14),
      scrollPaddingVertical: isWebLandscape ? web(24) : mobile(80),
      keyboardVerticalOffset: mobile(10),
      linksRowMarginBottom: isWebLandscape ? web(8) : mobile(12),
      linksRowWidth: isWebLandscape ? web(314) : '90%',
      linkFontSize: isWebLandscape ? web(14) : mobile(14),
    };
  }, [isWebLandscape, height]);

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
          {step === 'email' ? (
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
                {t('auth.forgot_pass_subtitle')}
              </Text>

              <View
                style={[
                  styles.fieldBlock,
                  {
                    marginBottom: sizes.fieldBlockMarginBottom,
                    backgroundColor: theme.formInputBackground,
                    width: sizes.fieldBlockWidth,
                    height: sizes.fieldBlockHeight,
                    borderRadius: sizes.borderRadius,
                  },
                ]}
              >
                <Text style={[styles.label, { fontSize: sizes.labelFontSize, color: theme.formInputLabelColor, textAlign: isRTL ? 'right' : 'left' }]}>
                  {t('auth.email_label')}
                </Text>
                <CustomTextInput
                  ref={emailInputRef}
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
                  placeholder='name@example.com'
                  placeholderTextColor={theme.formInputPlaceholderColor}
                  keyboardType='email-address'
                  autoCapitalize='none'
                  autoCorrect={false}
                  value={email}
                  onChangeText={(txt) => {
                    setEmail(txt);
                    setEmailError(null);
                  }}
                  returnKeyType='done'
                  onSubmitEditing={handleSend}
                />
              </View>

              {!!emailError && (
                <Text style={{ color: theme.errorTextColor, fontSize: sizes.errorFontSize, marginBottom: 8 }}>
                  {emailError}
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
                onPress={handleSend}
                disabled={sending || !isValidEmail}
              />
            </>
          ) : (
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
