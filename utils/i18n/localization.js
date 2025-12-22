export const getLocalizedField = (entity, field, locale = 'en') => {
    if (entity == null) {
        return null;
    }

    const i18nField = `${field}_i18n`;

    if (entity[i18nField] && entity[i18nField][locale]) {
        return entity[i18nField][locale];
    }

    return entity[i18nField]?.en || entity[field] || null;
};