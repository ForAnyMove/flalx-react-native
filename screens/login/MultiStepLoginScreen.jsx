import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import { logError, logInfo } from '../../utils/log_util';
import CustomPicker from '../../components/ui/CustomPicker';

import LoginStep1_EmailPassword from './LoginStep1_EmailPassword';
import LoginStep2_PhoneSetup from './LoginStep2_PhoneSetup';
import LoginStep3_VerifyCode from './LoginStep3_VerifyCode';
import { useWindowInfo } from '../../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';

export default function MultiStepLoginScreen({ onGoToRegister, onGoToForgottenPassword, skipMFA = false }) {
  const { t } = useTranslation();
  const { session, languageController } = useComponentContext();
  const isRTL = languageController.isRTL;
  const [step, setStep] = useState('email'); // email, phone_setup, verify_code, loading
  const [mfaData, setMfaData] = useState({
    phone: '',
    isExistingUserWithMfa: false,
  });
  const [error, setError] = useState(null);
  const { width, height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      skipBtnTop: isWebLandscape ? web(103) : mobile(10),
    };
  }, [isWebLandscape, height]);

  useEffect(() => {
    const checkMfaStatusOnMount = async () => {
      // Проверяем, есть ли сессия, но MFA еще не пройдена
      if (session.token && !session.mfaVerified) {
        handleEmailNext(); // Запускаем тот же флоу, что и после логина
      }
    };

    checkMfaStatusOnMount();
  }, [skipMFA]);

  const handleEmailNext = async () => {
    if (skipMFA) {
      session.setMfaAsVerified(true);
      return;
    }
    setStep('loading');
    setError(null);
    try {
      const { success, data, error: apiError } = await session.getMfaStatus();
      if (!success) {
        throw new Error(apiError || 'Failed to get MFA status');
      }

      if (data.mfa_enabled && data.phone) {
        // MFA is enabled, send login code
        const sendResult = await session.sendMfaLoginCode();
        if (sendResult.success) {
          setMfaData({ phone: data.phone, isExistingUserWithMfa: true });
          setStep('verify_code');
        } else {
          // Handle error, maybe show a popup
          throw new Error(sendResult.error || 'Failed to send login code');
        }
      } else {
        // MFA not set up, go to phone setup
        setMfaData({ phone: '', isExistingUserWithMfa: false });
        setStep('phone_setup');
      }
    } catch (e) {
      logError('MFA Flow Error:', e);
      setError(e.message);
      setStep('email'); // Go back to email step on error
    }
  };

  const handlePhoneSetupNext = (phone) => {
    setMfaData({ phone, isExistingUserWithMfa: false });
    setStep('verify_code');
  };

  const handleVerifySuccess = () => {
    logInfo("MFA verified, logging in.");
    // The session manager now handles setting the mfaVerified flag,
    // which App.js will use to navigate.
  };

  const handleBack = () => {
    session.signOut();
    setStep('email');
  };

  const renderStep = () => {
    switch (step) {
      case 'loading':
        return <ActivityIndicator />;
      case 'email':
        return (
          <LoginStep1_EmailPassword
            onNext={handleEmailNext}
            onGoToRegister={onGoToRegister}
            onGoToForgottenPassword={onGoToForgottenPassword}
            apiError={error}
          />
        );
      case 'phone_setup':
        return (
          <LoginStep2_PhoneSetup
            onNext={handlePhoneSetupNext}
            onBack={handleBack}
          />
        );

      case 'verify_code':
        return (
          <LoginStep3_VerifyCode
            phone={mfaData.phone}
            isExistingUserWithMfa={mfaData.isExistingUserWithMfa}
            onNext={handleVerifySuccess}
            onBack={() => setStep(mfaData.isExistingUserWithMfa ? 'email' : 'phone_setup')}
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
});
