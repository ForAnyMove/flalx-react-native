import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Platform,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useComponentContext } from '../../../context/globalAppContext';
import CustomPicker from '../../../components/ui/CustomPicker';
import { icons } from '../../../constants/icons';
import { useState, useMemo, useEffect } from 'react';
import { useWindowInfo } from '../../../context/windowContext';
import { useTranslation } from 'react-i18next';
import { scaleByHeight, scaleByHeightMobile } from '../../../utils/resizeFuncs';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { sendFeedback, sendMessage } from '../../../src/api/support';
import { useNotification } from '../../../src/render';

// getResponsiveSize helper was unused and removed

export default function Settings() {
  const { themeController, languageController, geolocationController } = useComponentContext();
  const { showError, showInfo } = useNotification();
  const { height } = useWindowDimensions();
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;
  const { isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  // Toggles
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Modals
  const [aboutVisible, setAboutVisible] = useState(false);
  const [regulationsVisible, setRegulationsVisible] = useState(false);
  const [contactUsVisible, setContactUsVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);

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
    };
  }, [height, isWebLandscape, isRTL]);

  useEffect(() => {
    if (geolocationController.error) {
      showError(geolocationController.error, [], () => {
        geolocationController.clearError();
      });
    }
  }, [geolocationController.error]);

  useEffect(() => {
    if (geolocationController.dialog) {
      showInfo(geolocationController.dialog.message, geolocationController.dialog.buttons, () => {
        geolocationController.dialog.buttons.forEach(btn => {
          if (btn.key == 'deny') btn.onPress();
        });
        geolocationController.clearDialog();
        geolocationController.clearError();
      });
    }
  }, [geolocationController.dialog]);

  // помощник для контейнеров-строк
  const rowStyle = {
    width: sizes.rowsWidth,
    alignSelf: sizes.rowsAlign,
    flexDirection: isWebLandscape ? (isRTL ? 'row-reverse' : 'row') : 'column',
    justifyContent: isWebLandscape ? 'space-between' : 'center',
    gap: sizes.colGap,
    marginBottom: sizes.rowGap,
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeController.current?.backgroundColor,
          paddingVertical: sizes.containerPaddingVertical,
          paddingHorizontal: sizes.containerPaddingHorizontal,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={{
          paddingBottom: sizes.scrollPaddingBottom,
        }}
      >
        {/* Break Line */}
        {/* <View
          style={[
            styles.breakLine,
            {
              backgroundColor: themeController.current?.breakLineColor,
              marginVertical: sizes.rowGap,
            },
          ]}
        /> */}
        {/* Language + Theme */}
        <View
          style={[
            rowStyle,
            isWebLandscape
              ? { height: sizes.inputHeight }
              : { height: sizes.inputHeight * 2 + sizes.colGap },
          ]}
        >
          <CustomPicker
            label={t('settings.language')}
            options={[
              { label: t('settings.lang_en', 'English'), value: 'en' },
              { label: t('settings.lang_he', 'עברית'), value: 'he' },
            ]}
            selectedValue={languageController.current}
            onValueChange={(itemValue) => languageController.setLang(itemValue)}
            isRTL={isRTL}
            containerStyle={{ flex: 1 }}
          />

          <CustomPicker
            label={t('settings.theme')}
            options={[
              { label: t('settings.theme_light', 'Light'), value: 'light' },
              { label: t('settings.theme_dark', 'Dark'), value: 'dark' },
            ]}
            selectedValue={themeController.isTheme}
            onValueChange={(itemValue) => themeController.setTheme(itemValue)}
            isRTL={isRTL}
            containerStyle={{ flex: 1 }}
          />
        </View>

        {/* Break Line */}
        <View
          style={[
            styles.breakLine,
            {
              backgroundColor: themeController.current?.breakLineColor,
              marginVertical: sizes.rowGap,
            },
          ]}
        />

        {/* Switches */}
        <View style={[rowStyle, { marginVertical: sizes.switchMargin }]}>
          <View
            style={[
              styles.switchRow,
              {
                width: isWebLandscape ? '47%' : '100%',
                flexDirection: isRTL ? 'row-reverse' : 'row',
              },
            ]}
          >
            <Text
              style={[
                // styles.switchName,
                {
                  color: themeController.current?.unactiveTextColor,
                  fontSize: sizes.baseFont,
                },
              ]}
            >
              {t('settings.location')}
            </Text>
            <Switch
              value={geolocationController.enabled}
              onValueChange={geolocationController.toggleGeolocation}
              trackColor={{
                false: themeController.current?.switchTrackColor,
                true: themeController.current?.switchTrackColor,
              }}
              thumbColor={
                true ? themeController.current?.switchThumbColor : '#000'
              }
            />
          </View>

          <View
            style={[
              styles.switchRow,
              {
                width: isWebLandscape ? '47%' : '100%',
                flexDirection: isRTL ? 'row-reverse' : 'row',
              },
            ]}
          >
            <Text
              style={[
                // styles.switchName,
                {
                  color: themeController.current?.unactiveTextColor,
                  fontSize: sizes.baseFont,
                },
              ]}
            >
              {t('settings.notifications')}
            </Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{
                false: themeController.current?.switchTrackColor,
                true: themeController.current?.switchTrackColor,
              }}
              thumbColor={
                true ? themeController.current?.switchThumbColor : '#000'
              }
            />
          </View>
        </View>

        {/* Break Line */}
        <View
          style={[
            styles.breakLine,
            {
              backgroundColor: themeController.current?.breakLineColor,
              marginVertical: sizes.rowGap,
            },
          ]}
        />

        {/* Buttons */}
        <View style={rowStyle}>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              {
                backgroundColor:
                  themeController.current?.buttonColorPrimaryDefault,
                padding: sizes.btnPadding,
                flex: isWebLandscape ? 1 : undefined,
                borderRadius: sizes.borderRadius,
                height: sizes.btnHeightWeb,
              },
              isWebLandscape && {
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
            onPress={() => setAboutVisible(true)}
          >
            <Text
              style={[
                // styles.primaryText,
                {
                  color: themeController.current?.buttonTextColorPrimary,
                  fontSize: sizes.btnFont,
                },
              ]}
            >
              {t('settings.about')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              {
                backgroundColor:
                  themeController.current?.buttonColorPrimaryDefault,
                padding: sizes.btnPadding,
                borderRadius: sizes.borderRadius,
                flex: isWebLandscape ? 1 : undefined,
                height: sizes.btnHeightWeb,
              },
              isWebLandscape && {
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
            onPress={() => setRegulationsVisible(true)}
          >
            <Text
              style={[
                // styles.primaryText,
                {
                  color: themeController.current?.buttonTextColorPrimary,
                  fontSize: sizes.btnFont,
                },
              ]}
            >
              {t('settings.regulations')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Icons + Text — фиксируем у нижнего края в альбомном вебе */}
      <View
        style={[
          styles.bottomRow,
          {
            flexDirection: isRTL ? 'row-reverse' : 'row',
            position: isWebLandscape ? 'absolute' : 'relative',
            bottom: sizes.bottomInset,
            left: sizes.containerPadding,
            right: sizes.containerPadding,
            marginTop: sizes.rowGap,
          },
          isWebLandscape && { justifyContent: 'flex-start' },
        ]}
      >
        <View
          style={
            isWebLandscape && {
              [isRTL ? 'marginLeft' : 'marginRight']: sizes.bottomMr,
              marginBottom: sizes.bottomMb,
            }
          }
        >
          <Text
            style={[
              styles.bottomText,
              {
                color: themeController.current?.unactiveTextColor,
                fontSize: sizes.questionsFont,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {t('settings.have_question')}
          </Text>
          <Text
            style={[
              styles.bottomText,
              {
                color: themeController.current?.unactiveTextColor,
                fontSize: sizes.questionsFont,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {t('settings.just_cheer')}
          </Text>
          <Text
            style={[
              styles.versionText,
              {
                color: themeController.current?.unactiveTextColor,
                fontSize: sizes.questionsFont,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            v1.52
          </Text>
        </View>
        <View
          style={[
            styles.connectBtnsContainer,
            {
              flexDirection: isRTL ? 'row-reverse' : 'row',
              gap: sizes.connectBtnsGap,
            },
          ]}
        >
          <TouchableOpacity
            style={{
              height: sizes.iconCircleSize,
              width: sizes.iconCircleSize,
              borderRadius: sizes.iconCircleSize / 2,
              backgroundColor: themeController.current?.primaryColor,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setContactUsVisible(true)}
          >
            <Image
              source={icons.emailClear}
              style={{
                width: sizes.iconSize,
                height: sizes.iconSize,
              }}
              resizeMode='contain'
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              height: sizes.iconCircleSize,
              width: sizes.iconCircleSize,
              borderRadius: sizes.iconCircleSize / 2,
              backgroundColor: themeController.current?.primaryColor,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setFeedbackVisible(true)}
          >
            <Image
              source={icons.phoneClear}
              style={{ width: sizes.iconSize, height: sizes.iconSize }}
              resizeMode='contain'
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* About Modal */}
      <Modal
        visible={aboutVisible}
        animationType='slide'
        transparent={isWebLandscape}
      >
        <ModalContent
          title={t('settings.about')}
          onClose={() => setAboutVisible(false)}
          isWebLandscape={isWebLandscape}
          sizes={sizes}
          content={t('settings.about_content')}
          avatar={true}
          isRTL={isRTL}
          height={height}
        />
      </Modal>

      {/* Regulations Modal */}
      <Modal
        visible={regulationsVisible}
        animationType='slide'
        transparent={isWebLandscape}
      >
        <ModalContent
          title={t('settings.regulations')}
          onClose={() => setRegulationsVisible(false)}
          isWebLandscape={isWebLandscape}
          sizes={sizes}
          content={t('settings.regulations_content')}
          isRTL={isRTL}
          height={height}
        />
      </Modal>

      {/* Contact Us Modal */}
      <Modal
        visible={contactUsVisible}
        animationType='slide'
        transparent={isWebLandscape}
      >
        <ModalContent
          title={t('settings.contact_us')}
          onClose={() => setContactUsVisible(false)}
          isWebLandscape={isWebLandscape}
          sizes={sizes}
          content={''}
          contactForm={true}
          isRTL={isRTL}
          height={height}
        />
      </Modal>

      {/* Feedback Modal */}
      <Modal
        visible={feedbackVisible}
        animationType='slide'
        transparent={isWebLandscape}
      >
        <ModalContent
          title={t('settings.feedback')}
          onClose={() => setFeedbackVisible(false)}
          isWebLandscape={isWebLandscape}
          sizes={sizes}
          content={''}
          feedback={true}
          isRTL={isRTL}
          height={height}
        />
      </Modal>
    </View>
  );
}

// Модальное содержимое
function ModalContent({
  title,
  onClose,
  lines,
  isWebLandscape,
  sizes,
  content,
  avatar = false,
  contactForm = false,
  feedback = false,
  isRTL,
}) {
  const { themeController, setAppLoading, session } = useComponentContext();
  const { t } = useTranslation();
  const { height } = useWindowDimensions();

  const [accepted, setAccepted] = useState(false);
  const [contactUsForm, setContactUsForm] = useState({
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
        name: contactUsForm.name,
        email: contactUsForm.email,
        topic: contactUsForm.topic,
        reason: contactUsForm.reason,
        message: contactUsForm.message,
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
      console.error('Error in confirmContactUs:', error);
    } finally {
      setAppLoading(false);
    }
  };

  const confirmFeedback = async () => {
    try {
      setAppLoading(true);

      if (contactUsForm.phoneNumber.trim() === '') {
        throw new Error('Phone number is required for feedback');
      }

      const success = await sendFeedback(session, {
        phoneNumber: contactUsForm.phoneNumber,
      });

      setAppLoading(false);
      onClose();
    } catch (error) {
      console.error('Error in confirmFeedback:', error);
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
          },
          isWebLandscape && {
            width: sizes.regulationsModalWidth,
            height: heightByType(),
            borderRadius: sizes.borderRadius,
            backgroundColor: themeController.current?.backgroundColor,
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
          <View style={[!isWebLandscape && { height: '100%', justifyContent: 'space-between' }]}>
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
                  <ScrollView style={[{ width: '100%' }]}>
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
                          marginBottom: 0,
                          height: sizes.inputHeight,
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
                      <TextInput
                        value={contactUsForm.topic}
                        onChangeText={(v) =>
                          setContactUsForm((p) => ({ ...p, topic: v }))
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
                      <TextInput
                        value={contactUsForm.message}
                        onChangeText={(v) =>
                          setContactUsForm((p) => ({ ...p, message: v }))
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
                      <TextInput
                        value={contactUsForm.email}
                        onChangeText={(v) =>
                          setContactUsForm((p) => ({ ...p, email: v }))
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
                      <TextInput
                        value={contactUsForm.name}
                        onChangeText={(v) =>
                          setContactUsForm((p) => ({ ...p, name: v }))
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
                      selectedValue={contactUsForm.reason}
                      onValueChange={(value) =>
                        setContactUsForm((p) => ({ ...p, reason: value }))
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
                          [isRTL ? 'marginRight' : 'marginLeft']:
                            sizes.checkboxTextMargin,
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
                      <TextInput
                        value={contactUsForm.phoneNumber}
                        onChangeText={(v) =>
                          setContactUsForm((p) => ({ ...p, phoneNumber: v }))
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
                    console.log('submit form', {
                      contactForm,
                      feedback,
                      contactUsForm,
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
  container: { flex: 1 },
  pickerContainer: {
    justifyContent: 'space-between',
    position: 'relative',
  },
  picker: { backgroundColor: 'transparent', borderWidth: 0 },
  label: {
    // position: 'absolute',
  },
  switchName: { fontWeight: 'bold' },
  breakLine: { height: 1 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // primaryText: { fontWeight: 'bold' },
  bottomRow: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  connectBtnsContainer: {},
  bottomText: {},
  versionText: {},
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'space-between',
  },
  modalTitle: { color: '#0A62EA' },
  modalContent: {},
  modalText: {},
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
