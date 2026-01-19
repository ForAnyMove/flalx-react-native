import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  I18nManager,
  Animated,
  ActivityIndicator,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { icons } from '../../constants/icons';

function PrimaryOutlineButton({
  title,
  onPress,
  disabled,
  theme,
  isLandscape,
  height,
  containerStyle = {},
}) {
    const buttonDynamicStyles = useMemo(
    () => ({
      outlineBtn: {
        height: isLandscape && Platform.OS === 'web' ? scaleByHeight(62, height) : scaleByHeightMobile(62, height),
        width: isLandscape && Platform.OS === 'web' ? scaleByHeight(330, height) : '100%',
        marginTop: isLandscape && Platform.OS === 'web' ? scaleByHeight(38, height) : scaleByHeightMobile(12, height),
        borderRadius: isLandscape && Platform.OS === 'web' ? scaleByHeight(8, height) : scaleByHeightMobile(12, height),  
      },
      outlineBtnText: {
        fontSize: isLandscape && Platform.OS === 'web' ? scaleByHeight(20, height) : scaleByHeightMobile(20, height),
        lineHeight: isLandscape && Platform.OS === 'web' ? scaleByHeight(20, height) : scaleByHeightMobile(20, height),
      },
      webLandscapeButton: {
        width: scaleByHeight(330, height),
        height: scaleByHeight(62, height),
      },
    }),
    [height, isLandscape]
  );
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.outlineBtn,
        buttonDynamicStyles.outlineBtn,
        { borderColor: theme.primaryColor, opacity: disabled ? 0.6 : 1 },
        isLandscape &&
          Platform.OS === 'web' && {
            width: scaleByHeight(330, height),
            height: scaleByHeight(62, height),
          },
        containerStyle,
      ]}
    >
      {typeof title === 'string' ? (
        <Text
          style={[
            styles.outlineBtnText,
            buttonDynamicStyles.outlineBtnText,
            { color: theme.primaryColor },
          ]}
        >
          {title}
        </Text>
      ) : (
        title
      )}
    </TouchableOpacity>
  );
}


