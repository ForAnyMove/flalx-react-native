import {
    StyleSheet,
    Text,
    View,
    Platform,
    ScrollView,
} from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import { useTranslation } from 'react-i18next';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { useMemo, useState } from 'react';
import NewJobTemplateButton from './NewJobTemplateButton';
import { useLocalization } from '../src/services/useLocalization';
import { useWindowInfo } from '../context/windowContext';
import { icons } from '../constants/icons';

export default function NewJobTemplateGrouped({
    jobTypesWithSubtypes,
    onSubTypePress,
    searchValue = '',
}) {
    const { themeController, languageController } = useComponentContext();
    const { tField, isRTL } = useLocalization(languageController.current);
    const { width, height, isLandscape } = useWindowInfo();
    const { t } = useTranslation();
    const [expandedTypes, setExpandedTypes] = useState({});

    const isWebLandscape = Platform.OS === 'web' && isLandscape;

    const sizes = useMemo(
        () => ({
            groupMarginBottom: isWebLandscape
                ? scaleByHeight(12, height)
                : scaleByHeightMobile(10, height),
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
                groupContainer: {
                    marginBottom: sizes.groupMarginBottom,
                },
            }),
        [sizes]
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

    const handleTypePress = (typeKey) => {
        setExpandedTypes(prev => ({
            ...prev,
            [typeKey]: !prev[typeKey]
        }));
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
        >
            {filteredData.map((type) => {
                const isExpanded = !!expandedTypes[type.key];
                const rotation = isExpanded ? '0deg' : (isRTL ? '90deg' : '-90deg');

                return (
                    <View key={type.key} style={dynamicStyles.groupContainer}>
                        <NewJobTemplateButton
                            templateTitle={tField(type, 'name')}
                            onPress={() => handleTypePress(type.key)}
                            fullWidth
                            isRTL={isRTL}
                            icon={icons.arrowDown}
                            iconStyle={{ transform: [{ rotate: rotation }] }}
                        />
                        {isExpanded && (
                            <View style={styles.buttonsWrapper}>
                                {type.subtypes?.map((subType) => (
                                    <NewJobTemplateButton
                                        key={subType.key}
                                        templateTitle={tField(subType, 'name')}
                                        onPress={() => onSubTypePress(type.key, subType.key)}
                                    />
                                ))}
                            </View>
                        )}
                    </View>
                );
            })}
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
    groupContainer: {},
    buttonsWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginTop: 10,
    },
});
