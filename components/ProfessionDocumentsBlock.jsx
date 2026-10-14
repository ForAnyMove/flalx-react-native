import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Image,
  ScrollView,
} from 'react-native';
import { useWindowInfo } from '../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import ImagePickerModal from './ui/ImagePickerModal';
import CustomExperiencePicker from './ui/CustomExperiencePicker';
import { icons } from '../constants/icons';
import { uploadImageAsset } from '../src/files/uploadFile';
import { logError } from '../utils/log_util';
import { useNotification } from '../src/render';

// Optional "Documents and experience" block: passport / certificate photos + experience.
// Controlled by the parent via `value` = { passportPhotos, certificatePhotos, experience }.
const ProfessionDocumentsBlock = ({ value, onChange, width }) => {
  const { themeController, languageController, setAppLoading } = useComponentContext();
  const { height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const { t } = useTranslation();
  const { showError } = useNotification();
  const isRTL = languageController.isRTL;

  const [pickerVisible, setPickerVisible] = useState(false);
  const [activePicker, setActivePicker] = useState(null); // 'passport' or 'certificate'

  const { passportPhotos, certificatePhotos, experience } = value;

  const sizes = useMemo(() => {
    const scale = isWebLandscape ? scaleByHeight : scaleByHeightMobile;
    return {
      borderRadius: scale(8),
      titleSize: scale(16),
      hintSize: scale(12),
      uploadRowHeight: scale(56),
      uploadRowPaddingH: scale(16),
      uploadRowMarginBottom: scale(12),
      uploadIconSize: scale(32),
      uploadTextSize: scale(14),
      textMarginH: scale(10),
      imageGridGap: scale(8),
      imageSize: scale(80),
      removeIconSize: scale(16),
      crossSpace: scale(8),
      blockMarginBottom: scale(8),
      maxHeight: height * 0.3,
    };
  }, [height, isWebLandscape]);

  const handleOpenPicker = (type) => {
    setActivePicker(type);
    setPickerVisible(true);
  };

  const handleAddImages = async (uris) => {
    setAppLoading(true);
    try {
      const uploadedUrls = await Promise.all(
        uris.map(async (uri) => {
          const res = await uploadImageAsset(uri, { purpose: 'document', fileName: activePicker || 'document' });
          return res?.url || null;
        })
      );
      const urls = uploadedUrls.filter(Boolean);
      if (activePicker === 'passport') {
        onChange({ ...value, passportPhotos: [...passportPhotos, ...urls] });
      } else if (activePicker === 'certificate') {
        onChange({ ...value, certificatePhotos: [...certificatePhotos, ...urls] });
      }
      setPickerVisible(false);
      setActivePicker(null);
    } catch (e) {
      logError('Ошибка загрузки изображений:', e);
      showError(e?.message || t('errors.unexpected_error'));
    } finally {
      setAppLoading(false);
    }
  };

  const handleRemoveImage = (index, type) => {
    if (type === 'passport') {
      onChange({ ...value, passportPhotos: passportPhotos.filter((_, i) => i !== index) });
    } else {
      onChange({ ...value, certificatePhotos: certificatePhotos.filter((_, i) => i !== index) });
    }
  };

  const styles = StyleSheet.create({
    container: {
      width,
      marginBottom: sizes.blockMarginBottom,
    },
    title: {
      fontSize: sizes.titleSize,
      fontFamily: 'Rubik-SemiBold',
      color: themeController.current?.textColor,
      textAlign: isRTL ? 'right' : 'left',
      marginBottom: sizes.crossSpace / 2,
    },
    hint: {
      fontSize: sizes.hintSize,
      color: themeController.current?.formInputLabelColor,
      textAlign: isRTL ? 'right' : 'left',
      lineHeight: sizes.hintSize * 1.4,
      marginBottom: sizes.uploadRowMarginBottom,
    },
    uploadRow: {
      height: sizes.uploadRowHeight,
      width: '100%',
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
      gap: sizes.imageGridGap,
      marginBottom: sizes.uploadRowMarginBottom,
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
  });

  const renderImageGrid = (photos, type) => (
    <ScrollView contentContainerStyle={styles.imageGrid} horizontal={true}>
      {(isRTL ? photos.map((photo, i) => ({ photo, i })).reverse() : photos.map((photo, i) => ({ photo, i }))).map(({ photo, i: index }) => (
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

  const renderUploadRow = (type, icon, label) => (
    <TouchableOpacity style={styles.uploadRow} onPress={() => handleOpenPicker(type)}>
      <View style={styles.uploadRowInfo}>
        <Image
          source={icon}
          style={{ width: sizes.uploadIconSize, height: sizes.uploadIconSize }}
        />
        <Text style={styles.uploadText}>{label}</Text>
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
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('professions.register_modal.documents_title')}</Text>
      <Text style={styles.hint}>{t('professions.register_modal.documents_hint')}</Text>
      <ScrollView style={{ maxHeight: sizes.maxHeight }}>
        {renderUploadRow('passport', icons.passport, t('professions.verification.passport_photo'))}
        {passportPhotos.length > 0 && renderImageGrid(passportPhotos, 'passport')}
        {renderUploadRow('certificate', icons.id, t('professions.verification.certificate_photo'))}
        {certificatePhotos.length > 0 && renderImageGrid(certificatePhotos, 'certificate')}
        <CustomExperiencePicker
          label={t('register.experience_label')}
          selectedValue={experience}
          onValueChange={(exp) => onChange({ ...value, experience: exp })}
          isRTL={isRTL}
          bottomDropdown={false}
        />
      </ScrollView>
      <ImagePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onAdd={handleAddImages}
        multiple
      />
    </View>
  );
};

export default ProfessionDocumentsBlock;
