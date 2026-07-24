import { fetchWithSession } from './apiBase';
import { logError, logInfo } from '../../utils/log_util';

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

// Unified Contact Support form (components/modals/ContactSupportModal.jsx),
// replacing the separate Contact Us / Feedback modals — category folds in
// what "Feedback" used to be as its own button. Endpoint confirmed
// implemented server-side against this contract (2026-07-17). email/phone
// aren't sent explicitly: the backend already knows the account's contact
// details from the session, `contactMethod` just says which one to reply
// through.
export async function sendSupportRequest(session, requestData) {
    try {
        const { category, subject, message, contactMethod, preferredTime } = requestData;
        validateSupportRequest(requestData);
        const response = await fetchWithSession({
            session,
            endpoint: '/api/support/request',
            data: { category, subject, message, contactMethod, preferredTime },
            method: 'POST'
        });
        return response.data?.success == true;
    } catch (error) {
        logError('Error sending support request:', error);
        throw error;
    }
}

function validateSupportRequest(requestData) {
    const { category, subject, message, contactMethod } = requestData;
    if (!category || !subject || !message || !contactMethod) {
        throw new Error('Category, subject, message and a contact method are required.');
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
