import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, use } from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  View,
  Text,
  TextInput,
} from 'react-native';
import {
  ComponentProvider,
  useComponentContext,
} from './context/globalAppContext';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomTextInput from './components/ui/CustomTextInput';

// Экраны
import OnboardingScreen from './screens/OnboardingScreen';
import RegisterScreen from './screens/RegisterScreen';
import AppScreen from './screens/AppScreen';
import { useWindowInfo, WindowProvider } from './context/windowContext';
import { useFonts } from 'expo-font';
import { WebViewProvider } from './context/webViewContext';
import { GlobalWebScreen } from './screens/GlobalWebScreen';
import { WebSocketProvider } from './context/webSocketContext';
import { GlobalNotificationHandler, NotificationProvider } from './src/render';
import LoadingStub from './screens/LoaderScreen';
import ForgottenPasswordScreen from './screens/ForgottenPasswordScreen';
import MultiStepLoginScreen from './screens/login/MultiStepLoginScreen';
import MultiStepRegisterScreen from './screens/register/MultiStepRegisterScreen';
import MfaSetupScreen from './screens/register/MfaSetupScreen';
import { logError } from './utils/log_util';
import usePushNotifications from './managers/pushNotificationsManager';

// // --- Безопасная глобальная подмена TextInput ---
// const originalCreateElement = React.createElement;
// React.createElement = (type, props, ...children) => {
//   if (type === TextInput) {
//     return originalCreateElement(CustomTextInput, props, ...children);
//   }
//   return originalCreateElement(type, props, ...children);
// };

// --- Глобальное применение шрифта ---
const originalTextRender = Text.render;
Text.render = function render(props, ref) {
  // Проверяем, не задан ли уже fontFamily в стилях
  const style = StyleSheet.flatten(props.style) || {};
  const fontFamily = style.fontFamily || 'Rubik-Medium'; // По умолчанию Rubik-Medium

  const newProps = {
    ...props,
    style: [style, { fontFamily }], // Применяем либо существующий, либо дефолтный
  };
  return originalTextRender.call(this, newProps, ref);
};

export default function AppWrapper() {
  return (
    <ComponentProvider>
      <NotificationProvider>
        <WindowProvider>
          <App />
        </WindowProvider>
        <GlobalNotificationHandler />
      </NotificationProvider>
    </ComponentProvider>
  );
}

function App() {
  const {
    session,
    user,
    themeController,
    languageController,
    isLoader,
    registerControl,
    forgotPassControl,
  } = useComponentContext();

  usePushNotifications({ session });
  const [isOnboardingShowed, setOnboardingShowed] = useState(false);
  const [onboardingStatusChecked, setOnboardingStatusChecked] = useState(false);
  const { width, height, isLandscape, isKeyboardVisible, focusedInputs } =
    useWindowInfo();

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        let status;
        if (Platform.OS === 'web') {
          status = localStorage.getItem('onboarding_completed');
        } else {
          status = await AsyncStorage.getItem('onboarding_completed');
        }
        if (status === 'true') {
          setOnboardingShowed(true);
        }
      } catch (e) {
        logError('Failed to load onboarding status', e);
      } finally {
        setOnboardingStatusChecked(true);
      }
    };

    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        *:focus {
          outline: none !important;
        }
        input:focus,
        textarea:focus {
          outline: none !important;
        }
        [data-focusable="true"]:focus {
          outline: none !important;
        }
      `;
      document.head.append(style);
    }
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    'Rubik-Regular': require('./assets/fonts/static/Rubik-Regular.ttf'),
    'Rubik-SemiBold': require('./assets/fonts/static/Rubik-SemiBold.ttf'),
    'Rubik-Bold': require('./assets/fonts/static/Rubik-Bold.ttf'),
    'Rubik-Medium': require('./assets/fonts/static/Rubik-Medium.ttf'),
  });

  // проверяем готовность всех данных
  const isReady =
    session !== undefined &&
    user !== undefined &&
    languageController?.current !== undefined &&
    (fontsLoaded || fontError) &&
    onboardingStatusChecked;

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <View style={styles.loader}>
            {/* <ActivityIndicator
              size='large'
              color={themeController?.current?.primaryColor || 'blue'}
            /> */}
            <LoadingStub />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const handleOnboardingFinish = async () => {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem('onboarding_completed', 'true');
      } else {
        await AsyncStorage.setItem('onboarding_completed', 'true');
      }
      setOnboardingShowed(true);
    } catch (e) {
      logError('Failed to save onboarding status', e);
      // Fallback for current session
      setOnboardingShowed(true);
    }
  };

  let content;

  // 1. Онбординг
  if (!isOnboardingShowed) {
    content = <OnboardingScreen onFinish={handleOnboardingFinish} />;
  }
  // 2. Авторизация
  else if (!(session.status && session.mfaVerified)) {
    // Authenticated at aal1 but the backend forces MFA setup before app access.
    if (session.status && session.mfaSetup?.required) {
      content = <MfaSetupScreen optional={false} onDone={() => {}} />;
    } else {
      content = (
        <MultiStepLoginScreen
          onGoToRegister={(method) => registerControl.goToRegisterScreen(method)}
          onGoToForgottenPassword={() => forgotPassControl.switch()}
        />
      );
    }
  }

  // 3. Регистрация первого входа
  else if (user?.current?.firstauth) {
    content = <RegisterScreen />;
  }
  // 4. Основное приложение
  else {
    content = (
      <WebSocketProvider>
        <AppScreen />
      </WebSocketProvider>
    );
  }
  // Регистрация перед входом
  if (registerControl.state) {
    content = <MultiStepRegisterScreen initialMethod={registerControl.initialMethod} />;
  }
  if (forgotPassControl.state) {
    content = <ForgottenPasswordScreen />;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: themeController.current.backgroundColor },
        ]}
      >
        <WebViewProvider>
          {isLoader ? <LoadingStub /> : content}
          {/* <View style={{ position: 'absolute', top: '15%', right: 0, zIndex: 999999999 }}>
            <Text>Width: {width}</Text>
            <Text>Height: {height}</Text>
            <Text>Landscape: {isLandscape ? 'Yes' : 'No'}</Text>
            <Text>Is Keyboard Visible: {isKeyboardVisible ? 'Yes' : 'No'}</Text>
            <Text>Focused Inputs: {focusedInputs.length}</Text>
          </View> */}
          <GlobalWebScreen />
          <StatusBar style='auto' />
        </WebViewProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
