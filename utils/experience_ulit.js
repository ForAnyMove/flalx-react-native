export const formatExperience = (exp, t) => {
    if (!exp || (typeof exp === 'object' && !exp.years && !exp.months)) return '-';

    const y = typeof exp === 'object' ? exp.years : 0;
    const m = typeof exp === 'object' ? exp.months : 0;

    if (!y && !m) return '-';

    const yearStr =
        y > 0
            ? y === 1
                ? t('register.experience.year')
                : t('register.experience.years', { years: y })
            : '';
    const monthStr =
        m > 0
            ? m === 1
                ? t('register.experience.month')
                : t('register.experience.months', { months: m })
            : '';

    return [yearStr, monthStr].filter(Boolean).join(' ');
};