export const formatExperience = (exp, t) => {
    if (!exp) return '-';

    let parsed = exp;

    if (typeof exp === 'string') {
        const trimmed = exp.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                parsed = JSON.parse(trimmed);
            } catch {
                parsed = exp;
            }
        } else if (!isNaN(Number(trimmed)) && trimmed !== '') {
            parsed = { years: Number(trimmed), months: 0 };
        } else if (['none', 'less_1', '1_3', '3_5', '5_plus'].includes(trimmed)) {
            if (trimmed === 'none') return '-';
            const fallbackMap = {
                less_1: 'Less than a year',
                '1_3': '1-3 years',
                '3_5': '3-5 years',
                '5_plus': '5+ years',
            };
            return typeof t === 'function'
                ? t(`register.experience.${trimmed}`, { defaultValue: fallbackMap[trimmed] || trimmed })
                : (fallbackMap[trimmed] || trimmed);
        }
    } else if (typeof exp === 'number') {
        parsed = { years: exp, months: 0 };
    }

    if (!parsed || (typeof parsed === 'object' && !parsed.years && !parsed.months)) {
        return '-';
    }

    const y = typeof parsed === 'object' ? Number(parsed.years) || 0 : 0;
    const m = typeof parsed === 'object' ? Number(parsed.months) || 0 : 0;

    if (!y && !m) {
        if (typeof parsed === 'string' && parsed !== '-') return parsed;
        return '-';
    }

    const translate = (key, options, fallback) => {
        if (typeof t === 'function') {
            return t(key, { ...options, defaultValue: fallback });
        }
        return fallback;
    };

    const yearStr =
        y > 0
            ? y === 1
                ? translate('register.experience.year', {}, '1 year')
                : translate('register.experience.years', { years: y }, `${y} years`)
            : '';
    const monthStr =
        m > 0
            ? m === 1
                ? translate('register.experience.month', {}, '1 month')
                : translate('register.experience.months', { months: m }, `${m} months`)
            : '';

    return [yearStr, monthStr].filter(Boolean).join(' ') || '-';
};