import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import { useWindowInfo } from '../../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import Step3_PhoneVerify from './Step3_PhoneVerify';
import AppHeading from '../../components/ui/AppHeading';
import { getAuthErrorMessage } from '../../src/auth/authErrors';
import { logError } from '../../utils/log_util';

/**
 * Mid-app MFA verification — shown whenever the backend says
 * `nextStep: 'mfa_verification_required'` (session exists at aal1 but policy
 * now demands aal2), which can happen well after login if the backend's MFA
 * policy changes while the user is already using the app. This is distinct
 * from the login-time `mfa_required` flow handled inline by
 * MultiStepLoginScreen — that one always has a live login response with
 * `mfa.availableFactors`; this one may not, so it falls back to
 * `GET /auth/mfa/factors` itself.
 *
 * On successful verify, session.verifyMfa() refreshes the session (nextStep
 * becomes 'authenticated') and App.js reactively moves the app forward —
 * this screen doesn't need to navigate anywhere itself.
 */
export default function MfaVerifyScreen() {
  const { t } = useTranslation();
  const { session, themeController } = useComponentContext();
  const theme = themeController.current;
  const { height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = useMemo(() => {
    const scale = isWebLandscape
      ? (s) => scaleByHeight(s, height)
      : (s) => scaleByHeightMobile(s, height);
    return {
      mfaGap: scale(12),
      mfaTitleFontSize: scale(18),
      mfaTitleMarginBottom: scale(12),
      factorBtnBorderRadius: scale(8),
      factorBtnPaddingVertical: scale(14),
      factorBtnPaddingHorizontal: scale(24),
      factorBtnMinWidth: scale(220),
      logoutMarginTop: scale(16),
    };
  }, [isWebLandscape, height]);

  const [step, setStep] = useState('loading'); // loading | select | verify
  const [factors, setFactors] = useState([]);
  const [factor, setFactor] = useState(null);
  const [challengeId, setChallengeId] = useState(null);
  const [error, setError] = useState(null);

  const selectFactor = useCallback(async (f) => {
    setError(null);
    try {
      const ch = await session.challengeMfa({ factorId: f.id });
      setFactor(f);
      setChallengeId(ch.challengeId);
      setStep('verify');
    } catch (e) {
      logError('MFA challenge error:', e.message || e);
      setError(getAuthErrorMessage(e));
      setStep('select');
    }
  }, [session]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setStep('loading');
      setError(null);
      try {
        let available = session.mfa?.availableFactors;
        if (!available || available.length === 0) {
          const { factors: all } = await session.listMfaFactors();
          available = (all || [])
            .filter((f) => f.status === 'verified')
            .map((f) => ({ id: f.id, type: f.type, phone: f.phone }));
        }
        if (cancelled) return;

        setFactors(available);
        if (available.length === 1) {
          await selectFactor(available[0]);
        } else {
          setStep('select');
        }
      } catch (e) {
        if (cancelled) return;
        logError('MFA factor lookup error:', e.message || e);
        setError(getAuthErrorMessage(e));
        setStep('select');
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async (code) => {
    try {
      await session.verifyMfa({ factorId: factor.id, challengeId, code });
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  };

  const handleResend = async () => {
    try {
      const ch = await session.challengeMfa({ factorId: factor.id });
      setChallengeId(ch.challengeId);
      return { success: true };
    } catch (e) {
      return { success: false, error: getAuthErrorMessage(e) };
    }
  };

  if (step === 'loading') {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <ActivityIndicator size='large' color={theme.primaryColor} />
      </View>
    );
  }

  if (step === 'select') {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
        <View style={[styles.centerBlock, { gap: sizes.mfaGap }]}>
          <AppHeading level={2} style={[styles.title, { color: theme.unactiveTextColor, fontSize: sizes.mfaTitleFontSize, marginBottom: sizes.mfaTitleMarginBottom }]}>
            {t('auth.select_factor')}
          </AppHeading>
          {factors.map((f) => (
            <TouchableOpacity
              key={f.id}
              onPress={() => selectFactor(f)}
              accessibilityRole="button"
              accessibilityLabel={f.type === 'phone' ? (f.phone || t('auth.phone_label')) : f.type.toUpperCase()}
              style={[
                styles.factorBtn,
                {
                  borderColor: theme.primaryColor,
                  borderRadius: sizes.factorBtnBorderRadius,
                  paddingVertical: sizes.factorBtnPaddingVertical,
                  paddingHorizontal: sizes.factorBtnPaddingHorizontal,
                  minWidth: sizes.factorBtnMinWidth,
                },
              ]}
            >
              <Text style={{ color: theme.primaryColor, fontFamily: 'Rubik-Medium' }}>
                {f.type === 'phone' ? (f.phone || t('auth.phone_label')) : f.type.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
          {!!error && (
            <Text style={{ color: theme.errorTextColor, textAlign: 'center' }}>{error}</Text>
          )}
          <TouchableOpacity
            onPress={() => session.logout()}
            accessibilityRole="button"
            accessibilityLabel={t('auth.back_to_sign_in') || 'Back to sign in'}
            style={{ marginTop: sizes.logoutMarginTop }}
          >
            <Text style={{ color: theme.formInputLabelColor, textDecorationLine: 'underline' }}>
              {t('auth.back_to_sign_in')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isTotp = factor?.type === 'totp';

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <Step3_PhoneVerify
        phone={factor?.phone || ''}
        onVerify={handleVerify}
        onResend={handleResend}
        onBack={() => session.logout()}
        backLabel={t('auth.back_to_sign_in')}
        // A TOTP factor has no phone it was "sent" to and no SMS resend.
        title={isTotp ? t('auth.mfa_verify_title') : undefined}
        subtitle={isTotp ? t('auth.mfa_verify_subtitle') : undefined}
        showResend={!isTotp}
      />
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
  },
  title: {
    fontFamily: 'Rubik-SemiBold',
    textAlign: 'center',
  },
  factorBtn: {
    borderWidth: 1.5,
    alignItems: 'center',
  },
});
