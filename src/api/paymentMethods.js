import { fetchWithSession } from './apiBase';
import { logError } from '../../utils/log_util';
import i18n from '../../utils/i18n/i18n';

const getCurrentLanguage = (language) => language ?? i18n.language ?? 'en';
const providerMap = { paypal: 'PAYPAL', hyp: 'HYP', card: 'HYP' };

export async function fetchPaymentMethods(session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: '/api/payment-methods',
            method: 'GET',
        });
        return response.data.paymentMethods ?? [];
    } catch (e) {
        logError('Failed to load payment methods:', e);
        return [];
    }
}

export async function deletePaymentMethod(session, methodId) {
    const response = await fetchWithSession({
        session,
        endpoint: `/api/payment-methods/${methodId}`,
        method: 'DELETE',
    });
    return response.data;
}

export async function setDefaultPaymentMethod(session, methodId, type = 'purchase') {
    const response = await fetchWithSession({
        session,
        endpoint: `/api/payment-methods/${methodId}/set-default?type=${type}`,
        method: 'PUT',
    });
    return response.data;
}

export async function setupPaymentMethod(session, paymentMethod = 'paypal', options = {}) {
    const { language, currency = 'ILS' } = options;
    const provider = providerMap[paymentMethod] ?? 'PAYPAL';
    const response = await fetchWithSession({
        session,
        endpoint: '/api/payment-methods/setup',
        data: {
            provider,
            language: getCurrentLanguage(language),
            currency,
        },
        method: 'POST',
    });
    return response.data;
}

export async function updateSubscriptionMethod(session, subscriptionId, methodId) {
    const response = await fetchWithSession({
        session,
        endpoint: `/api/billing/subscriptions/${subscriptionId}/payment-method`,
        data: { paymentMethodId: methodId },
        method: 'PUT',
    });
    return response.data;
}
