import { StatusBar } from "expo-status-bar";
import { StyleSheet, ActivityIndicator, View, Text } from "react-native";
import { useState } from "react";
import { ComponentProvider, useComponentContext } from "./context/globalAppContext";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// Экраны
import AuthScreen from "./screens/AuthScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import RegisterScreen from "./screens/RegisterScreen";
import AppScreen from "./screens/AppScreen";
import { WindowProvider } from "./context/windowContext";
import { useFonts } from 'expo-font';

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
      <WindowProvider>
        <App />
      </WindowProvider>
    </ComponentProvider>
  );
}

function App() {
  const { session, user, themeController, languageController } = useComponentContext();
  const [isOnboardingShowed, setOnboardingShowed] = useState(false);

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
    (fontsLoaded || fontError);

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <View style={styles.loader}>
            <ActivityIndicator
              size="large"
              color={themeController?.current?.primaryColor || "blue"}
            />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  let content;
// console.log('!isOnboardingShowed - ', !isOnboardingShowed, '!session.status - ', !session.status, 'user?.current?.firstauth - ', user?.current?.firstauth);

  // 1. Онбординг
  // if (!isOnboardingShowed) {
  //   content = <OnboardingScreen onFinish={() => setOnboardingShowed(true)} />;
  // }
  // // 2. Авторизация
  // else
  //    if (!session.status) {
  //   content = <AuthScreen />;
  // }
  // // 3. Регистрация первого входа
  // else 
  //   if (user?.current?.firstauth) {
  //   content = <RegisterScreen />;
  // }
  // 4. Основное приложение
  // else {
    content = <AppScreen />;
  // }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {content}
        <StatusBar style="auto" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
