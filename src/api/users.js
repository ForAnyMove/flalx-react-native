import axios from 'axios';

async function getRevealedUsers(session) {
    try {
        const token = session?.token?.access_token || session?.access_token;
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

        const response = await axios.get(`${url}/api/user-info/purchased`, { headers });

        if (response.status === 200) {
            return response.data.purchasedUsers;
        } else {
            throw new Error('Failed to fetch revealed users');
        }
    } catch (error) {
        console.error('Error fetching revealed users:', error);
        throw error;
    }
}

async function revealUser(userId, session) {
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

        const response = await axios.get(`${url}/api/user-info/reveal/${userId}`, { headers });

        if (response.status === 200) {
            const returnData = {};

            if (response.data.isAlreadyRevealed) {
                returnData.user = response.data.data;
            } else if (response.data.paymentRequired == true) {
                returnData.paymentUrl = response.data.paymentUrl;
            }

            return returnData;
        } else {
            throw new Error('Failed to reveal user contacts');
        }

    } catch (error) {
        console.error('Error revealing user contacts:', error);
        throw error;
    }
}

export { getRevealedUsers, revealUser };