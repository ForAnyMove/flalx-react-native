import { fetchWithSession } from './apiBase';
import { logError } from '../../utils/log_util';
import { Platform } from 'react-native';

export async function getUserExportData(session, language) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/users/export`,
            method: 'GET',
            // Web receives a Blob (PDF binary from server).
            // Mobile receives HTML text which expo-print converts to PDF.
            responseType: Platform.OS === 'web' ? 'blob' : 'text',
            data: { lang: language }
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