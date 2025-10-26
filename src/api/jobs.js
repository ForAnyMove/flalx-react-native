import axios from 'axios';

async function createJob(jobData, session) {
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

        const response = await axios.post(`${url}/api/jobs/create`, { job: jobData, paymentMethod: 'paypal' }, { headers });

        const status = response.status;
        const returnData = {};

        if (status == 200) {
            // job created successfully

            const { job } = response.data;
            returnData.job = job;

        } else if (status == 201) {
            // payment required

            const { payment } = response.data;
            console.log(payment);

            const paypalApprovalUrl = payment?.paymentMetadata?.paypalApproval?.href;

            if (paypalApprovalUrl) {
                returnData.paymentUrl = paypalApprovalUrl;
            }
        }

        return returnData;
    } catch (error) {
        console.error('Error creating new job:', error);
        throw error;
    }
}

async function checkHasPendingJob(session) {
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

        const response = await axios.get(`${url}/api/jobs/pending`, { headers });

        const status = response.status;
        const returnData = {};

        if (status == 200) {
            // pending jobs found
            const { job, payment } = response.data;
            returnData.job = job;
            returnData.payment = payment;
        }

        return returnData;
    } catch (error) {
        console.error('Error checking for pending jobs:', error);
        throw error;
    }
}

async function getJobProducts(session) {
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

        const response = await axios.get(`${url}/api/jobs/products`, { headers });

        if (response.status === 200) {
            return response.data.products;
        } else {
            throw new Error('Failed to fetch job products');
        }
    } catch (error) {
        console.error('Error fetching job products:', error);
        throw error;
    }
}

export { createJob, checkHasPendingJob, getJobProducts };