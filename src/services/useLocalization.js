import { useCallback } from "react";
import { getLocalizedField } from "../../utils/i18n/localization";

export const useLocalization = (localeState) => {
    const tField = useCallback((entity, field) => {
        console.log(localeState);

        return getLocalizedField(entity, field, localeState);
    }, [localeState]);

    return { tField };
};