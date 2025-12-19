import React, { useMemo } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    Image,
    useWindowDimensions,
    Platform,
    StyleSheet,
} from 'react-native';
import { icons } from '../../../constants/icons';
import { useWindowInfo } from '../../../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../../../utils/resizeFuncs';
import { useComponentContext } from '../../../context/globalAppContext';
import { useTranslation } from 'react-i18next';

export const SubmitModal = ({ visible, onClose, onSubmitted }) => {
    const { themeController } = useComponentContext();
    const { height, width } = useWindowDimensions();
    const { isLandscape } = useWindowInfo();
    const isWebLandscape = Platform.OS === 'web' && isLandscape;
    const { t } = useTranslation();

    const sizes = useMemo(() => {
        const scale = isWebLandscape ? scaleByHeight : scaleByHeightMobile;
        return {
            modalWidth: isWebLandscape ? scale(450) : width,
            modalMaxHeight: isWebLandscape ? height * 0.8 : height,
            borderRadius: scale(8),
            paddingVertical: scale(40),
            paddingHorizontal: scale(60),
            titleSize: scale(24),
            descriptionSize: scale(18),
            crossSpace: scale(8),
            iconSize: scale(24),
            buttonHeight: scale(62),
            buttonFontSize: scale(16),
            successIconContainerSize: scale(112),
            successIconSize: scale(112),
            successTitleMarginTop: scale(24),
            successDescriptionMarginTop: scale(8),
            successButtonMarginTop: scale(32),
        };
    }, [height, width, isWebLandscape]);

    const styles = StyleSheet.create({
        modalOverlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        modalContainer: {
            width: sizes.modalWidth,
            maxHeight: sizes.modalMaxHeight,
            backgroundColor: themeController.current?.backgroundColor,
            borderRadius: sizes.borderRadius,
            paddingVertical: sizes.paddingVertical,
            paddingHorizontal: sizes.paddingHorizontal,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 20,
            alignItems: 'center',
            position: 'relative',
            boxSizing: 'border-box',
        },
        crossIcon: {
            width: sizes.iconSize,
            height: sizes.iconSize,
            tintColor: themeController.current?.textColor,
        },
        successContainer: {
            alignItems: 'center',
        },
        successIconContainer: {
            width: sizes.successIconContainerSize,
            height: sizes.successIconContainerSize,
            borderRadius: sizes.successIconContainerSize / 2,
            backgroundColor:
                themeController.current?.buttonColorPrimaryDefault + '20',
            justifyContent: 'center',
            alignItems: 'center',
        },
        successTitle: {
            fontSize: sizes.titleSize,
            fontWeight: 'bold',
            color: themeController.current?.primaryColor,
            marginTop: sizes.successTitleMarginTop,
            textAlign: 'center',
        },
        successDescription: {
            fontSize: sizes.descriptionSize,
            color: themeController.current?.unactiveTextColor,
            marginTop: sizes.successDescriptionMarginTop,
            textAlign: 'center',
            lineHeight: sizes.descriptionSize * 1.25,
        },
        okButton: {
            height: sizes.buttonHeight,
            backgroundColor: themeController.current?.buttonColorPrimaryDefault,
            borderRadius: sizes.borderRadius,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: sizes.successButtonMarginTop,
            width: '100%',
        },
        okButtonText: {
            color: themeController.current?.buttonTextColorPrimary,
            fontSize: sizes.buttonFontSize,
            fontWeight: 'bold',
        },
    });

    const handleSubmit = () => {
        onSubmitted && onSubmitted();
    }

    const handleClose = () => {
        onClose && onClose();
    }

    return <Modal visible={visible} transparent={true} animationType='fade'>
        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
                <>
                    <View style={styles.successContainer}>
                        <View style={styles.successIconContainer}>
                            <Image
                                source={icons.checkDefault}
                                style={{
                                    width: sizes.successIconSize,
                                    height: sizes.successIconSize,
                                }}
                            />
                        </View>
                        <Text style={styles.successTitle}>
                            {t('professions.verification.success_title')}
                        </Text>
                        <Text style={styles.successDescription}>
                            {t('professions.verification.success_description')}
                        </Text>
                        <TouchableOpacity style={styles.okButton} onPress={handleClose}>
                            <Text style={styles.okButtonText}>{t('common.ok')}</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                        onPress={handleSubmit}
                        style={{
                            position: 'absolute',
                            top: sizes.crossSpace,
                            right: sizes.crossSpace,
                        }}
                    >
                        <Image source={icons.cross} style={styles.crossIcon} />
                    </TouchableOpacity>
                </>
            </View>
        </View>
    </Modal>
}