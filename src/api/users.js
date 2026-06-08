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
        const { useCoupon = false, paymentMethod = 'paypal', currency = 'USD', savePaymentMethod, savedPaymentMethodId, language } = paymentOptions;
        const data = {
            currency,
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

export { getRevealedUsers, revealUser, addCommentToUserByJob, getRevealProduct };
