import {
    StyleSheet,
    Text,
    View,
    Platform,
    TouchableOpacity,
    useWindowDimensions,
} from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import { useTranslation } from 'react-i18next';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { useMemo } from 'react';

export default function NewJobTemplateButton({
    templateTitle,
    onPress,
}) {
    const { themeController } = useComponentContext();
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;
    const { t } = useTranslation();

    const isWebLandscape = Platform.OS === 'web' && isLandscape;

    const sizes = useMemo(
        () => ({
            cardMargin: isWebLandscape
                ? scaleByHeight(8, height)
                : scaleByHeightMobile(4, height),
            cardWidth: isWebLandscape
                ? scaleByHeight(242, height)
                : (width - scaleByHeightMobile(20, height)) / 2 -
                scaleByHeightMobile(17, height),
            cardHeight: isWebLandscape
                ? scaleByHeight(60, height)
                : scaleByHeightMobile(50, height),
            cardRadius: isWebLandscape
                ? scaleByHeight(8, height)
                : scaleByHeightMobile(4, height),
            font: isWebLandscape
                ? scaleByHeight(14, height)
                : scaleByHeightMobile(14, height),
            paddingVertical: isWebLandscape
                ? scaleByHeight(15, height)
                : scaleByHeightMobile(12, height),
            paddingHorizontal: isWebLandscape
                ? scaleByHeight(16, height)
                : scaleByHeightMobile(12, height),
        }),
        [isWebLandscape, height, width]
    );

    const dynamicStyles = useMemo(
        () =>
            StyleSheet.create({
                card: {
                    margin: sizes.cardMargin,
                    width: sizes.cardWidth,
                    height: sizes.cardHeight,
                    borderRadius: sizes.cardRadius,
                    backgroundColor: themeController.current?.formInputBackground,
                    paddingVertical: sizes.paddingVertical,
                    paddingHorizontal: sizes.paddingHorizontal,
                },
                titleText: {
                    fontSize: sizes.font,
                    color: themeController.current?.primaryColor,
                },
            }),
        [sizes, themeController]
    );

    return (
        <TouchableOpacity
            style={[styles.card, dynamicStyles.card]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text
                style={[styles.title, dynamicStyles.titleText]}
                numberOfLines={2}
                ellipsizeMode='tail'
            >
                {templateTitle}
            </Text>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        elevation: 3,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontWeight: '500',
        textAlign: 'center',
    },
});
