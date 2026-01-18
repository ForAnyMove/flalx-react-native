import { useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './../utils/supabase/supabase';
import { API_BASE_URL } from '../utils/config';
import { getRevealedUsers, getRevealProduct, revealUser } from '../src/api/users';
import { getUserSubscription } from '../src/api/subscriptions';

// ⚠️ Замени этот IP на свой (или 10.0.2.2 для Android эмулятора)
// const SERVER_URL =
//   Platform.OS === 'web' ? 'http://localhost:3000' : 'http://10.0.2.2:3000';

export default function sessionManager() {
  const [session, setSession] = useState(null);
  const [trialSession, setTrialSession] = useState(null);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [revealedUsers, setRevealedUsers] = useState([]); // для хранения ID пользователей с раскрытыми контактами
  const [revealProduct, setRevealProduct] = useState(null);
  const [email, setEmail] = useState(null); // для verifyOtp
  const [phone, setPhone] = useState(null); // для verifyOtp с телефоном
  const [isInPasswordReset, setIsInPasswordReset] = useState(false);
  const preResetAuthCall = useRef(false);

  const [isLoader, setLoader] = useState(true);

  function clearSupabaseStorage() {
    if (Platform.OS === 'web') {
      // Удаляем кастомную сессию
      localStorage.removeItem('supabase_session');

      // Удаляем все sb-*-auth-token
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
      });
    } else {
      // React Native: удаляем через AsyncStorage

      AsyncStorage.removeItem('supabase_session');

      AsyncStorage.getAllKeys().then((keys) => {
        const sbKeys = keys.filter(
          (k) => k.startsWith('sb-') && k.endsWith('-auth-token')
        );
        if (sbKeys.length > 0) {
          AsyncStorage.multiRemove(sbKeys);
        }
      });
    }
  }
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handler = () => {
      if (preResetAuthCall.current || isInPasswordReset) {
        console.log('Clearing Supabase storage on page unload (WEB)');
        clearSupabaseStorage();
      }
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isInPasswordReset]);

  // Загружаем сессию при старте
  useEffect(() => {
    loadSession();
  }, []);

  // useEffect(() => {
  //   if (Platform.OS === "web") return;

  //   const sub = AppState.addEventListener("change", (state) => {
  //     if (state === "background") {
  //       if (preResetAuthCall.current || isInPasswordReset) {
  //         console.log("Clearing Supabase storage (RN background)");
  //         clearSupabaseStorage();
  //       }
  //     }
  //   });

  //   return () => sub.remove();
  // }, [isInPasswordReset]);

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
        console.log('save session in load session, ', savedSession, parsed);

        await saveSession(data.session);
        setSession(parsed);
        console.log('Сессия восстановлена:', parsed);

        // Загружаем профиль пользователя
        await fetchUserProfile(parsed.access_token);
        await refreshRevealedUsers({
          token: { access_token: parsed.access_token },
          serverURL: API_BASE_URL,
        });
        await refreshRevealProduct({
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
    console.log('save session');

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
  // Запросить код на email
  async function resetPasswordWithEmail(userEmail, options = {}) {
    setEmail(userEmail); // сохраним email для дальнейшей проверки кода
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: 'flalx://reset-password', // deep link
    });
    if (error) {
      console.error('Ошибка при отправке кода:', error.message);
      return { success: false, error: error.message };
    } else {
      console.log('Код отправлен на email:', userEmail);
      return { success: true };
    }
  }

  // Запросить код на телефон
  async function resetPasswordWithPhone(userPhone) {
    setPhone(userPhone); // сохраним телефон для дальнейшей проверки кода
    const { error } = await supabase.auth.signInWithOtp({
      phone: userPhone,
    });
    if (error) {
      console.error('Ошибка при отправке SMS:', error.message);
      return { success: false, error: error.message };
    } else {
      console.log('SMS отправлено на номер:', userPhone);
      return { success: true };
    }
  }

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      console.log('Пользователь открыл ссылку восстановления');
      setIsInPasswordReset(true); // поместить в контекст
    }
  });

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
        await refreshRevealProduct(data.session);
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

  // >>> MFA (Multi-Factor Authentication) FUNCTIONS <<<

  /**
   * Шаг 1: Регистрация телефона как второго фактора
   * @param {string} phone - Номер телефона в формате E.164 (например, +79991234567)
   */
  async function enrollPhoneNumber(phone) {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'phone',
        phone: phone,
      });

      if (error) {
        console.error('MFA Enroll Error:', error.message);
        return { success: false, error: error.message };
      }

      console.log('MFA Enroll Success:', data);
      return { success: true, factorId: data.id };
    } catch (e) {
      console.error('MFA Enroll Exception:', e);
      return { success: false, error: String(e) };
    }
  }

  /**
   * Шаг 2: Отправка СМС с кодом верификации
   * @param {string} factorId - ID фактора, полученный на шаге enroll
   */
  async function challengePhoneNumber(factorId) {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: factorId,
      });

      if (error) {
        console.error('MFA Challenge Error:', error.message);
        return { success: false, error: error.message };
      }

      console.log('MFA Challenge Success:', data);
      return { success: true, challengeId: data.id };
    } catch (e) {
      console.error('MFA Challenge Exception:', e);
      return { success: false, error: String(e) };
    }
  }

  /**
   * Шаг 3: Проверка кода из СМС
   * @param {string} factorId - ID фактора
   * @param {string} challengeId - ID вызова, полученный на шаге challenge
   * @param {string} code - Код из СМС
   */
  async function verifyPhoneNumber(factorId, challengeId, code) {
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeId,
        code: code,
      });

      if (error) {
        console.error('MFA Verify Error:', error.message);
        return { success: false, error: error.message };
      }

      console.log('MFA Verify Success: User session now has aal2.');
      // Сессия автоматически обновляется, пересохранять не нужно,
      // но можно обновить стейт, если потребуется
      const { data: { session } } = await supabase.auth.getSession();
      await saveSession(session);

      return { success: true };
    } catch (e) {
      console.error('MFA Verify Exception:', e);
      return { success: false, error: String(e) };
    }
  }


  // >>> END MFA FUNCTIONS <<<


  // Проверка кода
  async function verifyOtpResetPassword(code) {
    if (!email) {
      console.error('Email не установлен. Сначала вызови signInWithEmail().');
      return;
    }

    preResetAuthCall.current = true;
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });

    if (error) {
      console.error('Ошибка проверки кода:', error.message);
      throw new Error(`Ошибка проверки кода: ${error.message}`);
    } else {
      console.log('Код принят:', data);
      setTrialSession(data.session);

      setIsInPasswordReset(true);
    }
  }

  // Обновление пароля (используется в сбросе пароля)
  async function updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Ошибка обновления пароля:', error.message);
      return { success: false, error: error.message };
    }

    console.log('Пароль успешно обновлен:', data);
    // После успешного обновления выходим из системы,
    // чтобы пользователь мог войти с новым паролем.
    await signOut();
    return { success: true };
  }

  // Проверка SMS кода для сброса пароля
  async function verifyOtpResetPasswordWithPhone(code) {
    if (!phone) {
      console.error(
        'Телефон не установлен. Сначала вызови resetPasswordWithPhone().'
      );
      return;
    }

    preResetAuthCall.current = true;
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });

    if (error) {
      console.error('Ошибка проверки SMS кода:', error.message);
      throw new Error(`Ошибка проверки SMS кода: ${error.message}`);
    } else {
      console.log('Код принят:', data);
      setTrialSession(data.session);
      setIsInPasswordReset(true);
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

  // Сброс пароля (новая функция)
  async function resetPassword(newPassword) {
    if (!trialSession) {
      return { success: false, error: 'No temporary session for password reset.' };
    }
    // Устанавливаем временную сессию для сброса
    await supabase.auth.setSession(trialSession);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    // Сбрасываем состояние после попытки
    setTrialSession(null);
    setIsInPasswordReset(false);
    preResetAuthCall.current = false;

    if (error) {
      console.error('Ошибка сброса пароля:', error.message);
      // Важно выйти из системы, даже если была ошибка,
      // чтобы не остаться в некорректной сессии
      await signOut();
      return { success: false, error: error.message };
    }

    console.log('Пароль успешно сброшен.');
    // Выходим, чтобы пользователь мог залогиниться с новым паролем
    await signOut();
    return { success: true };
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

  async function refreshRevealProduct(sessionProps = null) {
    try {
      const revealed = await getRevealProduct(
        sessionProps || {
          token: { access_token: session.access_token },
          serverURL: API_BASE_URL,
        }
      );
      setRevealProduct(revealed);
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
  async function tryReveal(userId, useCoupon = false) {
    if (revealedUsers.includes(userId)) {
      return;
    }

    try {
      const data = await revealUser(userId, {
        token: { access_token: session.access_token },
        serverURL: API_BASE_URL,
      }, useCoupon);
      if (data.user) {
        setRevealedUsers((prev) => [...prev, userId]);
        return { user: data.user };
      } else if (data.paymentUrl) {
        return { paymentUrl: data.paymentUrl };
      }
    } catch (error) {
      throw error;
    }
  }

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (event === 'PASSWORD_RECOVERY') {
          console.log('Password recovery mode: session НЕ сохраняем');
          setTrialSession(newSession); // временная сессия
          setIsInPasswordReset(true);
          return;
        }

        if (event === 'SIGNED_IN') {
          // но если мы в режиме reset — тоже не сохраняем!
          if (preResetAuthCall.current || isInPasswordReset) {
            console.log('SIGNED_IN во время reset password – игнорируем');
            preResetAuthCall.current = false;
            return;
          }

          // обычный вход — сохраняем
          console.log('default sign in event');

          await saveSession(newSession);
          setSession(newSession);
          return;
        }

        if (!newSession) {
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
        // Cпециальная обработка для MFA
        if (error.code === 'mfa_required') {
          console.log('MFA is required for this user.');
          // На этом этапе сессия не создана, но Supabase возвращает
          // информацию, необходимую для следующего шага.
          // Мы можем получить список факторов аутентификации.
          const { data: mfaData, error: mfaError } = await supabase.auth.mfa.listFactors();
          
          if (mfaError) {
            console.error('Could not list MFA factors:', mfaError.message);
            return { success: false, error: mfaError.message };
          }

          const phoneFactor = mfaData.factors.find(f => f.factor_type === 'phone' && f.status === 'verified');

          if (phoneFactor) {
            // Теперь мы можем инициировать challenge
            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
              factorId: phoneFactor.id
            });

            if (challengeError) {
              console.error('MFA Challenge failed:', challengeError.message);
              return { success: false, error: challengeError.message };
            }
            
            return {
              success: false,
              mfaRequired: true,
              phone: phoneFactor.friendly_name, // friendly_name usually holds the phone number
              factorId: phoneFactor.id,
              challengeId: challengeData.id, // ID для шага верификации
            };
          } else {
            return { success: false, error: 'No verified phone factor found for MFA.' };
          }
        }
        
        console.error('Ошибка входа по паролю:', error.message);
        return { success: false, error: error.message };
      }

      console.log('Успешный вход с паролем:', data.session);

      // сохраняем сессию
      await saveSession(data.session);

      // Загружаем профиль
      await fetchUserProfile(data.session.access_token);
      await refreshRevealedUsers(data.session);
      await refreshRevealProduct(data.session);

      return { success: true };
    } catch (e) {
      console.error('Ошибка signInWithPassword:', e.message);
      return { success: false, error: e.message };
    }
  }

  // Создание пользователя по email + password
  async function createUser(email, password, profileData = {}, referralCode = null) {
    try {
      // Регистрируем пользователя в Supabase
      console.log('Creating user with referral code:', referralCode);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            invite_code: referralCode || null
          }
        }
      });

      if (error) {
        // Явная ошибка от Supabase, например, "User already registered"
        if (error.message.toLowerCase().includes('already registered')) {
          return {
            success: false,
            error: error.message,
            isUserExists: true,
          };
        }
        console.error('Ошибка регистрации в Supabase:', error.message);
        return { success: false, error: error.message };
      }

      console.log('Пользователь создан:', data);

      // → data.session может быть null если email confirmation = ON
      const sessionData = data.session;

      if (!sessionData) {
        // Если сессия не вернулась — пользователь должен подтвердить email
        // Это может быть как новый пользователь, так и существующий неподтвержденный
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          return {
            success: false,
            error: 'User with this email already exists.',
            isUserExists: true,
          };
        }

        return {
          success: true,
          requiresEmailConfirmation: true,
          user: data.user,
        };
      }

      // 2. Сохраняем сессию (как после логина)
      await saveSession(sessionData);

      // 3. Загружаем профиль с сервера
      // await fetchUserProfile(sessionData.access_token);

      // 4. Обновляем профиль сразу данными из формы
      //   (имя, фамилия, профессии и т.д.)
      // if (Object.keys(profileData).length > 0) {
      //   await updateUser(profileData, sessionData.access_token);
      // }

      // 5. Обновить список revealedUsers (как после логина)
      // await refreshRevealedUsers(sessionData);

      return { success: true, user: data.user, session: sessionData };
    } catch (e) {
      console.error('Ошибка createUser:', e);
      return { success: false, error: e.message };
    }
  }

  // Создание пользователя по номеру телефона + пароль
  async function createUserWithPhone(phone, password) {
    try {
      const { data, error } = await supabase.auth.signUp({
        phone,
        password,
      });

      if (error) {
        // Обработка ошибки, если пользователь уже существует
        if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('user already exists')) {
          return {
            success: false,
            error: error.message,
            isUserExists: true,
          };
        }
        console.error('Ошибка регистрации в Supabase:', error.message);
        return { success: false, error: error.message };
      }

      // Если signUp прошел успешно, это значит, что OTP был отправлен.
      // Сессия не создается до верификации.
      console.log('OTP отправлен на номер:', phone);
      return { success: true };

    } catch (e) {
      console.error('Ошибка createUserWithPhone:', e);
      return { success: false, error: e.message };
    }
  }

  // Проверка SMS кода
  async function verifyPhoneOtp(phone, token) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    });

    if (error) {
      console.error('Ошибка проверки SMS кода:', error.message);
      return { success: false, error: error.message };
    }

    console.log('Успешный вход через SMS OTP:', data);
    await saveSession(data.session);

    try {
      // Загружаем профиль пользователя
      await fetchUserProfile(data.session.access_token);
      await refreshRevealedUsers(data.session);
      await refreshRevealProduct(data.session);
      return { success: true, session: data.session };
    } catch (profileError) {
      console.error(
        'Ошибка загрузки профиля после входа:',
        profileError.message
      );
      await signOut();
      return { success: false, error: 'Не удалось загрузить профиль пользователя.' };
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
  // Обновление пароля после сброса
  async function setNewPassword(newPassword) {
    await supabase.auth.setSession(trialSession);

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      console.error('Ошибка:', error.message);
      return { success: false, error: error.message };
    }

    setIsInPasswordReset(false);
    preResetAuthCall.current = false;
    signOut();
    return { success: true };
  }

  return {
    session: {
      status: !!session && !!user,
      token: session,
      sendCode: (email) => signInWithEmail(email),
      signInWithPassword: (email, password) =>
        signInWithPassword(email, password),
      resetPasswordWithEmail: (email) => resetPasswordWithEmail(email),
      resetPasswordWithPhone: (phone) => resetPasswordWithPhone(phone),
      checkCode: (code) => verifyOtp(code),
      checkCodeForPaswordReset: (code) => verifyOtpResetPassword(code),
      checkCodeForPasswordResetWithPhone: (code) =>
        verifyOtpResetPasswordWithPhone(code),
      signOut,
      serverURL: API_BASE_URL,
      createUser: (email, password, options, referralCode) => createUser(email, password, options, referralCode),
      createUserWithPhone: (phone, password) => createUserWithPhone(phone, password),
      verifyPhoneOtp: (phone, token) => verifyPhoneOtp(phone, token),
      updatePassword: (newPassword) => updatePassword(newPassword),
      changePassword: (oldPassword, newPassword) =>
        changePassword(oldPassword, newPassword),
      createPassword: (newPassword) => createPassword(newPassword),
      resetPassword: isInPasswordReset,
      setNewPassword: (newPassword) => setNewPassword(newPassword),
      enrollPhoneNumber,
      challengePhoneNumber,
      verifyPhoneNumber,
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
      product: revealProduct,
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
