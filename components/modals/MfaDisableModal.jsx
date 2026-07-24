import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import { useWindowInfo } from '../../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { icons } from '../../constants/icons';
import CustomTextInput from '../ui/CustomTextInput';
import { getAuthErrorMessage } from '../../src/auth/authErrors';
import { logError } from '../../utils/log_util';

const OTP_LENGTH = 6;

/**
 * Disable-MFA confirmation: /mfa/challenge -> /mfa/verify (raises aal2) ->
 * /mfa/unenroll, per the flow spelled out for the Security block. Fetches
 * the enrolled factor id itself via listMfaFactors() (mirrors
 * MfaVerifyScreen.jsx's own fallback) rather than trusting session.mfa's
 * optional availableFactors, which isn't reliably populated outside the
 * login-time mfa_required response.
 */
export default function MfaDisableModal({ visible, onClose, onDisabled }) {
  const { t } = useTranslation();
  const { session, themeController, languageController } = useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;
  const { height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [factorId, setFactorId] = useState(null);
  const [loadingFactor, setLoadingFactor] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [otp, setOtp] = useState(Array.from({ length: OTP_LENGTH }, () => ''));
  const inputsRef = useRef([]);
  const [verifying, setVerifying] = useState(false);
  const [otpError, setOtpError] = useState(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setOtp(Array.from({ length: OTP_LENGTH }, () => ''));
    setOtpError(null);
    setLoadError(null);
    setLoadingFactor(true);
    (async () => {
      try {
        const { factors } = await session.listMfaFactors();
        const factor = factors?.find((f) => f.status === 'verified') ?? factors?.[0];
        if (cancelled) return;
        if (!factor) {
          setLoadError(t('errors.unexpected_error'));
        } else {
          setFactorId(factor.id);
        }
      } catch (e) {
        if (cancelled) return;
        logError('MFA list factors error:', e.message || e);
        setLoadError(getAuthErrorMessage(e));
      } finally {
        if (!cancelled) setLoadingFactor(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

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

  const handleDisable = async () => {
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
      await session.verifyMfa({ factorId, challengeId: challenge.challengeId, code });
      // unenrollMfa() also refreshes session state (session.mfa.enabled ->
      // false) — see managers/sessionManager.js.
      await session.unenrollMfa({ factorId });
      onDisabled?.();
    } catch (e) {
      logError('MFA disable error:', e.message || e);
      setOtpError(getAuthErrorMessage(e));
      setOtp(Array.from({ length: OTP_LENGTH }, () => ''));
      inputsRef.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;
    return {
      modalWidth: isWebLandscape ? scale(420) : '90%',
      borderRadius: scale(12),
      padding: isWebLandscape ? scale(28) : scale(22),
      titleFont: scale(19),
      subtitleFont: scale(14),
      otpCellHeight: scale(56),
      otpCellFontSize: scale(20),
      btnHeight: scale(52),
      gap: scale(14),
      closeIconSize: scale(18),
    };
  }, [isWebLandscape, height]);

  const handleClose = () => {
    if (verifying) return;
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={handleClose}>
      {visible && (
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })}>
            <View
              style={{
                width: sizes.modalWidth,
                backgroundColor: theme.backgroundColor,
                borderRadius: sizes.borderRadius,
                padding: sizes.padding,
              }}
            >
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: sizes.padding / 2,
                  [isRTL ? 'left' : 'right']: sizes.padding / 2,
                  zIndex: 10,
                }}
                onPress={handleClose}
              >
                <Image
                  source={icons.cross}
                  style={{ width: sizes.closeIconSize, height: sizes.closeIconSize, tintColor: theme.textColor }}
                />
              </TouchableOpacity>

              <Text
                style={{
                  fontSize: sizes.titleFont,
                  fontFamily: 'Rubik-Bold',
                  color: theme.textColor,
                  textAlign: 'center',
                  marginBottom: 8,
                }}
              >
                {t('my_profile.security.disable_modal_title')}
              </Text>
              <Text
                style={{
                  fontSize: sizes.subtitleFont,
                  color: theme.unactiveTextColor,
                  textAlign: 'center',
                  marginBottom: sizes.gap,
                }}
              >
                {t('my_profile.security.disable_modal_subtitle')}
              </Text>

              {loadingFactor ? (
                <ActivityIndicator size='large' color={theme.primaryColor} />
              ) : loadError ? (
                <Text style={{ color: theme.errorTextColor, textAlign: 'center' }}>{loadError}</Text>
              ) : (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: sizes.gap }}>
                    {otp.map((digit, idx) => (
                      <CustomTextInput
                        key={idx}
                        ref={(ref) => (inputsRef.current[idx] = ref)}
                        style={{
                          width: `${100 / OTP_LENGTH - 2}%`,
                          height: sizes.otpCellHeight,
                          fontSize: sizes.otpCellFontSize,
                          borderWidth: 1,
                          borderRadius: 8,
                          textAlign: 'center',
                          fontFamily: 'Rubik-Medium',
                          borderColor: otpError ? theme.errorTextColor : theme.borderColor,
                          color: theme.formInputTextColor,
                          backgroundColor: theme.formInputBackground,
                        }}
                        keyboardType='number-pad'
                        maxLength={1}
                        value={digit}
                        onChangeText={(text) => onChangeOtpCell(text, idx)}
                        onKeyPress={(e) => onKeyPressOtp(e, idx)}
                      />
                    ))}
                  </View>

                  {!!otpError && (
                    <Text style={{ color: theme.errorTextColor, textAlign: 'center', marginBottom: sizes.gap }}>
                      {otpError}
                    </Text>
                  )}

                  <TouchableOpacity
                    onPress={handleDisable}
                    disabled={verifying || otp.join('').length !== OTP_LENGTH}
                    style={{
                      height: sizes.btnHeight,
                      borderRadius: sizes.borderRadius / 1.5,
                      borderWidth: 1.5,
                      borderColor: theme.errorTextColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: verifying || otp.join('').length !== OTP_LENGTH ? 0.6 : 1,
                    }}
                  >
                    {verifying ? (
                      <ActivityIndicator color={theme.errorTextColor} />
                    ) : (
                      <Text style={{ color: theme.errorTextColor, fontFamily: 'Rubik-Medium', fontSize: 16 }}>
                        {t('my_profile.security.disable_confirm_button')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </View>
      )}
    </Modal>
  );
}
