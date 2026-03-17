import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useWindowInfo } from '../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import { icons } from '../constants/icons';

const PaymentMethodsModal = ({
  visible,
  onClose,
  onSetDefault,
  onDelete,
}) => {
  const { themeController, languageController } = useComponentContext();
  const theme = themeController.current;
  const { height, width, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

  // Mock data
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, title: 'PayPal (user@email)', default: true },
    { id: 2, title: 'Credit card •••• •••• •••• 4352', default: false },
    { id: 3, title: 'Credit card •••• •••• •••• 2032', default: false },
  ]);
  const [isLoading, setIsLoading] = useState(false);

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
    };
  }, [height, width, isWebLandscape]);

  const renderItem = ({ item }) => {
    const isDefault = item.default;
    return (
      <View
        style={[
          styles.itemContainer,
          {
            flexDirection: isRTL ? 'row-reverse' : 'row',
          },
          isDefault && {
            backgroundColor: theme.defaultBlocksMockBackground,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.itemCircleTouchable}
          onPress={() => onSetDefault(item.id)}
        >
          <Image
            source={isDefault ? icons.radioOn : icons.radioOff}
            style={[
              styles.itemCircle,
            ]}
          />
        </TouchableOpacity>
        <Text style={styles.itemTitle} numberOfLines={1} ellipsizeMode='tail'>
          {item.title}
        </Text>
        <TouchableOpacity
          style={styles.itemDeleteButton}
          onPress={() => onDelete(item.id)}
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
      height: sizes.itemHeight,
      borderRadius: sizes.itemBorderRadius,
      paddingHorizontal: sizes.itemPaddingHorizontal,
      alignItems: 'center',
      marginBottom: sizes.itemMarginBottom,
    },
    itemCircleTouchable: {
      padding: 4, // Increase touchable area
    },
    itemCircle: {
      width: sizes.itemCircleSize,
      height: sizes.itemCircleSize,
    },
    itemInnerCircle: {
      width: sizes.itemInnerCircleSize,
      height: sizes.itemInnerCircleSize,
      borderRadius: sizes.itemInnerCircleSize / 2,
      backgroundColor: theme.primaryColor,
    },
    itemTitle: {
      flex: 1,
      fontSize: sizes.itemTitleSize,
      color: theme.textColor,
      marginHorizontal: sizes.itemIconMargin,
      fontFamily: 'Rubik-Medium',
    },
    itemDeleteButton: {
      padding: 4, // Increase touchable area
    },
    itemDeleteIcon: {
      width: sizes.itemDeleteIconSize,
      height: sizes.itemDeleteIconSize,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.backgroundColor+'CC', // Semi-transparent background
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: sizes.borderRadius,
      zIndex: 10,
    },
  });

  return (
    <Modal visible={visible} transparent={true} animationType='fade'>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size='large' color={theme.primaryColor} />
            </View>
          )}
          <TouchableOpacity style={styles.crossButton} onPress={onClose}>
            <Image source={icons.cross} style={styles.crossIcon} />
          </TouchableOpacity>

          <Text style={styles.title}>Payment methods</Text>

          {paymentMethods.length > 0 ? (
            <FlatList
              data={paymentMethods}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.list}
            />
          ) : (
            <Text style={styles.emptyText}>
              You don't have any saved payment methods yet.
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default PaymentMethodsModal;
