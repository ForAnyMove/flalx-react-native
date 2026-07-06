import { fetchWithSession } from './apiBase';
import { logError, logInfo } from '../../utils/log_util';
import i18n from '../../utils/i18n/i18n';

const getCurrentLanguage = (language) => language ?? i18n.language ?? 'en';

async function getRevealedUsers(session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: '/api/user-info/purchased',
            method: 'GET'
        });
        if (response.status === 200) {
            return response.data.purchasedUsers;
        } else {
            throw new Error('Failed to fetch revealed users');
        }
    } catch (error) {
        logInfo('Error fetching revealed users:', error);
        throw error;
    }
}

async function revealUser(userId, session, paymentOptions = {}) {
    try {
        const { useCoupon = false, paymentMethod = 'paypal', savePaymentMethod, savedPaymentMethodId, language } = paymentOptions;
        const data = {
            language: getCurrentLanguage(language),
            ...(useCoupon
                ? { use_coupon: true, paymentMethod: 'none' }
                : savedPaymentMethodId
                    ? { paymentMethod, savedPaymentMethodId }
                    : { paymentMethod }
            ),
            ...(!useCoupon && !savedPaymentMethodId && savePaymentMethod !== undefined && { savePaymentMethod }),
        };
        const response = await fetchWithSession({
            session,
            endpoint: `/api/user-info/${userId}/pay`,
            method: 'POST',
            data,
        });

        logInfo('Reveal user response:', response);

        const returnData = {};

        if (response.data?.isAlreadyRevealed) {
            returnData.user = response.data;
        } else if (response.data?.payment?.paymentMetadata?.directCharge) {
            returnData.payment = response.data.payment;
            returnData.paymentMethodsSnapshot = response.data.paymentMethodsSnapshot ?? null;
            returnData.user = response.data.user ?? null;
        } else if (response.data?.paymentRequired == true) {
            returnData.paymentUrl = response.data.paymentUrl;
        }

        return returnData;
    } catch (error) {
        logInfo('Error revealing user:', error);
        throw error;
    }
}

async function getRevealProduct(session) {
    try {
        const response = await fetchWithSession({ session, endpoint: '/api/user-info/products' });

        return response.data.reveal;
    } catch (error) {
        logError('Error fetching reveal product:', error);
        throw error;
    }
}

/**
 * The single authoritative source of current-user state: the pre-existing
 * rich profile (jobs, professions, avatar, referral, ...) and subscription,
 * plus the auth-level fields that drive routing (`user`, `session.authLevel`,
 * `mfa`, `nextStep`). Replaces the old two-call bootstrap
 * (`GET /auth/me` + a separate `GET /users/me`) — `/auth/me` is legacy now.
 *
 * @param {object} session
 * @returns {Promise<{
 *   profile: Record<string, any>,
 *   subscription: Record<string, any> | null,
 *   user: { id: string, email?: string|null, phone?: string|null, emailVerified: boolean, phoneVerified: boolean, mfaEnabled: boolean },
 *   session: { authLevel: 'aal1' | 'aal2' },
 *   mfa: {
 *     policy: 'disabled' | 'optional' | 'required',
 *     enabled: boolean,
 *     required: boolean,
 *     setupRequired: boolean,
 *     verificationRequired: boolean,
 *     allowedFactors: Array<'totp' | 'phone'>,
 *     recommendedFactor?: 'totp' | 'phone',
 *     availableFactors?: Array<{ id: string, type: 'totp' | 'phone', phone?: string }>,
 *   },
 *   nextStep: 'authenticated' | 'mfa_setup_required' | 'mfa_verification_required' | 'login_required',
 * }>}
 */
async function me(session) {
    const response = await fetchWithSession({
        session,
        endpoint: '/users/me',
        method: 'GET',
    });
    console.log(response.data);

    return response.data;
}

async function addCommentToUserByJob(userId, jobId, comment, rating, session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/users/${userId}/comments`,
            data: { jobId, text: comment, rating },
            method: 'POST'
        });
        if (response.status === 200) {
            return response.data.comment;
        } else {
            throw new Error('Failed to add comment to user');
        }
    } catch (error) {
        logInfo('Error adding comment to user:', error);
        throw error;
    }
}

export { getRevealedUsers, revealUser, addCommentToUserByJob, getRevealProduct, me };
