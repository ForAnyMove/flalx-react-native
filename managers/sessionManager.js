import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './../utils/supabase/supabase';

// ⚠️ Замени этот IP на свой (или 10.0.2.2 для Android эмулятора)
const SERVER_URL =
  Platform.OS === 'web' ? 'http://localhost:3000' : 'http://10.0.2.2:3000';

export default function sessionManager() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState(null); // для verifyOtp

  // Загружаем сессию при старте
  useEffect(() => {
    loadSession();
  }, []);

  async function loadSession() {
    try {
      let savedSession;
      if (Platform.OS === 'web') {
        savedSession = localStorage.getItem('supabase_session');
      } else {
        savedSession = await AsyncStorage.getItem('supabase_session');
      }

      if (savedSession) {
        const parsed = JSON.parse(savedSession);

        // Проверяем актуальность токена
        const { data, error } = await supabase.auth.setSession(parsed);

        if (error) {
          console.error('Ошибка восстановления сессии:', error.message);
          return;
        }

        // data.session уже будет с обновлённым токеном, если refresh прошёл
        await saveSession(data.session);
        setSession(parsed);
        console.log('Сессия восстановлена:', parsed);

        // Загружаем профиль пользователя
        await fetchUserProfile(parsed.access_token);
      }
    } catch (e) {
      console.error('Ошибка загрузки сессии:', e);
      await signOut();
    }
  }

  async function saveSession(newSession) {
    try {
      setSession(newSession);
      if (Platform.OS === 'web') {
        localStorage.setItem('supabase_session', JSON.stringify(newSession));
      } else {
        await AsyncStorage.setItem(
          'supabase_session',
          JSON.stringify(newSession)
        );
      }
    } catch (e) {
      console.error('Ошибка сохранения сессии:', e);
    }
  }

  // Запросить код на email
  async function signInWithEmail(userEmail) {
    setEmail(userEmail); // сохраним email для дальнейшей проверки кода
    const { error } = await supabase.auth.signInWithOtp({ email: userEmail });
    if (error) {
      console.error('Ошибка при отправке кода:', error.message);
    } else {
      console.log('Код отправлен на email:', userEmail);
    }
  }

  // Проверка кода
  async function verifyOtp(code) {
    if (!email) {
      console.error('Email не установлен. Сначала вызови signInWithEmail().');
      return;
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });

    if (error) {
      console.error('Ошибка проверки кода:', error.message);
    } else {
      console.log('Успешный вход:', data);
      await saveSession(data.session);

      // Загружаем профиль пользователя
      await fetchUserProfile(data.session.access_token);
    }
  }

  // Запрашиваем профиль с сервера
  async function fetchUserProfile(token) {
    try {
      const res = await fetch(`${SERVER_URL}/users/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        throw new Error('Ошибка загрузки профиля');
      }

      const profile = await res.json();
      console.log('Профиль пользователя:', profile);
      setUser(profile);
    } catch (err) {
      console.error('Ошибка при запросе профиля:', err.message);
    }
  }

  // Выход
  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    if (Platform.OS === 'web') {
      localStorage.removeItem('supabase_session');
    } else {
      await AsyncStorage.removeItem('supabase_session');
    }
  }
  
  // Обновить данные пользователя
  async function updateUser(updates) {
    try {
      const res = await fetch(`${SERVER_URL}/users/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Ошибка обновления профиля");

      const updatedUser = await res.json();
      setUser(updatedUser); // обновляем локальное состояние
      console.log("Данные пользователя обновлены:", updatedUser);
      return updatedUser;
    } catch (err) {
      console.error("Ошибка updateUser:", err.message);
      throw err;
    }
  }

  // Удалить пользователя
  async function deleteUser() {
    try {
      const res = await fetch(`${SERVER_URL}/users/me`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!res.ok) throw new Error("Ошибка удаления пользователя");

      console.log("Пользователь удалён");

      // сразу выходим из аккаунта
      await signOut();
    } catch (err) {
      console.error("Ошибка deleteUser:", err.message);
      throw err;
    }
  }

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          await saveSession(session);
          setSession(session);
        } else {
          setSession(null);
          setUser(null);
        }
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  return {
    session: {
      status: !!session && !!user,
      token: session,
      sendCode: (email) => signInWithEmail(email),
      checkCode: (code) => verifyOtp(code),
      signOut,
      serverURL: SERVER_URL,
    },
    user: {
      current: user,
      update: updateUser,
      delete: deleteUser,
    },
  };
}
