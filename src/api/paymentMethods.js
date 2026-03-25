import { fetchWithSession } from './apiBase';
import { logError } from '../../utils/log_util';

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

export async function updateSubscriptionMethod(session, subscriptionId, methodId) {
    const response = await fetchWithSession({
        session,
        endpoint: `/api/billing/subscriptions/${subscriptionId}/payment-method`,
        data: { paymentMethodId: methodId },
        method: 'PUT',
    });
    return response.data;
}
