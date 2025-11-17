import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './../utils/supabase/supabase';
import { API_BASE_URL } from '../utils/config';
import { getRevealedUsers, revealUser } from '../src/api/users';
import { getUserSubscription } from '../src/api/subscriptions';

// ⚠️ Замени этот IP на свой (или 10.0.2.2 для Android эмулятора)
// const SERVER_URL =
//   Platform.OS === 'web' ? 'http://localhost:3000' : 'http://10.0.2.2:3000';

export default function sessionManager() {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [revealedUsers, setRevealedUsers] = useState([]); // для хранения ID пользователей с раскрытыми контактами
  const [email, setEmail] = useState(null); // для verifyOtp

  const [isLoader, setLoader] = useState(true);

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
        await refreshRevealedUsers({
          token: { access_token: parsed.access_token },
          serverURL: API_BASE_URL,
        });
      }
    } catch (e) {
      console.error('Ошибка загрузки сессии:', e);
      await signOut();
    } finally {
      setLoader(false);
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
      return { success: false, error: error.message };
    } else {
      console.log('Код отправлен на email:', userEmail);
      return { success: true };
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

      try {
        // Загружаем профиль пользователя
        await fetchUserProfile(data.session.access_token);
        await refreshRevealedUsers(data.session);
      } catch (profileError) {
        console.error(
          'Ошибка загрузки профиля после входа:',
          profileError.message
        );
        // Выходим из системы, чтобы избежать несогласованного состояния
        await signOut();
        // Передаем ошибку дальше, чтобы UI мог ее обработать
        throw new Error('Не удалось загрузить профиль пользователя.');
      }
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
  async function updateUser(updates, token = null) {
    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token || session?.access_token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error('Ошибка обновления профиля');

      const updatedUser = await res.json();
      setUser(updatedUser); // обновляем локальное состояние
      console.log('Данные пользователя обновлены:', updatedUser);
      return updatedUser;
    } catch (err) {
      console.error('Ошибка updateUser:', err.message);
      throw err;
    }
  }

  // Удалить пользователя
  async function deleteUser() {
    try {
      const res = await fetch(`${API_BASE_URL}/users/me`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!res.ok) throw new Error('Ошибка удаления пользователя');

      console.log('Пользователь удалён');

      // сразу выходим из аккаунта
      await signOut();
    } catch (err) {
      console.error('Ошибка deleteUser:', err.message);
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
      const revealed = await getRevealedUsers(
        sessionProps || {
          token: { access_token: session.access_token },
          serverURL: API_BASE_URL,
        }
      );
      setRevealedUsers(revealed.map((user) => user.id));
    } catch (error) {
      console.error('Error refreshing revealed users:', error);
    }
  }

  async function refreshUserSubscription(sessionProps = null) {
    try {
      const { subscription } = await getUserSubscription(
        sessionProps || {
          token: { access_token: session.access_token },
          serverURL: API_BASE_URL,
        }
      );

      setSubscription(subscription);
    } catch (error) {
      console.error('Error refreshing user subscription:', error);
    }
  }

  // Reveal user contacts
  async function tryReveal(userId) {
    if (revealedUsers.includes(userId)) {
      return;
    }

    try {
      const data = await revealUser(userId, {
        token: { access_token: session.access_token },
        serverURL: API_BASE_URL,
      });
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

  // 🔐 Авторизация через email + пароль
  async function signInWithPassword(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Ошибка входа по паролю:', error.message);
        return { success: false, error: error.message };
      }

      console.log('Успешный вход с паролем:', data.session);

      // сохраняем сессию
      await saveSession(data.session);

      // Загружаем профиль
      await fetchUserProfile(data.session.access_token);
      await refreshRevealedUsers(data.session);

      return { success: true };
    } catch (e) {
      console.error('Ошибка signInWithPassword:', e.message);
      return { success: false, error: e.message };
    }
  }

  // Создание пользователя по email + password
  async function createUser(email, password, profileData = {}) {
    try {
      // 1. Регистрируем пользователя в Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Ошибка регистрации в Supabase:', error.message);
        return { success: false, error: error.message };
      }

      console.log('Пользователь создан:', data);

      // → data.session может быть null если email confirmation = ON
      const sessionData = data.session;

      if (!sessionData) {
        // Если сессия не вернулась — пользователь должен подтвердить email
        return {
          success: true,
          requiresEmailConfirmation: true,
          user: data.user,
        };
      }

      // 2. Сохраняем сессию (как после логина)
      await saveSession(sessionData);

      // 3. Загружаем профиль с сервера
      await fetchUserProfile(sessionData.access_token);

      // 4. Обновляем профиль сразу данными из формы
      //   (имя, фамилия, профессии и т.д.)
      if (Object.keys(profileData).length > 0) {
        await updateUser(profileData, sessionData.access_token);
      }

      // 5. Обновить список revealedUsers (как после логина)
      await refreshRevealedUsers(sessionData);

      return { success: true, user: data.user, session: sessionData };
    } catch (e) {
      console.error('Ошибка createUser:', e);
      return { success: false, error: e.message };
    }
  }

  // Смена существующего пароля
  async function changePassword(oldPassword, newPassword) {
    try {
      const email = user?.email;

      if (!email) return { success: false, error: 'User email not found' };

      // 1. Сохраняем основную сессию
      const mainSession = { ...session };

      // 2. Проверяем правильность старого пароля
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: oldPassword,
      });

      if (error) {
        // восстановить основную сессию
        await supabase.auth.setSession(mainSession);
        return {
          success: false,
          error: 'Old password is incorrect',
        };
      }

      // 3. Старый пароль верный — восстанавливаем основную сессию
      await supabase.auth.setSession(mainSession);

      // 4. Меняем пароль
      const { data: upd, error: updErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updErr) {
        return { success: false, error: updErr.message };
      }
      console.log('Password was changed successfully');

      return { success: true };
    } catch (e) {
      console.error('changePassword error:', e);
      return { success: false, error: e.message };
    }
  }

  // Создание нового пароля для OTP-пользователя
  async function createPassword(newPassword) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Ставим флаг is_password_exist в профиле (через твой API)
      try {
        await updateUser({ is_password_exist: true });
      } catch (e) {
        console.warn("Couldn't update profile flag is_password_exist");
      }

      return { success: true };
    } catch (e) {
      console.error('createPassword error:', e);
      return { success: false, error: e.message };
    }
  }

  return {
    session: {
      status: !!session && !!user,
      token: session,
      sendCode: (email) => signInWithEmail(email),
      signInWithPassword: (email, password) =>
        signInWithPassword(email, password),
      checkCode: (code) => verifyOtp(code),
      signOut,
      serverURL: API_BASE_URL,
      createUser: (email, password, profileData) =>
        createUser(email, password, profileData),
      changePassword: (oldPassword, newPassword) =>
        changePassword(oldPassword, newPassword),
      createPassword: (newPassword) => createPassword(newPassword),
    },
    user: {
      current: user,
      update: updateUser,
      delete: deleteUser,
    },
    subscription: {
      current: subscription,
      isActive: isHasSubscription(),
      refresh: () => refreshUserSubscription(),
    },
    usersReveal: {
      list: revealedUsers,
      contains: (userId) =>
        subscription != null || revealedUsers.includes(userId),
      tryReveal,
      refresh: refreshRevealedUsers,
      appendRevealed: (userId) => {
        if (revealedUsers.includes(userId)) return;
        setRevealedUsers((prev) => [...prev, userId]);
      },
    },
    isLoader: isLoader,
  };
}
