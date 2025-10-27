import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './../utils/supabase/supabase';
import { API_BASE_URL } from '../utils/config';
import { getRevealedUsers, revealUser } from '../src/api/users';

// ⚠️ Замени этот IP на свой (или 10.0.2.2 для Android эмулятора)
// const SERVER_URL =
//   Platform.OS === 'web' ? 'http://localhost:3000' : 'http://10.0.2.2:3000';

export default function sessionManager() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [revealedUsers, setRevealedUsers] = useState([]); // для хранения ID пользователей с раскрытыми контактами
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
        console.log(data.session);


        if (error) {
          // console.error('Ошибка восстановления сессии:', error.message);
          return;
        }

        // data.session уже будет с обновлённым токеном, если refresh прошёл
        await saveSession(data.session);
        setSession(parsed);
        console.log('Сессия восстановлена:', parsed);

        // Загружаем профиль пользователя
        await fetchUserProfile(parsed.access_token);
        await refreshRevealedUsers({ token: { access_token: parsed.access_token }, serverURL: API_BASE_URL });
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
      throw new Error(`Ошибка проверки кода: ${error.message}`);
    } else {
      console.log('Успешный вход:', data);
      await saveSession(data.session);

      // Загружаем профиль пользователя
      await fetchUserProfile(data.session.access_token);
      await refreshRevealedUsers(data.session);
    }
  }

  // Запрашиваем профиль с сервера
  async function fetchUserProfile(token) {
    try {
      const res = await fetch(`${API_BASE_URL}/users/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        throw new Error('Ошибка загрузки профиля');
      }

      const { profile, subscription } = await res.json();
      console.log('Профиль пользователя:', profile);
      console.log('Подписка пользователя:', subscription);

      setUser(profile);
      setSubscription(subscription);

    } catch (err) {
      // console.error('Ошибка запроса профиля:', err.message);
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
      const res = await fetch(`${API_BASE_URL}/users/me`, {
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
      const res = await fetch(`${API_BASE_URL}/users/me`, {
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

  function isHasSubscription() {
    if (!subscription) return false;

    const currentDate = new Date();
    const expiryDate = new Date(subscription.expiry);
    return expiryDate > currentDate;
  }

  async function refreshRevealedUsers(sessionProps = null) {
    try {
      const revealed = await getRevealedUsers(sessionProps || session);
      setRevealedUsers(revealed.map((user) => user.id));
    }
    catch (error) {
      console.error('Error refreshing revealed users:', error);
    }
  }

  // Reveal user contacts
  async function tryReveal(userId) {
    if (revealedUsers.includes(userId)) {
      return;
    }

    try {
      const data = await revealUser(userId, { token: { access_token: session.access_token }, serverURL: API_BASE_URL });
      if (data.user) {
        setRevealedUsers((prev) => [...prev, userId]);
        return { user: data.user };
      } else if (data.paymentUrl) {
        return { paymentUrl: data.paymentUrl };
      }
    } catch (error) {
      console.error('Error revealing user contacts:', error);
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
      serverURL: API_BASE_URL,
    },
    user: {
      current: user,
      update: updateUser,
      delete: deleteUser,
    },
    subscription: {
      current: subscription,
      isActive: isHasSubscription(),
    },
    usersReveal: {
      list: revealedUsers,
      contains: (userId) => subscription != null || revealedUsers.includes(userId),
      tryReveal,
      refresh: refreshRevealedUsers,
      appendRevealed: (userId) => {
        if (revealedUsers.includes(userId)) return;
        setRevealedUsers((prev) => [...prev, userId]);
      },
    }
  }
}
