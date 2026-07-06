import axios from "axios";
import { logError } from "../../utils/log_util";
import { FALLBACK_API_BASE_URL } from "../../utils/config";
import { getSessionToken } from "../auth/authStorage";
import { notifyAuthState } from "../auth/authEvents";

/**
 * Shared transport for all authenticated data-API calls.
 *
 * Auth is resolved from the backend app session (NOT a Supabase token):
 *   - Web: HttpOnly cookie -> `withCredentials: true` (no Authorization header).
 *   - Native: `Authorization: Bearer <app_session_token>` from SecureStore.
 *
 * The `session` argument is kept for backwards compatibility (call sites still
 * pass it), but the Supabase access_token it used to carry is no longer read.
 * Only `session.serverURL` is still used to resolve the base URL.
 */
export async function fetchWithSession({ session, endpoint, data = {}, method = 'GET', responseType }) {
    try {
        const url = session?.serverURL || FALLBACK_API_BASE_URL;

        if (!url) {
            return null;
        }

        const token = await getSessionToken();

        const headers = {
            'Content-Type': 'application/json',
            // Native transport: attach the backend app session token when present.
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };

        const config = {
            method,
            url: `${url}${endpoint}`,
            headers,
            data,
            // Required for web HttpOnly cookie sessions.
            withCredentials: true,
        };

        // Add responseType if specified (for binary data like PDFs)
        if (responseType) {
            config.responseType = responseType;
        }

        const response = await axios(config);

        return response;
    } catch (error) {
        logError('Error fetching data from endpoint:', error);

        // Both the 401 ({error, nextStep}) and 403 MFA-guard ({code, message,
        // nextStep}) error shapes carry `nextStep` at the top level even
        // though the failure-reason field name differs between them — key off
        // that uniformly so any business call (jobs/payments/subscriptions/...)
        // can push the app to the right screen, not just auth-specific calls.
        const nextStep = error?.response?.data?.nextStep;
        if (nextStep) {
            error.nextStep = nextStep;
            notifyAuthState(nextStep);
        }
        // Axios errors don't carry `.status` at the top level the way this
        // app's authApi errors do — normalize it so callers can check
        // `e?.status === 401` regardless of which transport threw.
        if (error?.response?.status) {
            error.status = error.response.status;
        }

        throw error;
    }
}
