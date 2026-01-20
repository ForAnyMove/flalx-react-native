import { fetchWithSession } from './apiBase';
import { logError } from '../../utils/log_util';

const ENDPOINTS = {
    export: (base) => `${base}/users/export`,
}

export async function getUserExportData(session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: '/users/export',
            method: 'GET'
        });
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