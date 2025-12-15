import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  TextInput,
} from 'react-native';
import { useWindowInfo } from '../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { useTranslation } from 'react-i18next';
import { FontAwesome6 } from '@expo/vector-icons';
import AutocompletePicker from './ui/AutocompletePicker';
import { JOB_TYPES } from '../constants/jobTypes';
import { useComponentContext } from '../context/globalAppContext';

const RegisterProfessionModal = ({ visible, onClose }) => {
  const { themeController, languageController } = useComponentContext();
  const { height, width } = useWindowDimensions();
  const { isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

  const [profession, setProfession] = useState(null);
  const [subtype, setSubtype] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      modalWidth: isWebLandscape ? width * 0.35 : width * 0.9,
      modalMaxHeight: isWebLandscape ? height * 0.7 : height * 0.8,
      borderRadius: scale(12),
      padding: scale(24),
      headerBottomMargin: scale(16),
      titleSize: scale(20),
      iconSize: scale(18),
      descriptionSize: scale(14),
      descriptionMarginBottom: scale(24),
      inputHeight: scale(56),
      inputGap: scale(16),
      buttonHeight: scale(50),
      buttonFontSize: scale(16),
      successIconContainerSize: scale(72),
      successIconSize: scale(36),
      successTitleMarginTop: scale(24),
      successDescriptionMarginTop: scale(8),
      successButtonMarginTop: scale(32),
    };
  }, [height, width, isWebLandscape]);

  const handleSend = async () => {
    console.log('Registering profession:', { profession, subtype });
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitted(true);
  };

  const handleClose = () => {
    onClose();
    // Reset state after a short delay to allow closing animation to finish
    setTimeout(() => {
      setIsSubmitted(false);
      setProfession(null);
      setSubtype('');
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
    description: {
      fontSize: sizes.descriptionSize,
      color: themeController.current?.unactiveTextColor,
      marginBottom: sizes.descriptionMarginBottom,
      lineHeight: sizes.descriptionSize * 1.5,
      textAlign: isRTL ? 'right' : 'left',
    },
    inputContainer: {
      height: sizes.inputHeight,
      backgroundColor: themeController.current?.formInputBackground,
      borderRadius: sizes.borderRadius,
      justifyContent: 'center',
      paddingHorizontal: sizes.padding / 2,
      marginBottom: sizes.inputGap,
    },
    textInput: {
      width: '100%',
      height: '100%',
      color: themeController.current?.textColor,
      fontSize: sizes.descriptionSize,
      textAlign: isRTL ? 'right' : 'left',
    },
    label: {
      fontSize: sizes.descriptionSize * 0.8,
      color: themeController.current?.unactiveTextColor,
      position: 'absolute',
      top: sizes.inputHeight * 0.15,
      left: sizes.padding / 2,
      right: sizes.padding / 2,
      textAlign: isRTL ? 'right' : 'left',
    },
    sendButton: {
      height: sizes.buttonHeight,
      backgroundColor: themeController.current?.buttonColorPrimaryDefault,
      borderRadius: sizes.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: sizes.inputGap,
    },
    sendButtonText: {
      color: themeController.current?.buttonTextColorPrimary,
      fontSize: sizes.buttonFontSize,
      fontWeight: 'bold',
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
      backgroundColor:
        themeController.current?.buttonColorPrimaryDefault + '20', // Light blue background
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
                {t('professions.register_modal.success_title')}
              </Text>
              <Text style={styles.successDescription}>
                {t('professions.register_modal.success_description')}
              </Text>
              <TouchableOpacity style={styles.okButton} onPress={handleClose}>
                <Text style={styles.okButtonText}>
                  {t('professions.register_modal.ok_button')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>
                  {t('professions.register_modal.title')}
                </Text>
                <TouchableOpacity onPress={handleClose}>
                  <FontAwesome6
                    name='close'
                    size={sizes.iconSize}
                    color={themeController.current?.unactiveTextColor}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.description}>
                {t('professions.register_modal.description')}
              </Text>

              <AutocompletePicker
                label={t('professions.register_modal.profession_label')}
                placeholder={t(
                  'professions.register_modal.profession_placeholder'
                )}
                options={JOB_TYPES}
                onValueChange={setProfession}
                selectedValue={profession}
                isRTL={isRTL}
                containerStyle={{ marginBottom: sizes.inputGap }}
              />

              <View style={styles.inputContainer}>
                <Text style={styles.label}>
                  {t('professions.register_modal.subtype_label')}
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={t(
                    'professions.register_modal.subtype_placeholder'
                  )}
                  placeholderTextColor={
                    themeController.current?.formInputPlaceholderColor
                  }
                  value={subtype}
                  onChangeText={setSubtype}
                />
              </View>

              <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                <Text style={styles.sendButtonText}>
                  {t('professions.register_modal.send_button')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default RegisterProfessionModal;
