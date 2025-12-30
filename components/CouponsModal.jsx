import React, { useMemo, useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Image,
  TextInput,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useWindowInfo } from '../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import { icons } from '../constants/icons';

const CouponsModal = ({ visible, onClose }) => {
  const { themeController, languageController, user } = useComponentContext();
  const theme = themeController.current;
  const { height, width } = useWindowDimensions();
  const { isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

  const [linkCopied, setLinkCopied] = useState(false);
  const referralLink = `https://www.flalx.com/projects/${user.current?.id}`;
  const couponsCount = user.current?.coupons || 0;

  useEffect(() => {
    if (!visible) {
      // Reset state when modal is closed
      setTimeout(() => {
        setLinkCopied(false);
      }, 500);
    }
  }, [visible]);

  const copyToClipboard = () => {
    Clipboard.setStringAsync(referralLink);
    setLinkCopied(true);
  };

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      modalWidth: isWebLandscape ? scale(480) : '90%',
      borderRadius: scale(8),
      padding: scale(24),
      containerPaddingVertical: scale(36),
      containerPaddingHorizontal: scale(67),
      titleSize: scale(24),
      titleBottomMargin: scale(32),
      couponIconSize: scale(40),
      couponIconMargin: scale(8),
      couponTextSize: scale(18),
      couponCountTextSize: scale(28),
      couponSectionMarginBottom: scale(16),
      couponTextMarginBottom: scale(16),
      descriptionSize: scale(14),
      descriptionMarginBottom: scale(24),
      infoFieldHeight: scale(76),
      infoFieldWidth: isWebLandscape ? scale(330) : '100%',
      infoFieldPaddingH: scale(16),
      labelFont: scale(12),
      labelMarginBottom: scale(4),
      fieldFont: scale(16),
      copyIconSize: scale(24),
      copyIconTop: scale(10),
      copyIconRight: scale(17),
      linkCopiedTextMarginTop: scale(4),
      linkCopiedTextSize: scale(14),
      linkCopiedTextBottom: scale(12),
      infoFieldMarginBottom: scale(40),
      buttonHeight: scale(62),
      buttonWidth: isWebLandscape ? web(331) : '100%',
      buttonFontSize: scale(20),
      buttonMarginBottom: scale(6),
      crossIconSize: scale(24),
      crossIconPosition: scale(12),
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
    },
    couponSection: {
      alignItems: 'center',
      marginBottom: sizes.couponSectionMarginBottom,
    },
    couponText: {
      fontSize: sizes.couponTextSize,
      color: theme.textColor,
      marginBottom: sizes.couponTextMarginBottom,
    },
    couponCountText: {
      fontSize: sizes.couponCountTextSize,
      color: theme.primaryColor,
    },
    description: {
      fontSize: sizes.descriptionSize,
      color: theme.unactiveTextColor,
      textAlign: 'center',
      marginBottom: sizes.descriptionMarginBottom,
    },
    infoField: {
      width: sizes.infoFieldWidth,
      height: sizes.infoFieldHeight,
      backgroundColor: theme.formInputBackground,
      borderRadius: sizes.borderRadius,
      paddingHorizontal: sizes.infoFieldPaddingH,
      justifyContent: 'center',
      marginBottom: sizes.infoFieldMarginBottom,
      position: 'relative',
    },
    infoFieldLabel: {
      fontSize: sizes.labelFont,
      color: theme.unactiveTextColor,
      marginBottom: sizes.labelMarginBottom,
    },
    infoFieldText: {
      fontSize: sizes.fieldFont,
      color: theme.formInputLabelColor,
      paddingRight: sizes.copyIconSize + sizes.infoFieldPaddingH, // make space for icon
      fontFamily: 'Rubik-Medium',
    },
    copyIcon: {
      position: 'absolute',
      top: sizes.copyIconTop,
      right: sizes.copyIconRight,
      width: sizes.copyIconSize,
      height: sizes.copyIconSize,
    },
    linkCopiedText: {
      fontSize: sizes.linkCopiedTextSize,
      color: theme.textColor,
      marginTop: sizes.linkCopiedTextMarginTop,
      position: 'absolute',
      bottom: sizes.linkCopiedTextBottom,
      alignSelf: 'center',
    },
    closeButton: {
      height: sizes.buttonHeight,
      width: sizes.buttonWidth,
      backgroundColor: theme.buttonColorPrimaryDefault,
      borderRadius: sizes.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: sizes.buttonMarginBottom,
    },
    closeButtonText: {
      color: theme.buttonTextColorPrimary,
      fontSize: sizes.buttonFontSize,
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
  });

  return (
    <Modal visible={visible} transparent={true} animationType='fade'>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.crossButton} onPress={onClose}>
            <Image source={icons.cross} style={styles.crossIcon} />
          </TouchableOpacity>

          <Text style={styles.title}>{t('coupons.title')}</Text>

          <View style={styles.couponSection}>
            <Text style={styles.couponText}>
              {
                t('coupons.count', { count: couponsCount }).split(
                  couponsCount
                )[0]
              }
              <Text style={[styles.couponText, { color: theme.primaryColor }]}>
                {couponsCount}
              </Text>
              {
                t('coupons.count', { count: couponsCount }).split(
                  couponsCount
                )[1]
              }
            </Text>
            <View style={{ alignItems: 'center', flexDirection: 'row' }}>
              <Image
                source={icons.coupon}
                style={[
                  {
                    width: sizes.couponIconSize,
                    height: sizes.couponIconSize,
                    tintColor: theme.primaryColor,
                  },
                  isRTL
                    ? { marginLeft: sizes.couponIconMargin }
                    : { marginRight: sizes.couponIconMargin },
                ]}
              />
              <Text style={[styles.couponCountText, { fontWeight: 'bold' }]}>
                {couponsCount}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>{t('coupons.description')}</Text>

          <View style={{ width: sizes.infoFieldWidth }}>
            <View style={styles.infoField}>
              <Text style={styles.infoFieldLabel}>
                {t('coupons.copy_link_label')}
              </Text>
              <TextInput
                style={styles.infoFieldText}
                value={referralLink}
                editable={false}
              />
              <TouchableOpacity
                style={styles.copyIcon}
                onPress={copyToClipboard}
              >
                <Image
                  source={icons.copy}
                  style={{
                    width: '100%',
                    height: '100%',
                    tintColor: linkCopied
                      ? theme.formInputLabelColor
                      : theme.primaryColor,
                  }}
                />
              </TouchableOpacity>
            </View>
            {linkCopied && (
              <Text style={styles.linkCopiedText}>
                {t('coupons.link_copied')}
              </Text>
            )}
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CouponsModal;
