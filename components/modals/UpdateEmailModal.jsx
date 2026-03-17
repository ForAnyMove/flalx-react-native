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

const UpdateEmailModal = ({
  visible,
  onClose,
  onSave,
  currentEmail,
  isLoading,
}) => {
  const { t } = useTranslation();
  const { themeController, languageController, session } = useComponentContext();
  const theme = themeController.current;
  const { height, isLandscape } = useWindowInfo();
  const isRTL = languageController.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [step, setStep] = useState('enterEmail'); // 'enterEmail' or 'success'
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [internalLoading, setInternalLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep('enterEmail');
      setEmail(currentEmail || '');
      setError(null);
      setInternalLoading(false);
    }
  }, [visible, currentEmail]);

  const handleSendLink = async () => {
    if (email === currentEmail) {
      setError(t('errors.email_not_changed'));
      return;
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t('errors.invalid_email'));
      return;
    }

    setError(null);
    setInternalLoading(true);
    const result = await session.user.updateEmail(email);
    setInternalLoading(false);

    if (result.success) {
      setStep('success');
      onSave(email); // Notify parent that the process was initiated
    } else {
      setError(result.error || t('errors.unexpected_error'));
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
      saveButtonHeight: scale(52),
      errorTextSize: scale(14),
      successIconSize: scale(64),
      successTextSize: scale(16),
      successTextMarginTop: scale(16),
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
      textAlign: 'center',
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
      justifyContent: 'center',
    },
    label: {
      fontSize: sizes.labelSize,
      color: theme.formInputLabelColor,
      position: 'absolute',
      top: 8,
      left: sizes.inputPaddingHorizontal,
      right: sizes.inputPaddingHorizontal,
      textAlign: isRTL ? 'right' : 'left',
    },
    input: {
      fontSize: sizes.inputSize,
      color: theme.formInputTextColor,
      paddingTop: 15,
      textAlign: isRTL ? 'right' : 'left',
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
      fontSize: 18,
      fontWeight: 'bold',
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
    errorText: {
      color: theme.error,
      fontSize: sizes.errorTextSize,
      marginBottom: 10,
      alignSelf: 'flex-start',
    },
    successContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    successIcon: {
      width: sizes.successIconSize,
      height: sizes.successIconSize,
      tintColor: theme.primaryColor,
    },
    successText: {
      fontSize: sizes.successTextSize,
      color: theme.textColor,
      textAlign: 'center',
      marginTop: sizes.successTextMarginTop,
      fontFamily: 'Rubik-Regular',
    },
  });

  const renderEnterEmail = () => (
    <>
      <Text style={styles.title}>{t('my_profile.change_email')}</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('my_profile.email')}</Text>
        <CustomTextInput
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          keyboardType='email-address'
          autoCapitalize='none'
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <TouchableOpacity style={styles.saveButton} onPress={handleSendLink}>
        <Text style={styles.saveButtonText}>{t('common.save')}</Text>
      </TouchableOpacity>
    </>
  );

  const renderSuccess = () => (
    <View style={styles.successContainer}>
      <Image source={icons.checkDefault} style={styles.successIcon} />
      <Text style={styles.successText}>
        {t('my_profile.email_change_sent', { email })}
      </Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent={true} animationType='fade'>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {(isLoading || internalLoading) && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size='large' color={theme.primaryColor} />
            </View>
          )}
          <TouchableOpacity style={styles.crossButton} onPress={onClose}>
            <Image source={icons.cross} style={styles.crossIcon} />
          </TouchableOpacity>

          {step === 'enterEmail' ? renderEnterEmail() : renderSuccess()}
        </View>
      </View>
    </Modal>
  );
};

export default UpdateEmailModal;
