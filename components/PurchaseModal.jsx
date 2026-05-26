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
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import { useWindowInfo } from '../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { icons } from '../constants/icons';

/**
 * PurchaseModal — modal for selecting a payment method and completing a purchase.
 *
 * Props:
 *   visible           {boolean}
 *   onClose           {function}
 *   type              {'regular' | 'subscribtion'} — default 'regular'
 *   price             {string}       — e.g. "$1.50"
 *   onPurchase        {async function} — called when user confirms payment
 *   onPayWithCoupons  {function?}    — called when "Pay with coupons" is pressed
 *   onOpenSubscriptions {function?}  — called when "Get a subscription" is pressed
 *   mode              {'purchase' | 'subscription'} — default 'purchase'
 *   startStep         {'select' | 'method'} — initial screen, default 'select'
 *   skipBackOnMethod  {boolean} — if true, Close button on 'method' screen closes modal instead of going back
 *
 * Screens (step state):
 *   'select'  — first screen: choose payment approach
 *   'method'  — select specific payment method from available / saved lists
 *   'success' — payment completed successfully
 *   'error'   — payment failed
 *
 * Cross-button behaviour:
 *   select  → onClose()
 *   method  → skipBackOnMethod ? onClose() : setStep('select')
 *   success → onClose()
 *   error   → setStep('method')
 */
