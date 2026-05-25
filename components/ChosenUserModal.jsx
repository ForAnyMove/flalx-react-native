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
import JobExpectationsBadge from './ui/JobExpectationsBadge';

const ChosenUserModal = ({
  visible,
  onClose,
  job,
  onConfirm,
  onDecline,
  chargeEvent,
}) => {
  const { themeController, languageController } = useComponentContext();
  const theme = themeController.current;
  const { height, width, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

  // 'info' | 'loading' | 'retrying' | 'success' | 'error'
  const [step, setStep] = useState('info');
  const [retryInfo, setRetryInfo] = useState(null);
  const [errorReason, setErrorReason] = useState(null);

  useEffect(() => {
    if (visible) {
      setStep('info');
      setRetryInfo(null);
      setErrorReason(null);
    }
  }, [visible]);

  useEffect(() => {
    if (!chargeEvent) return;
    switch (chargeEvent.type) {
      case 'JOB_CHARGE_COMPLETED':
        setStep('success');
        break;
      case 'JOB_CHARGE_FAILED_RETRYING':
        setRetryInfo(chargeEvent.payload);
        setStep('retrying');
        break;
      case 'JOB_CHARGE_FINAL_FAILED':
        setErrorReason(chargeEvent.payload?.reason);
        setStep('error');
        break;
    }
  }, [chargeEvent]);

  const handleCrossPress = () => {
    onClose();
  };

  const handleDecline = async () => {
    try {
      await onDecline?.(job?.id);
    } finally {
      onClose();
    }
  };

  const handleConfirm = async () => {
    setStep('loading');
    try {
      await onConfirm?.(job?.id);
      // 202 response — stay in loading; WS event drives next state
    } catch {
      setErrorReason(null);
      setStep('error');
    }
  };

  const jobTitle = job?.type?.name_i18n?.[languageController.current] || job?.type?.name || 'this job';
  const price = job?.proposed_price || '0';

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
      yourBidSize: scale(18),
      yourBidMarginBottom: scale(0),
      buttonsGap: scale(24),
      loadingIndicatorSize: scale(60),
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
      width: '100%',
      alignItems: 'center',
    },
    statusIcon: {
      width: sizes.mainStatusIconSize,
      height: sizes.mainStatusIconSize,
      marginBottom: sizes.statusIconMarginBottom,
      resizeMode: 'contain',
    },
    errorIcon: {
      width: sizes.statusIconSize,
      height: sizes.statusIconSize,
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
    yourBid: {
      fontSize: sizes.yourBidSize,
      color: theme.formInputPlaceholderColor,
      fontFamily: 'Rubik-Medium',
      marginBottom: sizes.yourBidMarginBottom,
      textAlign: 'center',
    },
    buttonsRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      width: '100%',
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
      borderWidth: 1,
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

  const renderInfo = () => (
    <View style={styles.contentContainer}>
      <Image source={icons.chosen_user} style={styles.statusIcon} />
      <Text style={styles.title}>{t('chosen_user_modal.title_info')}</Text>
      <Text style={styles.desc}>
        <Trans
          i18nKey="chosen_user_modal.desc_info"
          values={{ jobTitle, price }}
          components={{ highlight: <Text style={{ color: theme.textColor }} /> }}
        />
      </Text>

      {(job?.proposed_price || job?.proposed_time_from) && (
        <View style={{ alignItems: 'center', width: '100%' }}>
          <Text style={styles.yourBid}>{t('chosen_user_modal.your_bid')}</Text>
          <JobExpectationsBadge
            expectations={job}
            isRTL={isRTL}
            containerStyle={{ justifyContent: 'center' }}
          />
        </View>
      )}

      <View style={styles.buttonsRow}>
        <TouchableOpacity style={[styles.button, styles.outlineButton, { flex: 1 }]} onPress={handleDecline}>
          <Text style={[styles.buttonText, styles.outlineButtonText]}>
            {t('chosen_user_modal.btn_decline')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.primaryButton, { flex: 1 }]} onPress={handleConfirm}>
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            {t('chosen_user_modal.btn_confirm')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLoading = () => (
    <View style={styles.contentContainer}>
      <View style={{ width: sizes.statusIconSize, height: sizes.statusIconSize, borderRadius: sizes.statusIconSize / 2, backgroundColor: theme.defaultBlocksMockBackground, justifyContent: 'center', alignItems: 'center', marginBottom: sizes.statusIconMarginBottom }}>
        <Image source={icons.salary} style={{ width: sizes.statusIconSize * 0.5, height: sizes.statusIconSize * 0.5, tintColor: theme.primaryColor, resizeMode: 'contain' }} />
      </View>
      <Text style={styles.title}>{t('chosen_user_modal.title_loading')}</Text>
      <Text style={[styles.desc, { marginBottom: 0 }]}>{t('chosen_user_modal.desc_loading')}</Text>
      <ActivityIndicator size={sizes.loadingIndicatorSize} color={theme.primaryColor} style={{ marginVertical: 20 }} />
    </View>
  );

  const renderRetrying = () => {
    const nextAttemptTime = retryInfo?.nextAttemptAt
      ? new Date(retryInfo.nextAttemptAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
    return (
      <View style={styles.contentContainer}>
        <Image source={icons.attention} style={styles.errorIcon} />
        <Text style={styles.title}>{t('chosen_user_modal.title_retrying')}</Text>
        <Text style={styles.desc}>
          {t('chosen_user_modal.desc_retrying', {
            attempt: retryInfo?.attempt,
            maxAttempts: retryInfo?.maxAttempts,
            time: nextAttemptTime,
          })}
        </Text>
      </View>
    );
  };

  const renderSuccess = () => (
    <View style={styles.contentContainer}>
      <Image source={icons.checkDefault} style={styles.statusIcon} />
      <Text style={styles.title}>{t('chosen_user_modal.title_success')}</Text>
      <Text style={styles.desc}>
        <Trans
          i18nKey="chosen_user_modal.desc_success"
          values={{ jobTitle }}
          components={{ highlight: <Text style={{ color: theme.textColor }} /> }}
        />
      </Text>
      <TouchableOpacity style={[styles.button, styles.primaryButton, { width: '100%' }]} onPress={onClose}>
        <Text style={[styles.buttonText, styles.primaryButtonText]}>
          {t('chosen_user_modal.btn_got_it')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderError = () => {
    const titleKey = errorReason === 'client_charge'
      ? 'chosen_user_modal.title_error_client_charge'
      : 'chosen_user_modal.title_error';
    const descKey = errorReason === 'client_charge'
      ? 'chosen_user_modal.desc_error_client_charge'
      : errorReason === 'provider_charge'
        ? 'chosen_user_modal.desc_error_provider_charge'
        : 'chosen_user_modal.desc_error';
    return (
      <View style={styles.contentContainer}>
        <Image source={icons.attention} style={styles.errorIcon} />
        <Text style={[styles.title, { color: theme.errorTextColor }]}>{t(titleKey)}</Text>
        <Text style={styles.desc}>{t(descKey)}</Text>
        <TouchableOpacity style={[styles.button, styles.primaryButton, { width: '100%' }]} onPress={onClose}>
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            {t('chosen_user_modal.btn_close')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderContent = () => {
    switch (step) {
      case 'info': return renderInfo();
      case 'loading': return renderLoading();
      case 'retrying': return renderRetrying();
      case 'success': return renderSuccess();
      case 'error': return renderError();
      default: return renderInfo();
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

export default ChosenUserModal;
