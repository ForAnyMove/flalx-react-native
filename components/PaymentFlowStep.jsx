import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { icons } from '../constants/icons';

const PaymentFlowStep = ({
  showAddMethod,
  setShowAddMethod,
  availableMethods = [],
  savedMethods = [],
  selectedMethodId,
  setSelectedMethodId,
  newMethodId,
  setNewMethodId,
  saveForFuture,
  setSaveForFuture,
  sizes,
  theme,
  t,
  isRTL,
  // Custom slots
  step2Title,
  step2Header,
  step2Footer,
  onAddMethodPay,
  addMethodPayLabel,
}) => {
  if (!sizes || !theme) return null;

  const styles = StyleSheet.create({
    contentContainer: {
      width: '100%',
      alignItems: 'center',
    },
    title: {
      fontSize: sizes.titleSize,
      fontWeight: 'bold',
      color: theme.textColor,
      marginBottom: sizes.titleMarginBottom || sizes.titleBottomMargin,
      fontFamily: 'Rubik-Bold',
      textAlign: 'center',
    },
    methodsSection: {
      width: '100%',
      marginBottom: sizes.methodsSectionMarginBottom || sizes.sectionContainerMarginBottom,
    },
    methodsLabel: {
      color: theme.formInputLabelColor,
      fontSize: sizes.sectionHeaderFontSize || sizes.sectionHeaderSize || sizes.textSize,
      textAlign: isRTL ? 'right' : 'left',
      marginBottom: sizes.paginationMarginBottom || sizes.sectionHeaderMarginBottom,
      fontFamily: 'Rubik-Medium',
    },
    methodsScroll: {
      width: '100%',
      maxHeight: sizes.methodScrollMaxHeight,
    },
    methodItem: {
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
      resizeMode: 'contain',
      marginHorizontal: sizes.itemContentMarginHorizontal,
    },
    methodLabel: {
      flex: 1,
      fontSize: sizes.itemTitleSize,
      color: theme.textColor,
      fontFamily: 'Rubik-Medium',
    },
    addMethodLink: {
      marginTop: sizes.changeMethodLinkMarginTop || sizes.changeLinkMarginTop || sizes.addMethodLinkMarginTop,
      alignSelf: 'center',
    },
    addMethodText: {
      fontSize: sizes.changeLinkTextSize || sizes.textSize,
      color: theme.primaryColor,
      fontFamily: 'Rubik-Medium',
      textDecorationLine: 'underline',
    },
    checkboxRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      width: '100%',
      marginTop: sizes.checkboxRowMarginTop || sizes.checkboxMarginTop || 0,
      marginBottom: sizes.checkboxRowMarginBottom || sizes.checkboxMarginBottom || 12,
    },
    checkbox: {
      borderWidth: sizes.checkboxBorderWidth || 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    checkboxInner: {
      width: sizes.checkboxSize * 0.7,
      height: sizes.checkboxSize * 0.7,
      tintColor: '#fff',
    },
    checkboxText: {
      flex: 1,
      color: theme.unactiveTextColor,
      fontFamily: 'Rubik-Medium',
    },
    button: {
      width: '100%',
      height: sizes.buttonHeight,
      borderRadius: sizes.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: sizes.buttonMarginTop || 0,
    },
    primaryButton: {
      backgroundColor: theme.buttonColorPrimaryDefault || theme.primaryColor,
    },
    buttonText: {
      fontSize: sizes.buttonTextSize,
      fontFamily: 'Rubik-Medium',
    },
    primaryButtonText: {
      color: theme.buttonTextColorPrimary,
    },
  });

  const getSavedMethodLabel = (method) => {
    if (method.type === 'paypal') {
      return `PayPal (${method.details?.title || 'user@email'})`;
    }
    return `${t('payment_modal.credit_card', { defaultValue: 'Credit card' })} •••• •••• •••• ${method.details?.last4 || '4352'}`;
  };

  const renderAddMethodScreen = () => {
    return (
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          {t('payment_modal.select_method_title')}
        </Text>

        {availableMethods.map((methodType) => {
          const isSelected = newMethodId === methodType;
          return (
            <TouchableOpacity
              key={methodType}
              style={[
                styles.methodItem,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
                isSelected && {
                  backgroundColor: theme.defaultBlocksMockBackground,
                },
                {
                  borderColor: isSelected ? theme.primaryColor : 'transparent',
                  borderWidth: 1,
                  backgroundColor: isSelected ? theme.primaryColor + '10' : theme.defaultBlocksMockBackground + '33',
                }
              ]}
              onPress={() => setNewMethodId(methodType)}
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

        {/* Save for future purchases Checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setSaveForFuture((v) => !v)}
        >
          <View
            style={[
              styles.checkbox,
              {
                width: sizes.checkboxSize,
                height: sizes.checkboxSize,
                borderRadius: sizes.checkboxRadius,
                borderColor: theme.primaryColor,
                backgroundColor: saveForFuture ? theme.primaryColor : 'transparent',
                marginRight: isRTL ? 0 : (sizes.checkboxMarginRight || 10),
                marginLeft: isRTL ? (sizes.checkboxMarginRight || 10) : 0,
              },
            ]}
          >
            {saveForFuture && (
              <Image source={icons.checkDefault} style={styles.checkboxInner} />
            )}
          </View>
          <Text style={[styles.checkboxText, { fontSize: sizes.checkboxTextSize || sizes.textSize, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('payment_modal.save_for_future')}
          </Text>
        </TouchableOpacity>

        {/* Pay Button */}
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={onAddMethodPay}
        >
          <Text style={[styles.buttonText, styles.primaryButtonText]}>
            {addMethodPayLabel}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSavedMethodsScreen = () => {
    return (
      <View style={styles.contentContainer}>
        {step2Title && (
          <Text style={styles.title}>
            {step2Title}
          </Text>
        )}

        {step2Header}

        <View style={styles.methodsSection}>
          <Text style={styles.methodsLabel}>
            {t('payment_modal.saved_methods', { defaultValue: 'Saved methods' })}
          </Text>
          <ScrollView style={styles.methodsScroll} showsVerticalScrollIndicator={false}>
            {savedMethods.map((method, index) => {
              const isSelected = selectedMethodId === method.id;
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.methodItem,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    {
                      borderColor: isSelected ? theme.primaryColor : 'transparent',
                      borderWidth: 1,
                      backgroundColor: isSelected ? theme.primaryColor + '10' : theme.defaultBlocksMockBackground + '33',
                      marginBottom: index === savedMethods.length - 1 ? 0 : sizes.itemMarginBottom,
                    }
                  ]}
                  onPress={() => setSelectedMethodId(method.id)}
                >
                  <Image
                    source={isSelected ? icons.radioOn : icons.radioOff}
                    style={[
                      styles.itemCircle,
                      { tintColor: isSelected ? theme.primaryColor : theme.formInputLabelColor },
                    ]}
                  />
                  <Text
                    style={[
                      styles.methodLabel,
                      {
                        marginLeft: isRTL ? 0 : sizes.itemContentMarginHorizontal,
                        marginRight: isRTL ? sizes.itemContentMarginHorizontal : 0,
                        textAlign: isRTL ? 'right' : 'left',
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

          {/* +Add new payment method link */}
          <TouchableOpacity style={styles.addMethodLink} onPress={() => setShowAddMethod(true)}>
            <Text style={styles.addMethodText}>
              {t('payment_modal.add_new_method', { defaultValue: '+Add new payment method' })}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Save for future purchases Checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setSaveForFuture((v) => !v)}
        >
          <View
            style={[
              styles.checkbox,
              {
                width: sizes.checkboxSize,
                height: sizes.checkboxSize,
                borderRadius: sizes.checkboxRadius,
                borderColor: theme.primaryColor,
                backgroundColor: saveForFuture ? theme.primaryColor : 'transparent',
                marginRight: isRTL ? 0 : (sizes.checkboxMarginRight || 10),
                marginLeft: isRTL ? (sizes.checkboxMarginRight || 10) : 0,
              },
            ]}
          >
            {saveForFuture && (
              <Image source={icons.checkDefault} style={styles.checkboxInner} />
            )}
          </View>
          <Text style={[styles.checkboxText, { fontSize: sizes.checkboxTextSize || sizes.textSize, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('payment_modal.save_for_future')}
          </Text>
        </TouchableOpacity>

        {step2Footer}
      </View>
    );
  };

  return showAddMethod ? renderAddMethodScreen() : renderSavedMethodsScreen();
};

export default PaymentFlowStep;
