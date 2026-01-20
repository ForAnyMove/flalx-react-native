import { fetchWithSession } from './apiBase';
import { logError } from '../../utils/log_util';

const ENDPOINTS = {
    getUserRequests: {
        url: (base) => `${base}/api/type-creation-requests/user/my`,
        method: 'GET'
    },
    sendUserRequest: {
        url: (base) => `${base}/api/type-creation-requests/user`,
        method: 'POST'
    }
}

export async function fetchUserTypeCreationRequests(session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: '/api/type-creation-requests/user/my',
            method: 'GET'
        });
        return response.data;
    } catch (error) {
        logError('Error fetching user type creation requests:', error);
        throw error;
    }
}

export async function sendUserTypeCreationRequest(session, requestData) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: '/api/type-creation-requests/user',
            data: requestData,
            method: 'POST'
        });
        const status = response.status;
        if (status == 201) {
            return response.data;
        }
    }
    catch (error) {
        logError('Error sending user type creation request:', error);
        throw error;
    }
}