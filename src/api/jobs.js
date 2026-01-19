import axios from 'axios';
import { fetchWithSession } from './apiBase';
import { logError } from '../../utils/log_util';

async function createJob(jobData, session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: '/api/jobs/create',
            data: { job: jobData, paymentMethod: 'paypal' },
            method: 'POST'
        });
        const returnData = {
            paymentUrl: response.data?.payment?.paymentMetadata?.paypalApproval?.href,
            job: response.data?.job
        };
        return returnData;
    } catch (error) {
        logError('Error creating new job:', error);
        throw error;
    }
}

async function payForJob(jobDataId, session, useCoupon = false) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/api/jobs/${jobDataId}/pay`,
            data: { paymentMethod: 'paypal', use_coupon: useCoupon },
            method: 'POST'
        });
        const returnData = {
            paymentUrl: response.data?.payment?.paymentMetadata?.paypalApproval?.href,
            job: response.data?.job
        };
        return returnData;
    } catch (error) {
        logError('Error creating new job:', error);
        throw error;
    }
}

async function checkHasPendingJob(session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: '/api/jobs/pending',
            method: 'GET'
        });
        const returnData = {};
        if (response.status === 200) {
            const { job, payment } = response.data;
            returnData.job = job;
            returnData.payment = payment;
        }
        return returnData;
    } catch (error) {
        logError('Error checking for pending jobs:', error);
        throw error;
    }
}

async function getJobProducts(session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: '/api/jobs/products',
            method: 'GET'
        });
        if (response.status === 200) {
            return response.data;
        } else {
            throw new Error('Failed to fetch job products');
        }
    } catch (error) {
        logError('Error fetching job products:', error);
        throw error;
    }
}

async function addSelfToJobProviders(jobId, session, useCoupon = false) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/api/jobs/${jobId}/providers`,
            data: {
                paymentMethod: 'paypal',
                use_coupon: useCoupon
            },
            method: 'POST'
        });

        return response.data;
    } catch (error) {
        logError('Error adding self to job providers:', error);
        throw error;
    }
}

async function removeSelfFromJobProviders(jobId, session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/api/jobs/${jobId}/providers`,
            method: 'DELETE'
        });
        return response.data;
    } catch (error) {
        logError('Error removing self from job providers:', error);
        throw error;
    }
}

async function isProviderInJob(jobId, session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/api/jobs/${jobId}/is-provider`,
            method: 'GET'
        });
        return response.data?.isProvider == true;
    }
    catch (error) {
        logError('Error checking if provider is in job:', error);
        throw error;
    }
}

async function wasProviderInJob(jobId, session) {
    try {
        const response = await fetchWithSession({ session, endpoint: `/api/jobs/${jobId}/is-cancelled-provider` });

        return response.data?.isCancelledProvider == true;
    }
    catch (error) {
        logError('Error checking if provider is in job:', error);
        throw error;
    }
}

async function completeJob(jobId, options, session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/jobs/${jobId}/done`,
            data: { images: options.images, comment: options.description },
            method: 'PATCH'
        });
        return response.data;
    } catch (error) {
        logError('Error completing job:', error);
        throw error;
    }
}

async function updateJobComment(jobId, comment, session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/jobs/${jobId}/job-comment`,
            data: { comment },
            method: 'PATCH'
        });
        return response.data;
    } catch (error) {
        logError('Error updating job comment:', error);
        throw error;
    }
}

async function noticeJobRejection(jobId, session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/jobs/as-creator/waiting/${jobId}/notice-rejection`,
            data: {},
            method: 'PATCH'
        });
        return response.data;
    } catch (error) {
        logError('Error noticing job rejection:', error);
        throw error;
    }
}

export {
    createJob,
    checkHasPendingJob,
    getJobProducts,
    addSelfToJobProviders,
    removeSelfFromJobProviders,
    isProviderInJob,
    wasProviderInJob,
    completeJob,
    updateJobComment,
    payForJob,
    noticeJobRejection
};