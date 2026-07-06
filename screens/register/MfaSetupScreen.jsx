import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import * as Clipboard from 'expo-clipboard';
import { SvgXml } from 'react-native-svg';
import { useComponentContext } from '../../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { useWindowInfo } from '../../context/windowContext';
import CustomTextInput from '../../components/ui/CustomTextInput';
import { getAuthErrorMessage } from '../../src/auth/authErrors';
import { logError } from '../../utils/log_util';

const OTP_LENGTH = 6;

/**
 * Supabase's TOTP enroll response returns `totp.qr_code` as a raw SVG XML
 * string (not a data URI or raster image) — the backend passes it through
 * unchanged (see supabase-auth.provider.ts). SVG needs a real SVG renderer:
 * on web, <Image> renders via a CSS `background-image` that silently fails
 * on inline SVG data URIs (the visible layer never appears, even though the
 * hidden accessibility <img> react-native-web also renders loads fine — which
 * is misleading when inspecting the DOM); on native, Image can't decode SVG
 * at all. Use react-native-svg's SvgXml for the SVG case instead.
 */
function normalizeQrCode(qrCode) {
  if (!qrCode) return null;
  const trimmed = String(qrCode).trim();

  if (trimmed.includes('svg') || trimmed.startsWith('<?xml')) {
    return { kind: 'svg', xml: trimmed };
  }
  if (trimmed.startsWith('data:') || /^https?:\/\//.test(trimmed)) {
    return { kind: 'raster', uri: trimmed };
  }
  // Bare base64 raster fallback.
  return { kind: 'raster', uri: `data:image/png;base64,${trimmed}` };
}

/**
 * Post-registration MFA setup (TOTP by default).
 *
 * Flow: enroll (POST /auth/mfa/enroll { type: 'totp' }) -> show QR/secret
 * -> user enters 6-digit code -> challenge (this is what actually sends the
 * challenge context, no SMS for TOTP) -> verify -> session's authLevel raised
 * to aal2 (same app_session, no new token minted).
 *
 * @param {{ optional?: boolean, onDone: () => void, onSkip?: () => void }} props
 */
