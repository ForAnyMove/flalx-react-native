import axios from 'axios';
import { fetchWithSession } from './apiBase';
import { logError, logInfo, logWarn } from '../../utils/log_util';
import i18n from '../../utils/i18n/i18n';

const getCurrentLanguage = (language) => language ?? i18n.language ?? 'en';

async function createJob(jobData, session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: '/api/jobs/create',
            data: { job: jobData },
            method: 'POST'
        });
        return {
            job: response.data?.job
        };
    } catch (error) {
        logError('Error creating new job:', error);
        throw error;
    }
}

async function payForJob(jobDataId, session, paymentOptions = {}) {
    try {
        const { useCoupon = false, paymentMethod = 'paypal', savePaymentMethod, savedPaymentMethodId, language } = paymentOptions;
        const data = {
            language: getCurrentLanguage(language),
            ...(useCoupon
                ? { use_coupon: true, paymentMethod: 'none' }
                : savedPaymentMethodId
                    ? { paymentMethod, savedPaymentMethodId }
                    : { paymentMethod }
            ),
            ...(!useCoupon && !savedPaymentMethodId && savePaymentMethod !== undefined && { savePaymentMethod }),
        };
        const response = await fetchWithSession({
            session,
            endpoint: `/api/jobs/${jobDataId}/pay`,
            data,
            method: 'POST'
        });
        // Raw payload, unconditionally — lets us tell a backend omission (link
        // never in the response) from a frontend extraction bug (link present
        // under a field we're not reading) when a redirect goes missing.
        logInfo('payForJob response:', response.data);
        // Coupon / subscription bypass — job already moved to pending_moderation
        if (response.data?.success === true) {
            return {
                success: true,
                remainingCoupons: response.data?.remainingCoupons ?? null,
                job: response.data?.job ?? null,
            };
        }

        const paymentUrl = response.data?.redirectUrl ?? response.data?.payment?.paymentMetadata?.approval?.href;
        const directAuth = response.data?.directAuth === true;
        if (!paymentUrl && !directAuth) {
            logWarn('payForJob: response has no success/directAuth/paymentUrl — caller will silently skip the redirect:', response.data);
        }

        return {
            paymentUrl,
            directAuth,
            payment: response.data?.payment,
            job: response.data?.job,
            paymentMethodsSnapshot: response.data?.paymentMethodsSnapshot ?? null,
        };
    } catch (error) {
        logError('Error paying for job:', error);
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

async function addSelfToJobProviders(jobId, session, options = {}) {
    try {
        const {
            useCoupon = false,
            paymentMethod = 'paypal',
            savePaymentMethod,
            savedPaymentMethodId,
            language,
            proposed_price,
            proposed_time_from,
            proposed_time_to,
            proposed_time_from_local,
            proposed_time_to_local,
            source_timezone,
        } = options;

        const data = {
            language: getCurrentLanguage(language),
            ...(useCoupon
                ? { use_coupon: true, paymentMethod: 'none' }
                : savedPaymentMethodId
                    ? { paymentMethod, savedPaymentMethodId }
                    : { paymentMethod }
            ),
            ...(!useCoupon && !savedPaymentMethodId && savePaymentMethod !== undefined && { savePaymentMethod }),
            ...(proposed_price !== undefined && proposed_price !== '' && { proposed_price: parseFloat(proposed_price) }),
            ...(proposed_time_from && { proposed_time_from }),
            ...(proposed_time_to && { proposed_time_to }),
            ...(proposed_time_from_local && { proposed_time_from_local }),
            ...(proposed_time_to_local && { proposed_time_to_local }),
            ...(source_timezone && { source_timezone }),
        };

        const response = await fetchWithSession({
            session,
            endpoint: `/api/jobs/${jobId}/providers`,
            data,
            method: 'POST'
        });
        // Raw payload, unconditionally — same reasoning as payForJob's log:
        // tells a backend omission apart from a frontend extraction bug.
        logInfo('addSelfToJobProviders response:', response.data);

        if (response.data?.couponUsed === true) {
            return { success: true, remainingCoupons: response.data?.remainingCoupons ?? null };
        }
        if (response.data?.directAuth === true) {
            return { directAuth: true, payment: response.data?.payment };
        }
        // Was previously reading only `redirectUrl`, unlike payForJob's identical
        // flow which also falls back to `payment.paymentMetadata.approval.href` —
        // when the backend put the link there instead, this returned `paymentUrl:
        // undefined`, every ShowJobModal call site silently treated that as "no
        // redirect needed" and moved on, and PurchaseModal (which independently
        // checks `payment.paymentMetadata.approval.href` too) then closed itself
        // believing the caller had already opened the redirect — losing the
        // payment link with no error anywhere. Matches the fallback below.
        const paymentUrl = response.data?.redirectUrl ?? response.data?.payment?.paymentMetadata?.approval?.href;
        if (!paymentUrl) {
            logWarn('addSelfToJobProviders: response has no couponUsed/directAuth/paymentUrl — caller will silently skip the redirect:', response.data);
        }
        return {
            paymentUrl,
            payment: response.data?.payment,
        };
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

async function respondToJobAgreement(jobId, session, agreed) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/api/jobs/${jobId}/providers/agreement`,
            data: { agreed },
            method: 'POST'
        });
        return response.data;
    } catch (error) {
        logError('Error responding to job agreement:', error);
        throw error;
    }
}

async function assignExecutor(jobId, session, executorId) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/api/jobs/${jobId}/assign-executor`,
            data: { executorId },
            method: 'POST'
        });
        return response.data;
    } catch (error) {
        logError('Error assigning executor:', error);
        throw error;
    }
}

async function selectProvider(jobId, session, providerId) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/api/jobs/${jobId}/providers/select`,
            data: { providerId },
            method: 'POST'
        });
        return response.data;
    } catch (error) {
        logError('Error selecting provider:', error);
        throw error;
    }
}

async function confirmProviderSelection(jobId, session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/api/jobs/${jobId}/providers/confirm`,
            method: 'POST',
        });
        return response.data; // 202: { status: 'charging', dealId }
    } catch (error) {
        logError('Error confirming provider selection:', error);
        throw error;
    }
}

async function rejectProviderSelection(jobId, session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/api/jobs/${jobId}/providers/reject`,
            method: 'POST',
        });
        return response.data;
    } catch (error) {
        logError('Error rejecting provider selection:', error);
        throw error;
    }
}

async function getArchivedRefs(session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: '/api/jobs/archived-refs',
            method: 'GET',
        });
        return response.data?.data ?? [];
    } catch (error) {
        logError('Error fetching archived refs:', error);
        throw error;
    }
}

async function markArchivedRefSeen(jobId, session) {
    try {
        const response = await fetchWithSession({
            session,
            endpoint: `/api/jobs/archived-refs/${jobId}/seen`,
            method: 'PATCH',
        });
        return response.data;
    } catch (error) {
        logError('Error marking archived ref as seen:', error);
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
    noticeJobRejection,
    respondToJobAgreement,
    assignExecutor,
    selectProvider,
    confirmProviderSelection,
    rejectProviderSelection,
    getArchivedRefs,
    markArchivedRefSeen,
};
