import { fetchWithSession } from './apiBase';
import { logError } from '../../utils/log_util';

async function createSubscription(session, planId) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: '/api/billing/subscriptions/initialize',
            data: { planId, provider: 'hyp' },
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

export { getSubscriptionPlans, createSubscription, getUserSubscription, upgradeSubscription, downgradeSubscription, payForPlanUpgrade };