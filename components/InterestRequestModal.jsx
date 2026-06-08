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
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import { useWindowInfo } from '../context/windowContext';
import { icons } from '../constants/icons';
import { scale, scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import BaseActionModal from './BaseActionModal';
import PaymentFlowStep from './PaymentFlowStep';
import DateTimePicker from '@react-native-community/datetimepicker';

// ─── Internal Helper Components (Defined outside to prevent focus loss) ───

const PaginationDots = ({ activeStep, sizes, theme, t }) => (
  <View style={[styles.paginationContainer, { marginBottom: sizes.paginationMarginBottom }]}>
    <View style={[styles.dotsRow, { marginBottom: sizes.dotsRowMarginBottom }]}>
      <View style={[styles.dot, {
        width: activeStep === 1 ? sizes.dotActiveSize : sizes.dotInactiveSize,
        height: activeStep === 1 ? sizes.dotActiveSize : sizes.dotInactiveSize,
        backgroundColor: activeStep === 1 ? theme.primaryColor : theme.defaultBlocksMockBackground,
        borderRadius: (activeStep === 1 ? sizes.dotActiveSize : sizes.dotInactiveSize) / 2,
        marginHorizontal: sizes.dotMarginHorizontal,
      }]} />
      <View style={[styles.dot, {
        width: activeStep === 2 ? sizes.dotActiveSize : sizes.dotInactiveSize,
        height: activeStep === 2 ? sizes.dotActiveSize : sizes.dotInactiveSize,
        backgroundColor: activeStep === 2 ? theme.primaryColor : theme.defaultBlocksMockBackground,
        borderRadius: (activeStep === 2 ? sizes.dotActiveSize : sizes.dotInactiveSize) / 2,
        marginHorizontal: sizes.dotMarginHorizontal,
      }]} />
    </View>
    <Text style={[styles.stepText, { fontSize: sizes.stepTextFontSize, color: theme.formInputLabelColor }]}>
      {t('interestRequest.step_of', { current: activeStep, total: 2, defaultValue: `Step ${activeStep} of 2` })}
    </Text>
  </View>
);

const SuccessHeader = ({ subtitle, text, sizes, theme }) => (
  <View style={[styles.successHeaderContainer, { marginBottom: sizes.successHeaderMarginBottom }]}>
    <Image
      source={icons.checkDefault}
      style={[
        styles.successCircle,
        {
          width: sizes.successCircleSize,
          height: sizes.successCircleSize,
          marginBottom: sizes.successCircleMarginBottom
        }
      ]}
    />
    {subtitle && (
      <View style={[styles.subtitleBox, { borderBottomColor: theme.defaultBlocksMockBackground, paddingBottom: sizes.subtitleBoxPaddingBottom }]}>
        <Text style={[styles.successSubtitle, { color: theme.primaryColor, fontSize: sizes.statusTitleSize, marginBottom: sizes.successSubtitleMarginBottom }]}>{subtitle}</Text>
        {text && <Text style={[styles.successText, { color: theme.formInputLabelColor, fontSize: sizes.statusTextSize }]}>{text}</Text>}
      </View>
    )}
  </View>
);

const FormInput = ({ label, value, placeholder, onChangeText, hint, keyboardType, sizes, theme, isRTL, error, t }) => (
  <View style={[styles.inputWrapper, { marginBottom: sizes.sectionMarginBottom }]}>
    <Text style={[styles.inputLabelOutside, { color: theme.textColor, fontSize: sizes.sectionHeaderFontSize, marginBottom: sizes.sectionHeaderMarginBottom, textAlign: isRTL ? 'right' : 'left' }]}>
      {t('interestRequest.price_header', { defaultValue: 'Price' })}
    </Text>
    <View style={[
      styles.inputContainer,
      {
        backgroundColor: theme.formInputBackground,
        height: sizes.buttonHeight,
        borderRadius: sizes.borderRadius,
        paddingHorizontal: sizes.inputPaddingHorizontal,
        borderWidth: error ? 1 : 0,
        borderColor: theme.errorTextColor
      }
    ]}>
      <Text style={[styles.inputLabelInside, { color: theme.formInputLabelColor, fontSize: sizes.hintSize, left: sizes.inputPaddingHorizontal, top: sizes.inputLabelInsideTop }]}>
        {t('interestRequest.price_input_label', { defaultValue: 'Your price' })}
      </Text>
      <TextInput
        style={[styles.textInput, { color: theme.textColor, fontSize: sizes.inputTextSize, textAlign: isRTL ? 'right' : 'left', marginTop: sizes.textInputMarginTop }]}
        value={value}
        onChangeText={(text) => {
          const numericValue = text.replace(/[^0-9.]/g, '');
          onChangeText(numericValue);
        }}
        placeholder={placeholder}
        placeholderTextColor={theme.formInputPlaceholderColor}
        keyboardType="numeric"
      />
    </View>
    {hint && <Text style={[styles.hintText, { color: theme.unactiveTextColor, fontSize: sizes.hintSize, textAlign: isRTL ? 'right' : 'left', marginTop: sizes.hintTextMarginTop }]}>{hint}</Text>}
  </View>
);

const DateInput = ({ label, value, onPress, mode, sizes, theme, handleWebDateChange, isRTL, t, error }) => {
  const webInputRef = React.useRef(null);

  const handlePress = () => {
    if (Platform.OS === 'web') {
      if (webInputRef.current) {
        webInputRef.current.showPicker?.();
        webInputRef.current.click?.();
      }
    } else {
      onPress?.();
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handlePress}
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.formInputBackground,
            height: sizes.buttonHeight,
            borderRadius: sizes.borderRadius,
            paddingHorizontal: sizes.inputPaddingHorizontal,
            borderWidth: (error && mode === 'start') ? 1 : 0,
            borderColor: theme.errorTextColor,
            justifyContent: 'center',
            position: 'relative',
          }
        ]}
      >
        <Text style={[styles.inputLabelInside, { color: theme.formInputLabelColor, fontSize: sizes.hintSize, left: sizes.inputPaddingHorizontal, top: sizes.inputLabelInsideTop }]}>{label}</Text>
        <View style={[styles.dateRow, isRTL && { flexDirection: 'row-reverse' }, { marginTop: sizes.dateRowMarginTop }]}>
          <Text style={[styles.dateText, { color: value ? theme.textColor : theme.formInputPlaceholderColor, fontSize: sizes.inputTextSize }]}>
            {value ? new Date(value).toLocaleDateString() : t('interestRequest.pick_date', { defaultValue: 'Pick date' })}
          </Text>
          <Image source={icons.calendar || icons.calendarDefault} style={{ width: sizes.crossIconSize, height: sizes.crossIconSize, tintColor: theme.formInputLabelColor }} />
        </View>
        {Platform.OS === 'web' && (
          <input
            ref={webInputRef}
            type="date"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              pointerEvents: 'none',
            }}
            value={value ? new Date(value).toISOString().split('T')[0] : ''}
            onChange={(e) => handleWebDateChange(mode, e)}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const InterestRequestModal = ({
  visible,
  onClose,
  isBusinessJob,
  hasSubscription,
  price, // Total price for payment e.g. "$1.99"
  onConfirm, // callback(formData, paymentOptions)
  onPayWithCoupons,
  onOpenSubscriptions,
  formData,
  setFormData,
  step,
  setStep,
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
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [saveForFuture, setSaveForFuture] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ price: false, date: false });
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [newMethodId, setNewMethodId] = useState(null);

  // Date Picker States
  const [pickerMode, setPickerMode] = useState(null); // 'start' | 'end' | null

  const savedMethods = paymentsManagerController?.savedMethods ?? [];
  const availableMethods = paymentsManagerController?.availableMethods ?? [];
  const couponsCount = couponsManagerController?.balance ?? 0;

  // ─── Effect: Reset/Initialize ────────────────────────────────────────────────
  useEffect(() => {
    if (visible) {
      couponsManagerController?.refreshBalance?.();
      // Only set step automatically if it's not already set to something meaningful or if it's a fresh open
      if (isBusinessJob && !hasSubscription) {
        setStep(2);
      }
      setFieldErrors({ price: false, date: false });
      setShowAddMethod(false);
      setNewMethodId(availableMethods.length > 0 ? availableMethods[0] : null);
      if (savedMethods.length > 0) {
        const defaultMethod = savedMethods.find(m => m.default) || savedMethods[0];
        setSelectedMethodId(defaultMethod.id);
      }
    }
  }, [visible, isBusinessJob, hasSubscription]);

  // ─── Sizes (Synchronized with Design Requirements) ───────────────────────────
  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      modalWidth: isWebLandscape ? scale(450) : '90%',
      borderRadius: scale(8),
      containerPaddingVertical: scale(32),
      containerPaddingHorizontal: scale(75),
      inputPaddingHorizontal: scale(16),
      // Text
      titleSize: scale(24),
      titleBottomMargin: scale(24),
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
      // Scroll
      methodScrollMaxHeight: isWebLandscape ? scaleByHeight(280, height) : height * 0.32,
      // Section headers
      sectionHeaderFontSize: scale(18),
      sectionHeaderMarginBottom: scale(8),
      sectionMarginBottom: scale(24),
      // Checkbox
      checkboxSize: scale(18),
      checkboxRadius: scale(4),
      checkboxMarginBottom: scale(16),
      checkboxTextSize: scale(16),
      // Status screens
      statusIconSize: scale(64),
      statusTitleSize: scale(20),
      statusTextSize: scale(16),
      // Buttons
      buttonHeight: scale(62),
      buttonTextSize: scale(20),
      // Change method link
      changeLinkMarginTop: scale(16),
      changeLinkTextSize: scale(16),

      // InterestRequest Specific
      dotActiveSize: scale(12),
      dotInactiveSize: scale(8),
      dotGap: scale(8),
      paginationMarginBottom: scale(16),
      stepTextFontSize: scale(16),
      successCircleSize: scale(80),
      successIconSize: scale(40),
      hintSize: scale(12),
      inputTextSize: scale(18),
      totalPriceSize: scale(24),
      couponIconSize: scale(24),
      couponButtonGap: scale(6),

      // New restored sizes
      dotsRowMarginBottom: scale(8),
      dotMarginHorizontal: scale(4),
      successHeaderMarginBottom: scale(24),
      successCircleMarginBottom: scale(16),
      subtitleBoxPaddingBottom: scale(16),
      successSubtitleMarginBottom: scale(4),
      inputLabelInsideTop: scale(6),
      textInputMarginTop: scale(14),
      hintTextMarginTop: scale(6),
      dateRowMarginTop: scale(14),
      paymentHeaderMarginBottom: scale(24),
      methodsSectionMarginBottom: scale(16),
      confirmTextLineHeight: scale(22),
      // Method icons sizes
      paypalMethodHeight: scale(38),
      paypalMethodWidth: scale(150),
      hypMethodHeight: scale(34),
      hypMethodWidth: scale(80),
      apple_payMethodHeight: scale(38),
      apple_payMethodWidth: scale(140),
      google_payMethodHeight: scale(38),
      google_payMethodWidth: scale(140),
      methodIconWidth: scale(80),
      methodIconHeight: scale(34),
    };
  }, [height, width, isWebLandscape]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleContinue = () => {
    const hasPrice = formData.price.trim() !== '';
    const hasDate = formData.startDate !== null;

    if (!isBusinessJob) {
      setFieldErrors({ price: !hasPrice, date: !hasDate });
      if (!hasPrice || !hasDate) return;
    }

    if (hasSubscription) {
      onConfirm(formData, {});
    } else {
      setStep(2);
    }
  };

  const handleFinalSubmit = () => {
    const savedMethod = savedMethods.find(m => m.id === selectedMethodId);
    const paymentOptions = {
      paymentMethod: savedMethod?.type,
      savedPaymentMethodId: selectedMethodId,
    };
    onConfirm(formData, paymentOptions);
  };

  const handleAddMethodPay = () => {
    const paymentOptions = {
      paymentMethod: newMethodId,
      ...(saveForFuture && { savePaymentMethod: true }),
    };
    onConfirm(formData, paymentOptions);
  };

  const onDateChange = (event, selectedDate) => {
    const mode = pickerMode;
    setPickerMode(null);
    if (selectedDate) {
      if (mode === 'start') {
        setFormData(prev => ({ ...prev, startDate: selectedDate.toISOString() }));
      } else {
        setFormData(prev => ({ ...prev, endDate: selectedDate.toISOString() }));
      }
      setFieldErrors(prev => ({ ...prev, date: false }));
    }
  };

  const handleWebDateChange = (mode, e) => {
    const val = e.target.value;
    if (val) {
      const date = new Date(val);
      if (mode === 'start') {
        setFormData(prev => ({ ...prev, startDate: date.toISOString() }));
      } else {
        setFormData(prev => ({ ...prev, endDate: date.toISOString() }));
      }
      setFieldErrors(prev => ({ ...prev, date: false }));
    }
  };
  // ─── Render Content ──────────────────────────────────────────────────────────
  const renderForm = () => {
    const showHeader = hasSubscription;
    return (
      <View style={styles.content}>
        {showHeader ? (
          <SuccessHeader
            subtitle={t('interestRequest.sub_active_no_fee', { defaultValue: 'Subscription active - no fee' })}
            sizes={sizes}
            theme={theme}
          />
        ) : (
          <PaginationDots activeStep={1} sizes={sizes} theme={theme} t={t} />
        )}

        <Text style={[styles.modalTitle, { color: theme.textColor, fontSize: sizes.titleSize, marginBottom: sizes.titleBottomMargin }]}>
          {t('interestRequest.your_application', { defaultValue: 'Your application' })}
        </Text>

        <FormInput
          label={t('interestRequest.price_header', { defaultValue: 'Price' })}
          value={formData.price}
          onChangeText={(v) => {
            setFormData(p => ({ ...p, price: v }));
            setFieldErrors(p => ({ ...p, price: false }));
          }}
          placeholder="$0"
          hint={t('interestRequest.price_hint', { defaultValue: 'Enter the amount you are willing to work for' })}
          sizes={sizes}
          theme={theme}
          isRTL={isRTL}
          error={fieldErrors.price}
          t={t}
        />

        <View style={[styles.timeSection, { marginBottom: sizes.sectionMarginBottom }]}>
          <Text style={[styles.inputLabelOutside, { color: theme.textColor, fontSize: sizes.sectionHeaderFontSize, marginBottom: sizes.sectionHeaderMarginBottom, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('interestRequest.time_label', { defaultValue: 'Available time' })}
          </Text>
          <View style={[styles.row, { gap: sizes.itemMarginBottom, marginBottom: 8 }]}>
            <DateInput
              label={t('common.from', { defaultValue: 'From' })}
              value={formData.startDate}
              onPress={() => Platform.OS !== 'web' && setPickerMode('start')}
              mode="start"
              sizes={sizes}
              theme={theme}
              handleWebDateChange={handleWebDateChange}
              isRTL={isRTL}
              t={t}
              error={fieldErrors.date}
            />
            <DateInput
              label={t('common.to', { defaultValue: 'To' })}
              value={formData.endDate}
              onPress={() => Platform.OS !== 'web' && setPickerMode('end')}
              mode="end"
              sizes={sizes}
              theme={theme}
              handleWebDateChange={handleWebDateChange}
              isRTL={isRTL}
              t={t}
              error={fieldErrors.date}
            />
          </View>
          <Text style={[styles.hintText, { color: theme.unactiveTextColor, fontSize: sizes.hintSize, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('interestRequest.time_hint', { defaultValue: 'If exact — pick same date for both' })}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primaryColor, height: sizes.buttonHeight, borderRadius: sizes.borderRadius }]}
          onPress={handleContinue}
        >
          <Text style={[styles.buttonText, { color: theme.buttonTextColorPrimary, fontSize: sizes.buttonTextSize }]}>
            {hasSubscription ? t('interestRequest.submit_application', { defaultValue: 'Submit application' }) : t('interestRequest.continue_to_payment', { defaultValue: 'Continue to payment' })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPayment = () => {
    const isClientJob = !isBusinessJob;

    const step2Header = (
      <>
        {isClientJob && <PaginationDots activeStep={2} sizes={sizes} theme={theme} t={t} />}

        <View style={[styles.paymentHeader, { marginBottom: sizes.paymentHeaderMarginBottom }]}>
          <Text style={[styles.modalTitle, { color: theme.textColor, fontSize: sizes.titleSize, marginBottom: 4 }]}>
            {isClientJob ? t('interestRequest.payment', { defaultValue: 'Payment' }) : t('interestRequest.submit_application_title', { defaultValue: 'Submit application' })}
          </Text>
          <Text style={[styles.totalPrice, { color: theme.textColor, fontSize: sizes.totalPriceSize }]}>
            {t('interestRequest.total', { defaultValue: 'Total:' })} <Text style={{ color: theme.primaryColor }}>{price}</Text>
          </Text>
        </View>
      </>
    );

    const step2Footer = (
      <View>
        <TouchableOpacity
          style={[styles.outlineButton, { borderColor: theme.primaryColor, height: sizes.buttonHeight, borderRadius: sizes.borderRadius, backgroundColor: theme.backgroundColor }, !selectedMethodId && { opacity: 0.4 }]}
          onPress={handleFinalSubmit}
          disabled={!selectedMethodId}
        >
          <Text style={[styles.outlineButtonText, { color: theme.primaryColor, fontSize: sizes.buttonTextSize }]}>
            {t('interestRequest.pay_and_submit', { price, defaultValue: `Pay ${price} & Submit` })}
          </Text>
        </TouchableOpacity>

        {onPayWithCoupons && (
          <TouchableOpacity
            style={[
              styles.outlineButton,
              {
                borderColor: theme.buttonColorSecondaryDefault || theme.primaryColor,
                height: sizes.buttonHeight,
                borderRadius: sizes.borderRadius,
                backgroundColor: theme.backgroundColor,
                marginTop: 12,
              },
            ]}
            onPress={onPayWithCoupons}
          >
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                alignItems: 'center',
                gap: sizes.couponButtonGap,
              }}
            >
              <Text
                style={[
                  styles.outlineButtonText,
                  {
                    color: theme.buttonColorSecondaryDefault || theme.primaryColor,
                    fontSize: sizes.buttonTextSize,
                  },
                ]}
              >
                {t('payment_modal.pay_with_coupon_balance', {
                  balance: couponsCount,
                })}
              </Text>
              <Image
                source={icons.coupon}
                style={{
                  width: sizes.couponIconSize,
                  height: sizes.couponIconSize,
                  tintColor: theme.buttonColorSecondaryDefault || theme.primaryColor,
                }}
              />
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.primaryColor, height: sizes.buttonHeight, borderRadius: sizes.borderRadius, marginTop: 12 }]}
          onPress={onOpenSubscriptions}
        >
          <Text style={[styles.buttonText, { color: theme.buttonTextColorPrimary, fontSize: sizes.buttonTextSize }]}>
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
        setSelectedMethodId={setSelectedMethodId}
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
        addMethodPayLabel={`${t('payment_modal.pay')} ${price}`}
      />
    );
  };

  const renderBusinessSubscribed = () => (
    <View style={styles.content}>
      <SuccessHeader
        subtitle={t('interestRequest.sub_active', { defaultValue: 'Subscription active' })}
        text={t('interestRequest.sub_free_info', { defaultValue: 'Application is free with your subscription' })}
        sizes={sizes}
        theme={theme}
      />

      <Text style={[styles.modalTitle, { color: theme.textColor, fontSize: sizes.titleSize, textAlign: 'center', marginBottom: sizes.titleBottomMargin }]}>
        {t('interestRequest.submit_your_app_query', { defaultValue: 'Submit your application?' })}
      </Text>

      <Text style={[styles.confirmText, { color: theme.unactiveTextColor, fontSize: sizes.sectionHeaderFontSize, textAlign: 'center', marginBottom: sizes.sectionMarginBottom, lineHeight: sizes.confirmTextLineHeight }]}>
        {t('interestRequest.interest_sent_immediately', { defaultValue: 'Your interest will be sent to the client immediately.' })}
      </Text>

      <TouchableOpacity
        style={[styles.primaryButton, { backgroundColor: theme.primaryColor, height: sizes.buttonHeight, borderRadius: sizes.borderRadius }]}
        onPress={() => onConfirm({}, {})}
      >
        <Text style={[styles.buttonText, { color: theme.buttonTextColorPrimary, fontSize: sizes.buttonTextSize }]}>
          {t('interestRequest.submit_application', { defaultValue: 'Submit application' })}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Main Content Selector ───────────────────────────────────────────────────
  let content;
  if (isBusinessJob && hasSubscription) {
    content = renderBusinessSubscribed();
  } else if (step === 2) {
    content = renderPayment();
  } else {
    content = renderForm();
  }

  return (
    <>
      <BaseActionModal
        visible={visible}
        onClose={() => {
          if (showAddMethod) {
            setShowAddMethod(false);
          } else {
            onClose();
          }
        }}
        sizes={sizes}
        theme={theme}
        overlayColor="rgba(59, 70, 99, 0.6)"
      >
        {content}
      </BaseActionModal>
      {Platform.OS !== 'web' && pickerMode && (
        <DateTimePicker
          value={formData[pickerMode === 'start' ? 'startDate' : 'endDate'] ? new Date(formData[pickerMode === 'start' ? 'startDate' : 'endDate']) : new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(59, 70, 99, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  closeBtn: {
    position: 'absolute',
    zIndex: 10,
  },
  content: {
    width: '100%',
  },
  // Pagination
  paginationContainer: {
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
  },
  stepText: {
    fontFamily: 'Rubik-Medium',
  },
  // Success Header
  successHeaderContainer: {
    alignItems: 'center',
  },
  successCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitleBox: {
    alignItems: 'center',
    borderBottomWidth: 1,
    width: '100%',
  },
  successSubtitle: {
    fontFamily: 'Rubik-Medium',
    textAlign: 'center',
  },
  successText: {
    fontFamily: 'Rubik-Regular',
    textAlign: 'center',
  },
  // General
  modalTitle: {
    fontFamily: 'Rubik-Bold',
    textAlign: 'center',
  },
  inputWrapper: {
  },
  inputLabelOutside: {
    fontFamily: 'Rubik-Bold',
  },
  inputContainer: {
    justifyContent: 'center',
    position: 'relative',
  },
  inputLabelInside: {
    position: 'absolute',
    fontFamily: 'Rubik-Medium',
  },
  textInput: {
    fontFamily: 'Rubik-Medium',
    padding: 0,
  },
  hintText: {
    fontFamily: 'Rubik-Regular',
  },
  timeSection: {
  },
  row: {
    flexDirection: 'row',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontFamily: 'Rubik-Medium',
  },
  // Buttons
  primaryButton: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButton: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  buttonText: {
    fontFamily: 'Rubik-Medium',
  },
  outlineButtonText: {
    fontFamily: 'Rubik-Medium',
  },
  // Payment
  paymentHeader: {
    alignItems: 'center',
  },
  totalPrice: {
    fontFamily: 'Rubik-Bold',
  },
  methodsSection: {
  },
  methodsLabel: {
    fontFamily: 'Rubik-Medium',
  },
  methodsScroll: {
    width: '100%',
  },
  methodItem: {
    width: '100%',
    alignItems: 'center',
  },
  methodLabel: {
    fontFamily: 'Rubik-Medium',
  },
  addMethodLink: {
    alignSelf: 'center',
  },
  addMethodText: {
    fontFamily: 'Rubik-Bold',
    textDecorationLine: 'underline',
  },
  checkboxRow: {
    alignItems: 'center',
  },
  checkbox: {
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxText: {
    fontFamily: 'Rubik-Medium',
    flex: 1,
  },
  confirmText: {
    fontFamily: 'Rubik-Regular',
  }
});

export default InterestRequestModal;
