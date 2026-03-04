import {
    StyleSheet,
    Text,
    View,
    Platform,
    TouchableOpacity,
    useWindowDimensions,
    Image,
} from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import { useTranslation } from 'react-i18next';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { useMemo } from 'react';
import { useWindowInfo } from '../context/windowContext';

export default function NewJobTemplateButton({
    templateTitle,
    onPress,
    icon,
    iconStyle,
    isRTL,
    fullWidth,
}) {
    const { themeController } = useComponentContext();
    const { width, height, isLandscape } = useWindowInfo();
    const { t } = useTranslation();

    const isWebLandscape = Platform.OS === 'web' && isLandscape;

    const sizes = useMemo(
        () => ({
            cardMargin: isWebLandscape
                ? scaleByHeight(8, height)
                : scaleByHeightMobile(4, height),
            cardWidth: fullWidth
                ? '100%'
                : isWebLandscape
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
            iconSize: isWebLandscape
                ? scaleByHeight(24, height)
                : scaleByHeightMobile(20, height),
            iconMargin: scaleByHeightMobile(8, height),
        }),
        [isWebLandscape, height, width, fullWidth]
    );

    const dynamicStyles = useMemo(
        () =>
            StyleSheet.create({
                card: {
                    margin: fullWidth ? 0 : sizes.cardMargin,
                    width: sizes.cardWidth,
                    height: sizes.cardHeight,
                    borderRadius: sizes.cardRadius,
                    backgroundColor: themeController.current?.formInputBackground,
                    paddingVertical: sizes.paddingVertical,
                    paddingHorizontal: sizes.paddingHorizontal,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    justifyContent: fullWidth ? 'flex-start' : 'center',
                },
                titleText: {
                    fontSize: sizes.font,
                    color: themeController.current?.primaryColor,
                    textAlign: fullWidth ? (isRTL ? 'right' : 'left') : 'center',
                    flex: fullWidth ? 1 : 0,
                },
                icon: {
                    width: sizes.iconSize,
                    height: sizes.iconSize,
                    marginHorizontal: sizes.iconMargin,
                }
            }),
        [sizes, themeController, fullWidth, isRTL]
    );

    return (
        <TouchableOpacity
            style={[styles.card, dynamicStyles.card]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {icon && <Image source={icon} style={[dynamicStyles.icon, iconStyle]} />}
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
        alignItems: 'center',
    },
    title: {
        fontWeight: '500',
    },
});
