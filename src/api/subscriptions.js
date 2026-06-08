import { fetchWithSession } from './apiBase';
import { logError } from '../../utils/log_util';
import i18n from '../../utils/i18n/i18n';

const getCurrentLanguage = (language) => language ?? i18n.language ?? 'en';

async function createSubscription(session, planId, paymentOptions = {}) {
    const { paymentMethod = 'paypal', savedPaymentMethodId, language } = paymentOptions;
    const providerMap = { paypal: 'PAYPAL', hyp: 'HYP', card: 'HYP' };
    const provider = providerMap[paymentMethod] ?? 'PAYPAL';
    try {
        const response = await fetchWithSession({
            session,
            endpoint: '/api/billing/subscriptions/initialize',
            data: {
                planId,
                provider,
                language: getCurrentLanguage(language),
                ...(savedPaymentMethodId && { savedPaymentMethodId }),
            },
            method: 'POST'
        });

        return response.data;
    } catch (error) {
        logError('Error creating subscription:', error, error.response);
        if (error.response?.data?.subscription != null) {
            return {
                approvalUrl: null
            };
        }
        throw error;
    }
}

async function getSubscriptionPlans(session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: '/api/subscriptions/plans',
            method: 'GET'
        });
        const status = response.status;
        const returnData = {};
        if (status == 200) {
            const { plans } = response.data;
            returnData.plans = plans;
        }
        return returnData;
    } catch (error) {
        logError('Error fetching subscription plans:', error);
        throw error;
    }
}

async function getUserSubscription(session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: '/api/subscriptions/current',
            method: 'GET'
        });
        const status = response.status;
        const returnData = {};
        if (status == 200) {
            const { subscription } = response.data;
            returnData.subscription = subscription;
        }
        return returnData;
    } catch (error) {
        logError('Error fetching user subscription:', error);
        throw error;
    }
}

async function upgradeSubscription(session, currentSubscriptionId, planId) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/api/subscriptions/${currentSubscriptionId}/upgrade`,
            data: { planId, force_change: true },
            method: 'POST'
        });
        const status = response.status;
        const returnData = {};
        if (status == 200) {
            const { success, payment_url } = response.data;
            returnData.success = success;
            returnData.payment_url = payment_url;
        }
        return returnData;
    } catch (error) {
        logError('Error upgrading subscription:', error);
        throw error;
    }
}

async function downgradeSubscription(session, currentSubscriptionId, planId) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/api/subscriptions/${currentSubscriptionId}/downgrade`,
            data: { planId, force_change: true },
            method: 'POST'
        });
        const status = response.status;
        const returnData = {};
        if (status == 200) {
            const { success, approval_url } = response.data;
            returnData.success = success;
            returnData.approval_url = approval_url;
        }
        return returnData;
    } catch (error) {
        logError('Error downgrading subscription:', error);
        throw error;
    }
}

async function payForPlanUpgrade(session, currentSubscriptionId) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/api/subscriptions/${currentSubscriptionId}/upgrade-payment`,
            data: {},
            method: 'POST'
        });
        const status = response.status;
        const returnData = {};
        if (status == 200) {
            const { success, approval_url } = response.data;
            returnData.success = success;
            returnData.approval_url = approval_url;
        }
        return returnData;
    } catch (error) {
        logError('Error paying for plan upgrade:', error);
        throw error;
    }
}

async function cancelSubscription(session, subscriptionId, immediate = false) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/api/billing/subscriptions/${subscriptionId}/cancel`,
            data: { immediate },
            method: 'POST'
        });
        return response.data;
    } catch (error) {
        logError('Error cancelling subscription:', error);
        throw error;
    }
}

async function reactivateSubscription(session, subscriptionId, paymentMethodId) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/api/billing/subscriptions/${subscriptionId}/reactivate`,
            data: paymentMethodId ? { paymentMethodId } : {},
            method: 'POST'
        });
        return response.data;
    } catch (error) {
        logError('Error reactivating subscription:', error);
        throw error;
    }
}

async function updateSubscriptionPaymentMethod(session, subscriptionId, paymentMethodId) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/api/billing/subscriptions/${subscriptionId}/payment-method`,
            data: { paymentMethodId },
            method: 'PUT'
        });
        return response.data;
    } catch (error) {
        logError('Error updating subscription payment method:', error);
        throw error;
    }
}

async function addPaymentMethodToSubscription(session, subscriptionId, paymentMethod = 'paypal', options = {}) {
    const { language } = options;
    const providerMap = { paypal: 'PAYPAL', hyp: 'HYP', card: 'HYP' };
    const provider = providerMap[paymentMethod] ?? 'PAYPAL';
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/api/billing/subscriptions/${subscriptionId}/add-payment-method`,
            data: { provider, language: getCurrentLanguage(language) },
            method: 'POST'
        });
        return response.data;
    } catch (error) {
        logError('Error adding payment method to subscription:', error);
        throw error;
    }
}

export { getSubscriptionPlans, createSubscription, getUserSubscription, upgradeSubscription, downgradeSubscription, payForPlanUpgrade, cancelSubscription, reactivateSubscription, updateSubscriptionPaymentMethod, addPaymentMethodToSubscription };
