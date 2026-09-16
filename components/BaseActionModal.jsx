import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { icons } from '../constants/icons';
import AppModal from './ui/AppModal';

const BaseActionModal = ({
  visible,
  onClose,
  isLoading,
  sizes,
  theme,
  children,
  overlayColor = 'rgba(0, 0, 0, 0.5)',
  isRTL = false,
}) => {
  if (!sizes || !theme) {
    return null; // Ensure sizes and theme are provided
  }

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: overlayColor,
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
      maxHeight: '90%',
    },
    crossButton: {
      position: 'absolute',
      top: sizes.crossIconPosition,
      right: isRTL ? undefined : sizes.crossIconPosition,
      left: isRTL ? sizes.crossIconPosition : undefined,
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
  });

  return (
    <AppModal visible={visible} transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.primaryColor} />
            </View>
          )}

          <TouchableOpacity onPress={onClose} style={styles.crossButton}>
            <Image
              source={icons.cross}
              style={styles.crossIcon}
              resizeMode="contain"
            />
          </TouchableOpacity>

          {children}
        </View>
      </View>
    </AppModal>
  );
};

export default BaseActionModal;

