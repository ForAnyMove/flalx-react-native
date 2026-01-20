import { fetchWithSession } from './apiBase';
import { logError } from '../../utils/log_util';

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

async function revealUser(userId, session, useCoupon = false) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/api/user-info/reveal/${userId}`,
            method: 'POST',
            data: { use_coupon: useCoupon }
        });

        const returnData = {};

        if (response.data?.isAlreadyRevealed) {
            returnData.user = response.data;
        } else if (response.data?.paymentRequired == true) {
            returnData.paymentUrl = response.data.paymentUrl;
        }

        return returnData;
    } catch (error) {
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