import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addSelfToJobProviders, getJobProducts, isProviderInJob, noticeJobRejection, removeSelfFromJobProviders, wasProviderInJob } from "../src/api/jobs";
import { useGeolocation } from "./useGeolocation";
import { logError } from "../utils/log_util";

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
export default function jobsManager({ session, user, geolocation }) {
  const [creatorPending, setCreatorPending] = useState([]);
  const [creatorWaiting, setCreatorWaiting] = useState([]);
  const [creatorInProgress, setCreatorInProgress] = useState([]);
  const [creatorDone, setCreatorDone] = useState([]);
  const [jobProducts, setJobProducts] = useState([]);
  const [providerProducts, setProviderProducts] = useState([]);

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

  const getLocation = useCallback(async () => {
    if (!geolocation.enabled) return null;
    if (geolocation.location == null) {
      return await geolocation.getCurrentLocationDirect();
    } else {
      return geolocation.location;
    }
  }, [geolocation]);

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

  async function loadCreatorPending() {
    return safeFetch(`${serverURL}/jobs/as-creator/pending`, { headers: authHeaders });
  }

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
    const currentLocation = await getLocation();

    let url = `${serverURL}/jobs/as-executor/new`;
    if (currentLocation) {
      const params = new URLSearchParams({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
        radius: 50
      });
      url += `?${params.toString()}`;
    }
    return safeFetch(url, {
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json'
      }
    });
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

  async function reloadCreator() {
    if (!serverURL || !token || !userId) return;
    setLoadingCreator(true);
    setError(null);
    try {
      const [pending, waiting, inProgress, done, products] = await Promise.all([
        loadCreatorPending(),
        loadCreatorWaiting(),
        loadCreatorInProgress(),
        loadCreatorDone(),
        loadJobProducts(),
      ]);
      if (!alive.current) return;
      setCreatorPending(pending);
      setCreatorWaiting(waiting);
      setCreatorInProgress(inProgress);
      setCreatorDone(done);
      setJobProducts(products.jobProducts);
      setProviderProducts(products.providerProducts);

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

  async function reloadExecutorNew() {
    if (!serverURL || !token || !userId) return;
    setLoadingExecutor(true);
    setError(null);

    try {
      const n = await loadExecNew();
      if (!alive.current) return;
      setExecNew(n);
    } catch (e) {
      if (!alive.current) return;
      setError(e.message || "Executor new list load error");
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
    //   logInfo('Error adding self to job providers:', e);
    //   throw e;
    // }
  }

  async function removeProvider(jobId) {
    try {
      const result = await removeSelfFromJobProviders(jobId, session);
      await reloadAll();
    } catch (e) {
      logError('Error removing self from job providers:', e);
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
      logInfo('Error checking provider in job:', e);
      return false;
    }
  }
  async function checkWasProviderInJob(jobId) {
    try {
      const success = await wasProviderInJob(jobId, session);
      return success;
    }
    catch (e) {
      logInfo('Error checking provider in job:', e);
      return false;
    }
  }

  async function noticeJobRejectionAsCreator(jobId) {
    try {
      await noticeJobRejection(jobId, session);
      setCreatorWaiting((prev) => prev.filter((job) => job.status !== 'rejected'));
    } catch (e) {
      logInfo('Error noticing job rejection as creator:', e);
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
      pending: creatorPending,
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
    reloadExecutorNew,
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
      checkIsProviderInJob,
      checkWasProviderInJob,
      noticeJobRejectionAsCreator
    },
    products: jobProducts,
    providerProduct: providerProducts.length > 0 ? providerProducts[0] : null,
  };
}
