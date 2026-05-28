import axios from "axios";
import { logError } from "../../utils/log_util";
import { FALLBACK_API_BASE_URL } from "../../utils/config";

export async function fetchWithSession({ session, endpoint, data = {}, method = 'GET', responseType }) {
    try {
        const token = session?.token?.access_token;
        const url = session?.serverURL || FALLBACK_API_BASE_URL;

        if (!token || !url) {
            return null;
        }

        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        };

        const config = {
            method,
            url: `${url}${endpoint}`,
            headers,
            data
        };

        // Add responseType if specified (for binary data like PDFs)
        if (responseType) {
            config.responseType = responseType;
        }

        const response = await axios(config);

        return response;
    } catch (error) {
        logError('Error fetching data from endpoint:', error);
        throw error;
    }
}