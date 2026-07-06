import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import Step3_PhoneVerify from './Step3_PhoneVerify';
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
            <Text style={{ color: theme.errorTextColor, textAlign: 'center' }}>{error}</Text>
          )}
          <TouchableOpacity onPress={() => session.logout()} style={{ marginTop: 16 }}>
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