export default function Step2_PhoneEnroll({ onNext, onBack }) {
  const { t } = useTranslation();
  const { session, themeController, languageController, registerControl } =
    useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState(null);
  const [sending, setSending] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      brandFontSize: isWebLandscape ? web(57) : mobile(68),
      brandLetterSpacing: isWebLandscape ? web(5) : mobile(5),
      brandMarginBottom: isWebLandscape ? web(35) : mobile(22),
      titleFontSize: isWebLandscape ? web(18) : mobile(18),
      subtitleFontSize: isWebLandscape ? web(18) : mobile(16),
      subtitleMarginBottom: isWebLandscape ? web(25) : mobile(28),
      fieldBlockMarginBottom: isWebLandscape ? web(14) : mobile(16),
      labelFontSize: isWebLandscape ? web(14) : mobile(14),
      labelMarginBottom: isWebLandscape ? web(4) : mobile(6),
      inputPaddingHorizontal: isWebLandscape ? web(16) : mobile(16),
      inputFontSize: isWebLandscape ? web(18) : mobile(18),
      inputMarginBottom: isWebLandscape ? web(2) : mobile(8),
      borderRadius: isWebLandscape ? web(8) : mobile(8),
      linksRowMarginBottom: isWebLandscape ? web(8) : mobile(12),
      linksRowWidth: isWebLandscape ? web(314) : '90%',
      linkFontSize: isWebLandscape ? web(14) : mobile(14),
      errorFontSize: isWebLandscape ? web(14) : mobile(14),
      phoneDescriptionFontSize: isWebLandscape ? web(14) : mobile(14),
      phoneDescriptionLineHeight: isWebLandscape ? web(18) : mobile(18),
      webLandscapeFieldBlockWidth: isWebLandscape ? web(330) : '100%',
      webLandscapeFieldBlockHeight: isWebLandscape ? web(76) : mobile(75),
      webLandscapeFieldBlockPaddingTop: web(8),
      webLandscapeLabelMarginBottom: web(7),
      webLandscapeInputMarginBottom: web(3),
      keyboardVerticalOffset: mobile(10),
      scrollPaddingVertical: isWebLandscape ? web(24) : mobile(80),
      fieldBlockPaddingHorizontal: isWebLandscape ? web(16) : mobile(16),
    };
  }, [isWebLandscape, height]);

  const phoneInputRef = useRef(null);
  useEffect(() => {
    const timer = setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const isValidPhone = useMemo(() => {
    // Basic validation for E.164 format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.trim());
  }, [phone]);

  const handleSubmit = async () => {
    if (!isValidPhone) {
      setPhoneError(t('register.phone_invalid')); // You'll need to add this translation
      return;
    }
    setPhoneError(null);
    setSending(true);

    try {
      // Step 1: Enroll the phone number
      const enrollResult = await session.enrollPhoneNumber(phone.trim());
      if (!enrollResult.success) {
        throw new Error(enrollResult.error);
      }
      const factorId = enrollResult.factorId;

      // Step 2: Challenge the phone number (send SMS)
      const challengeResult = await session.challengePhoneNumber(factorId);
      if (!challengeResult.success) {
        throw new Error(challengeResult.error);
      }
      const challengeId = challengeResult.challengeId;

      // Success, move to next step
      onNext(factorId, challengeId, phone.trim());

    } catch (e) {
      console.error('MFA Enrollment/Challenge Error:', e.message);
      setPhoneError(e.message || 'An unknown error occurred.');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      style={[styles.root, { backgroundColor: theme.backgroundColor }]}
      keyboardVerticalOffset={Platform.select({
        ios: sizes.keyboardVerticalOffset,
        android: 0,
      })}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingVertical: sizes.scrollPaddingVertical },
          isWebLandscape
            ? { justifyContent: 'center', alignItems: 'center', flex: 1 }
            : {},
        ]}
        keyboardShouldPersistTaps='handled'
      >
        <Animated.View
          style={[
            styles.contentBlock,
            isWebLandscape
              ? { width: height * 0.5 }
              : { width: '100%' },
            { opacity: fadeAnim },
          ]}
        >
          <Text
            style={[
              styles.brand,
              {
                color: theme.primaryColor,
                fontSize: sizes.brandFontSize,
                letterSpacing: sizes.brandLetterSpacing,
                marginBottom: sizes.brandMarginBottom,
              },
            ]}
          >
            {t('auth.app_name')}
          </Text>

          <Text
            style={[
              styles.title,
              {
                color: theme.unactiveTextColor,
                textAlign: 'center',
                fontSize: sizes.titleFontSize,
              },
            ]}
          >
            {t('register.mfa_title')} 
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color: theme.unactiveTextColor,
                textAlign: 'center',
                fontSize: sizes.subtitleFontSize,
                marginBottom: sizes.subtitleMarginBottom,
              },
            ]}
          >
            {t('register.mfa_enroll_subtitle')}
          </Text>

          <View
            style={[
              styles.fieldBlock,
              {
                marginBottom: sizes.fieldBlockMarginBottom,
                backgroundColor: theme.formInputBackground,
                width: sizes.webLandscapeFieldBlockWidth,
                borderRadius: sizes.borderRadius,
                paddingTop: sizes.webLandscapeFieldBlockPaddingTop,
                paddingHorizontal: sizes.fieldBlockPaddingHorizontal,
                height: sizes.webLandscapeFieldBlockHeight,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  fontSize: sizes.labelFontSize,
                  marginBottom: sizes.labelMarginBottom,
                  color: theme.formInputLabelColor,
                  textAlign: isRTL ? 'right' : 'left',
                },
                isWebLandscape
                  ? {
                      marginBottom: sizes.webLandscapeLabelMarginBottom,
                    }
                  : null,
              ]}
            >
              {t('register.phone_label')}
            </Text>
            <TextInput
              ref={phoneInputRef}
              style={[
                styles.input,
                {
                  fontSize: sizes.inputFontSize,
                  marginBottom: sizes.inputMarginBottom,
                  color: theme.formInputTextColor,
                  textAlign: isRTL ? 'right' : 'left',
                  backgroundColor: 'transparent',
                  borderWidth: 0,
                  marginBottom: sizes.webLandscapeInputMarginBottom,
                },
                Platform.OS === 'web' &&
                  isLandscape && {
                    outlineStyle: 'none',
                  },
              ]}
              placeholder='+1234567890'
              placeholderTextColor={theme.formInputPlaceholderColor}
              keyboardType='phone-pad'
              autoCapitalize='none'
              autoCorrect={false}
              value={phone}
              onChangeText={setPhone}
              returnKeyType='done'
            />
          </View>
          <View
            style={[
              styles.linksRow,
              {
                width: sizes.linksRowWidth,
                marginBottom: sizes.linksRowMarginBottom,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              },
            ]}
          >
            <TouchableOpacity onPress={onBack}>
              <Text
                style={[
                  styles.link,
                  {
                    fontSize: sizes.linkFontSize,
                    color: theme.formInputLabelColor,
                    textDecorationLine: 'none',
                  },
                ]}
              >
                {t('register.back_to_email')}
              </Text>
            </TouchableOpacity>
          </View>

          <PrimaryOutlineButton
            isLandscape={isLandscape}
            height={height}
            theme={theme}
            title={
              sending ? (
                <ActivityIndicator color={theme.primaryColor} />
              ) : (
                t('auth.send_code')
              )
            }
            onPress={handleSubmit}
            disabled={sending || !isValidPhone}
          />
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: '6%',
  },
  contentBlock: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  brand: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'Rubik-Bold',
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: 'Rubik-SemiBold',
  },
  subtitle: {
    textAlign: 'center',
    fontWeight: '600',
    fontFamily: 'Rubik-SemiBold',
  },
  fieldBlock: {},
  label: {
    fontWeight: '500',
  },
  input: {
    borderWidth: 0,
    fontWeight: '500',
  },
  outlineBtn: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  outlineBtnText: {
    fontFamily: 'Rubik-Medium',
  },
  linksRow: {
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontFamily: 'Rubik-Medium',
  },
  link: {
    textDecorationLine: 'underline',
  },
  error: {
    marginTop: 4,
  },
  phoneDescription: {
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: 'Rubik-Medium',
  },
});