import axios from 'axios';

const ENDPOINTS = {
    typesWithSubtypes: (base) => `${base}/api/job-types/user/with-subtypes`,
}

export async function getSystemTypesWithSubtypes(session) {
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

        const response = await axios.get(ENDPOINTS.typesWithSubtypes(url), { headers });

        const status = response.status;
        const returnData = {};

        if (status == 200) {
            returnData.typesWithSubtypes = response.data;
        }

        return returnData;
    } catch (error) {
        console.error('Error fetching system types with subtypes:', error);
        throw error;
    }
}