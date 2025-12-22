import { useCallback } from "react";
import { getLocalizedField } from "../../utils/i18n/localization";

export const useLocalization = (localeState) => {
    const tField = useCallback((entity, field) => {
        return getLocalizedField(entity, field, localeState);
    }, [localeState]);

    return { tField };
};