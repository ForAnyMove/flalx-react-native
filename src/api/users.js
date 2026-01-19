import axios from 'axios';
import { fetchWithSession } from './apiBase';
import { logError } from '../../utils/log_util';

async function getRevealedUsers(session) {
    try {
        const token = session?.token?.access_token || session?.access_token;
        const url = session?.serverURL || 'http://localhost:3000';

        if (!token) {
            throw new Error('No valid session token found');
        }

        if (!url) {
            throw new Error('No valid server URL found in session');
        }

        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        };

        const response = await axios.get(`${url}/api/user-info/purchased`, { headers });

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

        if (response.isAlreadyRevealed) {
            returnData.user = response.data;
        } else if (response.paymentRequired == true) {
            returnData.paymentUrl = response.paymentUrl;
        }

        return returnData;
    } catch (error) {
        throw error;
    }
}

async function getRevealProduct(session) {
    try {
        const data = await fetchWithSession({ session, endpoint: '/api/user-info/products' });

        return data.reveal;
    } catch (error) {
        logError('Error fetching reveal product:', error);
        throw error;
    }
}

async function addCommentToUserByJob(userId, jobId, comment, rating, session) {
    try {
        const token = session?.token?.access_token;
        const url = session?.serverURL || 'http://localhost:3000';

        if (!token) {
            throw new Error('No valid session token found');
        }

        if (!url) {
            throw new Error('No valid server URL found in session');
        }

        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        };

        const body = {
            jobId,
            text: comment,
            rating
        };

        const response = await axios.post(`${url}/users/${userId}/comments`, body, { headers });

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