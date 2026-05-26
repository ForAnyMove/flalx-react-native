import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useTranslation, Trans } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import { useWindowInfo } from '../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { icons } from '../constants/icons';

const ConfirmSelectProviderModal = ({
  visible,
  onClose,
  onConfirm,
  providerName,
  onSuccessClose,
}) => {
  const { themeController, languageController } = useComponentContext();
  const theme = themeController.current;
  const { height, width, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

  // 'confirm' | 'loading' | 'success' | 'error'
  const [step, setStep] = useState('confirm');

  useEffect(() => {
    if (visible) {
      setStep('confirm');
    }
  }, [visible]);

  const handleCrossPress = () => {
    if (step === 'success') {
      onSuccessClose();
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleConfirm = () => {
    setStep('loading');
    onConfirm()
      .then((success) => {
        if (success !== false) {
          setStep('success');
        } else {
          setStep('error');
        }
      })
      .catch(() => {
        setStep('error');
      });
  };

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      modalWidth: isWebLandscape ? scale(480) : '90%',
      borderRadius: scale(8),
      containerPaddingVertical: scale(32),
      containerPaddingHorizontal: isWebLandscape ? scale(66) : scale(24),
      titleSize: scale(24),
      titleBottomMargin: scale(8),
      descSize: scale(18),
      descMarginBottom: scale(24),
      crossIconSize: scale(24),
      crossIconPosition: scale(12),
      statusIconSize: scale(112),
      mainStatusIconSize: scale(120),
      statusIconMarginBottom: scale(24),
      statusTitleSize: scale(22),
      statusTextSize: scale(16),
      statusTextMarginTop: scale(12),
      statusTextMarginBottom: scale(24),
      buttonHeight: scale(62),
      buttonTextSize: scale(20),
      buttonMarginTop: scale(24),
      buttonsGap: scale(24),
      loadingIndicatorSize: scale(60),
      borderWidthOne: 1,
      flexOne: 1,
      widthFull: '100%',
    };
  }, [height, width, isWebLandscape]);

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: sizes.flexOne,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      width: sizes.modalWidth,
      backgroundColor: theme.backgroundColor,
      borderRadius: sizes.borderRadius,
      paddingVertical: sizes.containerPaddingVertical,
      paddingHorizontal: sizes.containerPaddingHorizontal,
      alignItems: 'center',
      position: 'relative',
    },
    crossButton: {
      position: 'absolute',
      top: sizes.crossIconPosition,
      right: sizes.crossIconPosition,
      zIndex: 1,
    },
    crossIcon: {
      width: sizes.crossIconSize,
      height: sizes.crossIconSize,
      tintColor: theme.textColor,
    },
    contentContainer: {
      width: sizes.widthFull,
      alignItems: 'center',
    },
    statusIcon: {
      width: sizes.mainStatusIconSize,
      height: sizes.mainStatusIconSize,
      marginBottom: sizes.statusIconMarginBottom,
      resizeMode: 'contain',
    },
    title: {
      fontSize: sizes.statusTitleSize,
      fontFamily: 'Rubik-Bold',
      color: theme.primaryColor,
      marginBottom: sizes.titleBottomMargin,
      textAlign: 'center',
    },
    desc: {
      fontSize: sizes.descSize,
      color: theme.unactiveTextColor,
      fontFamily: 'Rubik-Medium',
      textAlign: 'center',
      marginBottom: sizes.descMarginBottom,
    },
    buttonsRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      width: sizes.widthFull,
      marginTop: sizes.buttonMarginTop,
      gap: sizes.buttonsGap,
    },
    button: {
      height: sizes.buttonHeight,
      borderRadius: sizes.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: theme.buttonColorPrimaryDefault,
    },
    outlineButton: {
      backgroundColor: 'transparent',
      borderWidth: sizes.borderWidthOne,
      borderColor: theme.buttonColorPrimaryDefault,
    },
    buttonText: {
      fontSize: sizes.buttonTextSize,
      fontFamily: 'Rubik-Medium',
      textAlign: 'center',
    },
    primaryButtonText: {
      color: theme.buttonTextColorPrimary,
    },
    outlineButtonText: {
      color: theme.buttonColorPrimaryDefault,
    },
  });

  const renderConfirm = () => (
    <View style={styles.contentContainer}>
      <Image source={icons.chosen_user} style={styles.statusIcon} />
      <Text style={styles.title}>{t('selectProviderModal.confirm_title')}</Text>
      <Text style={styles.desc}>
        <Trans
          i18nKey="selectProviderModal.confirm_description"
          values={{ name: providerName }}
          components={{ highlight: <Text style={{ color: theme.textColor }} /> }}
        />
      </Text>

      <View style={styles.buttonsRow}>
        <TouchableOpacity style={[styles.button, styles.outlineButton, { flex: sizes.flexOne }]} onPress={handleCancel}>
          <Text style={[styles.buttonText, styles.outlineButtonText]}>
            {t('common.cancel')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.primaryButton, { flex: sizes.flexOne }]} onPress={handleConfirm}>
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            {t('selectProviderModal.confirm_button')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.contentContainer}>
      <ActivityIndicator size={sizes.loadingIndicatorSize} color={theme.primaryColor} style={{ marginVertical: sizes.statusIconMarginBottom }} />
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.contentContainer}>
      <Image source={icons.checkDefault} style={styles.statusIcon} />
      <Text style={styles.title}>{t('selectProviderModal.success_title')}</Text>
      <Text style={styles.desc}>
        <Trans
          i18nKey="selectProviderModal.success_description"
          values={{ name: providerName }}
          components={{ highlight: <Text style={{ color: theme.textColor }} /> }}
        />
      </Text>
      <TouchableOpacity style={[styles.button, styles.primaryButton, { width: sizes.widthFull }]} onPress={onSuccessClose}>
        <Text style={[styles.buttonText, styles.primaryButtonText]}>
          {t('selectProviderModal.success_button')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderError = () => (
    <View style={styles.contentContainer}>
      <Image source={icons.attention} style={styles.statusIcon} />
      <Text style={[styles.title, { color: theme.errorTextColor }]}>{t('errors.unexpected_error')}</Text>
      <TouchableOpacity style={[styles.button, styles.primaryButton, { width: sizes.widthFull }]} onPress={handleCancel}>
        <Text style={[styles.buttonText, styles.primaryButtonText]}>
          {t('common.close')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (step) {
      case 'confirm':
        return renderConfirm();
      case 'loading':
        return renderLoading();
      case 'success':
        return renderSuccess();
      case 'error':
        return renderError();
      default:
        return renderConfirm();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.crossButton} onPress={handleCrossPress}>
            <Image source={icons.cross} style={styles.crossIcon} />
          </TouchableOpacity>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmSelectProviderModal;
