import { useEffect, useMemo, useRef, useState } from "react";

/**
 * providersManager — агрегирует список провайдеров и доступ к профилям:
 * {
 *   providers: [],           // список всех "других" пользователей
 *   getUserById: fn,         // (id) => Promise<User>
 *   reload: fn,              // перезагрузить список
 *   getCommentsWritten: fn,  // (id?) => Promise<Comment[]>
 *   getCommentsReceived: fn, // (id?) => Promise<Comment[]>
 *   setComment: fn,          // (userId, { text, status }) => Promise<Comment>
 *   refreshUserComments: fn, // (userId) => Promise<Comment[]>
 *   loading: bool,
 *   error: string|null
 * }
 */
export default function providersManager({ session }) {
  const [providers, setProviders] = useState([]);
  const [cache, setCache] = useState({}); // кэш id -> user
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const serverURL = session?.serverURL;
  const token = session?.token?.access_token;

  // защита от гонок
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  async function safeFetch(url, opts) {
    const res = await fetch(url, opts);
    if (!res.ok) {
      let msg = "Request failed";
      try {
        const body = await res.json();
        msg = body?.error || msg;
      } catch { }
      throw new Error(msg);
    }
    return res.json();
  }

  // загрузка списка "других" пользователей
  async function reload() {
    if (!serverURL || !token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await safeFetch(`${serverURL}/users/others`, {
        headers: authHeaders,
      });
      if (!alive.current) return;

      setProviders(data);
      // обновляем кэш
      setCache((prev) => {
        const newCache = { ...prev };
        data.forEach((u) => {
          newCache[u.id] = u;
        });
        return newCache;
      });
    } catch (e) {
      if (!alive.current) return;
      setError(e.message || "Providers load error");
    } finally {
      if (alive.current) setLoading(false);
    }
  }

  // получить пользователя по id (с кэшем)
  async function getUserById(userId) {
    if (!userId) return null;

    // 1. проверить кэш
    if (cache[userId]) {
      return cache[userId];
    }

    // 2. запросить с сервера
    const user = await safeFetch(`${serverURL}/users/${userId}`, {
      headers: authHeaders,
    });

    // 3. сохранить в кэш
    setCache((prev) => ({ ...prev, [userId]: user }));

    return user;
  }

  // добавить комментарий
  async function setComment(userId, { text, rating, jobId }) {
    if (!userId || !text || !rating || !jobId) return null;

    const res = await safeFetch(`${serverURL}/users/${userId}/comments`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ text, rating, jobId }),
    });

    // обновим кэш
    setCache((prev) => {
      const comments = prev[userId]?.comments || [];
      return {
        ...prev,
        [userId]: { ...prev[userId], comments: [res, ...comments] },
      };
    });

    return res;
  }

  // получить комментарии, написанные юзером (author)
  async function getCommentsWritten(userId) {
    const query = userId ? `?id=${userId}` : "";
    return safeFetch(`${serverURL}/users/author/comments${query}`, {
      headers: authHeaders,
    });
  }

  // получить комментарии, оставленные юзеру (target)
  async function getCommentsReceived(userId) {
    const query = userId ? `?id=${userId}` : "";
    return safeFetch(`${serverURL}/users/target/comments${query}`, {
      headers: authHeaders,
    });
  }

  // обновить комментарии для конкретного юзера и записать в кэш
  async function refreshUserComments(userId) {
    if (!userId) return [];
    const comments = await getCommentsReceived(userId);
    setCache((prev) => ({
      ...prev,
      [userId]: { ...(prev[userId] || {}), comments },
    }));
    return comments;
  }

  function appendUserData(userId, email, phoneNumber) {
    setProviders((prev) => {
      return prev.map((user) => {
        if (user.id !== userId) return user;
        return { ...user, email, phoneNumber };
      });
    });

    setCache((prev) => {
      const user = prev[userId] || {};
      return {
        ...prev,
        [userId]: { ...user, email, phoneNumber },
      };
    });
  }

  // авто-загрузка, как только есть сессия
  useEffect(() => {
    if (serverURL && token) {
      reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverURL, token]);

  return {
    providers,
    getUserById,
    reload,
    loading,
    error,
    setComment,
    getCommentsWritten,
    getCommentsReceived,
    refreshUserComments,
    appendUserData
  };
}
