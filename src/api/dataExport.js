import axios from 'axios';
import { logError } from '../../utils/log_util';

const ENDPOINTS = {
    export: (base) => `${base}/users/export`,
}

export async function getUserExportData(session) {
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

        const response = await axios.get(ENDPOINTS.export(url), { headers });

        const status = response.status;
        let returnData = null;

        if (status == 200) {
            returnData = response.data;
        }

        return returnData;
    } catch (error) {
        logError('Error fetching system types with subtypes:', error);
        throw error;
    }
}