import axios from 'axios';
import { logError } from '../../utils/log_util';

export async function sendMessage(session, messageData) {
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

        const { name, email, topic, reason, message } = messageData;

        validateContactMessage(messageData);

        const response = await axios.post(`${url}/api/support/contact`, {
            name,
            email,
            topic,
            reason,
            message
        }, { headers });

        return response.data?.success == true;
    } catch (error) {
        logError('Error sending support message:', error);
        throw error;
    }
}

export async function sendFeedback(session, messageData) {
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

        const { phoneNumber, preferredTime, message } = messageData;

        validateFeedbackMessage(messageData);

        const response = await axios.post(`${url}/api/support/feedback`, {
            phoneNumber,
            preferredTime,
            message
        }, { headers });

        return response.data?.success == true;
    } catch (error) {
        logInfo('Error sending support message:', error);
        throw error;
    }
}

function validateContactMessage(messageData) {
    const { name, email, topic, message } = messageData;
    if (!name || !email || !topic || !message) {
        throw new Error('All fields are required to send a support message.');
    }
}

function validateFeedbackMessage(messageData) {
    const { phoneNumber } = messageData;
    if (!phoneNumber) {
        throw new Error('Phone number is required to send feedback.');
    }
}
