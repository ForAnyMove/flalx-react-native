import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import { useWindowInfo } from '../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { icons } from '../constants/icons';

const AlertModal = ({
  visible,
  onClose,
  title,
  onConfirm,
  useConfirmAsClose = false,
}) => {
  const { themeController, languageController } = useComponentContext();
  const theme = themeController.current;
  const { height, width, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      modalWidth: isWebLandscape ? scale(450) : '80%',
      modalPadding: scale(32),
      borderRadius: scale(8),
      titleSize: scale(20),
      titleLineHeight: scale(28),
      titleBottomMargin: scale(32),
      buttonHeight: scale(62),
      buttonWidth: isWebLandscape ? scale(153) : '100%',
      buttonTextSize: scale(20),
      crossIconSize: scale(24),
      crossIconPosition: scale(12),
    };
  }, [height, width, isWebLandscape]);

  const handleClose = () => {
    if (useConfirmAsClose && onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            {
              backgroundColor: theme.backgroundColor,
              width: sizes.modalWidth,
              padding: sizes.modalPadding,
              borderRadius: sizes.borderRadius,
            },
          ]}
        >
          <TouchableOpacity
            onPress={handleClose}
            style={[
              styles.closeBtn,
              { top: sizes.crossIconPosition, right: sizes.crossIconPosition },
            ]}
          >
            <Image
              source={icons.cross}
              style={{
                width: sizes.crossIconSize,
                height: sizes.crossIconSize,
                tintColor: theme.textColor,
              }}
            />
          </TouchableOpacity>

          <Text
            style={[
              styles.title,
              {
                color: theme.textColor,
                fontSize: sizes.titleSize,
                lineHeight: sizes.titleLineHeight,
                marginBottom: sizes.titleBottomMargin,
              },
            ]}
          >
            {title}
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={onConfirm}
              style={[
                styles.button,
                {
                  backgroundColor: theme.buttonColorPrimaryDefault,
                  height: sizes.buttonHeight,
                  width: sizes.buttonWidth,
                  borderRadius: sizes.borderRadius,
                },
              ]}
            >
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: theme.buttonTextColorPrimary,
                    fontSize: sizes.buttonTextSize,
                  },
                ]}
              >
                {t('common.ok', { defaultValue: 'OK' })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    zIndex: 10,
  },
  title: {
    fontFamily: 'Rubik-Bold',
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Rubik-Medium',
  },
});

export default AlertModal;
