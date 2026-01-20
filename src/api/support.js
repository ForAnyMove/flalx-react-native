import { fetchWithSession } from './apiBase';
import { logError } from '../../utils/log_util';

export async function sendMessage(session, messageData) {
    try {
        const { name, email, topic, reason, message } = messageData;
        validateContactMessage(messageData);
        const response = await fetchWithSession({
            session,
            endpoint: '/api/support/contact',
            data: { name, email, topic, reason, message },
            method: 'POST'
        });
        return response.data?.success == true;
    } catch (error) {
        logError('Error sending support message:', error);
        throw error;
    }
}

export async function sendFeedback(session, messageData) {
    try {
        const { phoneNumber, preferredTime, message } = messageData;
        validateFeedbackMessage(messageData);
        const response = await fetchWithSession({
            session,
            endpoint: '/api/support/feedback',
            data: { phoneNumber, preferredTime, message },
            method: 'POST'
        });
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
