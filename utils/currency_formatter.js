export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
    if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
        return '0';
    }

    const numAmount = Number(amount);
    if (numAmount === 0) {
        return '0';
    }

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(numAmount);
    } catch (e) {
        return `${numAmount}`;
    }
};