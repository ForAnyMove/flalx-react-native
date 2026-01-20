import { fetchWithSession } from './apiBase';
import { logError } from '../../utils/log_util';

const ENDPOINTS = {
    typesWithSubtypes: (base) => `${base}/api/job-types/user/with-subtypes`,
}

export async function getSystemTypesWithSubtypes(session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: '/api/job-types/user/with-subtypes',
            method: 'GET'
        });
        const status = response.status;
        const returnData = {};
        if (status == 200) {
            returnData.typesWithSubtypes = response.data;
        }
        return returnData;
    } catch (error) {
        logError('Error fetching system types with subtypes:', error);
        throw error;
    }
}