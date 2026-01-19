import axios from 'axios';
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

        const response = await axios({
            method: ENDPOINTS.getUserRequests.method,
            url: ENDPOINTS.getUserRequests.url(url),
            headers
        });

        return response.data;
    } catch (error) {
        logError('Error fetching user type requests:', error);
        throw error;
    }
}

export async function fetchUserProfessions(session) {
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

        const response = await axios({
            method: ENDPOINTS.getUserProfessions.method,
            url: ENDPOINTS.getUserProfessions.url(url),
            headers
        });

        return response.data;
    } catch (error) {
        logInfo('Error fetching user type requests:', error);
        throw error;
    }
}

export async function sendUserTypeRequest(session, requestData) {
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

        const response = await axios({
            method: ENDPOINTS.sendUserRequest.method,
            url: ENDPOINTS.sendUserRequest.url(url),
            headers,
            data: requestData
        });

        return response.data;
    } catch (error) {
        logInfo('Error sending user type request:', error);
        throw error;
    }
}