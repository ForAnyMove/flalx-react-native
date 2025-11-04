import axios from 'axios';

async function createSubscription(session, planId) {
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

        const response = await axios.post(`${url}/api/subscriptions/create`, { planId }, { headers });

        const status = response.status;
        const returnData = {};

        if (status == 201) {
            // subscription created successfully
            const { success, subscription, approvalUrl } = response.data;
            returnData.success = success;
            returnData.subscription = subscription;
            returnData.approvalUrl = approvalUrl;
        }

        return returnData;
    } catch (error) {
        console.error('Error creating subscription:', error, error.response);
        if (error.response?.data?.subscription != null) {
            return {
                success: false,
                subscription: error.response.data.subscription,
                approvalUrl: null
            };
        }
        throw error;
    }
}

async function getSubscriptionPlans(session) {
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

        const response = await axios.get(`${url}/api/subscriptions/plans`, { headers });

        const status = response.status;
        const returnData = {};

        if (status == 200) {
            // plans retrieved successfully
            const { plans } = response.data;
            returnData.plans = plans;
        }
        console.log('Check plans translations code: ',returnData.plans);
        
        return returnData;
    } catch (error) {
        console.error('Error fetching subscription plans:', error);
        throw error;
    }
}

async function getUserSubscription(session) {
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

        const response = await axios.get(`${url}/api/subscriptions/current`, { headers });


        const status = response.status;
        const returnData = {};

        if (status == 200) {
            // subscription retrieved successfully
            const { subscription } = response.data;
            returnData.subscription = subscription;
        }

        return returnData;
    } catch (error) {
        console.error('Error fetching user subscription:', error);
        throw error;
    }
}

async function upgradeSubscription(session, currentSubscriptionId, planId) {
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

        const response = await axios.post(`${url}/api/subscriptions/${currentSubscriptionId}/upgrade`, { planId, force_change: true }, { headers });

        const status = response.status;
        const returnData = {};

        if (status == 200) {
            const { success, payment_url } = response.data;
            returnData.success = success;
            returnData.payment_url = payment_url;
        }

        return returnData;
    } catch (error) {
        console.error('Error upgrading subscription:', error);
        throw error;
    }
}

async function downgradeSubscription(session, currentSubscriptionId, planId) {
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

        const response = await axios.post(`${url}/api/subscriptions/${currentSubscriptionId}/downgrade`, { planId, force_change: true }, { headers });

        const status = response.status;
        const returnData = {};

        if (status == 200) {
            const { success, approval_url } = response.data;
            returnData.success = success;
            returnData.approval_url = approval_url;
        }

        return returnData;
    } catch (error) {
        console.error('Error upgrading subscription:', error);
        throw error;
    }
}

async function payForPlanUpgrade(session, currentSubscriptionId) {
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

        const response = await axios.post(`${url}/api/subscriptions/${currentSubscriptionId}/upgrade-payment`, {}, { headers });
        const status = response.status;
        const returnData = {};
        console.log(response);


        if (status == 200) {
            const { success, approval_url } = response.data;
            returnData.success = success;
            returnData.approval_url = approval_url;
        }

        return returnData;
    } catch (error) {
        console.error('Error paying for plan upgrade:', error);
        throw error;
    }
}

export { getSubscriptionPlans, createSubscription, getUserSubscription, upgradeSubscription, downgradeSubscription, payForPlanUpgrade };