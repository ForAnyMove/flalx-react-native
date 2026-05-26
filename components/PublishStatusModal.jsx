import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import { useWindowInfo } from '../context/windowContext';
import { useTranslation } from 'react-i18next';
import { icons } from '../constants/icons';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { formatCurrency } from '../utils/currency_formatter';
import BaseActionModal from './BaseActionModal';
import PaymentFlowStep from './PaymentFlowStep';

const PublishStatusModal = ({
  visible,
  onClose,
  jobType,
  setJobType,
  onSubmit,
  step = 1,
  setStep,
}) => {
  const {
    themeController,
    languageController,
    subscription,
    user,
    jobsController,
    paymentsManagerController,
    couponsManagerController,
  } = useComponentContext();

  const theme = themeController.current;
  const { height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

  // ─── Step State Management (Fallback to local if no parent prop) ──────────────
  const [localStep, setLocalStep] = useState(1);
  const activeStep = setStep ? step : localStep;
  const activeSetStep = setStep ? setStep : setLocalStep;

  // ─── Local State ─────────────────────────────────────────────────────────────
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [selectedSource, setSelectedSource] = useState('available'); // 'saved' | 'available'
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [newMethodId, setNewMethodId] = useState(null);

  // ─── Data Extraction ─────────────────────────────────────────────────────────
  // const isClient = user.current?.account_type === 'client';
  const isClient = true;
  const hasSubscription = subscription.current != null;
  const savedMethods = paymentsManagerController?.savedMethods ?? [];
  const availableMethods = paymentsManagerController?.availableMethods ?? [];
  const couponsCount = couponsManagerController?.balance ?? 0;

  // Filter products: Only normal (Default), quick (Quickly), and top (TOP) are allowed
  const displayProducts = useMemo(() => {
    const products = jobsController.products ?? [];
    const filtered = products.filter(
      (p) => p.type === 'normal' || p.type === 'quick' || p.type === 'top'
    );
    if (filtered.length > 0) return filtered;
    return [
      { type: 'normal', name: 'Default', price: 0.99, currency: 'USD' },
      { type: 'quick', name: 'Quickly', price: 0.99, currency: 'USD' },
      { type: 'top', name: 'TOP', price: 0.99, currency: 'USD' },
    ];
  }, [jobsController.products]);

  const selectedOption = useMemo(() => {
    return (
      displayProducts.find((o) => o.type === jobType) || displayProducts[0]
    );
  }, [displayProducts, jobType]);

  const defaultSavedMethod = useMemo(() => {
    return savedMethods.find((m) => m.default) ?? savedMethods[0];
  }, [savedMethods]);

  // ─── Reset on Modal Open ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    couponsManagerController?.refreshBalance?.();
    setIsLoading(false);
    setSaveForFuture(false);
    setShowAddMethod(false);
    setNewMethodId(availableMethods.length > 0 ? availableMethods[0] : null);

    if (savedMethods.length > 0 && defaultSavedMethod) {
      setSelectedMethodId(defaultSavedMethod.id);
      setSelectedSource('saved');
    } else if (availableMethods.length > 0) {
      setSelectedMethodId(availableMethods[0]);
      setSelectedSource('available');
    }
  }, [visible, defaultSavedMethod, availableMethods]);

  // ─── Sizes Metric (Dynamic & Scaled) ─────────────────────────────────────────
  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      modalWidth: isWebLandscape ? scale(460) : '92%',
      borderRadius: scale(8),
      containerPaddingVertical: scale(36),
      containerPaddingHorizontal: scale(75), // Scaled to 75px as required
      titleSize: scale(24),
      titleMarginBottom: scale(24),
      subtitleSize: scale(16),
      subTitleMarginBottom: scale(24),
      textSize: scale(14),
      buttonTextSize: scale(20),
      buttonSubTextSize: scale(11),
      buttonMarginHorizontal: scale(12),
      priceTextSize: scale(22),
      priceValueSize: scale(26),
      successCircleSize: scale(112),
      successCircleMarginVertical: scale(16),
      successTitleMarginBottom: scale(8),
      successSubtitleMarginBottom: scale(24),
      crossIconSize: scale(24),
      crossIconPosition: scale(12),
      iconSize: scale(24),
      couponIconSize: scale(24),
      itemCircleSize: scale(24),
      itemTitleSize: scale(15),
      itemHeight: scale(52),
      itemBorderRadius: scale(4),
      itemPaddingHorizontal: scale(8),
      itemMarginBottom: scale(12),
      itemContentMarginHorizontal: scale(16),
      methodScrollMaxHeight: isWebLandscape ? scale(180) : height * 0.28,
      savedMethodsScrollMinHeight: isWebLandscape ? scale(90) : height * 0.12,
      checkboxSize: scale(18),
      checkboxRadius: scale(4),
      checkboxTextSize: scale(15),
      badgePaddingVertical: scale(4),
      badgePaddingHorizontal: scale(12),
      badgeBorderRadius: scale(6),
      badgeFontSize: scale(12),
      badgeMarginBottom: scale(16),
      buttonHeight: scale(62),
      buttonMarginTop: scale(16),
      chipHeight: scale(34),
      chipPaddingHorizontal: scale(12),
      chipFont: scale(14),
      chipGap: scale(8),
      chipMarginBottom: scale(24),
      changeMethodLinkMarginTop: scale(16),
      // ─── Extra Dynamic Properties to Eliminate Hardcoded Values ───
      priceRowMarginBottom: scale(8),
      priceRowGap: scale(6),
      infoTextMarginBottom: scale(20),
      buttonSubTextMarginTop: scale(2),
      sectionHeaderMarginBottom: scale(8),
      sectionHeaderMarginTop: scale(12),
      methodIconWidth: scale(80),
      methodIconHeight: scale(34),
      paypalMethodHeight: scale(38),
      paypalMethodWidth: scale(150),
      hypMethodHeight: scale(34),
      hypMethodWidth: scale(80),
      apple_payMethodHeight: scale(38),
      apple_payMethodWidth: scale(140),
      google_payMethodHeight: scale(38),
      google_payMethodWidth: scale(140),
      addMethodLinkMarginTop: scale(16),
      checkboxRowMarginTop: scale(8),
      checkboxRowMarginBottom: scale(12),
      checkboxBorderWidth: scale(2),
      borderWidthOne: 1,
      marginTopZero: 0,
      couponButtonGap: scale(6),
      pricePlusMarginHorizontal: scale(4),
      priceLabelMarginRight: scale(4),
      step2PlusFontSize: scale(26) * 0.8,
      step2TitleMarginBottom: scale(20),
      sectionContainerMarginBottom: scale(16),
      checkboxMarginRight: scale(8),
      step2SubscriptionButtonMarginTop: scale(12),
      compoundButtonGap: scale(4),
      compoundTextMarginHorizontal: 0,
    };
  }, [height, isWebLandscape]);

  // ─── Label Helpers ───────────────────────────────────────────────────────────
  const getSavedMethodLabel = (method) => {
    if (method.type === 'paypal') {
      return `PayPal (${method.details?.title || 'user@email'})`;
    }
    return `${t('payment_modal.credit_card', { defaultValue: 'Credit card' })} •••• •••• •••• ${method.details?.last4 || '4352'}`;
  };

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const handleConfirmPayment = () => {
    setIsLoading(true);
    const chosenMethod =
      selectedSource === 'saved'
        ? savedMethods.find((m) => m.id === selectedMethodId)?.type
        : selectedMethodId;

    const payload = {
      useCoupon: isClient && selectedOption.type !== 'normal', // Always deduct coupon for TOP/Quickly combined payments for clients
      paymentMethod: chosenMethod,
      ...(selectedSource === 'saved' && { savedPaymentMethodId: selectedMethodId }),
      ...(selectedSource === 'available' && saveForFuture && { savePaymentMethod: true }),
    };

    onSubmit(payload);
  };

  const handleCouponOnlyPayment = () => {
    setIsLoading(true);
    onSubmit({ useCoupon: true });
  };

  const handleSubscriptionPublish = () => {
    setIsLoading(true);
    onSubmit({ subscriptionActive: true });
  };

  const handleAddMethodPay = () => {
    setIsLoading(true);
    const isCombined = isClient && selectedOption.type !== 'normal';
    const payload = {
      useCoupon: isCombined,
      paymentMethod: newMethodId,
      ...(saveForFuture && { savePaymentMethod: true }),
    };
    onSubmit(payload);
  };

  // ─── Layout Styles ───────────────────────────────────────────────────────────
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
      fontFamily: 'Rubik-Bold',
      color: theme.textColor,
      textAlign: 'center',
      marginBottom: sizes.titleMarginBottom,
    },
    subtitle: {
      fontSize: sizes.subtitleSize,
      fontFamily: 'Rubik-Medium',
      color: theme.formInputLabelColor,
      textAlign: 'center',
      marginBottom: sizes.subTitleMarginBottom,
    },
    chipContainer: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      gap: sizes.chipGap,
      marginBottom: sizes.chipMarginBottom,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chip: {
      height: sizes.chipHeight,
      paddingHorizontal: sizes.chipPaddingHorizontal,
      borderRadius: sizes.borderRadius / 2,
      borderWidth: sizes.borderWidthOne,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipText: {
      fontSize: sizes.chipFont,
      fontFamily: 'Rubik-Medium',
    },
    // Pricing details / labels
    priceRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: sizes.priceRowMarginBottom,
      gap: sizes.priceRowGap,
    },
    priceLabel: {
      fontSize: sizes.priceTextSize,
      fontFamily: 'Rubik-Bold',
      color: theme.textColor,
    },
    priceValue: {
      fontSize: sizes.priceValueSize,
      fontFamily: 'Rubik-Bold',
      color: theme.primaryColor,
    },
    infoText: {
      fontSize: sizes.textSize,
      fontFamily: 'Rubik-Medium',
      color: theme.formInputLabelColor,
      textAlign: 'center',
      marginBottom: sizes.infoTextMarginBottom,
    },
    // Buttons
    button: {
      width: '100%',
      height: sizes.buttonHeight,
      borderRadius: sizes.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: sizes.buttonMarginTop,
    },
    primaryButton: {
      backgroundColor: theme.buttonColorPrimaryDefault || theme.primaryColor,
    },
    outlinePrimaryButton: {
      backgroundColor: 'transparent',
      borderWidth: sizes.borderWidthOne,
      borderColor: theme.buttonColorPrimaryDefault || theme.primaryColor,
    },
    outlineSecondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: sizes.borderWidthOne,
      borderColor: theme.buttonColorSecondaryDefault,
    },
    buttonText: {
      fontSize: sizes.buttonTextSize,
      fontFamily: 'Rubik-Bold',
      textAlign: 'center',
      marginHorizontal: sizes.buttonMarginHorizontal,
      maxWidth: '90%',
    },
    primaryButtonText: {
      color: theme.buttonTextColorPrimary || '#fff',
    },
    outlinePrimaryButtonText: {
      color: theme.buttonColorPrimaryDefault || theme.primaryColor,
    },
    outlineSecondaryButtonText: {
      color: theme.buttonColorSecondaryDefault,
    },
    buttonSubText: {
      fontSize: sizes.buttonSubTextSize,
      fontFamily: 'Rubik-Medium',
      textAlign: 'center',
      marginTop: sizes.buttonSubTextMarginTop,
    },
    // Saved methods UI
    sectionHeader: {
      fontSize: sizes.textSize,
      fontFamily: 'Rubik-Bold',
      color: theme.formInputLabelColor,
      alignSelf: isRTL ? 'flex-end' : 'flex-start',
      marginBottom: sizes.sectionHeaderMarginBottom,
      marginTop: sizes.sectionHeaderMarginTop,
    },
    methodsScroll: {
      width: '100%',
    },
    methodItem: {
      width: '100%',
      height: sizes.itemHeight,
      borderRadius: sizes.itemBorderRadius,
      alignItems: 'center',
      paddingHorizontal: sizes.itemPaddingHorizontal,
      marginBottom: sizes.itemMarginBottom,
    },
    itemCircle: {
      width: sizes.itemCircleSize,
      height: sizes.itemCircleSize,
    },
    methodIcon: {
      resizeMode: 'contain',
      marginHorizontal: sizes.itemContentMarginHorizontal,
      width: sizes.methodIconWidth,
      height: sizes.methodIconHeight,
    },
    methodLabel: {
      flex: 1,
      fontSize: sizes.itemTitleSize,
      fontFamily: 'Rubik-Medium',
      color: theme.textColor,
    },
    addMethodLink: {
      alignSelf: 'center',
      marginTop: sizes.addMethodLinkMarginTop,
    },
    addMethodText: {
      fontSize: sizes.textSize,
      fontFamily: 'Rubik-Bold',
      color: theme.primaryColor,
      textDecorationLine: 'underline',
    },
    // Checkbox
    checkboxRow: {
      alignItems: 'center',
      width: '100%',
      marginTop: sizes.checkboxRowMarginTop,
      marginBottom: sizes.checkboxRowMarginBottom,
      flexDirection: isRTL ? 'row-reverse' : 'row',
    },
    checkbox: {
      borderWidth: sizes.checkboxBorderWidth,
      borderColor: theme.primaryColor,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxInner: {
      width: '80%',
      height: '80%',
      tintColor: '#fff',
    },
    checkboxText: {
      flex: 1,
      fontSize: sizes.checkboxTextSize,
      fontFamily: 'Rubik-Medium',
      color: theme.unactiveTextColor,
    },
    // Badges / Notices
    orangeBadge: {
      backgroundColor: theme.formInputBackground || '#F0F0FA',
      borderWidth: sizes.borderWidthOne,
      borderColor: theme.buttonColorSecondaryDefault || '#FE8A01',
      borderRadius: sizes.borderRadius,
      paddingVertical: sizes.badgePaddingVertical,
      paddingHorizontal: sizes.badgePaddingHorizontal,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: sizes.badgeMarginBottom,
      width: '100%',
    },
    orangeBadgeText: {
      fontSize: sizes.badgeFontSize,
      fontFamily: 'Rubik-Bold',
      color: theme.buttonColorSecondaryDefault || '#FE8A01',
      textAlign: 'center',
    },
    changeMethodLink: {
      marginTop: sizes.changeMethodLinkMarginTop,
      alignSelf: 'center',
    },
    changeMethodLinkText: {
      fontSize: sizes.textSize,
      color: theme.formInputLabelColor,
      textAlign: 'center',
    },
  });

  const formattedMoneyPrice = formatCurrency(
    selectedOption.price,
    selectedOption.currency
  );

  const getPayButtonBaseLabel = () => {
    if (savedMethods.length > 0 && defaultSavedMethod) {
      const methodName = t(`payment_modal.method_${defaultSavedMethod.type === 'hyp' ? 'card' : defaultSavedMethod.type}`);
      const methodTitle = defaultSavedMethod.details?.title ?? '';
      return `${t('payment_modal.pay_with')} ${methodName} (${methodTitle})`;
    }
    return `${t('payment_modal.pay')} ${formattedMoneyPrice}`;
  };

  const getPayButtonConfirmBaseLabel = () => {
    return `${t('payment_modal.pay', { defaultValue: 'Pay' })} ${formattedMoneyPrice}`;
  };

  const getPayButtonLabel = () => {
    const isCombined = isClient && selectedOption.type !== 'normal';
    let baseLabel = '';
    if (savedMethods.length > 0 && defaultSavedMethod) {
      const methodName = t(`payment_modal.method_${defaultSavedMethod.type === 'hyp' ? 'card' : defaultSavedMethod.type}`);
      const methodTitle = defaultSavedMethod.details?.title ?? '';
      baseLabel = `${t('payment_modal.pay_with')} ${methodName} (${methodTitle})`;
    } else {
      baseLabel = `${t('payment_modal.pay')} ${formattedMoneyPrice}`;
    }

    if (isCombined) {
      return `${baseLabel} + 1 🎫`;
    }
    return baseLabel;
  };

  // ─── Render Screen: Selection & Prices (Step 1) ─────────────────────────────
  const renderStep1 = () => {
    // CASE A: Active Subscription (Any Role)
    if (hasSubscription) {
      return (
        <View style={styles.contentContainer}>
          <Text style={styles.title}>
            {t('payment_modal.publish_status_title')}
          </Text>

          {/* Chips */}
          <View style={styles.chipContainer}>
            {displayProducts.map((opt) => {
              const active = jobType === opt.type;
              return (
                <TouchableOpacity
                  key={opt.type}
                  onPress={() => setJobType(opt.type)}
                  style={[
                    styles.chip,
                    {
                      borderColor: active
                        ? theme.primaryColor
                        : theme.formInputPlaceholderColor,
                      backgroundColor: active
                        ? theme.primaryColor
                        : 'transparent',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? theme.backgroundColor : theme.formInputLabelColor },
                    ]}
                  >
                    {opt.type === 'normal'
                      ? t('payment_modal.option_default', { defaultValue: 'Default' })
                      : opt.type === 'quick'
                        ? t('payment_modal.option_quickly', { defaultValue: 'Quickly' })
                        : t('payment_modal.option_top', { defaultValue: 'TOP' })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Success Checkmark Circle (Asset checkDefault) */}
          {jobType === 'normal' ? (
            <>
              <Image
                source={icons.checkDefault}
                style={{
                  width: sizes.successCircleSize,
                  height: sizes.successCircleSize,
                  marginBottom: sizes.successCircleMarginVertical,
                }}
              />

              <Text style={[styles.title, { color: theme.primaryColor, marginBottom: sizes.successTitleMarginBottom }]}>
                {t('payment_modal.subscription_active')}
              </Text>
              <Text style={[styles.subtitle, { marginBottom: sizes.successSubtitleMarginBottom }]}>
                {t('payment_modal.subscription_active_unlimited')}
              </Text>
            </>
          ) : (
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: sizes.compoundButtonGap,
                marginBottom: sizes.successSubtitleMarginBottom,
              }}
            >
              <Text style={[styles.priceLabel, { fontSize: sizes.titleSize, fontFamily: 'Rubik-Bold', marginRight: sizes.priceLabelMarginRight }]}>
                {t('interestRequest.total')}
              </Text>
              <Text style={[styles.priceValue, { color: theme.buttonColorSecondaryDefault }]}>1</Text>
              <Text style={{ color: theme.buttonColorSecondaryDefault, fontSize: sizes.titleSize, fontFamily: 'Rubik-Bold', marginHorizontal: sizes.pricePlusMarginHorizontal }}>
                {t('payment_modal.coupon', { defaultValue: 'coupon' })}
              </Text>
              <Image
                source={icons.coupon}
                style={{
                  width: sizes.couponIconSize,
                  height: sizes.couponIconSize,
                  tintColor: theme.buttonColorSecondaryDefault,
                }}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, { marginTop: sizes.marginTopZero }]}
            onPress={handleSubscriptionPublish}
          >
            <Text style={[styles.buttonText, styles.primaryButtonText]}>
              {t('payment_modal.create_job_posting')}
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // CASE B / C: No Subscription - Client role
    if (isClient) {
      if (selectedOption.type === 'normal') {
        // CASE B: Client default (Choose payment style)
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.title}>
              {t('payment_modal.publish_status_title')}
            </Text>

            {/* Chips */}
            <View style={styles.chipContainer}>
              {displayProducts.map((opt) => {
                const active = jobType === opt.type;
                return (
                  <TouchableOpacity
                    key={opt.type}
                    onPress={() => setJobType(opt.type)}
                    style={[
                      styles.chip,
                      {
                        borderColor: active
                          ? theme.primaryColor
                          : theme.formInputPlaceholderColor,
                        backgroundColor: active
                          ? theme.primaryColor
                          : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? '#fff' : theme.formInputLabelColor },
                      ]}
                    >
                      {opt.type === 'normal'
                        ? t('payment_modal.option_default', { defaultValue: 'Default' })
                        : opt.type === 'quick'
                          ? t('payment_modal.option_quickly', { defaultValue: 'Quickly' })
                          : t('payment_modal.option_top', { defaultValue: 'TOP' })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Price display separate */}
            <View
              style={[
                styles.priceRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              <Text style={styles.priceLabel}>
                {t('payment_modal.price_label')}
              </Text>
              <Text style={styles.priceValue}>{formattedMoneyPrice}</Text>
            </View>

            <Text style={styles.subtitle}>
              {t('payment_modal.choose_how_to_pay')}
            </Text>

            {/* Button 1: Card / saved payment method */}
            <TouchableOpacity
              style={[styles.button, styles.outlinePrimaryButton, { marginTop: sizes.marginTopZero }]}
              onPress={() => {
                if (savedMethods.length > 0 && defaultSavedMethod) {
                  handleConfirmPayment();
                } else {
                  activeSetStep(2);
                }
              }}
            >
              <Text style={[styles.buttonText, styles.outlinePrimaryButtonText]} numberOfLines={1}>
                {getPayButtonLabel()}
              </Text>
            </TouchableOpacity>

            {/* Change method link — only when saved methods exist */}
            {savedMethods.length > 0 && (
              <TouchableOpacity
                style={styles.changeMethodLink}
                onPress={() => activeSetStep(2)}
              >
                <Text style={styles.changeMethodLinkText}>
                  {t('payment_modal.change_method', { defaultValue: 'Change payment method' })}
                </Text>
              </TouchableOpacity>
            )}

            {/* Button 2: Pay with Coupon */}
            <TouchableOpacity
              style={[styles.button, styles.outlineSecondaryButton]}
              onPress={handleCouponOnlyPayment}
            >
              <View
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                  gap: sizes.couponButtonGap,
                }}
              >
                <Text style={[styles.buttonText, styles.outlineSecondaryButtonText]}>
                  {t('payment_modal.pay_with_coupon_balance', {
                    balance: couponsCount,
                  })}
                </Text>
                <Image
                  source={icons.coupon}
                  style={{
                    width: sizes.couponIconSize,
                    height: sizes.couponIconSize,
                    tintColor: theme.buttonColorSecondaryDefault,
                  }}
                />
              </View>
            </TouchableOpacity>

            {/* Button 3: Subscription plans */}
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => {
                onSubmit({ viewPlans: true });
              }}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                {t('payment_modal.get_subscription', { defaultValue: 'Get a subscription' })}
              </Text>
            </TouchableOpacity>
          </View>
        );
      } else {
        // CASE C: Client TOP / Quickly combined payments
        return (
          <View style={styles.contentContainer}>
            <Text style={styles.title}>
              {t('payment_modal.publish_status_title')}
            </Text>

            {/* Chips */}
            <View style={styles.chipContainer}>
              {displayProducts.map((opt) => {
                const active = jobType === opt.type;
                return (
                  <TouchableOpacity
                    key={opt.type}
                    onPress={() => setJobType(opt.type)}
                    style={[
                      styles.chip,
                      {
                        borderColor: active
                          ? theme.primaryColor
                          : theme.formInputPlaceholderColor,
                        backgroundColor: active
                          ? theme.primaryColor
                          : 'transparent',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? '#fff' : theme.formInputLabelColor },
                      ]}
                    >
                      {opt.type === 'normal'
                        ? t('payment_modal.option_default', { defaultValue: 'Default' })
                        : opt.type === 'quick'
                          ? t('payment_modal.option_quickly', { defaultValue: 'Quickly' })
                          : t('payment_modal.option_top', { defaultValue: 'TOP' })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Combined Price Header */}
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>{t('payment_modal.price_label')}</Text>
              <Text style={styles.priceValue}>{formattedMoneyPrice}</Text>
              <Text style={{ color: theme.formInputPlaceholderColor, fontSize: sizes.priceValueSize, fontFamily: 'Rubik-Bold', marginHorizontal: sizes.pricePlusMarginHorizontal }}>+</Text>
              <Text style={[styles.priceValue, { color: theme.buttonColorSecondaryDefault }]}>1</Text>
              <Text style={{ color: theme.buttonColorSecondaryDefault, fontSize: sizes.priceTextSize, fontFamily: 'Rubik-Bold', marginHorizontal: sizes.pricePlusMarginHorizontal }}>
                {t('payment_modal.coupon', { defaultValue: 'coupon' })}
              </Text>
              <Image
                source={icons.coupon}
                style={{
                  width: sizes.couponIconSize,
                  height: sizes.couponIconSize,
                  tintColor: theme.buttonColorSecondaryDefault,
                }}
              />
            </View>

            <Text style={styles.infoText}>
              {t('payment_modal.card_coupon_charged_simultaneously')}
            </Text>

            {/* Combined Pay Button */}
            <TouchableOpacity
              style={[styles.button, styles.outlinePrimaryButton, { height: sizes.buttonHeight * 1.15 }]}
              onPress={() => {
                if (savedMethods.length > 0 && defaultSavedMethod) {
                  handleConfirmPayment();
                } else {
                  activeSetStep(2);
                }
              }}
            >
              <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <View
                  style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: sizes.compoundButtonGap,
                    width: '100%',
                  }}
                >
                  <Text style={[styles.buttonText, styles.outlinePrimaryButtonText, { fontSize: sizes.buttonTextSize, marginHorizontal: sizes.compoundTextMarginHorizontal, flexShrink: 1, maxWidth: undefined }]} numberOfLines={1} ellipsizeMode="tail">
                    {getPayButtonBaseLabel()}
                  </Text>
                  <Text style={{ color: theme.formInputPlaceholderColor, fontSize: sizes.buttonTextSize, fontFamily: 'Rubik-Bold' }}>+</Text>
                  <Text style={{ color: theme.buttonColorSecondaryDefault, fontSize: sizes.buttonTextSize, fontFamily: 'Rubik-Bold' }}>1</Text>
                  <Text style={{ color: theme.buttonColorSecondaryDefault, fontSize: sizes.buttonTextSize, fontFamily: 'Rubik-Bold' }}>
                    {t('payment_modal.coupon', { defaultValue: 'coupon' })}
                  </Text>
                  <Image
                    source={icons.coupon}
                    style={{
                      width: sizes.couponIconSize,
                      height: sizes.couponIconSize,
                      tintColor: theme.buttonColorSecondaryDefault,
                    }}
                  />
                </View>
                <Text
                  style={[
                    styles.buttonSubText,
                    { color: theme.formInputLabelColor },
                  ]}
                >
                  {t('payment_modal.card_charged_coupon_deducted_once')}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Change method link — only when saved methods exist */}
            {savedMethods.length > 0 && (
              <TouchableOpacity
                style={styles.changeMethodLink}
                onPress={() => activeSetStep(2)}
              >
                <Text style={styles.changeMethodLinkText}>
                  {t('payment_modal.change_method', { defaultValue: 'Change payment method' })}
                </Text>
              </TouchableOpacity>
            )}

            {/* Subscription plans */}
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={() => {
                onSubmit({ viewPlans: true });
              }}
            >
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                {t('payment_modal.get_subscription', { defaultValue: 'Get a subscription' })}
              </Text>
            </TouchableOpacity>
          </View>
        );
      }
    }

    // CASE D / E: No Subscription - Business/Provider role (NO coupons)
    return (
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          {t('payment_modal.publish_status_title')}
        </Text>

        {/* Chips */}
        <View style={styles.chipContainer}>
          {displayProducts.map((opt) => {
            const active = jobType === opt.type;
            return (
              <TouchableOpacity
                key={opt.type}
                onPress={() => setJobType(opt.type)}
                style={[
                  styles.chip,
                  {
                    borderColor: active
                      ? theme.primaryColor
                      : theme.formInputPlaceholderColor,
                    backgroundColor: active
                      ? theme.primaryColor
                      : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? '#fff' : theme.formInputLabelColor },
                  ]}
                >
                  {opt.type === 'normal'
                    ? t('payment_modal.option_default', { defaultValue: 'Default' })
                    : opt.type === 'quick'
                      ? t('payment_modal.option_quickly', { defaultValue: 'Quickly' })
                      : t('payment_modal.option_top', { defaultValue: 'TOP' })}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Business Price Header */}
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>{t('payment_modal.price_label')}</Text>
          <Text style={styles.priceValue}>{formattedMoneyPrice}</Text>
        </View>

        <Text style={styles.infoText}>
          {t('payment_modal.business_only_card')}
        </Text>

        {/* Card Button */}
        <TouchableOpacity
          style={[styles.button, styles.outlinePrimaryButton]}
          onPress={() => {
            if (savedMethods.length > 0 && defaultSavedMethod) {
              handleConfirmPayment();
            } else {
              activeSetStep(2);
            }
          }}
        >
          <Text style={[styles.buttonText, styles.outlinePrimaryButtonText]} numberOfLines={1}>
            {getPayButtonLabel()}
          </Text>
        </TouchableOpacity>

        {/* Change method link — only when saved methods exist */}
        {savedMethods.length > 0 && (
          <TouchableOpacity
            style={styles.changeMethodLink}
            onPress={() => activeSetStep(2)}
          >
            <Text style={styles.changeMethodLinkText}>
              {t('payment_modal.change_method', { defaultValue: 'Change payment method' })}
            </Text>
          </TouchableOpacity>
        )}

        {/* Subscription plans */}
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => {
            onSubmit({ viewPlans: true });
          }}
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            {t('payment_modal.get_subscription', { defaultValue: 'Get a subscription' })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // ─── Render Screen: Select Payment Method (Step 2) ─────────────────────────
  const renderStep2 = () => {
    const isCombined = isClient && selectedOption.type !== 'normal';

    const step2Header = (
      <>
        {/* Payment Title and Total centered, mirroring InterestRequestModal */}
        <View style={{ alignItems: 'center', marginBottom: sizes.step2TitleMarginBottom }}>
          <Text style={[styles.title, { fontSize: sizes.titleSize }]}>
            {t('interestRequest.payment')}
          </Text>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { fontSize: sizes.titleSize, fontFamily: 'Rubik-Bold', marginRight: sizes.priceLabelMarginRight }]}>
              {t('interestRequest.total')}
            </Text>
            {isCombined ? (
              <View
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={styles.priceValue}>{formattedMoneyPrice}</Text>
                <Text style={{ color: theme.formInputPlaceholderColor, fontSize: sizes.step2PlusFontSize, fontFamily: 'Rubik-Bold', marginHorizontal: sizes.pricePlusMarginHorizontal }}>+</Text>
                <Text style={[styles.priceValue, { color: theme.buttonColorSecondaryDefault }]}>1</Text>
                <Text style={{ color: theme.buttonColorSecondaryDefault, fontSize: sizes.titleSize, fontFamily: 'Rubik-Bold', marginHorizontal: sizes.pricePlusMarginHorizontal }}>
                  {t('payment_modal.coupon', { defaultValue: 'coupon' })}
                </Text>
                <Image
                  source={icons.coupon}
                  style={{
                    width: sizes.couponIconSize,
                    height: sizes.couponIconSize,
                    tintColor: theme.buttonColorSecondaryDefault,
                  }}
                />
              </View>
            ) : (
              <Text style={styles.priceValue}>{formattedMoneyPrice}</Text>
            )}
          </View>
        </View>

        {/* Orange Alert Badge (if Combined Quickly/TOP) */}
        {isCombined && (
          <View style={styles.orangeBadge}>
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                width: '100%',
              }}
            >
              <Text style={styles.orangeBadgeText}>
                {t('payment_modal.coupon_deducted_part1', { defaultValue: '1 coupon' })}
              </Text>
              <Image
                source={icons.coupon}
                style={{
                  width: sizes.couponIconSize,
                  height: sizes.couponIconSize,
                  tintColor: theme.buttonColorSecondaryDefault,
                  marginHorizontal: sizes.pricePlusMarginHorizontal,
                }}
              />
              <Text style={styles.orangeBadgeText}>
                {t('payment_modal.coupon_deducted_part2', { defaultValue: 'will be deducted automatically' })}
              </Text>
            </View>
          </View>
        )}
      </>
    );

    const step2Footer = (
      <View style={{ width: '100%' }}>
        {/* Confirm Payment Action Button (Outline style) */}
        <TouchableOpacity
          style={[styles.button, styles.outlinePrimaryButton, !selectedMethodId && { opacity: 0.4 }]}
          onPress={handleConfirmPayment}
          disabled={!selectedMethodId}
        >
          {isCombined ? (
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: sizes.compoundButtonGap,
              }}
            >
              <Text style={[styles.buttonText, styles.outlinePrimaryButtonText, { marginHorizontal: sizes.compoundTextMarginHorizontal }]}>
                {getPayButtonConfirmBaseLabel()}
              </Text>
              <Text style={{ color: theme.formInputPlaceholderColor, fontSize: sizes.buttonTextSize, fontFamily: 'Rubik-Bold' }}>+</Text>
              <Text style={{ color: theme.buttonColorSecondaryDefault, fontSize: sizes.buttonTextSize, fontFamily: 'Rubik-Bold' }}>1</Text>
              <Text style={{ color: theme.buttonColorSecondaryDefault, fontSize: sizes.buttonTextSize, fontFamily: 'Rubik-Bold' }}>
                {t('payment_modal.coupon', { defaultValue: 'coupon' })}
              </Text>
              <Image
                source={icons.coupon}
                style={{
                  width: sizes.couponIconSize,
                  height: sizes.couponIconSize,
                  tintColor: theme.buttonColorSecondaryDefault,
                }}
              />
            </View>
          ) : (
            <Text style={[styles.buttonText, styles.outlinePrimaryButtonText]}>
              {t('interestRequest.pay_and_submit', {
                price: formattedMoneyPrice,
                defaultValue: `Pay ${formattedMoneyPrice} & Submit`,
              })}
            </Text>
          )}
        </TouchableOpacity>

        {/* Subscriptions plans button (Filled style) */}
        <TouchableOpacity
          style={[styles.button, styles.primaryButton, { marginTop: sizes.step2SubscriptionButtonMarginTop }]}
          onPress={() => {
            onSubmit({ viewPlans: true });
          }}
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            {t('payment_modal.get_subscription', { defaultValue: 'Get a subscription' })}
          </Text>
        </TouchableOpacity>
      </View>
    );

    return (
      <PaymentFlowStep
        showAddMethod={showAddMethod}
        setShowAddMethod={setShowAddMethod}
        availableMethods={availableMethods}
        savedMethods={savedMethods}
        selectedMethodId={selectedMethodId}
        setSelectedMethodId={(id) => {
          setSelectedMethodId(id);
          setSelectedSource('saved');
        }}
        newMethodId={newMethodId}
        setNewMethodId={setNewMethodId}
        saveForFuture={saveForFuture}
        setSaveForFuture={setSaveForFuture}
        sizes={sizes}
        theme={theme}
        t={t}
        isRTL={isRTL}
        step2Header={step2Header}
        step2Footer={step2Footer}
        onAddMethodPay={handleAddMethodPay}
        addMethodPayLabel={`${t('payment_modal.pay')} ${formattedMoneyPrice}`}
      />
    );
  };

  // ─── Render Main ─────────────────────────────────────────────────────────────
  return (
    <BaseActionModal
      visible={visible}
      onClose={() => {
        if (showAddMethod) {
          setShowAddMethod(false);
        } else {
          onClose();
        }
      }}
      isLoading={isLoading}
      sizes={sizes}
      theme={theme}
    >
      {activeStep === 1 ? renderStep1() : renderStep2()}
    </BaseActionModal>
  );
};

export default PublishStatusModal;
