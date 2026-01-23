import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Platform, Animated, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';

import Step1_EmailPassword from './Step1_EmailPassword';
import Step2_PhoneEnroll from './Step2_PhoneEnroll';
import Step3_PhoneVerify from './Step3_PhoneVerify';

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


export default function MultiStepRegisterScreen({ skipMFA = false }) {
  const { t } = useTranslation();
  const { themeController, registerControl } = useComponentContext();
  const theme = themeController.current;

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [step, setStep] = useState('email'); // email, phone_enroll, phone_verify, finished
  const [userData, setUserData] = useState({
    email: '',
    password: '',
    phone: '',
    factorId: null,
  });

  const handleEmailNext = (email, password) => {
    setUserData((prev) => ({ ...prev, email, password }));
    if (skipMFA) {
      setStep('finished');
    } else {
      setStep('phone_enroll');
    }
  };

  const handlePhoneEnrollNext = (phone, factorId) => {
    setUserData((prev) => ({ ...prev, phone, factorId }));
    setStep('phone_verify');
  };

  const handlePhoneVerifyNext = () => {
    setStep('finished');
  };

  const handleBack = () => {
    if (step === 'phone_enroll') {
      setStep('email');
    } else if (step === 'phone_verify') {
      setStep('phone_enroll');
    }
  };

  const sizes = useMemo(
    () => ({
      titleFontSize: isWebLandscape ? scaleByHeight(18, height) : scaleByHeightMobile(18, height),
      subtitleFontSize: isWebLandscape ? scaleByHeight(18, height) : scaleByHeightMobile(18, height),
      finishTitleMarginBottom: isWebLandscape ? scaleByHeight(18, height) : scaleByHeightMobile(8, height),
    }),
    [isWebLandscape, height]
  );

  const dynamicStyles = useMemo(() => {
    return {
      title: {
        fontSize: sizes.titleFontSize,
      },
      subtitle: {
        fontSize: sizes.subtitleFontSize,
      },
    };
  }, [sizes]);


  const renderStep = () => {
    switch (step) {
      case 'email':
        return <Step1_EmailPassword onNext={handleEmailNext} />;
      case 'phone_enroll':
        return <Step2_PhoneEnroll onNext={handlePhoneEnrollNext} onBack={handleBack} />;
      case 'phone_verify':
        return (
          <Step3_PhoneVerify
            factorId={userData.factorId}
            phone={userData.phone}
            onNext={handlePhoneVerifyNext}
            onBack={handleBack}
          />
        );
      case 'finished':
        return (
          <Animated.View
            style={[
              styles.contentBlock,
              isWebLandscape ? { width: height * 0.5 } : { width: '100%' },
            ]}
          >
            <Text
              style={[
                styles.title,
                dynamicStyles.title,
                {
                  color: theme.unactiveTextColor,
                  textAlign: 'center',
                  fontSize: dynamicStyles.title.fontSize * 1.5,
                  marginBottom: sizes.finishTitleMarginBottom,
                  fontFamily: 'Rubik-SemiBold',
                },
              ]}
            >
              {t('auth.verify_email')}
            </Text>
            <Text
              style={[
                styles.subtitle,
                dynamicStyles.subtitle,
                {
                  color: theme.unactiveTextColor,
                  textAlign: 'center',
                },
              ]}
            >
              {t('auth.verify_message_sended')}
            </Text>
            <PrimaryOutlineButton
                isLandscape={isLandscape}
                height={height}
                theme={theme}
                title={t('common.close')}
                onPress={() => registerControl.leaveRegisterScreen()}
            />
          </Animated.View>
        );
      default:
        return null;
    }
  };

  return <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>{renderStep()}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  contentBlock: {
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: '6%',
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
  outlineBtn: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  outlineBtnText: {
    fontFamily: 'Rubik-Medium',
  },
});
