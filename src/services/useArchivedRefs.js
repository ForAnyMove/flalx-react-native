import { useState, useCallback, useEffect } from 'react';
import { getArchivedRefs, markArchivedRefSeen } from '../api/jobs';
import { logError } from '../../utils/log_util';

/**
 * Manages archived job reference notifications.
 * These are one-time messages about events that happened while the user was offline.
 *
 * @param {object} session - Current app session (must contain token and serverURL)
 * @returns {{ refs: Array, fetchRefs: Function, markSeen: Function }}
 */
export function useArchivedRefs(session) {
    const [refs, setRefs] = useState([]);

    const fetchRefs = useCallback(async () => {
        if (!session?.token?.access_token) return;
        try {
            const data = await getArchivedRefs(session);
            setRefs(data);
        } catch (error) {
            logError('useArchivedRefs: failed to fetch', error);
        }
    }, [session?.token?.access_token]);

    const markSeen = useCallback(async (jobId) => {
        // Optimistically remove from local state immediately
        setRefs(prev => prev.filter(r => r.job_id !== jobId));
        try {
            await markArchivedRefSeen(jobId, session);
        } catch (error) {
            logError('useArchivedRefs: failed to mark seen', error);
        }
    }, [session?.token?.access_token]);

    // Fetch on session ready
    useEffect(() => {
        fetchRefs();
    }, [fetchRefs]);

    return { refs, fetchRefs, markSeen };
}
