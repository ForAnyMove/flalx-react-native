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
import { useComponentContext } from '../context/globalAppContext';
import ImagePickerModal from './ui/ImagePickerModal';
import { icons } from '../constants/icons';
import { uploadImageToSupabase } from '../utils/supabase/uploadImageToSupabase';

const AddProfessionModal = ({ visible, onClose }) => {
  const { themeController, languageController, user } = useComponentContext();
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
      modalWidth: isWebLandscape ? scale(450) : width,
      modalMaxHeight: isWebLandscape ? height * 0.8 : height,
      borderRadius: scale(8),
      padding: scale(24),
      paddingVertical: scale(40),
      paddingHorizontal: scale(60),
      headerBottomMargin: scale(32),
      titleSize: scale(24),
      descriptionSize: scale(18),
      crossSpace: scale(8),
      iconSize: scale(24),
      buttonHeight: scale(62),
      buttonFontSize: scale(16),
      uploadRowHeight: scale(64),
      uploadRowWidth: isWebLandscape ? '100%' : '100%',
      uploadRowPaddingH: scale(16),
      uploadRowMarginBottom: scale(16),
      uploadIconSize: scale(40),
      uploadTextSize: scale(16),
      imageGridGap: scale(8),
      imageSize: scale(100),
      textMarginH: scale(10),
      removeIconSize: scale(16),
      successIconContainerSize: scale(112),
      successIconSize: scale(112),
      successTitleMarginTop: scale(24),
      successDescriptionMarginTop: scale(8),
      successButtonMarginTop: scale(32),
    };
  }, [height, width, isWebLandscape]);

  const handleOpenPicker = (type) => {
    setActivePicker(type);
    setPickerVisible(true);
  };

  // const handleAddImages = (images) => {
  //   if (activePicker === 'passport') {
  //     setPassportPhotos((prev) => [...prev, ...images]);
  //   } else if (activePicker === 'certificate') {
  //     setCertificatePhotos((prev) => [...prev, ...images]);
  //   }
  //   setPickerVisible(false);
  //   setActivePicker(null);
  // };

  const handleAddImages = async (uris) => {
    try {
      const uploadedUrls = await Promise.all(
        uris.map(async (uri) => {
          // если хочешь лимит размера для локальных файлов:
          // if (uri.startsWith('file://')) await checkFileSize(uri, 5);

          const res = await uploadImageToSupabase(uri, user.current.id, {
            bucket: 'jobs',
            isAvatar: false,
          });
          return res?.publicUrl || null;
        })
      );

      if (activePicker === 'passport') {
        setPassportPhotos((prev) => [...prev, ...uploadedUrls.filter(Boolean)]);
      } else if (activePicker === 'certificate') {
        setCertificatePhotos((prev) => [
          ...prev,
          ...uploadedUrls.filter(Boolean),
        ]);
      }
      setPickerVisible(false);
      setActivePicker(null);
    } catch (e) {
      console.error('Ошибка загрузки изображений:', e);
    }
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
      paddingVertical: sizes.paddingVertical,
      paddingHorizontal: sizes.paddingHorizontal,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 20,
      alignItems: 'center',
      position: 'relative',
      boxSizing: 'border-box',
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
    crossIcon: {
      width: sizes.iconSize,
      height: sizes.iconSize,
      tintColor: themeController.current?.textColor,
    },
    submitButton: {
      height: sizes.buttonHeight,
      width: '100%',
      backgroundColor: themeController.current?.buttonColorPrimaryDefault,
      borderRadius: sizes.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: sizes.uploadRowMarginBottom,
    },
    submitButtonText: {
      color: themeController.current?.buttonTextColorPrimary,
      fontSize: sizes.buttonFontSize,
    },
    uploadRow: {
      height: sizes.uploadRowHeight,
      width: sizes.uploadRowWidth,
      backgroundColor: themeController.current?.formInputBackground,
      borderRadius: sizes.borderRadius,
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      paddingHorizontal: sizes.uploadRowPaddingH,
      justifyContent: 'space-between',
      marginBottom: sizes.uploadRowMarginBottom,
    },
    uploadRowInfo: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
    },
    uploadText: {
      fontSize: sizes.uploadTextSize,
      color: themeController.current?.textColor,
      marginHorizontal: sizes.textMarginH,
    },
    imageGrid: {
      flexDirection: 'row',
      // flexWrap: 'wrap',
      gap: sizes.imageGridGap,
      marginBottom: sizes.padding,
    },
    imageContainer: {
      position: 'relative',
      backgroundColor: themeController.current?.formInputBackground,
      borderRadius: sizes.borderRadius,
    },
    image: {
      width: sizes.imageSize,
      height: sizes.imageSize,
      borderRadius: sizes.borderRadius,
    },
    removeButton: {
      position: 'absolute',
      top: sizes.crossSpace / 2,
      right: sizes.crossSpace / 2,
      backgroundColor: themeController.current?.backgroundColor + '80',
      borderRadius: sizes.removeIconSize,
      padding: sizes.crossSpace / 4,
    },
    // Success view styles
    successContainer: {
      alignItems: 'center',
    },
    successIconContainer: {
      width: sizes.successIconContainerSize,
      height: sizes.successIconContainerSize,
      borderRadius: sizes.successIconContainerSize / 2,
      backgroundColor:
        themeController.current?.buttonColorPrimaryDefault + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    successTitle: {
      fontSize: sizes.titleSize,
      fontWeight: 'bold',
      color: themeController.current?.primaryColor,
      marginTop: sizes.successTitleMarginTop,
      textAlign: 'center',
    },
    successDescription: {
      fontSize: sizes.descriptionSize,
      color: themeController.current?.unactiveTextColor,
      marginTop: sizes.successDescriptionMarginTop,
      textAlign: 'center',
      lineHeight: sizes.descriptionSize * 1.25,
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
  console.log(passportPhotos);

  const renderImageGrid = (photos, type) => (
    <ScrollView contentContainerStyle={styles.imageGrid} horizontal={true}>
      {photos.map((photo, index) => (
        <View key={index} style={styles.imageContainer}>
          <Image source={{ uri: photo }} style={styles.image} />
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveImage(index, type)}
          >
            <Image
              source={icons.cross}
              style={{
                width: sizes.removeIconSize,
                height: sizes.removeIconSize,
                tintColor: themeController.current?.textColor,
              }}
            />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  return (
    <Modal visible={visible} transparent={true} animationType='fade'>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {isSubmitted ? (
            <>
              <View style={styles.successContainer}>
                <View style={styles.successIconContainer}>
                  <Image
                    source={icons.checkDefault}
                    style={{
                      width: sizes.successIconSize,
                      height: sizes.successIconSize,
                    }}
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
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  position: 'absolute',
                  top: sizes.crossSpace,
                  right: sizes.crossSpace,
                }}
              >
                <Image source={icons.cross} style={styles.crossIcon} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>
                  {t('professions.verification.title')}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  position: 'absolute',
                  top: sizes.crossSpace,
                  right: sizes.crossSpace,
                }}
              >
                <Image source={icons.cross} style={styles.crossIcon} />
              </TouchableOpacity>
              <ScrollView style={{ width: '100%' }}>
                {/* Passport Upload */}
                <TouchableOpacity
                  style={styles.uploadRow}
                  onPress={() => handleOpenPicker('passport')}
                >
                  <View style={styles.uploadRowInfo}>
                    <Image
                      source={icons.passport}
                      style={{
                        width: sizes.uploadIconSize,
                        height: sizes.uploadIconSize,
                      }}
                    />
                    <Text style={styles.uploadText}>
                      {t('professions.verification.passport_photo')}
                    </Text>
                  </View>
                  <Image
                    source={icons.plus}
                    style={{
                      width: sizes.uploadIconSize,
                      height: sizes.uploadIconSize,
                      tintColor: themeController.current?.primaryColor,
                    }}
                  />
                </TouchableOpacity>
                {passportPhotos.length > 0 &&
                  renderImageGrid(passportPhotos, 'passport')}

                {/* Certificate Upload */}
                <TouchableOpacity
                  style={styles.uploadRow}
                  onPress={() => handleOpenPicker('certificate')}
                >
                  <View style={styles.uploadRowInfo}>
                    <Image
                      source={icons.id}
                      style={{
                        width: sizes.uploadIconSize,
                        height: sizes.uploadIconSize,
                      }}
                    />
                    <Text style={styles.uploadText}>
                      {t('professions.verification.certificate_photo')}
                    </Text>
                  </View>
                  <Image
                    source={icons.plus}
                    style={{
                      width: sizes.uploadIconSize,
                      height: sizes.uploadIconSize,
                      tintColor: themeController.current?.primaryColor,
                    }}
                  />
                </TouchableOpacity>
                {certificatePhotos.length > 0 &&
                  renderImageGrid(certificatePhotos, 'certificate')}
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
