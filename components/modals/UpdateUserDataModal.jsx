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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import { useWindowInfo } from '../../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { icons } from '../../constants/icons';
import CustomTextInput from '../ui/CustomTextInput';

const UpdateUserDataModal = ({
  visible,
  onClose,
  userData,
  onSave,
  isLoading,
}) => {
  const { t } = useTranslation();
  const { themeController, languageController } = useComponentContext();
  const theme = themeController.current;
  const { height, isLandscape } = useWindowInfo();
  const isRTL = languageController.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [about, setAbout] = useState('');

  useEffect(() => {
    if (visible && userData) {
      setFirstName(userData.name || '');
      setSurname(userData.surname || '');
      setAbout(userData.about || '');
    }
  }, [visible]);

  const handleSave = () => {
    const updatedData = {};
    if (firstName !== userData.name) {
      updatedData.name = firstName;
    }
    if (surname !== userData.surname) {
      updatedData.surname = surname;
    }
    if (about !== userData.about) {
      updatedData.about = about;
    }

    if (Object.keys(updatedData).length > 0) {
      onSave(updatedData);
    } else {
      onClose();
    }
  };

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
      titleBottomMargin: scale(24),
      crossIconSize: scale(24),
      crossIconPosition: scale(12),
      inputHeight: scale(52),
      inputMarginBottom: scale(16),
      inputPaddingHorizontal: scale(16),
      labelSize: scale(12),
      inputSize: scale(16),
      aboutInputHeight: scale(120),
      saveButtonHeight: scale(52),
      labelTopPos: scale(8),
      inputTextTopPadding: scale(23),
      btnTextSize: scale(20),
    };
  }, [height, isWebLandscape]);

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
      zIndex: 1,
    },
    crossIcon: {
      width: sizes.crossIconSize,
      height: sizes.crossIconSize,
      tintColor: theme.textColor,
    },
    inputContainer: {
      width: '100%',
      height: sizes.inputHeight,
      backgroundColor: theme.formInputBackground,
      borderRadius: sizes.borderRadius,
      paddingHorizontal: sizes.inputPaddingHorizontal,
      marginBottom: sizes.inputMarginBottom,
    },
    aboutInputContainer: {
      height: sizes.aboutInputHeight,
    },
    label: {
      fontSize: sizes.labelSize,
      color: theme.formInputLabelColor,
      position: 'absolute',
      top: sizes.labelTopPos,
      left: sizes.inputPaddingHorizontal,
      right: sizes.inputPaddingHorizontal,
      textAlign: isRTL ? 'right' : 'left',
    },
    input: {
      fontSize: sizes.inputSize,
      color: theme.formInputTextColor,
      marginTop: sizes.inputTextTopPadding, // Make space for label
      textAlign: isRTL ? 'right' : 'left',
      width: '100%',
      fontFamily: 'Rubik-Medium',
    },
    saveButton: {
      width: '100%',
      height: sizes.saveButtonHeight,
      backgroundColor: theme.buttonColorPrimaryDefault,
      borderRadius: sizes.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
    },
    saveButtonText: {
      color: theme.buttonTextColorPrimary,
      fontSize: sizes.btnTextSize,
      fontFamily: 'Rubik-Medium',
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
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

          <Text style={styles.title}>{t('my_profile.update_user_data')}</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('my_profile.first_name')}</Text>
            <CustomTextInput
              value={firstName}
              onChangeText={setFirstName}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t('my_profile.surname')}</Text>
            <CustomTextInput
              value={surname}
              onChangeText={setSurname}
              style={styles.input}
            />
          </View>

          <View style={[styles.inputContainer, styles.aboutInputContainer]}>
            <Text style={styles.label}>{t('my_profile.about')}</Text>
            <CustomTextInput
              value={about}
              onChangeText={setAbout}
              style={{ ...styles.input, height: '100%' }}
              multiline
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default UpdateUserDataModal;
