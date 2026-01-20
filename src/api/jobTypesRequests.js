import { fetchWithSession } from './apiBase';
import { logError } from '../../utils/log_util';

const ENDPOINTS = {
    getUserRequests: {
        method: 'GET',
        url: (base) => `${base}/api/profession-requests/user/my`
    },
    getUserProfessions: {
        method: 'GET',
        url: (base) => `${base}/api/user-professions/user/my`
    },
    sendUserRequest: {
        url: (base) => `${base}/api/profession-requests/user`,
        method: 'POST'
    }
}

export async function fetchUserTypeRequests(session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: '/api/profession-requests/user/my',
            method: 'GET'
        });
        return response.data;
    } catch (error) {
        logError('Error fetching user type requests:', error);
        throw error;
    }
}

export async function fetchUserProfessions(session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: '/api/user-professions/user/my',
            method: 'GET'
        });
        return response.data;
    } catch (error) {
        logInfo('Error fetching user type requests:', error);
        throw error;
    }
}

export async function sendUserTypeRequest(session, requestData) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: '/api/profession-requests/user',
            data: requestData,
            method: 'POST'
        });
        return response.data;
    } catch (error) {
        logInfo('Error sending user type request:', error);
        throw error;
    }
}