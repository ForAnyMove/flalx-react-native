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
} from 'react-native';
import { useComponentContext } from '../../../context/globalAppContext';
import CustomPicker from '../../../components/ui/CustomPicker';
import { icons } from '../../../constants/icons';
import { useState } from 'react';
import { useWindowInfo } from '../../../context/windowContext';
import { useTranslation } from 'react-i18next';
import { scaleByHeight } from '../../../utils/resizeFuncs';
import { RFValue } from 'react-native-responsive-fontsize';
import BouncyCheckbox from 'react-native-bouncy-checkbox';

// getResponsiveSize helper was unused and removed

export default function Settings() {
  const { themeController, languageController } = useComponentContext();
  const { height, isLandscape } = useWindowInfo();
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  // Toggles
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Modals
  const [aboutVisible, setAboutVisible] = useState(false);
  const [regulationsVisible, setRegulationsVisible] = useState(false);
  const [contactUsVisible, setContactUsVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  // размеры/отступы
  const sizes = {
    baseFont: isWebLandscape ? scaleByHeight(16, height) : RFValue(12),
    font: isWebLandscape ? scaleByHeight(12, height) : RFValue(12),
    questionsFont: isWebLandscape ? scaleByHeight(18, height) : RFValue(10),
    iconCircleSize: isWebLandscape ? scaleByHeight(40, height) : RFValue(22),
    iconSize: isWebLandscape ? scaleByHeight(18, height) : RFValue(18),
    containerPadding: isWebLandscape ? height * 0.02 : RFValue(10),
    pickerHeight: isWebLandscape ? height * 0.06 : RFValue(50),
    rowGap: isWebLandscape ? height * 0.015 : RFValue(10),
    colGap: isWebLandscape ? height * 0.02 : 0,
    switchMargin: isWebLandscape ? height * 0.02 : RFValue(16),
    btnPadding: isWebLandscape ? height * 0.015 : RFValue(12),
    btnFont: isWebLandscape ? scaleByHeight(20, height) : RFValue(12),
    rowsWidth: isWebLandscape ? '65%' : '100%',
    rowsAlign: isWebLandscape ? (isRTL ? 'flex-end' : 'flex-start') : 'stretch',
    bottomInset: isWebLandscape ? height * 0.02 : 0,
    borderRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(5),
    regulationsModalWidth: isWebLandscape ? scaleByHeight(480, height) : '100%',
    regulationsModalHeight: isWebLandscape
      ? scaleByHeight(600, height)
      : '100%',
    aboutModalHeight: isWebLandscape ? scaleByHeight(650, height) : '100%',
    modalIconSize: isWebLandscape ? scaleByHeight(24, height) : RFValue(15),
    modalCloseBtnTopRightPosition: isWebLandscape
      ? scaleByHeight(7, height)
      : RFValue(5),
    regulationsModalPaddingVertical: isWebLandscape
      ? scaleByHeight(36, height)
      : RFValue(10),
    regulationsModalPaddingHorizontal: isWebLandscape
      ? scaleByHeight(44, height)
      : RFValue(10),
    regulationsModalTitle: isWebLandscape
      ? scaleByHeight(24, height)
      : RFValue(18),
    modalContentHeight: isWebLandscape
      ? scaleByHeight(440, height)
      : RFValue(400),
    avatarModalMarginBottom: isWebLandscape
      ? scaleByHeight(16, height)
      : RFValue(16),
    nonAvatarModalMarginBottom: isWebLandscape
      ? scaleByHeight(24, height)
      : RFValue(20),
    avatarSize: isWebLandscape ? scaleByHeight(80, height) : RFValue(65),
    contactUsModalHeight: isWebLandscape ? scaleByHeight(790, height) : '100%',
    feedbackModalHeight: isWebLandscape ? scaleByHeight(480, height) : '100%',
    sendContactFormModalHeight: isWebLandscape
      ? scaleByHeight(450, height)
      : '100%',
    inputContainerPaddingVertical: isWebLandscape
      ? scaleByHeight(10, height)
      : RFValue(6),
    inputContainerPaddingHorizontal: isWebLandscape
      ? scaleByHeight(16, height)
      : RFValue(8),
    inputHeight: isWebLandscape ? scaleByHeight(64, height) : RFValue(40),
    inputWidth: isWebLandscape ? scaleByHeight(330, height) : RFValue(150),
    textAreaHeight: isWebLandscape ? scaleByHeight(144, height) : RFValue(40),
    textInputPadding: isWebLandscape ? scaleByHeight(4, height) : RFValue(8),
    inputFont: isWebLandscape ? scaleByHeight(16, height) : RFValue(10),
    checkboxIconSize: isWebLandscape ? scaleByHeight(14, height) : RFValue(13),
  };

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
          padding: sizes.containerPadding,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={{
          paddingBottom: isWebLandscape ? height * 0.18 : RFValue(40),
        }}
      >
        {/* Break Line */}
        <View
          style={[
            styles.breakLine,
            { backgroundColor: themeController.current?.breakLineColor },
          ]}
        />
        {/* Language + Theme */}
        <View
          style={[
            rowStyle,
            isWebLandscape && { height: scaleByHeight(64, height) },
          ]}
        >
          <CustomPicker
            label={t('settings.language')}
            options={[
              { label: t('settings.lang_en', 'English'), value: 'en' },
              { label: t('settings.lang_he', 'עברית'), value: 'he' },
            ]}
            selectedValue={languageController.current}
            onValueChange={(itemValue) =>
              languageController.setLang(itemValue)
            }
            isRTL={isRTL}
            sizes={sizes}
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
            sizes={sizes}
          />
        </View>

        {/* Break Line */}
        <View
          style={[
            styles.breakLine,
            { backgroundColor: themeController.current?.breakLineColor },
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
                styles.switchName,
                {
                  color: themeController.current?.unactiveTextColor,
                  fontSize: sizes.baseFont,
                },
              ]}
            >
              {t('settings.location')}
            </Text>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
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
                styles.switchName,
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
            { backgroundColor: themeController.current?.breakLineColor },
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
              },
              isWebLandscape && {
                height: scaleByHeight(62, height),
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
              },
              isWebLandscape && {
                height: scaleByHeight(62, height),
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
          },
          isWebLandscape && { justifyContent: 'flex-start' },
        ]}
      >
        <View
          style={
            isWebLandscape && {
              [isRTL ? 'marginLeft' : 'marginRight']: scaleByHeight(93, height),
              marginBottom: scaleByHeight(55, height),
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
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <TouchableOpacity
            style={{
              marginRight: isRTL ? 0 : RFValue(10),
              marginLeft: isRTL ? RFValue(10) : 0,
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
              marginRight: isRTL ? 0 : RFValue(10),
              marginLeft: isRTL ? RFValue(10) : 0,
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
  height
}) {
  const { themeController } = useComponentContext();
  const { t } = useTranslation();

  const [accepted, setAccepted] = useState(false);
  const [contactUsForm, setContactUsForm] = useState({
    topic: '',
    message: '',
    email: '',
    name: '',
    reason: '',
  });

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
        onPress={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        style={[
          {
            position: 'relative',
            paddingVertical: sizes.regulationsModalPaddingVertical,
            paddingHorizontal: sizes.regulationsModalPaddingHorizontal,
            justifyContent: 'center',
          },
          isWebLandscape && {
            width: sizes.regulationsModalWidth,
            height: avatar
              ? sizes.aboutModalHeight
              : sizes.regulationsModalHeight,
            borderRadius: sizes.borderRadius,
            backgroundColor: themeController.current?.backgroundColor,
          },
        ]}
      >
        <View>
        <TouchableOpacity
          style={[
            {
              position: 'absolute',
              top: sizes.modalCloseBtnTopRightPosition,
              right: sizes.modalCloseBtnTopRightPosition,
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
                      paddingHorizontal: sizes.inputContainerPaddingHorizontal,
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
                      fontWeight: '500',
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
                      color: themeController.current?.unactiveTextColor,
                      fontSize: sizes.baseFont,
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
                      paddingHorizontal: sizes.inputContainerPaddingHorizontal,
                      borderRadius: sizes.borderRadius,
                      marginBottom: 0,
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
                      fontWeight: '500',
                      color: themeController.current?.textColor,
                      padding: 0,
                      paddingVertical: sizes.textInputPadding,
                      fontSize: sizes.inputFont,
                      borderRadius: sizes.borderRadius,
                      backgroundColor: 'transparent',
                      textAlign: isRTL ? 'right' : 'left',
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
                      paddingHorizontal: sizes.inputContainerPaddingHorizontal,
                      borderRadius: sizes.borderRadius,
                      marginBottom: 0,
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
                      fontWeight: '500',
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
                      paddingHorizontal: sizes.inputContainerPaddingHorizontal,
                      borderRadius: sizes.borderRadius,
                      marginBottom: 0,
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
                  />
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
                      fontWeight: '500',
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
                      label: t('settings.modals.contact_us.reason.option1', {
                        defaultValue: 'General Inquiry',
                      }),
                      value: 'general',
                    },
                    {
                      label: t('settings.modals.contact_us.reason.option2', {
                        defaultValue: 'Technical Support',
                      }),
                      value: 'technical',
                    },
                    {
                      label: t('settings.modals.contact_us.reason.option3', {
                        defaultValue: 'Feedback',
                      }),
                      value: 'feedback',
                    },
                  ]}
                  selectedValue={contactUsForm.reason}
                  onValueChange={(value) =>
                    setContactUsForm((p) => ({ ...p, reason: value }))
                  }
                  isRTL={isRTL}
                  sizes={sizes}
                />

                <View style={{ height: RFValue(20) }}>
                  <BouncyCheckbox
                    size={scaleByHeight(18, height)}
                    isChecked={accepted}
                    onPress={setAccepted}
                    text={t('register.terms_accept')}
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
                        scaleByHeight(10, height)
                      ,
                    }}
                    fillColor={themeController.current?.primaryColor}
                    innerIconStyle={{
                      borderWidth: scaleByHeight(
                        2,
                        height
                      ),
                      borderRadius: scaleByHeight(3, height),
                    }}
                    iconStyle={{
                      borderRadius: scaleByHeight(
                        3,
                        height
                      ),
                    }}
                  />
                  <Text
                    style={[
                      { color: themeController.current?.unactiveTextColor },
                    ]}
                  >
                    {t('settings.modals.contact_us.privacy_policy')}
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
                      fontSize: sizes.baseFont,
                    },
                  ]}
                >
                  {t('settings.feedback_title')}
                </Text>
                <Text
                  style={[
                    {
                      color: themeController.current?.primaryColor,
                      fontSize: sizes.baseFont,
                    },
                  ]}
                >
                  +1(800) 123-456
                </Text>
                <Text
                  style={[
                    {
                      color: themeController.current?.unactiveTextColor,
                      fontSize: sizes.baseFont,
                    },
                  ]}
                >
                  {t('settings.feedback_description')}
                </Text>
                <View style={{ height: RFValue(20) }}>
                  <Text
                    style={[
                      {
                        color: themeController.current?.unactiveTextColor,
                        fontSize: sizes.baseFont,
                      },
                    ]}
                  >
                    {t('settings.feedback_email')}
                  </Text>
                  <TextInput
                    style={[
                      {
                        borderBottomWidth: 1,
                        borderBottomColor: themeController.current?.borderColor,
                        color: themeController.current?.textColor,
                        fontSize: sizes.baseFont,
                        paddingVertical: RFValue(8),
                      },
                    ]}
                    placeholder={t('settings.feedback_email_placeholder')}
                    placeholderTextColor={
                      themeController.current?.unactiveTextColor
                    }
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
                  marginTop: RFValue(20),
                },
              ]}
              onPress={() => {
                // TODO: implement submit behavior
                console.log('submit form', {
                  contactForm,
                  feedback,
                  contactUsForm,
                });
                onClose();
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
                {t(contactForm ? 'settings.send' : 'settings.submit')}
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
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pickerContainer: {
    marginBottom: RFValue(8),
    borderRadius: RFValue(6),
    paddingBottom: RFValue(6),
    justifyContent: 'space-between',
    position: 'relative',
  },
  picker: { backgroundColor: 'transparent', borderWidth: 0 },
  label: {
    // position: 'absolute',
    top: RFValue(5),
  },
  switchName: { fontWeight: 'bold' },
  breakLine: { height: 1, marginVertical: RFValue(8) },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryBtn: {
    borderRadius: RFValue(6),
    alignItems: 'center',
    marginVertical: RFValue(5),
  },
  // primaryText: { fontWeight: 'bold' },
  bottomRow: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: RFValue(20),
  },
  connectBtnsContainer: { gap: RFValue(5) },
  bottomText: { fontSize: RFValue(10) },
  versionText: { fontSize: RFValue(10) },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RFValue(10),
    borderBottomWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'space-between',
  },
  modalTitle: { fontSize: RFValue(20), color: '#0A62EA' },
  modalContent: { padding: RFValue(10) },
  modalText: {
    fontSize: RFValue(12),
    marginBottom: RFValue(8),
    lineHeight: RFValue(16),
  },
  inputBlock: {
    marginBottom: RFValue(10),
    borderRadius: RFValue(5),
    padding: RFValue(8),
    ...Platform.select({
      web: {
        zIndex: 1,
      },
    }),
  },
  termsCheckboxText: {
    // fontSize: getResponsiveSize(14, 13),
    opacity: 0.8,
    fontWeight: 'bold',
  },
});
