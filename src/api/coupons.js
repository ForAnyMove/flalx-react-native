import { logError } from "../../utils/log_util";
import { fetchWithSession } from "./apiBase";

const ENDPOINTS = {
    route: `/api/referrals`,
    myLink: () => ENDPOINTS.route + '/my-link',
    balance: () => ENDPOINTS.route + '/coupons/balance',
    validate: (code) => ENDPOINTS.route + `/validate/${code}`,
}

export async function getReferralLink(session) {
    try {
        const data = await fetchWithSession({ session, endpoint: ENDPOINTS.myLink() });
        const { referral_code, referral_link } = data;

        return {
            referral_code,
            referral_link
        };
    } catch (error) {
        logError('Error fetching referral link:', error);
        throw error;
    }
}

export async function getCouponsBalance(session) {
    try {
        const data = await fetchWithSession({ session, endpoint: ENDPOINTS.balance() });
        const { balance } = data;

        return balance;
    } catch (error) {
        logError('Error fetching coupons balance:', error);
        throw error;
    }
}

export async function validateCouponCode(session, code) {
    try {
        const data = await fetchWithSession({ session, endpoint: ENDPOINTS.validate(code) });
        const { valid } = data;

        return valid;
    } catch (error) {
        logError('Error validating coupon code:', error);
        throw error;
    }
}