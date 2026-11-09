export const calculateCurrentExperience = (baseExp, verifiedDate) => {
    if (!baseExp) return null;

    let parsed = baseExp;
    if (typeof baseExp === 'string') {
        const trimmed = baseExp.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                parsed = JSON.parse(trimmed);
            } catch {
                parsed = baseExp;
            }
        } else if (!isNaN(Number(trimmed)) && trimmed !== '') {
            parsed = { years: Number(trimmed), months: 0 };
        }
    } else if (typeof baseExp === 'number') {
        parsed = { years: baseExp, months: 0 };
    }

    if (!parsed || typeof parsed !== 'object') {
        return baseExp;
    }

    const baseYears = Number(parsed.years) || 0;
    const baseMonths = Number(parsed.months) || 0;

    if (!verifiedDate) {
        return { years: baseYears, months: baseMonths };
    }

    const vDate = new Date(verifiedDate);
    if (isNaN(vDate.getTime())) {
        return { years: baseYears, months: baseMonths };
    }

    const now = new Date();
    let elapsedMonths = (now.getFullYear() - vDate.getFullYear()) * 12 + (now.getMonth() - vDate.getMonth());
    if (now.getDate() < vDate.getDate()) {
        elapsedMonths = Math.max(0, elapsedMonths - 1);
    }
    elapsedMonths = Math.max(0, elapsedMonths);

    const totalMonths = baseYears * 12 + baseMonths + elapsedMonths;
    return {
        years: Math.floor(totalMonths / 12),
        months: totalMonths % 12,
    };
};

export const formatExperience = (exp, t, verifiedDate = null) => {
    if (!exp) return '-';

    let effectiveExp = exp;
    if (verifiedDate) {
        effectiveExp = calculateCurrentExperience(exp, verifiedDate) || exp;
    }

    let parsed = effectiveExp;

    if (typeof effectiveExp === 'string') {
        const trimmed = effectiveExp.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                parsed = JSON.parse(trimmed);
            } catch {
                parsed = effectiveExp;
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
    } else if (typeof effectiveExp === 'number') {
        parsed = { years: effectiveExp, months: 0 };
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

export const getExperienceMonths = (exp) => {
    if (!exp) return 0;
    if (typeof exp === 'number') return exp * 12;
    if (typeof exp === 'string') {
        const trimmed = exp.trim();
        if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
            try {
                const obj = JSON.parse(trimmed);
                return (Number(obj.years) || 0) * 12 + (Number(obj.months) || 0);
            } catch { }
        }
        const num = Number(trimmed);
        if (!isNaN(num) && trimmed !== '') return num * 12;
        switch (trimmed) {
            case 'less_1': return 0;
            case '1_3': return 12;
            case '3_5': return 36;
            case '5_plus': return 60;
            default: return 0;
        }
    }
    if (typeof exp === 'object') {
        return (Number(exp.years) || 0) * 12 + (Number(exp.months) || 0);
    }
    return 0;
};