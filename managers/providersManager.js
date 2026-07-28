import { useEffect, useMemo, useRef, useState } from "react";

/**
 * providersManager — агрегирует список провайдеров и доступ к профилям:
 * {
 *   providers: [],           // список всех "других" пользователей
 *   getJobParticipant: fn,   // (jobId, userId) => Promise<User> — GET /jobs/:jobId/participant/:userId
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

  // Only send a bearer when we actually have a token (native). On web the
  // backend session travels via the HttpOnly cookie (credentials: 'include').
  const authHeaders = useMemo(
    () => (token ? { Authorization: `Bearer ${token}` } : {}),
    [token]
  );

  async function safeFetch(url, opts) {
    const res = await fetch(url, { ...opts, credentials: 'include' });
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

  // Получить полные данные участника конкретной работы (с кэшем).
  // GET /users/:id был снят с сервера как слишком общий — теперь профиль
  // участника отдаёт сам jobId-scoped эндпоинт, который сам решает, отдавать
  // ли личные данные (email/телефон), в зависимости от статуса раскрытия
  // именно для этой работы. Кэш ключуется парой (jobId, userId) — один и тот
  // же пользователь может быть раскрыт в одной работе и не раскрыт в другой.
  async function getJobParticipant(jobId, userId) {
    if (!jobId || !userId) return null;

    const cacheKey = `${jobId}:${userId}`;

    // 1. проверить кэш
    if (cache[cacheKey]) {
      return cache[cacheKey];
    }

    // 2. запросить с сервера
    const user = await safeFetch(`${serverURL}/jobs/${jobId}/participant/${userId}`, {
      headers: authHeaders,
    });

    // 3. сохранить в кэш
    setCache((prev) => ({ ...prev, [cacheKey]: user }));

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

  return {
    providers,
    getJobParticipant,
    loading,
    error,
    setComment,
    getCommentsWritten,
    getCommentsReceived,
    refreshUserComments,
    appendUserData
  };
}
