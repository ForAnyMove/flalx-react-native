import { StatusBar } from "expo-status-bar";
import { StyleSheet, ActivityIndicator, View } from "react-native";
import { useState, useEffect } from "react";
import { ComponentProvider, useComponentContext } from "./context/globalAppContext";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

// Экраны
import AuthScreen from "./screens/AuthScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import RegisterScreen from "./screens/RegisterScreen";
import AppScreen from "./screens/AppScreen";

export default function AppWrapper() {
  return (
    <ComponentProvider>
      <App />
    </ComponentProvider>
  );
}

function App() {
  const { session, user } = useComponentContext();
  const [isOnboardingShowed, setOnboardingShowed] = useState(false);
  const [loading, setLoading] = useState(true);

  // ждем пока sessionManager загрузит данные
  useEffect(() => {
    // Небольшая задержка имитации загрузки (например, пока сессия восстанавливается)
    const timeout = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timeout);
  }, [session, user]);

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  let content;

  // 1. Онбординг
  if (!isOnboardingShowed) {
    content = <OnboardingScreen onFinish={() => setOnboardingShowed(true)} />;
  }
  // 2. Авторизация
  else if (!session.status) {
    content = <AuthScreen />;
  }
  // 3. Регистрация первого входа
  else if (user?.current?.firstauth) {
    content = <RegisterScreen />;
  }
  // 4. Основное приложение
  else {
    content = <AppScreen />;
  }

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
