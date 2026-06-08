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
  FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import { useWindowInfo } from '../context/windowContext';
import { useWebView } from '../context/webViewContext';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { icons } from '../constants/icons';
import PaymentLegalNotice from './PaymentLegalNotice';

const SETUP_PAYMENT_METHODS = ['paypal', 'hyp'];

const PaymentMethodsModal = ({ visible, onClose }) => {
  const { themeController, languageController, paymentsManagerController } =
    useComponentContext();
  const theme = themeController.current;
  const { height, width, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const { t } = useTranslation();
  const { openWebView } = useWebView();
  const isRTL = languageController.isRTL;

  const [step, setStep] = useState('list'); // 'list', 'addMethod', 'confirmDelete', 'success', 'error', 'cantDelete'
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedSetupMethod, setSelectedSetupMethod] = useState(SETUP_PAYMENT_METHODS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setPaymentMethods(paymentsManagerController.savedMethods);
      setStep('list');
      setSelectedSetupMethod(SETUP_PAYMENT_METHODS[0]);
      setIsLoading(false);
      setError(null);
    }
  }, [visible, paymentsManagerController.savedMethods]);

  const handleSetDefault = async (id) => {
    setIsLoading(true);
    await paymentsManagerController.changeDefaultPaymentMethod(id);
    setIsLoading(false);
  };

  const handleDeletePress = (item) => {
    if (item.isSubscription) {
      setSelectedMethod(item);
      setStep('cantDelete');
    } else {
      setSelectedMethod(item);
      setStep('confirmDelete');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedMethod) return;
    setIsLoading(true);
    try {
      await paymentsManagerController.removePaymentMethod(selectedMethod.id);
      setStep('success');
    } catch (e) {
      setError(t('errors.cant_remove_payment'));
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetupPaymentMethod = async () => {
    setIsLoading(true);
    try {
      const result = await paymentsManagerController.setupNewPaymentMethod(
        selectedSetupMethod,
        {
          language: languageController.current,
          currency: 'ILS',
        },
      );
      const redirectUrl =
        result?.redirectUrl ||
        result?.paymentUrl ||
        result?.approvalUrl ||
        result?.setupUrl ||
        result?.url;

      setStep('list');
      if (redirectUrl) {
        openWebView(redirectUrl, () => {
          paymentsManagerController.refreshSavedMethods?.();
        });
      } else {
        await paymentsManagerController.refreshSavedMethods?.();
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || t('errors.unexpected_error'));
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const getCardIcon = (type) => {
    switch (type) {
      case 'paypal':
        return icons.paypal;
      case 'hyp':
        return icons.card;
      default:
        return icons.card;
    }
  };

  const getMethodTitle = (method) => {
    if (method.type === 'paypal') {
      return `PayPal (${method.details.email})`;
    }
    if (method.type === 'hyp') {
      return `Credit card ${method.details.cardNumber}`;
    }
    return 'Unknown Method';
  };

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      modalWidth: isWebLandscape ? scale(434) : '90%',
      borderRadius: scale(8),
      padding: scale(24),
      containerPaddingVertical: scale(32),
      containerPaddingHorizontal: isWebLandscape ? scale(52) : scale(32),
      titleSize: scale(24),
      titleBottomMargin: scale(16),
      crossIconSize: scale(24),
      crossIconPosition: scale(12),
      emptyTextSize: scale(18),
      emptyTextMarginBottom: scale(24),
      // Item styles
      itemHeight: scale(52),
      itemBorderRadius: scale(4),
      itemPaddingHorizontal: scale(8),
      itemMarginBottom: scale(16),
      itemCircleSize: scale(24),
      itemInnerCircleSize: scale(11),
      itemTitleSize: scale(16),
      itemIconMargin: scale(16),
      itemDeleteIconSize: scale(24),
      cardIconSize: scale(32),
      methodIconWidth: scale(110),
      methodIconHeight: scale(36),
      paypalMethodWidth: scale(150),
      paypalMethodHeight: scale(38),
      hypMethodWidth: scale(80),
      hypMethodHeight: scale(34),
      // For confirmation/status screens
      statusIconSize: scale(64),
      statusTitleSize: scale(22),
      statusTextSize: scale(16),
      statusTextMarginTop: scale(12),
      statusTextMarginBottom: scale(24),
      buttonHeight: scale(52),
      buttonTextSize: scale(18),
      buttonMarginTop: scale(8),
      legalNoticeFontSize: scale(11),
      legalNoticeMarginBottom: scale(16),
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
    title: {
      fontSize: sizes.titleSize,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: sizes.titleBottomMargin,
      fontFamily: 'Rubik-Bold',
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
    emptyText: {
      fontSize: sizes.emptyTextSize,
      color: theme.unactiveTextColor,
      textAlign: 'center',
      marginBottom: sizes.emptyTextMarginBottom,
    },
    list: {
      width: '100%',
    },
    itemContainer: {
      width: '100%',
      height: sizes.itemHeight,
      borderRadius: sizes.itemBorderRadius,
      paddingHorizontal: sizes.itemPaddingHorizontal,
      alignItems: 'center',
      justifyContent: 'flex-start',
      marginBottom: sizes.itemMarginBottom,
      flexDirection: 'row',
    },
    itemCircleTouchable: {
      padding: 4,
    },
    itemCircle: {
      width: sizes.itemCircleSize,
      height: sizes.itemCircleSize,
      borderRadius: sizes.itemCircleSize / 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    itemInnerCircle: {
      width: sizes.itemInnerCircleSize,
      height: sizes.itemInnerCircleSize,
      borderRadius: sizes.itemInnerCircleSize / 2,
      backgroundColor: theme.primaryColor,
    },
    cardIcon: {
      width: sizes.cardIconSize,
      height: sizes.cardIconSize,
      resizeMode: 'contain',
      marginHorizontal: sizes.itemIconMargin / 2,
    },
    itemTitle: {
      flex: 1,
      fontSize: sizes.itemTitleSize,
      color: theme.textColor,
      marginHorizontal: sizes.itemIconMargin,
      fontFamily: 'Rubik-Medium',
      textAlign: isRTL ? 'right' : 'left',
    },
    itemDeleteButton: {
      padding: 4, // Increase touchable area
    },
    itemDeleteIcon: {
      width: sizes.itemDeleteIconSize,
      height: sizes.itemDeleteIconSize,
    },
    methodIcon: {
      resizeMode: 'contain',
      marginHorizontal: sizes.itemIconMargin,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.backgroundColor + 'CC', // Semi-transparent background
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: sizes.borderRadius,
      zIndex: 10,
    },
    // Styles for confirmation and status screens
    statusContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    },
    statusIcon: {
      width: sizes.statusIconSize,
      height: sizes.statusIconSize,
    },
    errorIcon: {
      width: sizes.statusIconSize,
      height: sizes.statusIconSize,
      tintColor: theme.error,
    },
    statusTitle: {
      fontSize: sizes.statusTitleSize,
      fontFamily: 'Rubik-Bold',
      color: theme.textColor,
      marginTop: sizes.statusTextMarginTop,
      textAlign: 'center',
    },
    statusText: {
      fontSize: sizes.statusTextSize,
      color: theme.unactiveTextColor,
      textAlign: 'center',
      marginTop: sizes.statusTextMarginTop,
      marginBottom: sizes.statusTextMarginBottom,
      fontFamily: 'Rubik-Medium',
    },
    button: {
      width: '100%',
      height: sizes.buttonHeight,
      borderRadius: sizes.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: sizes.buttonMarginTop,
    },
    primaryButton: {
      backgroundColor: theme.buttonColorPrimaryDefault,
    },
    dangerButton: {
      backgroundColor: theme.errorTextColor,
    },
    dangerButtonText: {
      color: theme.buttonTextColorPrimary,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.buttonColorPrimaryDefault,
    },
    buttonText: {
      fontSize: sizes.buttonTextSize,
      fontFamily: 'Rubik-Medium',
    },
    primaryButtonText: {
      color: theme.buttonTextColorPrimary,
    },
    secondaryButtonText: {
      color: theme.buttonColorPrimaryDefault,
    },
  });

  const getMethodLabel = (method) => {
    const methodName = t(`payment_modal.method_${method.type === 'hyp' ? 'card' : method.type}`);
    const methodTitle = method.details?.title ?? '';
    return `${methodName} (${methodTitle})`;
  };

  const renderItem = ({ item }) => {
    const isDefault = item.default;
    const itemStyle = [
      styles.itemContainer,
      { flexDirection: isRTL ? 'row-reverse' : 'row' },
      isDefault && { backgroundColor: theme.defaultBlocksMockBackground },
    ];

    return (
      <View style={itemStyle}>
        <TouchableOpacity
          style={styles.itemCircleTouchable}
          onPress={() => handleSetDefault(item.id)}
        >
          <Image
            source={isDefault ? icons.radioOn : icons.radioOff}
            style={[styles.itemCircle]}
          />
        </TouchableOpacity>
        <Text style={styles.itemTitle} numberOfLines={1} ellipsizeMode='tail'>
          {getMethodLabel(item)}
        </Text>
        <TouchableOpacity
          style={styles.itemDeleteButton}
          onPress={() => handleDeletePress(item)}
        >
          <Image
            source={icons.deleteCross}
            style={[
              styles.itemDeleteIcon,
              {
                tintColor: isDefault
                  ? theme.errorTextColor
                  : theme.formInputLabelColor,
              },
            ]}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const handleAddMethodPress = () => {
    setSelectedSetupMethod(SETUP_PAYMENT_METHODS[0]);
    setStep('addMethod');
  };

  const renderAddButton = () => (
    <TouchableOpacity
      style={[styles.button, styles.primaryButton]}
      onPress={handleAddMethodPress}
    >
      <Text style={[styles.buttonText, styles.primaryButtonText]}>
        {t('payment_modal.add_method_button', { defaultValue: 'Add' })}
      </Text>
    </TouchableOpacity>
  );

  const renderListHeader = () => (
    <Text style={styles.title}>{t('my_profile.payment')}</Text>
  );

  const renderList = () => (
    <>
      {renderListHeader()}
      {paymentMethods.length > 0 ? (
        <FlatList
          data={paymentMethods}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
        />
      ) : (
        <Text style={styles.emptyText}>
          {t('my_profile.no_payment_methods')}
        </Text>
      )}
      {renderAddButton()}
    </>
  );

  const renderAddMethod = () => (
    <View style={styles.statusContainer}>
      <Text style={styles.title}>
        {t('payment_modal.select_method_title')}
      </Text>

      <PaymentLegalNotice
        title={t('payment_modal.legal_add_payment_method_title')}
        texts={[t('payment_modal.legal_add_payment_method_body')]}
        theme={theme}
        isRTL={isRTL}
        fontSize={sizes.legalNoticeFontSize}
        style={{ marginBottom: sizes.legalNoticeMarginBottom }}
      />

      {SETUP_PAYMENT_METHODS.map((methodType) => {
        const isSelected = selectedSetupMethod === methodType;
        return (
          <TouchableOpacity
            key={methodType}
            style={[
              styles.itemContainer,
              { flexDirection: 'row' },
              {
                borderColor: isSelected ? theme.primaryColor : 'transparent',
                borderWidth: 1,
                backgroundColor: isSelected
                  ? theme.primaryColor + '10'
                  : theme.defaultBlocksMockBackground + '33',
              },
            ]}
            onPress={() => setSelectedSetupMethod(methodType)}
          >
            <Image
              source={isSelected ? icons.radioOn : icons.radioOff}
              style={[
                styles.itemCircle,
                { tintColor: isSelected ? theme.primaryColor : theme.formInputLabelColor },
              ]}
            />
            <Image
              source={icons[`method_${methodType}`]}
              style={[
                styles.methodIcon,
                {
                  width: sizes[`${methodType}MethodWidth`] || sizes.methodIconWidth,
                  height: sizes[`${methodType}MethodHeight`] || sizes.methodIconHeight,
                },
              ]}
            />
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={handleSetupPaymentMethod}
      >
        <Text style={[styles.buttonText, styles.primaryButtonText]}>
          {t('common.continue')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderConfirmDelete = () => (
    <View style={styles.statusContainer}>
      <Text style={styles.statusTitle}>
        {t('my_profile.remove_payment_title')}
      </Text>
      <Text style={styles.statusText}>
        {t('my_profile.remove_payment_text')}
      </Text>
      <TouchableOpacity
        style={[styles.button, styles.secondaryButton]}
        onPress={() => setStep('list')}
      >
        <Text style={[styles.buttonText, styles.secondaryButtonText]}>
          {t('common.cancel')}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, styles.dangerButton]}
        onPress={handleDeleteConfirm}
      >
        <Text style={[styles.buttonText, styles.dangerButtonText]}>
          {t('common.remove')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.statusContainer}>
      <Image source={icons.checkDefault} style={styles.statusIcon} />
      <Text style={[styles.statusTitle, { color: theme.primaryColor }]}>
        {t('my_profile.payment_removed_success_title')}
      </Text>
      <Text style={styles.statusText}>
        {t('my_profile.payment_removed_success_text')}
      </Text>
      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={() => setStep('list')}
      >
        <Text style={[styles.buttonText, styles.primaryButtonText]}>
          {t('common.continue')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderError = () => (
    <View style={styles.statusContainer}>
      <Image source={icons.attention} style={styles.errorIcon} />
      <Text style={[styles.statusTitle, { color: theme.error }]}>
        {t('errors.payment_failed_title')}
      </Text>
      <Text style={[styles.statusText, { color: theme.errorTextColor }]}>
        {error || t('errors.unexpected_error')}
      </Text>
      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={() => setStep('list')}
      >
        <Text style={[styles.buttonText, styles.primaryButtonText]}>
          {t('common.back_to_list')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderCantDelete = () => (
    <View style={styles.statusContainer}>
      <Text style={styles.statusTitle}>
        {t('errors.cant_remove_payment_title')}
      </Text>
      <Text style={styles.statusText}>
        {t('errors.cant_remove_payment_text')}
      </Text>
      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={() => {
          onClose();
          // Here you might want to navigate to the subscription management screen
        }}
      >
        <Text style={[styles.buttonText, styles.primaryButtonText]}>
          {t('my_profile.manage_subscription')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    switch (step) {
      case 'list':
        return renderList();
      case 'addMethod':
        return renderAddMethod();
      case 'confirmDelete':
        return renderConfirmDelete();
      case 'success':
        return renderSuccess();
      case 'error':
        return renderError();
      case 'cantDelete':
        return renderCantDelete();
      default:
        return renderList();
    }
  };

  return (
    <Modal visible={visible} transparent={true} animationType='fade'>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size='large' color={theme.primaryColor} />
            </View>
          )}
          <TouchableOpacity
            style={styles.crossButton}
            onPress={() =>
              step === 'addMethod' || step === 'confirmDelete' || step === 'cantDelete'
                ? setStep('list')
                : onClose()
            }
          >
            <Image source={icons.cross} style={styles.crossIcon} />
          </TouchableOpacity>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
};

export default PaymentMethodsModal;
