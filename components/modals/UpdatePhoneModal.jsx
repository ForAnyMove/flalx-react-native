import React, { useState, useMemo, useEffect, useRef } from 'react';
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

const OTP_LENGTH = 6;

const UpdatePhoneModal = ({
  visible,
  onClose,
  onSave,
  currentPhone,
  isLoading,
}) => {
  const { t } = useTranslation();
  const { themeController, languageController, session } = useComponentContext();
  const theme = themeController.current;
  const { height, isLandscape } = useWindowInfo();
  const isRTL = languageController.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [step, setStep] = useState('enterPhone'); // 'enterPhone' or 'enterCode'
  const [phone, setPhone] = useState(currentPhone);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    if (visible) {
      setStep('enterPhone');
      setPhone(currentPhone);
      setOtp(Array(OTP_LENGTH).fill(''));
      setError(null);
      setInternalLoading(false);
    }
  }, [visible, currentPhone]);

  const handleSendCode = async () => {
    if (phone === currentPhone) {
      setError(t('errors.phone_not_changed'));
      return;
    }
    setError(null);
    setInternalLoading(true);
    const result = await session.rebindMfaPhoneNumber(phone);
    setInternalLoading(false);
    if (result.success) {
      setStep('enterCode');
    } else {
      setError(result.error || t('errors.unexpected_error'));
    }
  };

  const handleVerifyCode = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setError(t('errors.invalid_otp'));
      return;
    }
    setError(null);
    setInternalLoading(true);
    const result = await session.verifyRebindMfaPhoneNumber(phone, code);
    setInternalLoading(false);
    if (result.success) {
      onSave(phone); // Let parent know about the success
    } else {
      setError(result.error || t('errors.unexpected_error'));
    }
  };

  const onChangeOtpCell = (text, idx) => {
    const newOtp = [...otp];
    newOtp[idx] = text;
    setOtp(newOtp);

    if (text && idx < OTP_LENGTH - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const onKeyPressOtp = (e, idx) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
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
      otpRowMarginBottom: scale(20),
      otpCellSize: isWebLandscape ? scale(48) : scale(44),
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
    otpRow: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginBottom: sizes.otpRowMarginBottom,
    },
    otpCell: {
      width: sizes.otpCellSize,
      height: sizes.otpCellSize,
      borderWidth: 1,
      borderColor: theme.primaryColor,
      borderRadius: sizes.borderRadius,
      textAlign: 'center',
      fontSize: sizes.inputSize,
      color: theme.textColor,
    },
  });

  const renderEnterPhone = () => (
    <>
      <Text style={styles.title}>{t('my_profile.change_phone')}</Text>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('my_profile.phone')}</Text>
        <CustomTextInput
          value={phone}
          onChangeText={setPhone}
          style={styles.input}
          keyboardType='phone-pad'
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <TouchableOpacity style={styles.saveButton} onPress={handleSendCode}>
        <Text style={styles.saveButtonText}>{t('common.send_code')}</Text>
      </TouchableOpacity>
    </>
  );

  const renderEnterCode = () => (
    <>
      <Text style={styles.title}>{t('my_profile.verify_new_phone')}</Text>
      <View style={styles.otpRow}>
        {otp.map((digit, index) => (
          <CustomTextInput
            key={index}
            ref={(ref) => (inputsRef.current[index] = ref)}
            style={styles.otpCell}
            keyboardType='number-pad'
            maxLength={1}
            value={digit}
            onChangeText={(text) => onChangeOtpCell(text, index)}
            onKeyPress={(e) => onKeyPressOtp(e, index)}
          />
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <TouchableOpacity style={styles.saveButton} onPress={handleVerifyCode}>
        <Text style={styles.saveButtonText}>{t('common.verify')}</Text>
      </TouchableOpacity>
    </>
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

          {step === 'enterPhone' ? renderEnterPhone() : renderEnterCode()}
        </View>
      </View>
    </Modal>
  );
};

export default UpdatePhoneModal;
