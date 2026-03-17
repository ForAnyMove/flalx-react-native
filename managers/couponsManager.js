import { useEffect, useState } from "react";
import { getCouponsBalance, getReferralLink } from '../src/api/coupons';
import { logError } from "../utils/log_util";

export default function couponsManager({ session }) {
    const [couponsBalance, setCouponsBalance] = useState(0);
    const [link, setLink] = useState('');
    const [loading, setLoading] = useState(false);

    const token = session?.token?.access_token;

    useEffect(() => {
        // Сбрасываем состояние при смене аккаунта (или выходе)
        setCouponsBalance(0);
        setLink('');

        if (!session || !session?.token) return;

        async function fetchCouponsData() {
            setLoading(true);
            try {
                const balance = await getCouponsBalance(session);
                const referralData = await getReferralLink(session);
                setCouponsBalance(balance);
                setLink(referralData.referral_link);
            } catch (error) {
                logError('Error fetching coupons data:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchCouponsData();
    }, [token]); // Только token — избегаем loop через link

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