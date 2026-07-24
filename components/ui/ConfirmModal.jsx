import React, { useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import { useWindowInfo } from '../../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { icons } from '../../constants/icons';

/**
 * Small reusable "are you sure?" dialog — title + Cancel/Confirm, styled to
 * match the destructive-confirm pattern already hand-rolled (copy-pasted) in
 * Profile.jsx (delete account/logout) and ShowJobModal.jsx (close job).
 * Those two aren't migrated to this component — only new call sites use it,
 * to avoid touching working code for a pure refactor.
 */
export default function ConfirmModal({
  visible,
  title,
  onCancel,
  onConfirm,
  cancelText,
  confirmText,
  destructive = false,
}) {
  const { t } = useTranslation();
  const { themeController, languageController } = useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;
  const { height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = useMemo(() => {
    const scale = isWebLandscape ? scaleByHeight : scaleByHeightMobile;
    return {
      modalWidth: isWebLandscape ? scale(450, height) : '80%',
      modalPadding: scale(32, height),
      borderRadius: scale(8, height),
      titleSize: scale(20, height),
      titleLineHeight: scale(28, height),
      titleBottomMargin: scale(32, height),
      btnHeight: scale(62, height),
      btnWidth: isWebLandscape ? scale(153, height) : '100%',
      btnFont: scale(18, height),
      btnsGap: scale(24, height),
      closeIconSize: scale(22, height),
      closeIconPosition: scale(12, height),
    };
  }, [isWebLandscape, height]);

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.backgroundColor,
              width: sizes.modalWidth,
              padding: sizes.modalPadding,
              borderRadius: sizes.borderRadius,
            },
          ]}
        >
          <TouchableOpacity
            style={{ position: 'absolute', top: sizes.closeIconPosition, right: sizes.closeIconPosition }}
            onPress={onCancel}
          >
            <Image
              source={icons.cross}
              style={{ width: sizes.closeIconSize, height: sizes.closeIconSize, tintColor: theme.textColor }}
            />
          </TouchableOpacity>

          <Text
            style={{
              fontFamily: 'Rubik-Bold',
              textAlign: 'center',
              fontSize: sizes.titleSize,
              lineHeight: sizes.titleLineHeight,
              marginBottom: sizes.titleBottomMargin,
              color: theme.textColor,
            }}
          >
            {title}
          </Text>

          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              gap: sizes.btnsGap,
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <TouchableOpacity
              style={{
                height: sizes.btnHeight,
                width: sizes.btnWidth,
                borderRadius: sizes.borderRadius,
                backgroundColor: theme.backgroundColor,
                borderWidth: 1,
                borderColor: theme.buttonColorSecondaryDefault,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={onCancel}
            >
              <Text style={{ color: theme.buttonColorSecondaryDefault, fontSize: sizes.btnFont }}>
                {cancelText || t('common.cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                height: sizes.btnHeight,
                width: sizes.btnWidth,
                borderRadius: sizes.borderRadius,
                backgroundColor: destructive ? theme.errorTextColor : theme.buttonColorPrimaryDefault,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={onConfirm}
            >
              <Text style={{ color: theme.buttonTextColorPrimary, fontSize: sizes.btnFont }}>
                {confirmText || t('common.confirm')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    position: 'relative',
    alignItems: 'center',
  },
});
