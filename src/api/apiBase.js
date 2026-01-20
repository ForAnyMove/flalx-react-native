import axios from "axios";
import { logError } from "../../utils/log_util";
import { FALLBACK_API_BASE_URL } from "../../utils/config";

export async function fetchWithSession({ session, endpoint, data = {}, method = 'GET' }) {
    try {
        const token = session?.token?.access_token;
        const url = session?.serverURL || FALLBACK_API_BASE_URL;

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
            method,
            url: `${url}${endpoint}`,
            headers,
            data
        });

        return response;
    } catch (error) {
        logError('Error fetching data from endpoint:', error);
        throw error;
    }
}