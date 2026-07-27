import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import { useNotification } from '../render';
import { getJobStatus } from '../api/jobs';
import { logWarn } from '../../utils/log_util';

/**
 * Job lists aren't realtime, so a cached list item can be stale by the time
 * the user taps it (e.g. it was edited and moved to pending_moderation, or
 * got deleted). This does a lightweight GET /jobs/:id/status check right
 * before opening the detail modal — if the job is gone, or its status no
 * longer matches what the list showed, it warns instead of opening a detail
 * view for a job that's moved out from under the list, and refreshes the
 * list so it's no longer showing the stale entry.
 *
 * The status endpoint also reports the caller's own relationship to the job
 * (isCreator/isProvider/providerStatus) — that result is threaded through to
 * ShowJobModal via setJobStatusInfo so it doesn't need a second, redundant
 * call of its own to figure out the same thing on mount.
 *
 * Drives the global setAppLoading spinner for the duration of the check —
 * it's a real network round-trip on the critical path of opening a job, not
 * a fire-and-forget background refresh.
 *
 * @param {{ setCurrentJobId: Function, setShowJobModalVisible: Function, setJobModalStatus: Function, setJobStatusInfo?: Function }} setters
 * @returns {(job: object, modalStatus: string) => Promise<void>} call with the tapped job and the same modalStatus string the screen already passes to setJobModalStatus
 */
export function useJobDetailNavigation({ setCurrentJobId, setShowJobModalVisible, setJobModalStatus, setJobStatusInfo }) {
  const { session, jobsController, setAppLoading } = useComponentContext();
  const { showWarning } = useNotification();
  const { t } = useTranslation();

  return useCallback(async (job, modalStatus) => {
    const openCached = (statusInfo = null) => {
      setJobStatusInfo?.(statusInfo);
      setCurrentJobId(job.id);
      setShowJobModalVisible(true);
      setJobModalStatus(modalStatus);
    };

    setAppLoading?.(true);
    try {
      const result = await getJobStatus(job.id, session);

      if (!result?.exists) {
        showWarning(t('jobList.noLongerAvailable', {
          defaultValue: 'This job is no longer available.',
        }));
        jobsController.reloadAll();
        return;
      }

      if (job?.status != null && result.status !== job.status) {
        showWarning(
          result.status === 'pending_moderation' || result.status === 'update_requires_editing'
            ? t('jobList.jobOnModeration', {
              defaultValue: 'This job was sent to moderation and is temporarily unavailable.',
            })
            : t('jobList.jobChanged', {
              defaultValue: 'This job has changed since the list was last loaded — refreshing.',
            })
        );
        jobsController.reloadAll();
        return;
      }

      openCached({
        isCreator: result.isCreator,
        isProvider: result.isProvider,
        providerStatus: result.providerStatus,
      });
    } catch (e) {
      // The status pre-check itself failing (network hiccup) shouldn't block
      // navigation — fall back to opening with whatever the cached list had.
      // No isCreator/isProvider info in this case; ShowJobModal treats a
      // missing jobStatusInfo as "not a provider" rather than making its own
      // fallback call, per the whole point of merging this into one request.
      logWarn('useJobDetailNavigation: status check failed, opening with cached data anyway:', e.message);
      openCached(null);
    } finally {
      setAppLoading?.(false);
    }
  }, [session, jobsController, setAppLoading, setCurrentJobId, setShowJobModalVisible, setJobModalStatus, setJobStatusInfo, showWarning, t]);
}
