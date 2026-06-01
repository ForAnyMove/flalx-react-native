import React, { useMemo, useState } from 'react';
import {
  Modal,
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
import AutocompletePicker from './ui/AutocompletePicker';
import { useComponentContext } from '../context/globalAppContext';
import { icons } from '../constants/icons';
import { useNotification } from '../src/render';
import CustomTextInput from './ui/CustomTextInput';
import CustomExperiencePicker from './ui/CustomExperiencePicker';
import AddProfessionModal from './AddProfessionModal';
import { useLocalization } from '../src/services/useLocalization';

const RequestProfessionModal = ({
  visible,
  onClose,
  onRequested,
  onSwitchToSystemProfessions,
  showTabs,
  mode, // 'register' — hides switch links, shows info/warning texts
}) => {
  const { themeController, languageController, jobTypesController } =
    useComponentContext();
  const { width, height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;
  const { tField } = useLocalization(languageController.current);

  const [isSubmitted, setIsSubmitted] = useState(false);

  const [type, setType] = useState(null);
  const [subType, setSubType] = useState(null);
  const [experience, setExperience] = useState(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const jobTypesOptions = useMemo(() => {
    const options = {};
    jobTypesController.jobTypesWithSubtypes?.forEach(type => {
      options[type.key] = tField(type, 'name');
    });
    return options;
  }, [jobTypesController.jobTypesWithSubtypes, languageController.current]);

  const jobSubTypesOptions = useMemo(() => {
    setSubType(null);
    const options = {};
    if (type && jobTypesController.jobTypesWithSubtypes) {
      const selectedType = jobTypesController.jobTypesWithSubtypes.find(
        (t) => t.key === type
      );
      if (selectedType?.subtypes) {
        selectedType.subtypes.forEach(subtype => {
          options[subtype.key] = tField(subtype, 'name');
        });
      }
    }
    return options;
  }, [jobTypesController.jobTypesWithSubtypes, type]);

  const requiresVerification = useMemo(() => {
    if (!type || !subType) return false;
    const typeObj = jobTypesController.jobTypesWithSubtypes?.find((t) => t.key === type);
    const subtypeObj = typeObj?.subtypes?.find((st) => st.key === subType);
    if (!typeObj || !subtypeObj) return false;
    return jobTypesController.checkIfVerificationNeeded({
      typeId: typeObj.id,
      subTypeId: subtypeObj.id,
    });
  }, [type, subType, jobTypesController.jobTypesWithSubtypes]);

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
      didntFindTextMarginBottom: scale(16),
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
      infoTextSize: isWebLandscape ? scale(12) : scale(12),
      infoTextMarginTop: scale(12),
      verificationWarningMarginBottom: scale(8),
    };
  }, [height, width, isWebLandscape]);

  const handleSend = () => {
    if (requiresVerification) {
      setIsAddModalVisible(true);
      return;
    }
    const typeObj = jobTypesController.jobTypesWithSubtypes?.find((t) => t.key === type);
    const subtypeObj = typeObj?.subtypes?.find((st) => st.key === subType);
    onRequested({
      job_type_id: typeObj?.id ?? null,
      job_subtype_id: subtypeObj?.id ?? null,
      passport_photo_urls: null,
      certificate_photo_urls: null,
      experience,
    });
  };

  const handleDocumentsProvided = (docs) => {
    const typeObj = jobTypesController.jobTypesWithSubtypes?.find((t) => t.key === type);
    const subtypeObj = typeObj?.subtypes?.find((st) => st.key === subType);
    onRequested({
      job_type_id: typeObj?.id ?? null,
      job_subtype_id: subtypeObj?.id ?? null,
      passport_photo_urls: docs.passport_photos,
      certificate_photo_urls: docs.certificate_photos,
      experience,
    });
  };

  const handleAddModalClose = () => {
    setIsAddModalVisible(false);
  };

  const handleSwitch = () => {
    onSwitchToSystemProfessions();
    if (showTabs) {
      const newIndex = orderedTabs.indexOf('system_professions');
      handleTabPress(newIndex);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after a short delay to allow closing animation to finish
    setTimeout(() => {
      setIsSubmitted(false);
      setType(null);
      setSubType(null);
      setExperience(null);
      setIsAddModalVisible(false);
    }, 300);
  };

  const handleSelect = (type, subtype) => {
    setType(type);
    setSubType(subtype);
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
    didntFindText: {
      fontSize: sizes.descriptionSize,
      color: themeController.current?.formInputLabelColor,
      marginBottom: sizes.didntFindTextMarginBottom,
      lineHeight: sizes.descriptionSize * 1.25,
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
    <>
    <Modal visible={visible && !isAddModalVisible} transparent={true} animationType='fade'>
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
                  {t('professions.request_modal.success_title')}
                </Text>
                <Text style={styles.successDescription}>
                  {t('professions.request_modal.success_description')}
                </Text>
                <TouchableOpacity style={styles.okButton} onPress={handleClose}>
                  <Text style={styles.okButtonText}>
                    {t('professions.request_modal.ok_button')}
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
                  {t('professions.request_modal.title')}
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

              <AutocompletePicker
                label={t('professions.request_modal.profession_label')}
                placeholder={t(
                  'professions.request_modal.profession_placeholder'
                )}
                options={jobTypesOptions}
                onValueChange={setType}
                setValue={setType}
                selectedValue={type}
                value={type}
                isRTL={isRTL}
                containerStyle={{
                  marginBottom: sizes.inputGap,
                  width: sizes.inputWidth,
                  zIndex: 10,
                }}
                arrowIcon={true}
              />
              {!mode && (
                <View
                  style={{
                    width: sizes.inputWidth,
                    alignItems: isRTL ? 'flex-end' : 'flex-start',
                  }}
                >
                  <TouchableOpacity onPress={handleSwitch}>
                    <Text
                      style={[
                        styles.didntFindText,
                        {
                          textDecorationLine: 'underline',
                        },
                      ]}
                    >
                      {t('professions.request_modal.profession_not_found')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              <AutocompletePicker
                label={t('professions.request_modal.subtype_label')}
                placeholder={t('professions.request_modal.subtype_placeholder')}
                options={jobSubTypesOptions}
                onValueChange={setSubType}
                setValue={setSubType}
                selectedValue={subType}
                value={subType}
                isRTL={isRTL}
                containerStyle={{
                  marginBottom: sizes.inputGap,
                  width: sizes.inputWidth,
                  zIndex: 5,
                }}
                arrowIcon={true}
              />
              {!mode ? (
                <View
                  style={{
                    width: sizes.inputWidth,
                    alignItems: isRTL ? 'flex-end' : 'flex-start',
                  }}
                >
                  <TouchableOpacity onPress={handleSwitch}>
                    <Text
                      style={[
                        styles.didntFindText,
                        {
                          textDecorationLine: 'underline',
                        },
                      ]}
                    >
                      {t('professions.request_modal.subtype_not_found')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ width: sizes.inputWidth, marginTop: sizes.infoTextMarginTop }}>
                  {requiresVerification && (
                    <Text
                      style={{
                        fontSize: sizes.infoTextSize,
                        color: themeController.current?.warningTextColor,
                        textAlign: 'center',
                        marginBottom: sizes.verificationWarningMarginBottom,
                        lineHeight: sizes.infoTextSize * 1.4,
                        fontFamily: 'Rubik-SemiBold',
                      }}
                    >
                      {t('professions.request_modal_verification_warning')}
                    </Text>
                  )}
                  <Text
                    style={{
                      fontSize: sizes.infoTextSize,
                      color: themeController.current?.formInputLabelColor,
                      textAlign: 'center',
                      lineHeight: sizes.infoTextSize * 1.4,
                    }}
                  >
                    {t('professions.request_modal_not_found_info')}
                  </Text>
                </View>
              )}

              {requiresVerification && (
                <CustomExperiencePicker
                  label={t('register.experience_label')}
                  selectedValue={experience}
                  onValueChange={setExperience}
                  isRTL={isRTL}
                  containerStyle={{
                    width: sizes.inputWidth,
                  }}
                  bottomDropdown={false}
                />
              )}

              <TouchableOpacity
                disabled={!type || !subType || type === '' || subType === ''}
                style={[
                  styles.sendButton,
                  (!type || !subType || type === '' || subType === '') && {
                    opacity: 0.5,
                  },
                ]}
                onPress={handleSend}
              >
                <Text style={styles.sendButtonText}>
                  {requiresVerification ? t('common.next') : t('professions.request_modal.send_button')}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
    <AddProfessionModal
      visible={visible && isAddModalVisible}
      onClose={handleAddModalClose}
      onSubmit={handleDocumentsProvided}
    />
    </>
  );
};

export default RequestProfessionModal;
