import axios from 'axios';

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

        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching user type creation requests:', error);
        throw error;
    }
}

export async function sendUserTypeCreationRequest(session, requestData) {
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

        const status = response.status;

        if (status == 201) {
            return response.data;
        }
    }
    catch (error) {
        console.error('Error sending user type creation request:', error);
        throw error;
    }
}