export default function MfaSetupScreen({ optional = false, onDone, onSkip }) {
  const { t } = useTranslation();
  const { session, themeController, languageController } = useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const { height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [enrolling, setEnrolling] = useState(true);
  const [enrollError, setEnrollError] = useState(null);
  const [factorId, setFactorId] = useState(null);
  const [totp, setTotp] = useState(null); // { qrCode?, secret?, uri? }

  const [otp, setOtp] = useState(Array.from({ length: OTP_LENGTH }, () => ''));
  const inputsRef = useRef([]);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setEnrolling(true);
      setEnrollError(null);
      try {
        const data = await session.enrollMfa({ type: 'totp' });
        if (cancelled) return;
        setFactorId(data.factorId);
        setTotp({ qrCode: data.qrCode, secret: data.secret, uri: data.uri });
      } catch (e) {
        if (cancelled) return;
        logError('MFA enroll error:', e.message || e);
        setEnrollError(getAuthErrorMessage(e));
      } finally {
        if (!cancelled) setEnrolling(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleVerify = async () => {
    if (verifying || !factorId) return;
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setOtpError(t('auth.mfa_enter_code'));
      return;
    }
    setVerifying(true);
    setOtpError(null);
    try {
      const challenge = await session.challengeMfa({ factorId });
      await session.verifyMfa({
        factorId,
        challengeId: challenge.challengeId,
        code,
      });
      // verifyMfa() already refreshed the session (nextStep now reflects the
      // backend's post-verify state) — App.js reactively moves the app
      // forward, this callback just signals "done with this screen".
      onDone?.();
    } catch (e) {
      logError('MFA verify error:', e.message || e);
      setOtpError(getAuthErrorMessage(e));
      setOtp(Array.from({ length: OTP_LENGTH }, () => ''));
      inputsRef.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const copySecret = async () => {
    if (totp?.secret) {
      await Clipboard.setStringAsync(totp.secret);
    }
  };

  const qr = useMemo(() => normalizeQrCode(totp?.qrCode), [totp?.qrCode]);

  const sizes = useMemo(
    () => ({
      brandFontSize: isWebLandscape ? scaleByHeight(57, height) : scaleByHeightMobile(68, height),
      titleFontSize: isWebLandscape ? scaleByHeight(18, height) : scaleByHeightMobile(18, height),
      subtitleFontSize: isWebLandscape ? scaleByHeight(16, height) : scaleByHeightMobile(15, height),
      qrSize: isWebLandscape ? scaleByHeight(180, height) : scaleByHeightMobile(180, height),
      otpCellHeight: isWebLandscape ? scaleByHeight(64, height) : scaleByHeightMobile(64, height),
      otpCellFontSize: isWebLandscape ? scaleByHeight(20, height) : scaleByHeightMobile(20, height),
      btnHeight: isWebLandscape ? scaleByHeight(62, height) : scaleByHeightMobile(62, height),
      btnWidth: isWebLandscape ? scaleByHeight(330, height) : '100%',
      contentWidth: isWebLandscape ? height * 0.5 : '100%',
      gap: isWebLandscape ? scaleByHeight(14, height) : scaleByHeightMobile(14, height),
    }),
    [isWebLandscape, height]
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={[styles.root, { backgroundColor: theme.backgroundColor }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          isWebLandscape && { justifyContent: 'center', alignItems: 'center', flexGrow: 1 },
        ]}
        keyboardShouldPersistTaps='handled'
      >
        <View style={[styles.content, { width: sizes.contentWidth, gap: sizes.gap }]}>
          <Text style={[styles.brand, { color: theme.primaryColor, fontSize: sizes.brandFontSize }]}>
            {t('auth.app_name')}
          </Text>
          <Text style={[styles.title, { color: theme.unactiveTextColor, fontSize: sizes.titleFontSize }]}>
            {t('auth.mfa_setup_title')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.unactiveTextColor, fontSize: sizes.subtitleFontSize }]}>
            {optional ? t('auth.mfa_setup_recommend_subtitle') : t('auth.mfa_setup_subtitle')}
          </Text>

          {enrolling ? (
            <ActivityIndicator size='large' color={theme.primaryColor} />
          ) : enrollError ? (
            <Text style={{ color: theme.errorTextColor, textAlign: 'center' }}>{enrollError}</Text>
          ) : (
            <>
              {!!qr && (
                qr.kind === 'svg' ? (
                  <View style={{ width: sizes.qrSize, height: sizes.qrSize, alignSelf: 'center' }}>
                    <SvgXml xml={qr.xml} width='100%' height='100%' />
                  </View>
                ) : (
                  <Image
                    source={{ uri: qr.uri }}
                    style={{ width: sizes.qrSize, height: sizes.qrSize, alignSelf: 'center' }}
                    resizeMode='contain'
                  />
                )
              )}

              {!!totp?.secret && (
                <TouchableOpacity onPress={copySecret} style={{ alignItems: 'center' }}>
                  <Text style={[styles.subtitle, { color: theme.unactiveTextColor, fontSize: sizes.subtitleFontSize }]}>
                    {t('auth.mfa_secret_label')}
                  </Text>
                  <Text
                    selectable
                    style={{ color: theme.primaryColor, fontFamily: 'Rubik-Medium', letterSpacing: 2, marginTop: 4 }}
                  >
                    {totp.secret}
                  </Text>
                </TouchableOpacity>
              )}

              <View style={[styles.otpRow, { flexDirection: 'row' }]}>
                {otp.map((digit, idx) => (
                  <CustomTextInput
                    key={idx}
                    ref={(ref) => (inputsRef.current[idx] = ref)}
                    style={[
                      styles.otpCell,
                      {
                        height: sizes.otpCellHeight,
                        fontSize: sizes.otpCellFontSize,
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

              {!!otpError && (
                <Text style={{ color: theme.errorTextColor, textAlign: 'center' }}>{otpError}</Text>
              )}

              <TouchableOpacity
                onPress={handleVerify}
                disabled={verifying || otp.join('').length !== OTP_LENGTH}
                style={[
                  styles.primaryBtn,
                  {
                    height: sizes.btnHeight,
                    width: sizes.btnWidth,
                    borderColor: theme.primaryColor,
                    opacity: verifying || otp.join('').length !== OTP_LENGTH ? 0.6 : 1,
                  },
                ]}
              >
                {verifying ? (
                  <ActivityIndicator color={theme.primaryColor} />
                ) : (
                  <Text style={[styles.primaryBtnText, { color: theme.primaryColor }]}>
                    {t('common.confirm')}
                  </Text>
                )}
              </TouchableOpacity>

              {optional && (
                <TouchableOpacity onPress={() => onSkip?.()} style={{ alignItems: 'center', marginTop: 8 }}>
                  <Text style={{ color: theme.formInputLabelColor, fontFamily: 'Rubik-Medium' }}>
                    {t('auth.skip_for_now')}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, width: '100%' },
  scroll: { paddingHorizontal: '6%', paddingVertical: 40, flexGrow: 1, justifyContent: 'center' },
  content: { alignSelf: 'center', alignItems: 'center' },
  brand: { fontWeight: 'bold', textAlign: 'center', fontFamily: 'Rubik-Bold' },
  title: { fontWeight: '600', textAlign: 'center', fontFamily: 'Rubik-SemiBold' },
  subtitle: { textAlign: 'center', fontFamily: 'Rubik-Medium' },
  otpRow: { justifyContent: 'space-between', width: '90%', alignSelf: 'center' },
  otpCell: {
    width: `${100 / OTP_LENGTH - 2}%`,
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
    fontFamily: 'Rubik-Medium',
  },
  primaryBtn: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 8,
    alignSelf: 'center',
  },
  primaryBtnText: { fontFamily: 'Rubik-Medium', fontSize: 20 },
});
