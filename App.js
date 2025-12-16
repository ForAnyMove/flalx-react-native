import { StatusBar } from 'expo-status-bar';
import { StyleSheet, ActivityIndicator, View, Text } from 'react-native';
import { useState } from 'react';
import {
  ComponentProvider,
  useComponentContext,
} from './context/globalAppContext';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform } from 'react-native';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Экраны
import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import RegisterScreen from './screens/RegisterScreen';
import AppScreen from './screens/AppScreen';
import { WindowProvider } from './context/windowContext';
import { useFonts } from 'expo-font';
import { WebViewProvider } from './context/webViewContext';
import { GlobalWebScreen } from './screens/GlobalWebScreen';
import { WebSocketProvider } from './context/webSocketContext';
import { GlobalNotificationHandler, NotificationProvider } from './src/render';
import AuthScreenWithPass from './screens/AuthScreenWithPass';
import RegisterScreenWithPass from './screens/RegisterScreenWithPass';
import LoadingStub from './screens/LoaderScreen';
import ForgottenPasswordScreen from './screens/ForgottenPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';

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
    authControl,
    forgotPassControl,
  } = useComponentContext();
  const [isOnboardingShowed, setOnboardingShowed] = useState(false);
  const [onboardingStatusChecked, setOnboardingStatusChecked] = useState(false);

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
        console.error('Failed to load onboarding status', e);
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
      console.error('Failed to save onboarding status', e);
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
  else if (!session.status) {
  // Авторизация с OTP
    if (authControl.state) {
      content = <AuthScreen />;
    } else {
      content = <AuthScreenWithPass />;
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
    content = <RegisterScreenWithPass />;
  }
  // Регистрация перед входом
  if (forgotPassControl.state) {
    content = <ForgottenPasswordScreen />;
  }
  if (session.resetPassword) {
    content = <ResetPasswordScreen />;
  }
  
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <WebViewProvider>
          {isLoader ? <LoadingStub /> : content}
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
