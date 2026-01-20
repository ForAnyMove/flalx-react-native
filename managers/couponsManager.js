import { useEffect, useState } from "react";
import { getCouponsBalance, getReferralLink } from '../src/api/coupons';
import { logError } from "../utils/log_util";

export default function couponsManager({ session }) {
    const [couponsBalance, setCouponsBalance] = useState(0);
    const [link, setLink] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (link !== '' || !session || !session?.token || loading) return;

        async function fetchCouponsData() {
            setLoading(true);

            const balance = await getCouponsBalance(session);
            const referralData = await getReferralLink(session);
            setCouponsBalance(balance);

            setLink(referralData.referral_link);
            setLoading(false);
        }

        fetchCouponsData();
    }, [session, link]);

    async function refreshBalance() {
        try {
            if (!session || !session?.token) return;

            const balance = await getCouponsBalance(session);
            setCouponsBalance(balance);
        } catch (error) {
            logError('Error refreshing coupons balance:', error);
        }
    }

    return {
        balance: couponsBalance,
        referralLink: link,
        refreshBalance
    };
}