const PurchaseModal = ({
  visible,
  onClose,
  type = 'regular',
  price,
  onPurchase,
  onPayWithCoupons,
  onOpenSubscriptions,
  mode = 'purchase', // 'purchase' | 'subscription'
  startStep = 'select', // 'select' | 'method'
  skipBackOnMethod = false,
  footerText,
}) => {
  const {
    themeController,
    languageController,
    paymentsManagerController,
    couponsManagerController,
  } = useComponentContext();
  const theme = themeController.current;
  const { height, width, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

  // ─── State ───────────────────────────────────────────────────────────────────
  const [step, setStep] = useState('select'); // 'select' | 'method' | 'success' | 'error'
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [selectedSource, setSelectedSource] = useState('available'); // 'saved' | 'available'
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // ─── Data ────────────────────────────────────────────────────────────────────
  const savedMethods = paymentsManagerController?.savedMethods ?? [];
  const availableMethods = paymentsManagerController?.availableMethods ?? [];
  const couponsCount = couponsManagerController?.balance ?? 0;
  // subscription mode: use the subscription-default method (not the purchase default)
  const defaultSavedMethod =
    mode === 'subscription'
      ? (savedMethods.find((m) => m.isSubscription) ?? null)
      : (savedMethods.find((m) => m.default) ?? savedMethods[0]);

  // ─── Reset on open ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    couponsManagerController?.refreshBalance?.();
    setStep(startStep);
    setIsLoading(false);
    setError(null);
    setSaveForFuture(false);

    if (savedMethods.length > 0 && defaultSavedMethod) {
      setSelectedMethodId(defaultSavedMethod.id);
      setSelectedSource('saved');
    } else if (availableMethods.length > 0) {
      setSelectedMethodId(availableMethods[0]);
      setSelectedSource('available');
    }
  }, [visible, startStep]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleCrossPress = () => {
    if (step === 'select' || step === 'success') {
      onClose();
    } else if (step === 'method') {
      if (skipBackOnMethod) {
        onClose();
      } else {
        setStep('select');
      }
    } else if (step === 'error') {
      setStep('method');
    } else {
      onClose();
    }
  };

  const runPurchase = async () => {
    setIsLoading(true);
    try {
      // Build payload: for saved methods pass the method type + savedPaymentMethodId (direct charge),
      // for new methods pass type + optional savePaymentMethod flag
      const paymentMethodType =
        selectedSource === 'saved'
          ? savedMethods.find((m) => m.id === selectedMethodId)?.type ?? 'paypal'
          : selectedMethodId ?? 'paypal';

      const payload = {
        paymentMethod: paymentMethodType,
        currency: 'USD',
        ...(selectedSource === 'saved' && selectedMethodId && { savedPaymentMethodId: selectedMethodId }),
        ...(selectedSource === 'available' && saveForFuture && { savePaymentMethod: true }),
      };

      const response = await onPurchase?.(payload);

      // Keep saved methods in sync when backend returns a fresh snapshot
      if (response?.paymentMethodsSnapshot) {
        paymentsManagerController?.updateFromSnapshot(response.paymentMethodsSnapshot);
      }

      // Direct charge: payment completed instantly — show success
      if (response?.directCharge || response?.payment?.paymentMetadata?.directCharge) {
        setStep('success');
      }
      // Traditional redirect flow: the onPurchase handler already opened the WebView,
      // so close the modal rather than showing a premature success screen
      else if (
        response?.payment?.paymentMetadata?.approval?.href ||
        response?.paymentUrl ||
        response?.redirectUrl
      ) {
        onClose();
      }
      // No redirect (e.g. coupon payment, already-revealed, subscription)
      else {
        setStep('success');
      }
    } catch (e) {
      // Saved payment method was deleted/deactivated — refresh list and show specific message
      if (e?.response?.status === 404 && e?.response?.data?.message?.includes('Payment method not found')) {
        await paymentsManagerController?.refreshSavedMethods?.();
        setError(t('payment_modal.error_method_not_found'));
      } else {
        setError(e?.message ?? null);
      }
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  // First screen pay button: if there is a relevant default method → pay immediately,
  // otherwise → go to method selection screen.
  // In subscription mode only a subscription-default method qualifies; if none exists
  // the user must go through method selection even if they have other saved methods.
  const handlePayButtonPress = () => {
    if (defaultSavedMethod) {
      runPurchase();
    } else {
      setStep('method');
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const getPayButtonLabel = () => {
    if (savedMethods.length > 0 && defaultSavedMethod) {
      const methodName = t(`payment_modal.method_${defaultSavedMethod.type === 'hyp' ? 'card' : defaultSavedMethod.type}`);
      const methodTitle = defaultSavedMethod.details?.title ?? '';
      return `${t('payment_modal.pay_with')} ${methodName} (${methodTitle})`;
    }
    return `${t('payment_modal.pay')} ${price ?? ''}`;
  };

  const getSavedMethodLabel = (method) => {
    const methodName = t(`payment_modal.method_${method.type === 'hyp' ? 'card' : method.type}`);
    const methodTitle = method.details?.title ?? '';
    return `${methodName} (${methodTitle})`;
  };

  // ─── Sizes ───────────────────────────────────────────────────────────────────
  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      modalWidth: isWebLandscape ? scale(434) : '90%',
      borderRadius: scale(8),
      containerPaddingVertical: scale(32),
      containerPaddingHorizontal: isWebLandscape ? scale(52) : scale(32),
      // Text
      titleSize: scale(24),
      firstTitleSize: scale(20),
      titleBottomMargin: scale(16),
      priceTextSize: scale(24),
      priceLabelSize: scale(24),
      // Cross icon
      crossIconSize: scale(24),
      crossIconPosition: scale(12),
      // Method list items
      itemHeight: scale(52),
      itemBorderRadius: scale(4),
      itemPaddingHorizontal: scale(8),
      itemMarginBottom: scale(16),
      itemCircleSize: scale(24),
      itemTitleSize: scale(15),
      itemIconMargin: scale(12),
      itemContentMarginHorizontal: scale(16),
      // Method icons sizes
      paypalMethodHeight: scale(38),
      paypalMethodWidth: scale(150),
      hypMethodHeight: scale(34),
      hypMethodWidth: scale(80),
      apple_payMethodHeight: scale(38),
      apple_payMethodWidth: scale(140),
      google_payMethodHeight: scale(38),
      google_payMethodWidth: scale(140),
      methodScrollMaxHeight: isWebLandscape
        ? scaleByHeight(280, height)
        : height * 0.32,
      savedMethodsScrollMinHeight: isWebLandscape
        ? scaleByHeight(120, height)
        : height * 0.14,
      // Section headers
      sectionHeaderSize: scale(16),
      sectionHeaderMarginBottom: scale(6),
      sectionHeaderMarginTop: scale(14),
      // Checkbox
      checkboxSize: scale(18),
      checkboxRadius: scale(4),
      checkboxMarginTop: scale(14),
      checkboxMarginBottom: scale(8),
      checkboxTextSize: scale(16),
      // Status screens
      statusIconSize: scale(64),
      statusTitleSize: scale(22),
      statusTextSize: scale(16),
      statusTextMarginTop: scale(12),
      statusTextMarginBottom: scale(24),
      // Buttons
      buttonHeight: scale(62),
      buttonTextSize: scale(20),
      buttonTextMarginHorizontal: scale(12),
      buttonMarginTop: scale(16),
      // Change method link
      changeLinkMarginTop: scale(16),
      changeLinkTextSize: scale(16),
    };
  }, [height, width, isWebLandscape]);

  // ─── Styles ──────────────────────────────────────────────────────────────────
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
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.backgroundColor + 'CC',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: sizes.borderRadius,
      zIndex: 10,
    },
    contentContainer: {
      width: '100%',
      alignItems: 'center',
    },
    title: {
      fontSize: sizes.titleSize,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: sizes.titleBottomMargin,
      fontFamily: 'Rubik-Bold',
      textAlign: 'center',
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    priceLabel: {
      fontSize: sizes.priceLabelSize,
      color: theme.textColor,
      fontFamily: 'Rubik-Bold',
    },
    priceValue: {
      fontSize: sizes.priceTextSize,
      color: theme.primaryColor,
      fontFamily: 'Rubik-Bold',
    },
    // ─── Buttons ───────────────────────────────────────────────────────────────
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
    outlinePrimaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.buttonColorPrimaryDefault,
    },
    outlineSecondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.buttonColorSecondaryDefault,
    },
    buttonText: {
      fontSize: sizes.buttonTextSize,
      fontFamily: 'Rubik-Medium',
      marginHorizontal: sizes.buttonTextMarginHorizontal,
      maxWidth: '90%',
    },
    primaryButtonText: {
      color: theme.buttonTextColorPrimary,
    },
    outlinePrimaryButtonText: {
      color: theme.buttonColorPrimaryDefault,
    },
    outlineSecondaryButtonText: {
      color: theme.buttonColorSecondaryDefault,
    },
    // ─── Change method link ────────────────────────────────────────────────────
    changeMethodLink: {
      marginTop: sizes.changeLinkMarginTop,
      alignSelf: 'center',
    },
    changeMethodLinkText: {
      fontSize: sizes.changeLinkTextSize,
      color: theme.formInputLabelColor,
      textAlign: 'center',
    },
    // ─── Method selection screen ───────────────────────────────────────────────
    methodScroll: {
      width: '100%',
      maxHeight: sizes.methodScrollMaxHeight,
    },
    sectionHeader: {
      fontSize: sizes.sectionHeaderSize,
      color: theme.formInputLabelColor,
      fontFamily: 'Rubik-Medium',
      marginBottom: sizes.sectionHeaderMarginBottom,
      alignSelf: isRTL ? 'flex-end' : 'flex-start',
    },
    sectionHeaderSpaced: {
      marginTop: sizes.sectionHeaderMarginTop,
    },
    itemContainer: {
      height: sizes.itemHeight,
      width: '100%',
      borderRadius: sizes.itemBorderRadius,
      paddingHorizontal: sizes.itemPaddingHorizontal,
      alignItems: 'center',
      marginBottom: sizes.itemMarginBottom,
    },
    itemCircle: {
      width: sizes.itemCircleSize,
      height: sizes.itemCircleSize,
    },
    methodIcon: {
      // width: sizes.methodIconSize,
      // height: sizes.methodIconSize,
      resizeMode: 'contain',
      marginHorizontal: sizes.itemContentMarginHorizontal,
    },
    itemTitle: {
      flex: 1,
      fontSize: sizes.itemTitleSize,
      color: theme.textColor,
      fontFamily: 'Rubik-Medium',
    },
    // ─── Save for future checkbox ──────────────────────────────────────────────
    checkboxRow: {
      alignItems: 'center',
      width: '100%',
      marginTop: sizes.checkboxMarginTop,
      marginBottom: sizes.checkboxMarginBottom,
    },
    checkbox: {
      width: sizes.checkboxSize,
      height: sizes.checkboxSize,
      borderWidth: 2,
      borderColor: theme.buttonColorPrimaryDefault,
      borderRadius: sizes.checkboxRadius,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxInner: {
      width: sizes.checkboxSize * 1.2,
      height: sizes.checkboxSize * 1.2,
    },
    checkboxText: {
      flex: 1,
      fontSize: sizes.checkboxTextSize,
      color: theme.unactiveTextColor,
      fontFamily: 'Rubik-Medium',
    },
    // ─── Status screens ────────────────────────────────────────────────────────
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
      tintColor: theme.errorTextColor,
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
  });

  // ─── Screen: Select ──────────────────────────────────────────────────────────
  const renderSelect = () => {
    const isSubscription = type === 'subscribtion';

    return (
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { fontSize: sizes.firstTitleSize }]}>
          {isSubscription
            ? t('payment_modal.subscription_title')
            : t('payment_modal.select_title')}
        </Text>

        {price != null && (
          <View
            style={[
              styles.priceRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <Text style={styles.priceLabel}>
              {t('payment_modal.price_label')}
            </Text>
            <Text style={styles.priceValue}>{price}</Text>
          </View>
        )}

        {/* Primary pay button */}
        <TouchableOpacity
          style={[styles.button, styles.outlinePrimaryButton]}
          onPress={handlePayButtonPress}
        >
          <Text
            style={[styles.buttonText, styles.outlinePrimaryButtonText]}
            numberOfLines={1}
          >
            {getPayButtonLabel()}
          </Text>
        </TouchableOpacity>

        {/* Change method link — only when saved methods exist */}
        {savedMethods.length > 0 && (
          <TouchableOpacity
            style={styles.changeMethodLink}
            onPress={() => setStep('method')}
          >
            <Text style={styles.changeMethodLinkText}>
              {t('payment_modal.change_method')}
            </Text>
          </TouchableOpacity>
        )}

        {/* Coupon + Subscription buttons — regular type only */}
        {!isSubscription && (
          <>
            {
              onPayWithCoupons && (
                <TouchableOpacity
                  style={[styles.button, styles.outlineSecondaryButton]}
                  onPress={onPayWithCoupons}
                >
                  <Text
                    style={[styles.buttonText, styles.outlineSecondaryButtonText]}
                  >
                    {t('payment_modal.pay_coupons', { count: couponsCount })}
                  </Text>
                </TouchableOpacity>
              )
            }

            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onOpenSubscriptions}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                {t('payment_modal.get_subscription')}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {footerText && (
          <Text style={[styles.statusText, { marginTop: sizes.gap || 16, fontSize: sizes.disclosureSize || 14 }]}>
            {footerText}
          </Text>
        )}
      </View>
    );
  };

  // ─── Screen: Method selection ────────────────────────────────────────────────
  const renderMethod = () => {
    const hasSaved = savedMethods.length > 0;

    return (
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          {t('payment_modal.select_method_title')}
        </Text>

        {/* ── Available methods (не прокручиваются — всегда видны целиком) ── */}
        {hasSaved && (
          <Text style={styles.sectionHeader}>
            {t('payment_modal.create_new')}
          </Text>
        )}
        {availableMethods.map((methodType) => {
          const isSelected =
            selectedSource === 'available' && selectedMethodId === methodType;
          return (
            <TouchableOpacity
              key={methodType}
              style={[
                styles.itemContainer,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
                isSelected && {
                  backgroundColor: theme.defaultBlocksMockBackground,
                },
              ]}
              onPress={() => {
                setSelectedMethodId(methodType);
                setSelectedSource('available');
              }}
            >
              <Image
                source={isSelected ? icons.radioOn : icons.radioOff}
                style={styles.itemCircle}
              />
              <Image
                source={icons[`method_${methodType}`]}
                style={[
                  styles.methodIcon,
                  {
                    width: sizes[`${methodType}MethodWidth`],
                    height: sizes[`${methodType}MethodHeight`],
                  },
                ]}
              />
            </TouchableOpacity>
          );
        })}

        {/* ── Saved methods — только этот список прокручивается ── */}
        {hasSaved && (
          <>
            <Text style={[styles.sectionHeader, styles.sectionHeaderSpaced]}>
              {t('payment_modal.saved_methods')}
            </Text>
            <ScrollView
              style={[
                styles.methodScroll,
                {
                  minHeight: sizes.savedMethodsScrollMinHeight,
                },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {savedMethods.map((method, index) => {
                const isSelected =
                  selectedSource === 'saved' && selectedMethodId === method.id;
                return (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.itemContainer,
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                      isSelected && {
                        backgroundColor: theme.defaultBlocksMockBackground,
                      },
                      index === savedMethods.length - 1 && { marginBottom: 0 },
                    ]}
                    onPress={() => {
                      setSelectedMethodId(method.id);
                      setSelectedSource('saved');
                    }}
                  >
                    <Image
                      source={isSelected ? icons.radioOn : icons.radioOff}
                      style={styles.itemCircle}
                    />
                    <Text
                      style={[
                        styles.itemTitle,
                        {
                          marginLeft: isRTL
                            ? 0
                            : sizes.itemContentMarginHorizontal,
                          marginRight: isRTL
                            ? sizes.itemContentMarginHorizontal
                            : 0,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {getSavedMethodLabel(method)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ── Subscription: info label / Regular: save-for-future checkbox ── */}
        {mode === 'subscription' ? (
          <View style={[styles.checkboxRow, { opacity: selectedSource === 'available' ? 1 : 0 }]}>
            <Text style={[styles.checkboxText, { textAlign: isRTL ? 'right' : 'left' }]}>
              {skipBackOnMethod
                ? t('payment_modal.subscription_add_method_info')
                : t('payment_modal.subscription_save_info')}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.checkboxRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
              selectedSource !== 'available' && { opacity: 0 },
            ]}
            onPress={() => setSaveForFuture((v) => !v)}
            disabled={selectedSource !== 'available'}
          >
            <View
              style={[
                styles.checkbox,
                {
                  marginRight: isRTL ? 0 : 8,
                  marginLeft: isRTL ? 8 : 0,
                },
              ]}
            >
              {saveForFuture && (
                <Image source={icons.arrowDown} style={styles.checkboxInner} />
              )}
            </View>
            <Text style={styles.checkboxText}>
              {t('payment_modal.save_for_future')}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={runPurchase}
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            {t('common.continue')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ─── Screen: Success ─────────────────────────────────────────────────────────
  const renderSuccess = () => (
    <View style={styles.statusContainer}>
      <Image source={icons.checkDefault} style={styles.statusIcon} />
      <Text style={[styles.statusTitle, { color: theme.primaryColor }]}>
        {t('payment_modal.success_title')}
      </Text>
      <Text style={styles.statusText}>{t('payment_modal.success_text')}</Text>
      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={onClose}
      >
        <Text style={[styles.buttonText, styles.primaryButtonText]}>
          {t('common.continue')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Screen: Error ───────────────────────────────────────────────────────────
  const renderError = () => (
    <View style={styles.statusContainer}>
      <Image source={icons.attention} style={styles.errorIcon} />
      <Text style={[styles.statusTitle, { color: theme.errorTextColor }]}>
        {t('payment_modal.error_title')}
      </Text>
      <Text style={[styles.statusText, { color: theme.errorTextColor }]}>
        {error ?? t('errors.unexpected_error')}
      </Text>
      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={() => setStep('method')}
      >
        <Text style={[styles.buttonText, styles.primaryButtonText]}>
          {t('common.back')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Content router ──────────────────────────────────────────────────────────
  const renderContent = () => {
    switch (step) {
      case 'select':
        return renderSelect();
      case 'method':
        return renderMethod();
      case 'success':
        return renderSuccess();
      case 'error':
        return renderError();
      default:
        return renderSelect();
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <Modal visible={visible} transparent animationType='fade'>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size='large' color={theme.primaryColor} />
            </View>
          )}
          <TouchableOpacity
            style={styles.crossButton}
            onPress={handleCrossPress}
          >
            <Image source={icons.cross} style={styles.crossIcon} />
          </TouchableOpacity>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
};

export default PurchaseModal;
