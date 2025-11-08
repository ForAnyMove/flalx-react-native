import { useEffect, useMemo, useRef, useState } from "react";
import { addSelfToJobProviders, getJobProducts, isProviderInJob, removeSelfFromJobProviders } from "../src/api/jobs";

/**
 * jobsManager — агрегирует все списки заявок для вкладок:
 * {
 *   creator: { waiting: [], inProgress: [], done: [] },
 *   executor:{ new: [], waiting: [], inProgress: [], done: [] },
 *   reloadAll: fn,
 *   loading: { any: bool, creator: bool, executor: bool },
 *   error: string|null
 * }
 */
export default function jobsManager({ session, user }) {
  const [creatorWaiting, setCreatorWaiting] = useState([]);
  const [creatorInProgress, setCreatorInProgress] = useState([]);
  const [creatorDone, setCreatorDone] = useState([]);
  const [products, setProducts] = useState([]);

  const [execNew, setExecNew] = useState([]);
  const [execWaiting, setExecWaiting] = useState([]);
  const [execInProgress, setExecInProgress] = useState([]);
  const [execDone, setExecDone] = useState([]);

  const [loadingCreator, setLoadingCreator] = useState(false);
  const [loadingExecutor, setLoadingExecutor] = useState(false);
  const [error, setError] = useState(null);

  const serverURL = session?.serverURL;
  const token = session?.token?.access_token;
  const userId = user?.current?.id;

  // защита от гонок
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${token}`,
  }), [token]);

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

  // ------- загрузчики -------

  async function loadCreatorWaiting() {
    return safeFetch(`${serverURL}/jobs/as-creator/waiting`, { headers: authHeaders });
  }

  async function loadCreatorInProgress() {
    return safeFetch(`${serverURL}/jobs/as-creator/in-progress`, { headers: authHeaders });
  }

  async function loadCreatorDone() {
    return safeFetch(`${serverURL}/jobs/as-creator/done`, { headers: authHeaders });
  }

  async function loadExecNew() {
    return safeFetch(`${serverURL}/jobs/as-executor/new`, { headers: authHeaders });
  }

  async function loadExecWaiting() {
    return safeFetch(`${serverURL}/jobs/as-executor/waiting`, { headers: authHeaders });
  }

  async function loadExecInProgress() {
    return safeFetch(`${serverURL}/jobs/as-executor/in-progress`, { headers: authHeaders });
  }

  async function loadExecDone() {
    return safeFetch(`${serverURL}/jobs/as-executor/done`, { headers: authHeaders });
  }

  async function loadJobProducts() {
    return getJobProducts(session);
  }

  // ------- публичные методы -------

  async function reloadCreator() {
    if (!serverURL || !token || !userId) return;
    setLoadingCreator(true);
    setError(null);
    try {
      const [waiting, inProgress, done, products] = await Promise.all([
        loadCreatorWaiting(),
        loadCreatorInProgress(),
        loadCreatorDone(),
        loadJobProducts(),
      ]);
      if (!alive.current) return;
      setCreatorWaiting(waiting);
      setCreatorInProgress(inProgress);
      setCreatorDone(done);
      setProducts(products);
    } catch (e) {
      if (!alive.current) return;
      setError(e.message || "Creator lists load error");
    } finally {
      if (alive.current) setLoadingCreator(false);
    }
  }

  async function reloadExecutor() {
    if (!serverURL || !token || !userId) return;
    setLoadingExecutor(true);
    setError(null);
    try {
      const [n, waiting, inProgress, done] = await Promise.all([
        loadExecNew(),
        loadExecWaiting(),
        loadExecInProgress(),
        loadExecDone(),
      ]);
      if (!alive.current) return;
      console.log(n);

      setExecNew(n);
      setExecWaiting(waiting);
      setExecInProgress(inProgress);
      setExecDone(done);
    } catch (e) {
      if (!alive.current) return;
      setError(e.message || "Executor lists load error");
    } finally {
      if (alive.current) setLoadingExecutor(false);
    }
  }

  async function reloadAll() {
    await Promise.all([reloadCreator(), reloadExecutor()]);
  }

  async function deleteJob(jobId) {
    await safeFetch(`${serverURL}/jobs/${jobId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    await reloadAll(); // синхронизируем
  }

  async function confirmJob(jobId) {
    await safeFetch(`${serverURL}/jobs/${jobId}/close`, {
      method: "POST",
      headers: authHeaders,
    });
    await reloadAll();
  }

  async function markJobDone(jobId, options) {
    await safeFetch(`${serverURL}/jobs/${jobId}/done`, {
      method: "PATCH",
      headers: authHeaders,
      body: options,
    });
    await reloadAll();
  }

  async function approveProvider(jobId, executorId) {
    await safeFetch(`${serverURL}/jobs/${jobId}/assign-executor`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ executorId }),
    });
    await reloadAll();
  }

  async function removeExecutor(jobId) {
    await safeFetch(`${serverURL}/jobs/${jobId}/unassign-executor`, {
      method: "POST",
      headers: authHeaders,
    });
    await reloadAll();
  }

  async function addProvider(jobId) {
    // try {
    //   const { success, payment } = await addSelfToJobProviders(jobId, session);
    // } catch (e) {
    //   console.error('Error adding self to job providers:', e);
    //   throw e;
    // }
  }

  async function removeProvider(jobId) {
    try {
      const result = await removeSelfFromJobProviders(jobId, session);
      await reloadAll();
    } catch (e) {
      console.error('Error removing self from job providers:', e);
      throw e;
    }
    // await safeFetch(`${serverURL}/jobs/${jobId}/providers`, {
    //   method: "DELETE",
    //   headers: authHeaders,
    // });
    // await reloadAll();
  }

  async function getJobById(jobId) {
    const res = await fetch(`${serverURL}/jobs/${jobId}`, {
      headers: authHeaders,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch job');
    }
    return res.json();
  }

  async function checkIsProviderInJob(jobId) {
    try {
      const success = await isProviderInJob(jobId, session);
      return success;
    }
    catch (e) {
      console.error('Error checking provider in job:', e);
      return false;
    }
  }

  // авто-загрузка, как только есть сессия и юзер
  useEffect(() => {
    if (serverURL && token && userId) {
      reloadAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverURL, token, userId]);

  return {
    creator: {
      waiting: creatorWaiting,
      inProgress: creatorInProgress,
      done: creatorDone,
    },
    executor: {
      new: execNew,
      waiting: execWaiting,
      inProgress: execInProgress,
      done: execDone,
    },
    reloadAll,
    reloadCreator,
    reloadExecutor,
    loading: {
      any: loadingCreator || loadingExecutor,
      creator: loadingCreator,
      executor: loadingExecutor,
    },
    error,
    actions: {
      deleteJob,
      confirmJob,
      markJobDone,
      approveProvider,
      removeExecutor,
      addProvider,
      removeProvider,
      getJobById,
      checkIsProviderInJob
    },
    products
  };
}
