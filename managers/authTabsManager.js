import { useState } from 'react';

export default function authTabsManager() {
  const [isRegisterNewUser, setRegisterNewUser] = useState(false);
  const [forgottenPasswordScreen, setForgottenPasswordScreen] = useState(false);
  // Preselected registration method (e.g. 'email' when the user came from the
  // email login screen via "Create new user"). Null -> registration defaults
  // to phone, per the standard flow.
  const [registerInitialMethod, setRegisterInitialMethod] = useState(null);

  return {
    registerControl: {
      state: isRegisterNewUser,
      initialMethod: registerInitialMethod,
      goToRegisterScreen: (method = null) => {
        setRegisterInitialMethod(method);
        setRegisterNewUser(true);
      },
      leaveRegisterScreen: () => {
        setRegisterNewUser(false);
        setRegisterInitialMethod(null);
      },
    },
    forgotPassControl: {
      state: forgottenPasswordScreen,
      switch: () => setForgottenPasswordScreen((prev) => !prev)
    }
  };
}
