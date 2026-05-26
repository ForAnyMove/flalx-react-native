import { useState } from 'react';

export default function authTabsManager() {
  const [isRegisterNewUser, setRegisterNewUser] = useState(false);
  const [registerStep, setRegisterStep] = useState('email'); // 'email' или 'sms'
  const [isOTPAuth, setOTPAuth] = useState(false);
  const [forgottenPasswordScreen, setForgottenPasswordScreen] = useState(false);

  return {
    registerControl: {
      state: isRegisterNewUser,
      step: registerStep,
      nextStep: () => setRegisterStep('sms'),
      previousStep: () => setRegisterStep('email'),
      goToRegisterScreen: () => setRegisterNewUser(true),
      leaveRegisterScreen: () => setRegisterNewUser(false),
    },
    authControl: {
      state: isOTPAuth,
      switch: () => setOTPAuth((prev) => !prev),
    },
    forgotPassControl: {
      state: forgottenPasswordScreen,
      switch: () => setForgottenPasswordScreen((prev) => !prev)
    }
  };
}
