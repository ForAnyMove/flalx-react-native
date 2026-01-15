import {
    StyleSheet,
    Text,
    View,
    Platform,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import { useTranslation } from 'react-i18next';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { useMemo } from 'react';
import NewJobTemplateButton from './NewJobTemplateButton';
import { useLocalization } from '../src/services/useLocalization';

export default function NewJobTemplateGrouped({
    jobTypesWithSubtypes,
    onSubTypePress,
    searchValue = '',
}) {
    const { themeController, languageController } = useComponentContext();
    const { tField } = useLocalization(languageController.current);
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;
    const { t } = useTranslation();

    const isWebLandscape = Platform.OS === 'web' && isLandscape;

    const sizes = useMemo(
        () => ({
            groupMarginBottom: isWebLandscape
                ? scaleByHeight(24, height)
                : scaleByHeightMobile(20, height),
            titleFontSize: isWebLandscape
                ? scaleByHeight(18, height)
                : scaleByHeightMobile(16, height),
            titleMarginBottom: isWebLandscape
                ? scaleByHeight(12, height)
                : scaleByHeightMobile(10, height),
            titlePaddingHorizontal: isWebLandscape
                ? scaleByHeight(8, height)
                : scaleByHeightMobile(8, height),
        }),
        [isWebLandscape, height]
    );

    const dynamicStyles = useMemo(
        () =>
            StyleSheet.create({
                groupTitle: {
                    fontSize: sizes.titleFontSize,
                    color: themeController.current?.textColor,
                    marginBottom: sizes.titleMarginBottom,
                    paddingHorizontal: sizes.titlePaddingHorizontal,
                },
                groupContainer: {
                    marginBottom: sizes.groupMarginBottom,
                },
            }),
        [sizes, themeController]
    );

    // Фильтрация по поисковому запросу
    const filteredData = useMemo(() => {
        if (!jobTypesWithSubtypes) return [];

        const search = searchValue.toLowerCase();

        return jobTypesWithSubtypes
            .map((type) => {
                // Фильтруем подтипы
                const filteredSubTypes = type.subtypes?.filter((subType) =>
                    tField(subType, 'name').toLowerCase().includes(search)
                ) || [];

                // Если есть совпадение в названии типа или в подтипах, включаем группу
                const typeMatches = tField(type, 'name').toLowerCase().includes(search);

                if (typeMatches || filteredSubTypes.length > 0) {
                    return {
                        ...type,
                        subtypes: typeMatches ? type.subtypes : filteredSubTypes,
                    };
                }

                return null;
            })
            .filter(Boolean);
    }, [jobTypesWithSubtypes, searchValue, tField]);

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
        >
            {filteredData.map((type) => (
                <View key={type.key} style={dynamicStyles.groupContainer}>
                    <Text style={[styles.groupTitle, dynamicStyles.groupTitle]}>
                        {tField(type, 'name')}
                    </Text>
                    <View style={styles.buttonsWrapper}>
                        {type.subtypes?.map((subType) => (
                            <NewJobTemplateButton
                                key={subType.key}
                                templateTitle={tField(subType, 'name')}
                                onPress={() => onSubTypePress(type.key, subType.key)}
                            />
                        ))}
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 20,
    },
    groupTitle: {
        fontWeight: '700',
        fontFamily: 'Rubik-Bold',
    },
    groupContainer: {},
    buttonsWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
    },
});
