import axios from "axios";

export async function fetchWithSession({ session, endpoint, data = {} }) {
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

        const response = await axios.get(url + endpoint, { headers, ...data });
        return response.data;
    } catch (error) {
        console.error('Error fetching data from endpoint:', error);
        throw error;
    }
}