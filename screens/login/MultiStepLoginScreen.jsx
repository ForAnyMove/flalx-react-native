import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

import LoginStep1_EmailPassword from './LoginStep1_EmailPassword';
import LoginStep2_PhoneVerify from './LoginStep2_PhoneVerify';
import { logInfo } from '../../utils/log_util';

export default function MultiStepLoginScreen({ skipMFA = false, onGoToRegister, onGoToForgottenPassword }) {
  const [step, setStep] = useState('email'); // email, phone_verify
  const [loginData, setLoginData] = useState({
    phone: '',
    factorId: '',
    challengeId: '',
    // any other data needed between steps
  });

  const handleEmailNext = ({ phone, factorId, challengeId }) => {
    if (skipMFA) {
      // Handle direct login logic here, for now just log
      logInfo("Skipping MFA, logging in directly.");
    } else {
      setLoginData({ phone, factorId, challengeId });
      setStep('phone_verify');
    }
  };

  const handleVerifySuccess = () => {
    // Final login success logic is handled by sessionManager,
    // which will trigger a session update and app will navigate to main screen.
    logInfo("MFA verified, logging in.");
  };

  const handleBack = () => {
    setStep('email');
  };

  const renderStep = () => {
    switch (step) {
      case 'email':
        return <LoginStep1_EmailPassword
          onNext={handleEmailNext}
          onGoToRegister={onGoToRegister}
          onGoToForgottenPassword={onGoToForgottenPassword}
        />;
      case 'phone_verify':
        return (
          <LoginStep2_PhoneVerify
            phone={loginData.phone}
            factorId={loginData.factorId}
            challengeId={loginData.challengeId}
            onNext={handleVerifySuccess}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return <View style={styles.container}>{renderStep()}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
