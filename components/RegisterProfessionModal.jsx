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
  Image,
} from 'react-native';
import { useWindowInfo } from '../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { useTranslation } from 'react-i18next';
import AutocompletePicker from './ui/AutocompletePicker';
import { useComponentContext } from '../context/globalAppContext';
import { icons } from '../constants/icons';
import { useNotification } from '../src/render';

const RegisterProfessionModal = ({ visible, onClose, onRequestDone }) => {
  const { themeController, languageController, jobTypesController, setAppLoading } = useComponentContext();
  const { showWarning, showError } = useNotification();
  const { height, width } = useWindowDimensions();
  const { isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

  const [type, setType] = useState(null);
  const [subtype, setSubtype] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const jobTypesOptions = useMemo(() => {
    const options = {};
    jobTypesController.jobTypesWithSubtypes?.forEach(type => {
      options[type.key] = type.name;
    });
    return options;
  }, [jobTypesController.jobTypesWithSubtypes]);

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      modalWidth: isWebLandscape ? scale(450) : width*0.9,
      modalMaxHeight: isWebLandscape ? height * 0.8 : height,
      borderRadius: scale(8),
      padding: scale(24),
      paddingVertical: scale(40),
      paddingHorizontal: scale(60),
      headerBottomMargin: scale(16),
      titleSize: isWebLandscape ? scale(24) : scale(20),
      iconSize: scale(24),
      crossSpace: scale(8),
      descriptionSize: isWebLandscape ? scale(14) : scale(13),
      successDescriptionSize: scale(18),
      descriptionMarginBottom: scale(32),
      inputHeight: scale(64),
      inputWidth: isWebLandscape ? scale(330) : '100%',
      inputGap: scale(16),
      buttonHeight: scale(62),
      buttonWidth: isWebLandscape ? scale(330) : '100%',
      buttonFontSize: scale(20),
      successIconContainerSize: scale(112),
      successIconSize: scale(112),
      successTitleMarginTop: scale(24),
      successDescriptionMarginTop: scale(8),
      successButtonMarginTop: scale(32),
    };
  }, [height, width, isWebLandscape]);

  const validateForm = () => {
    return type !== null && type !== '' && subtype.trim() !== '';
  }

  const handleSend = async () => {
    if (!validateForm()) {
      showWarning('Invalid Input', [
        {
          title: 'OK',
          backgroundColor: '#3B82F6',
          textColor: '#FFFFFF'
        },
      ]);
      return;
    }

    setAppLoading(true);

    jobTypesController.userToSystemRequest.makeRequest({
      requested_type_name: jobTypesOptions[type] || type,
      requested_subtype_name: subtype.trim(),
      selected_type_id: jobTypesOptions[type] ? jobTypesController.jobTypesWithSubtypes.find(t => t.key === type)?.id : null,
    }).then((data) => {
      setIsSubmitted(true);
      onRequestDone && onRequestDone(data);
    }).catch((error) => {
      showError(t('professions.errors.failed_to_send_request', { error }), [
        {
          title: 'OK',
          backgroundColor: '#EF4444',
          textColor: '#FFFFFF'
        },
      ]);
    }).finally(() => {
      setAppLoading(false);
    });
  };

  const handleClose = () => {
    onClose();
    // Reset state after a short delay to allow closing animation to finish
    setTimeout(() => {
      setIsSubmitted(false);
      setType(null);
      setSubtype('');
    }, 300);
  };

  const applySelectedType = (typeKey) => {
    setType(typeKey);
  }

  const applySelectedSubtype = (subtypeText) => {
    setSubtype(subtypeText);
  }

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
    description: {
      fontSize: sizes.descriptionSize,
      color: themeController.current?.unactiveTextColor,
      marginBottom: sizes.descriptionMarginBottom,
      lineHeight: sizes.descriptionSize * 1.25,
      textAlign: 'center',
    },
    inputContainer: {
      height: sizes.inputHeight,
      width: sizes.inputWidth,
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
      width: sizes.buttonWidth,
      backgroundColor: themeController.current?.buttonColorPrimaryDefault,
      borderRadius: sizes.borderRadius,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: sizes.inputGap,
    },
    sendButtonText: {
      color: themeController.current?.buttonTextColorPrimary,
      fontSize: sizes.buttonFontSize,
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
      color: themeController.current?.primaryColor,
      marginTop: sizes.successTitleMarginTop,
      textAlign: 'center',
    },
    successDescription: {
      fontSize: sizes.successDescriptionSize,
      color: themeController.current?.unactiveTextColor,
      marginTop: sizes.successDescriptionMarginTop,
      textAlign: 'center',
      lineHeight: sizes.successDescriptionSize * 1.5,
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
                  {t('professions.register_modal.title')}
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

              <Text style={styles.description}>
                {t('professions.register_modal.description')}
              </Text>

              <AutocompletePicker
                label={t('professions.register_modal.profession_label')}
                placeholder={t(
                  'professions.register_modal.profession_placeholder'
                )}
                setValue={applySelectedType}
                options={jobTypesOptions}
                onValueChange={applySelectedType}
                selectedValue={type}
                isRTL={isRTL}
                containerStyle={{
                  marginBottom: sizes.inputGap,
                  width: sizes.inputWidth,
                }}
                arrowIcon={true}
                allowCustomText={true}
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
                  onChangeText={applySelectedSubtype}
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
