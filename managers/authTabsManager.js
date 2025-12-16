import { useState } from 'react';

export default function authTabsManager() {
  const [isRegisterNewUser, setRegisterNewUser] = useState(false);
  const [isOTPAuth, setOTPAuth] = useState(false);
  const [forgottenPasswordScreen, setForgottenPasswordScreen] = useState(false);

  return {
    registerControl: {
      state: isRegisterNewUser,
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
