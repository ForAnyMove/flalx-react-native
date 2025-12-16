import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Image,
  ScrollView,
} from 'react-native';
import { useWindowInfo } from '../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { useTranslation } from 'react-i18next';
import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { useComponentContext } from '../context/globalAppContext';
import ImagePickerModal from './ui/ImagePickerModal';

const AddProfessionModal = ({ visible, onClose }) => {
  const { themeController, languageController } = useComponentContext();
  const { height, width } = useWindowDimensions();
  const { isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

  const [passportPhotos, setPassportPhotos] = useState([]);
  const [certificatePhotos, setCertificatePhotos] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [activePicker, setActivePicker] = useState(null); // 'passport' or 'certificate'

  const sizes = useMemo(() => {
    const scale = isWebLandscape ? scaleByHeight : scaleByHeightMobile;
    return {
      modalWidth: isWebLandscape ? width * 0.35 : width * 0.9,
      modalMaxHeight: isWebLandscape ? height * 0.8 : height * 0.9,
      borderRadius: scale(12),
      padding: scale(24),
      headerBottomMargin: scale(16),
      titleSize: scale(20),
      iconSize: scale(18),
      buttonHeight: scale(50),
      buttonFontSize: scale(16),
      uploadRowHeight: scale(56),
      uploadIconSize: scale(24),
      uploadTextSize: scale(16),
      imageGridGap: scale(8),
      imageSize: scale(70),
      removeIconSize: scale(20),
      successIconContainerSize: scale(72),
      successIconSize: scale(36),
      successTitleMarginTop: scale(24),
      successDescriptionMarginTop: scale(8),
      successButtonMarginTop: scale(32),
    };
  }, [height, width, isWebLandscape]);

  const handleOpenPicker = (type) => {
    setActivePicker(type);
    setPickerVisible(true);
  };

  const handleAddImages = (images) => {
    if (activePicker === 'passport') {
      setPassportPhotos((prev) => [...prev, ...images]);
    } else if (activePicker === 'certificate') {
      setCertificatePhotos((prev) => [...prev, ...images]);
    }
    setPickerVisible(false);
    setActivePicker(null);
  };

  const handleRemoveImage = (index, type) => {
    if (type === 'passport') {
      setPassportPhotos((prev) => prev.filter((_, i) => i !== index));
    } else {
      setCertificatePhotos((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    console.log('Submitting verification:', {
      passportPhotos,
      certificatePhotos,
    });
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitted(true);
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setIsSubmitted(false);
      setPassportPhotos([]);
      setCertificatePhotos([]);
    }, 300);
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
      maxHeight: sizes.modalMaxHeight,
      backgroundColor: themeController.current?.backgroundColor,
      borderRadius: sizes.borderRadius,
      padding: sizes.padding,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 20,
    },
    header: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: sizes.headerBottomMargin,
    },
    title: {
      fontSize: sizes.titleSize,
      fontWeight: 'bold',
      color: themeController.current?.textColor,
      flex: 1,
      textAlign: isRTL ? 'right' : 'left',
    },
    submitButton: {
      height: sizes.buttonHeight,
      backgroundColor: themeController.current?.buttonColorPrimaryDefault,
      borderRadius: sizes.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: sizes.padding,
    },
    submitButtonText: {
      color: themeController.current?.buttonTextColorPrimary,
      fontSize: sizes.buttonFontSize,
      fontWeight: 'bold',
    },
    uploadRow: {
      height: sizes.uploadRowHeight,
      backgroundColor: themeController.current?.formInputBackground,
      borderRadius: sizes.borderRadius,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingHorizontal: sizes.padding / 2,
      justifyContent: 'space-between',
      marginBottom: sizes.padding / 2,
    },
    uploadRowInfo: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
    },
    uploadText: {
      fontSize: sizes.uploadTextSize,
      color: themeController.current?.textColor,
      marginHorizontal: sizes.padding / 2,
    },
    imageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sizes.imageGridGap,
      marginBottom: sizes.padding,
    },
    imageContainer: {
      position: 'relative',
    },
    image: {
      width: sizes.imageSize,
      height: sizes.imageSize,
      borderRadius: sizes.borderRadius / 2,
    },
    removeButton: {
      position: 'absolute',
      top: -5,
      right: -5,
      backgroundColor: themeController.current?.backgroundColor,
      borderRadius: 50,
      padding: 2,
    },
    // Success view styles
    successContainer: {
      alignItems: 'center',
      padding: sizes.padding,
    },
    successIconContainer: {
      width: sizes.successIconContainerSize,
      height: sizes.successIconContainerSize,
      borderRadius: sizes.successIconContainerSize / 2,
      backgroundColor: themeController.current?.buttonColorPrimaryDefault + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    successTitle: {
      fontSize: sizes.titleSize,
      fontWeight: 'bold',
      color: themeController.current?.textColor,
      marginTop: sizes.successTitleMarginTop,
      textAlign: 'center',
    },
    successDescription: {
      fontSize: sizes.descriptionSize,
      color: themeController.current?.unactiveTextColor,
      marginTop: sizes.successDescriptionMarginTop,
      textAlign: 'center',
      lineHeight: sizes.descriptionSize * 1.5,
    },
    okButton: {
      height: sizes.buttonHeight,
      backgroundColor: themeController.current?.buttonColorPrimaryDefault,
      borderRadius: sizes.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: sizes.successButtonMarginTop,
      width: '100%',
    },
    okButtonText: {
      color: themeController.current?.buttonTextColorPrimary,
      fontSize: sizes.buttonFontSize,
      fontWeight: 'bold',
    },
  });

  const renderImageGrid = (photos, type) => (
    <View style={styles.imageGrid}>
      {photos.map((photo, index) => (
        <View key={index} style={styles.imageContainer}>
          <Image source={{ uri: photo.uri || photo }} style={styles.image} />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveImage(index, type)}
          >
            <MaterialIcons
              name='cancel'
              size={sizes.removeIconSize}
              color={themeController.current?.unactiveTextColor}
            />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  return (
    <Modal visible={visible} transparent={true} animationType='fade'>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {isSubmitted ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconContainer}>
                <FontAwesome6
                  name='check'
                  size={sizes.successIconSize}
                  color={themeController.current?.buttonColorPrimaryDefault}
                />
              </View>
              <Text style={styles.successTitle}>
                {t('professions.verification.success_title')}
              </Text>
              <Text style={styles.successDescription}>
                {t('professions.verification.success_description')}
              </Text>
              <TouchableOpacity style={styles.okButton} onPress={handleClose}>
                <Text style={styles.okButtonText}>{t('common.ok')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>
                  {t('professions.verification.title')}
                </Text>
                <TouchableOpacity onPress={handleClose}>
                  <FontAwesome6
                    name='close'
                    size={sizes.iconSize}
                    color={themeController.current?.unactiveTextColor}
                  />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {/* Passport Upload */}
                <TouchableOpacity
                  style={styles.uploadRow}
                  onPress={() => handleOpenPicker('passport')}
                >
                  <View style={styles.uploadRowInfo}>
                    <FontAwesome6
                      name='user'
                      size={sizes.uploadIconSize}
                      color={themeController.current?.textColor}
                    />
                    <Text style={styles.uploadText}>
                      {t('professions.verification.passport_photo')}
                    </Text>
                  </View>
                  <FontAwesome6
                    name='plus'
                    size={sizes.uploadIconSize}
                    color={themeController.current?.textColor}
                  />
                </TouchableOpacity>
                {renderImageGrid(passportPhotos, 'passport')}

                {/* Certificate Upload */}
                <TouchableOpacity
                  style={styles.uploadRow}
                  onPress={() => handleOpenPicker('certificate')}
                >
                  <View style={styles.uploadRowInfo}>
                    <FontAwesome6
                      name='id-card'
                      size={sizes.uploadIconSize}
                      color={themeController.current?.textColor}
                    />
                    <Text style={styles.uploadText}>
                      {t('professions.verification.certificate_photo')}
                    </Text>
                  </View>
                  <FontAwesome6
                    name='plus'
                    size={sizes.uploadIconSize}
                    color={themeController.current?.textColor}
                  />
                </TouchableOpacity>
                {renderImageGrid(certificatePhotos, 'certificate')}
              </ScrollView>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <Text style={styles.submitButtonText}>
                  {t('common.submit')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      <ImagePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onAdd={handleAddImages}
      />
    </Modal>
  );
};

export default AddProfessionModal;
