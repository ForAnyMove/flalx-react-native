import React, { useState, useMemo } from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { logError, logInfo } from '../../../utils/log_util';
import { sendFeedback, sendMessage } from '../../../src/api/support';
import { scaleByHeight, scaleByHeightMobile } from '../../../utils/resizeFuncs';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import CustomPicker from '../../../components/ui/CustomPicker';
import CustomTextInput from '../../../components/ui/CustomTextInput';
import { icons } from '../../../constants/icons';
import { useComponentContext } from '../../../context/globalAppContext';
import { useWindowInfo } from '../../../context/windowContext';

// Модальное содержимое
export function ModalContent({
  title,
  onClose,
  content,
  avatar = false,
  contactForm = false,
  feedback = false,
}) {
  const { themeController, setAppLoading, session, languageController } =
    useComponentContext();
  const { t } = useTranslation();
  const { height, isLandscape } = useWindowInfo();
  const isRTL = languageController.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      baseFont: isWebLandscape ? web(16) : mobile(16),
      font: isWebLandscape ? web(12) : mobile(12),
      questionsFont: isWebLandscape ? web(18) : mobile(14),
      iconCircleSize: isWebLandscape ? web(40) : mobile(40),
      iconSize: isWebLandscape ? web(18) : mobile(18),
      containerPaddingVertical: isWebLandscape ? web(24) : mobile(14),
      containerPaddingHorizontal: isWebLandscape ? web(24) : mobile(12),
      pickerHeight: isWebLandscape ? web(64) : mobile(64),
      rowGap: isWebLandscape ? height * 0.015 : mobile(10),
      colGap: isWebLandscape ? height * 0.02 : mobile(12),
      switchMargin: isWebLandscape ? height * 0.02 : mobile(16),
      btnPadding: isWebLandscape ? height * 0.015 : mobile(12),
      btnFont: isWebLandscape ? web(20) : mobile(20),
      rowsWidth: isWebLandscape ? '65%' : '100%',
      rowsAlign: isWebLandscape
        ? isRTL
          ? 'flex-end'
          : 'flex-start'
        : 'stretch',
      bottomInset: isWebLandscape ? height * 0.02 : mobile(12),
      borderRadius: isWebLandscape ? web(8) : mobile(5),
      regulationsModalWidth: isWebLandscape ? web(480) : '100%',
      regulationsModalHeight: isWebLandscape ? web(600) : '100%',
      aboutModalHeight: isWebLandscape ? web(650) : '100%',
      modalIconSize: isWebLandscape ? web(24) : mobile(24),
      modalCloseBtnTopRightPosition: isWebLandscape ? web(7) : mobile(7),
      regulationsModalPaddingVertical: isWebLandscape ? web(36) : mobile(10),
      regulationsModalPaddingHorizontal: isWebLandscape ? web(44) : mobile(10),
      contactUsModalPaddingHorizontal: isWebLandscape ? web(74.5) : mobile(10),
      feedbackModalPaddingHorizontal: isWebLandscape ? web(62.5) : mobile(10),
      regulationsModalTitle: isWebLandscape ? web(24) : mobile(18),
      modalContentHeight: isWebLandscape ? web(440) : mobile(400),
      avatarModalMarginBottom: isWebLandscape ? web(16) : mobile(16),
      nonAvatarModalMarginBottom: isWebLandscape ? web(24) : mobile(20),
      avatarSize: isWebLandscape ? web(80) : mobile(65),
      contactUsModalHeight: isWebLandscape ? web(790) : '100%',
      feedbackModalHeight: isWebLandscape ? web(480) : '100%',
      sendContactFormModalHeight: isWebLandscape ? web(450) : '100%',
      inputContainerPaddingVertical: isWebLandscape ? web(10) : mobile(10),
      inputContainerPaddingHorizontal: isWebLandscape ? web(16) : mobile(16),
      inputHeight: isWebLandscape ? web(64) : mobile(64),
      inputWidth: isWebLandscape ? web(330) : mobile(150),
      textAreaHeight: isWebLandscape ? web(144) : mobile(144),
      textInputPadding: isWebLandscape ? web(4) : mobile(4),
      inputFont: isWebLandscape ? web(16) : mobile(16),
      modalInputMarginBottom: isWebLandscape ? web(16) : mobile(16),
      contactUsDescriptionPaddingHorizontal: isWebLandscape
        ? web(18)
        : mobile(12),
      checkboxContainerHeight: isWebLandscape ? web(36) : mobile(20),
      checkboxIconSize: isWebLandscape ? web(14) : mobile(13),
      checkboxTextSize: isWebLandscape ? web(14) : mobile(14),
      checkboxMarginBottom: isWebLandscape ? web(24) : mobile(8),
      checkboxPaddingHorizontal: isWebLandscape ? web(4) : mobile(4),
      btnHeight: isWebLandscape ? web(62) : undefined,
      successModalHeight: isWebLandscape ? web(450) : '100%',
      successModalPaddingHorizontal: isWebLandscape ? web(24) : mobile(16),
      successModalIconSize: isWebLandscape ? web(112) : mobile(40),
      successModalDescriptionFont: isWebLandscape ? web(18) : mobile(14),
      successModalDescriptionWidth: isWebLandscape ? web(246) : mobile(150),
      connectBtnsGap: isWebLandscape ? web(10) : mobile(10),
      bottomMb: isWebLandscape ? web(55) : 0,
      bottomMr: isWebLandscape ? web(93) : 0,
      scrollPaddingBottom: isWebLandscape ? height * 0.18 : mobile(40),
      btnHeightWeb: isWebLandscape ? web(62) : mobile(62),
      checkboxSize: isWebLandscape ? web(18) : mobile(18),
      checkboxTextMargin: isWebLandscape ? web(10) : mobile(10),
      checkboxIconBorderWidth: isWebLandscape ? web(2) : mobile(2),
      checkboxIconBorderRadius: isWebLandscape ? web(3) : mobile(3),
      switchWidth: isWebLandscape ? web(50) : mobile(50),
      switchHeight: isWebLandscape ? web(30) : mobile(30),
      switchCircleSize: isWebLandscape ? web(20) : mobile(20),
      switchPadding: isWebLandscape ? web(5) : mobile(5),
    };
  }, [height, isWebLandscape, isRTL]);

  const [accepted, setAccepted] = useState(false);
  const [contactUsFormState, setContactUsFormState] = useState({
    topic: '',
    message: '',
    email: '',
    name: '',
    reason: '',
    phoneNumber: '',
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const heightByType = () => {
    if (showSuccessModal) {
      return sizes.successModalHeight;
    } else if (contactForm) {
      return sizes.contactUsModalHeight;
    } else if (feedback) {
      return sizes.feedbackModalHeight;
    } else if (avatar) {
      return sizes.aboutModalHeight;
    } else {
      return sizes.regulationsModalHeight;
    }
  };

  const paddingHorizontalByType = () => {
    if (showSuccessModal) {
      return sizes.successModalPaddingHorizontal;
    } else if (contactForm) {
      return sizes.contactUsModalPaddingHorizontal;
    } else if (feedback) {
      return sizes.feedbackModalPaddingHorizontal;
    }
    return sizes.regulationsModalPaddingHorizontal;
  };

  const confirmContactUs = async () => {
    try {
      setAppLoading(true);

      const success = await sendMessage(session, {
        name: contactUsFormState.name,
        email: contactUsFormState.email,
        topic: contactUsFormState.topic,
        reason: contactUsFormState.reason,
        message: contactUsFormState.message,
      });

      setAppLoading(false);

      if (success) {
        setShowSuccessModal(true);
        setTimeout(() => {
          onClose();
          setShowSuccessModal(false);
        }, 2000);
      }
    } catch (error) {
      logError('Error in confirmContactUs:', error);
    } finally {
      setAppLoading(false);
    }
  };

  const confirmFeedback = async () => {
    try {
      setAppLoading(true);

      if (contactUsFormState.phoneNumber.trim() === '') {
        throw new Error('Phone number is required for feedback');
      }

      const success = await sendFeedback(session, {
        phoneNumber: contactUsFormState.phoneNumber,
      });

      setAppLoading(false);
      onClose();
    } catch (error) {
      logInfo('Error in confirmFeedback:', error);
    } finally {
      setAppLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        { flex: 1 },
        isWebLandscape && {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        },
      ]}
      onPress={() => onClose()}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        style={[
          {
            position: 'relative',
            paddingVertical: sizes.regulationsModalPaddingVertical,
            paddingHorizontal: paddingHorizontalByType(),
            justifyContent: 'center',
            boxSizing: 'border-box',
            height: '100%',
            backgroundColor: themeController.current?.backgroundColor,
          },
          isWebLandscape && {
            width: sizes.regulationsModalWidth,
            height: heightByType(),
            borderRadius: sizes.borderRadius,
            maxHeight: '100%',
          },
          contactForm &&
            isWebLandscape && {
              justifyContent: 'space-between',
            },
        ]}
      >
        <TouchableOpacity
          style={[
            {
              position: 'absolute',
              top: sizes.modalCloseBtnTopRightPosition,
              right: sizes.modalCloseBtnTopRightPosition,
              zIndex: 10,
            },
          ]}
          onPress={() => onClose()}
        >
          <Image
            source={icons.cross}
            style={{
              width: sizes.modalIconSize,
              height: sizes.modalIconSize,
              tintColor: themeController.current?.textColor,
            }}
          />
        </TouchableOpacity>
        {showSuccessModal ? (
          <View>
            <View
              style={{
                overflow: 'hidden',
                alignItems: 'center',
                marginBottom: sizes.avatarModalMarginBottom,
              }}
            >
              <Image
                source={icons.checkDefault}
                style={{
                  width: sizes.successModalIconSize,
                  height: sizes.successModalIconSize,
                  borderRadius: sizes.successModalIconSize / 2,
                }}
              />
            </View>
            <Text
              style={[
                {
                  fontSize: sizes.regulationsModalTitle,
                  color: themeController.current?.primaryColor,
                  fontFamily: 'Rubik-Bold',
                  textAlign: 'center',
                  marginBottom: sizes.avatarModalMarginBottom * 2,
                },
              ]}
            >
              {t('settings.modals.contact_us.success_title', {
                defaultValue: 'Your message has been sent!',
              })}
            </Text>
            <Text
              style={[
                {
                  fontSize: sizes.successModalDescriptionFont,
                  color: themeController.current?.unactiveTextColor,
                  textAlign: 'center',
                  width: sizes.successModalDescriptionWidth,
                  alignSelf: 'center',
                },
              ]}
            >
              {t('settings.modals.contact_us.success_message', {
                defaultValue:
                  'We will carefully review your \nquestion and contact you \nas soon as possible!',
              })}
            </Text>
          </View>
        ) : (
          <View
            style={[
              !isWebLandscape && {
                height: '100%',
                maxHeight: '100%',
                justifyContent: 'space-between',
              },
            ]}
          >
            <Text
              style={[
                {
                  fontSize: sizes.regulationsModalTitle,
                  color: themeController.current?.textColor,
                  fontFamily: 'Rubik-Bold',
                  textAlign: 'center',
                  marginBottom: avatar
                    ? sizes.avatarModalMarginBottom
                    : sizes.nonAvatarModalMarginBottom,
                },
              ]}
            >
              {title}
            </Text>
            {avatar && (
              <View
                style={{
                  overflow: 'hidden',
                  marginBottom: sizes.avatarModalMarginBottom,
                  alignItems: 'center',
                }}
              >
                <Image
                  source={icons.defaultAvatar}
                  style={{
                    width: sizes.avatarSize,
                    height: sizes.avatarSize,
                    borderRadius: sizes.avatarSize / 2,
                  }}
                />
              </View>
            )}
            {contactForm || feedback ? (
              <>
                {contactForm && (
                  <ScrollView
                    style={[
                      {
                        width: '100%',
                        maxHeight: '70%',
                        marginBottom: sizes.modalInputMarginBottom / 2,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.inputBlock,
                        {
                          backgroundColor:
                            themeController.current?.formInputBackground,
                          paddingVertical: sizes.inputContainerPaddingVertical,
                          paddingHorizontal:
                            sizes.inputContainerPaddingHorizontal,
                          borderRadius: sizes.borderRadius,
                          // marginBottom: 0,
                          height: sizes.inputHeight,
                          marginBottom: sizes.modalInputMarginBottom / 2,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          {
                            color: themeController.current?.unactiveTextColor,
                          },
                          isRTL && { textAlign: 'right' },
                          { fontSize: sizes.font },
                        ]}
                      >
                        {t('settings.modals.contact_us.topic.label', {
                          defaultValue: 'Topic',
                        })}
                      </Text>
                      <CustomTextInput
                        value={contactUsFormState.topic}
                        onChangeText={(v) =>
                          setContactUsFormState((p) => ({ ...p, topic: v }))
                        }
                        placeholder={t(
                          'settings.modals.contact_us.topic.placeholder',
                          {
                            defaultValue: 'Your login and message subject',
                          }
                        )}
                        placeholderTextColor={
                          themeController.current?.formInputLabelColor
                        }
                        style={{
                          fontFamily: 'Rubik-Medium',
                          color: themeController.current?.textColor,
                          padding: 0,
                          paddingVertical: sizes.textInputPadding,
                          fontSize: sizes.inputFont,
                          borderRadius: sizes.borderRadius,
                          backgroundColor: 'transparent',
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                      />
                    </View>
                    <Text
                      style={[
                        {
                          color:
                            themeController.current?.formInputPlaceholderColor,
                          fontSize: sizes.font,
                          paddingHorizontal:
                            sizes.contactUsDescriptionPaddingHorizontal,
                          marginBottom: sizes.modalInputMarginBottom,
                        },
                      ]}
                    >
                      {t('settings.modals.contact_us.description')}
                    </Text>
                    <View
                      style={[
                        styles.inputBlock,
                        {
                          backgroundColor:
                            themeController.current?.formInputBackground,
                          paddingVertical: sizes.inputContainerPaddingVertical,
                          paddingHorizontal:
                            sizes.inputContainerPaddingHorizontal,
                          borderRadius: sizes.borderRadius,
                          marginBottom: sizes.modalInputMarginBottom,
                          height: sizes.textAreaHeight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          { color: themeController.current?.unactiveTextColor },
                          isRTL && { textAlign: 'right' },
                          { fontSize: sizes.font },
                        ]}
                      >
                        {t('settings.modals.contact_us.message.label', {
                          defaultValue: 'Message',
                        })}
                      </Text>
                      <CustomTextInput
                        value={contactUsFormState.message}
                        onChangeText={(v) =>
                          setContactUsFormState((p) => ({ ...p, message: v }))
                        }
                        placeholder={t(
                          'settings.modals.contact_us.message.placeholder',
                          {
                            defaultValue: 'Write your message here...',
                          }
                        )}
                        placeholderTextColor={
                          themeController.current?.formInputLabelColor
                        }
                        style={{
                          fontFamily: 'Rubik-Medium',
                          color: themeController.current?.textColor,
                          padding: 0,
                          paddingVertical: sizes.textInputPadding,
                          fontSize: sizes.inputFont,
                          borderRadius: sizes.borderRadius,
                          backgroundColor: 'transparent',
                          textAlign: isRTL ? 'right' : 'left',
                          height: '100%',
                        }}
                        multiline={true}
                      />
                    </View>
                    <View
                      style={[
                        styles.inputBlock,
                        {
                          backgroundColor:
                            themeController.current?.formInputBackground,
                          paddingVertical: sizes.inputContainerPaddingVertical,
                          paddingHorizontal:
                            sizes.inputContainerPaddingHorizontal,
                          borderRadius: sizes.borderRadius,
                          marginBottom: sizes.modalInputMarginBottom,
                          height: sizes.inputHeight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          { color: themeController.current?.unactiveTextColor },
                          isRTL && { textAlign: 'right' },
                          { fontSize: sizes.font },
                        ]}
                      >
                        {t('settings.modals.contact_us.email.label', {
                          defaultValue: 'Email',
                        })}
                      </Text>
                      <CustomTextInput
                        value={contactUsFormState.email}
                        onChangeText={(v) =>
                          setContactUsFormState((p) => ({ ...p, email: v }))
                        }
                        placeholder={t(
                          'settings.modals.contact_us.email.placeholder',
                          {
                            defaultValue: 'Your email address',
                          }
                        )}
                        placeholderTextColor={
                          themeController.current?.formInputLabelColor
                        }
                        style={{
                          fontFamily: 'Rubik-Medium',
                          color: themeController.current?.textColor,
                          padding: 0,
                          paddingVertical: sizes.textInputPadding,
                          fontSize: sizes.inputFont,
                          borderRadius: sizes.borderRadius,
                          backgroundColor: 'transparent',
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                      />
                    </View>
                    <View
                      style={[
                        styles.inputBlock,
                        {
                          backgroundColor:
                            themeController.current?.formInputBackground,
                          paddingVertical: sizes.inputContainerPaddingVertical,
                          paddingHorizontal:
                            sizes.inputContainerPaddingHorizontal,
                          borderRadius: sizes.borderRadius,
                          marginBottom: sizes.modalInputMarginBottom,
                          height: sizes.inputHeight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          { color: themeController.current?.unactiveTextColor },
                          isRTL && { textAlign: 'right' },
                          { fontSize: sizes.font },
                        ]}
                      >
                        {t('settings.modals.contact_us.name.label', {
                          defaultValue: 'Your name',
                        })}
                      </Text>
                      <CustomTextInput
                        value={contactUsFormState.name}
                        onChangeText={(v) =>
                          setContactUsFormState((p) => ({ ...p, name: v }))
                        }
                        placeholder={t(
                          'settings.modals.contact_us.name.placeholder',
                          {
                            defaultValue: 'Your full name',
                          }
                        )}
                        placeholderTextColor={
                          themeController.current?.formInputLabelColor
                        }
                        style={{
                          fontFamily: 'Rubik-Medium',
                          color: themeController.current?.textColor,
                          padding: 0,
                          paddingVertical: sizes.textInputPadding,
                          fontSize: sizes.inputFont,
                          borderRadius: sizes.borderRadius,
                          backgroundColor: 'transparent',
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                      />
                    </View>
                    <CustomPicker
                      label={t('settings.modals.contact_us.reason.label', {
                        defaultValue: 'Reason for contact',
                      })}
                      options={[
                        {
                          label: t(
                            'settings.modals.contact_us.reason.option1',
                            {
                              defaultValue: 'General Inquiry',
                            }
                          ),
                          value: 'general',
                        },
                        {
                          label: t(
                            'settings.modals.contact_us.reason.option2',
                            {
                              defaultValue: 'Technical Support',
                            }
                          ),
                          value: 'technical',
                        },
                        {
                          label: t(
                            'settings.modals.contact_us.reason.option3',
                            {
                              defaultValue: 'Feedback',
                            }
                          ),
                          value: 'feedback',
                        },
                      ]}
                      selectedValue={contactUsFormState.reason}
                      onValueChange={(value) =>
                        setContactUsFormState((p) => ({ ...p, reason: value }))
                      }
                      isRTL={isRTL}
                      containerStyle={{
                        marginBottom: sizes.modalInputMarginBottom,
                        width: '100%',
                      }}
                    />

                    <View
                      style={{
                        height: sizes.checkboxContainerHeight,
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        alignItems: 'center',
                        marginBottom: sizes.checkboxMarginBottom,
                        paddingHorizontal: sizes.checkboxPaddingHorizontal,
                      }}
                    >
                      <BouncyCheckbox
                        size={sizes.checkboxSize}
                        isChecked={accepted}
                        onPress={setAccepted}
                        textStyle={[
                          styles.termsCheckboxText,
                          {
                            textAlign: isRTL ? 'right' : 'left',
                            color: themeController.current?.unactiveTextColor,
                            textDecorationLine: 'none',
                          },
                        ]}
                        textContainerStyle={{
                          marginLeft: isRTL ? 0 : sizes.checkboxTextMargin,
                        }}
                        fillColor={themeController.current?.primaryColor}
                        innerIconStyle={{
                          borderWidth: sizes.checkboxIconBorderWidth,
                          borderRadius: sizes.checkboxIconBorderRadius,
                        }}
                        iconStyle={{
                          borderRadius: sizes.checkboxIconBorderRadius,
                          fontSize: sizes.checkboxIconSize,
                        }}
                      />
                      <Text
                        style={[
                          {
                            color: themeController.current?.unactiveTextColor,
                            fontSize: sizes.checkboxTextSize,
                            marginRight: isRTL ? sizes.checkboxTextMargin : 0,
                          },
                        ]}
                      >
                        {t('settings.modals.contact_us.checkbox_text')}{' '}
                        <Text
                          style={[
                            { color: themeController.current?.primaryColor },
                          ]}
                        >
                          {t('settings.modals.contact_us.privacy_policy')}
                        </Text>
                      </Text>
                    </View>
                  </ScrollView>
                )}
                {feedback && (
                  <ScrollView style={[{ width: '100%' }]}>
                    <Text
                      style={[
                        {
                          color: themeController.current?.unactiveTextColor,
                          fontSize: sizes.successModalDescriptionFont,
                          textAlign: 'center',
                          marginBottom: sizes.modalInputMarginBottom,
                        },
                      ]}
                    >
                      {t('settings.modals.feedback_title')}
                    </Text>
                    <Text
                      style={[
                        {
                          color: themeController.current?.primaryColor,
                          fontSize: sizes.regulationsModalTitle,
                          fontFamily: 'Rubik-Bold',
                          textAlign: 'center',
                          marginBottom: sizes.modalInputMarginBottom,
                        },
                      ]}
                    >
                      +1(800) 123-456
                    </Text>
                    <Text
                      style={[
                        {
                          color: themeController.current?.unactiveTextColor,
                          fontSize: sizes.checkboxTextSize,
                          textAlign: 'center',
                          marginBottom: sizes.checkboxMarginBottom,
                        },
                      ]}
                    >
                      {t('settings.modals.feedback_description')}
                    </Text>
                    <View
                      style={[
                        styles.inputBlock,
                        {
                          backgroundColor:
                            themeController.current?.formInputBackground,
                          paddingVertical: sizes.inputContainerPaddingVertical,
                          paddingHorizontal:
                            sizes.inputContainerPaddingHorizontal,
                          borderRadius: sizes.borderRadius,
                          marginBottom: sizes.modalInputMarginBottom * 2,
                          height: sizes.inputHeight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          { color: themeController.current?.unactiveTextColor },
                          isRTL && { textAlign: 'right' },
                          { fontSize: sizes.font },
                        ]}
                      >
                        {t('settings.modals.feedback.phone.label', {
                          defaultValue: 'Your phone number',
                        })}
                      </Text>
                      <CustomTextInput
                        value={contactUsFormState.phoneNumber}
                        onChangeText={(v) =>
                          setContactUsFormState((p) => ({
                            ...p,
                            phoneNumber: v,
                          }))
                        }
                        placeholder={t(
                          'settings.modals.feedback.phone.placeholder',
                          {
                            defaultValue: 'Enter your phone number',
                          }
                        )}
                        placeholderTextColor={
                          themeController.current?.formInputLabelColor
                        }
                        style={{
                          fontFamily: 'Rubik-Medium',
                          color: themeController.current?.textColor,
                          padding: 0,
                          paddingVertical: sizes.textInputPadding,
                          fontSize: sizes.inputFont,
                          borderRadius: sizes.borderRadius,
                          backgroundColor: 'transparent',
                          textAlign: isRTL ? 'right' : 'left',
                        }}
                      />
                    </View>
                  </ScrollView>
                )}
                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    {
                      backgroundColor:
                        themeController.current?.buttonColorPrimaryDefault,
                      padding: sizes.btnPadding,
                      borderRadius: sizes.borderRadius,
                      height: sizes.btnHeight,
                    },
                  ]}
                  onPress={() => {
                    // TODO: implement submit behavior
                    logInfo('submit form', {
                      contactForm,
                      feedback,
                      contactUsForm: contactUsFormState,
                    });
                    if (contactForm) {
                      confirmContactUs();
                    } else if (feedback) {
                      confirmFeedback();
                    } else {
                      onClose();
                    }
                  }}
                >
                  <Text
                    style={[
                      {
                        color: themeController.current?.buttonTextColorPrimary,
                        fontSize: sizes.btnFont,
                      },
                    ]}
                  >
                    {t(contactForm ? 'settings.sent' : 'settings.submit')}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <ScrollView
                style={[{ width: '100%', height: sizes.modalContentHeight }]}
              >
                <Text
                  style={[
                    {
                      color: themeController.current?.textColor,
                      fontSize: sizes.baseFont,
                    },
                  ]}
                >
                  {content}
                </Text>
              </ScrollView>
            )}
          </View>
        )}
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBlock: {
    ...Platform.select({
      web: {
        zIndex: 1,
      },
    }),
  },
  termsCheckboxText: {
    opacity: 0.8,
    fontWeight: 'bold',
  },
});
