import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  I18nManager,
  Image,
  StyleSheet,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { useComponentContext } from '../context/globalAppContext';
import ImagePickerModal from '../components/ui/ImagePickerModal';
import { uploadImageToSupabase } from '../utils/supabase/uploadImageToSupabase';
import { icons } from '../constants/icons';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import TagSelector from '../components/TagSelector';
import CustomPicker from '../components/ui/CustomPicker';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { user, themeController, session, languageController } =
    useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      scrollContentPaddingHorizontal: isWebLandscape ? '6%' : '8%',
      scrollContentPaddingVertical: isWebLandscape ? web(0) : mobile(20),
      titleFontSize: isWebLandscape ? web(24) : mobile(24),
      titleMarginBottom: isWebLandscape ? web(0) : mobile(18),
      step2TitleMarginBottom: isWebLandscape ? web(36) : mobile(36),
      buttonPaddingVertical: isWebLandscape ? web(12) : mobile(12),
      buttonBorderRadius: isWebLandscape ? web(8) : mobile(8),
      buttonWidth: isWebLandscape ? web(330) : '100%',
      buttonHeight: isWebLandscape ? web(62) : mobile(62),
      buttonTextFontSize: isWebLandscape ? web(20) : mobile(20),
      progressContainerMarginVertical: isWebLandscape ? web(14) : mobile(14),
      dotMarginHorizontal: isWebLandscape ? web(14) : mobile(14),
      backArrowTop: isWebLandscape ? web(72) : mobile(20),
      backArrowHeight: isWebLandscape ? web(24) : mobile(24),
      backArrowSide: isWebLandscape ? web(height * 1.4 * 0.1) : mobile(10),
      finishedTextFontSize: isWebLandscape ? web(18) : mobile(18),
      termsBoxPaddingVertical: isWebLandscape ? web(5) : mobile(5),
      termsBoxMarginBottom: isWebLandscape ? web(12) : mobile(12),
      termsBoxTextFontSize: isWebLandscape ? web(16) : mobile(16),
      termsBoxTextLineHeight: isWebLandscape ? web(18) : mobile(18),
      termsCheckboxTextFontSize: isWebLandscape ? web(13) : mobile(13),
      avatarContainerMarginBottom: isWebLandscape ? web(40) : mobile(40),
      avatarContainerHeight: isWebLandscape ? web(158) : mobile(158),
      avatarWrapperBorderRadius: isWebLandscape ? web(50) : mobile(60),
      avatarImageBorderRadius: isWebLandscape ? web(50) : mobile(60),
      cameraButtonWidth: isWebLandscape ? web(26) : mobile(26),
      cameraButtonHeight: isWebLandscape ? web(26) : mobile(26),
      cameraButtonBorderRadius: isWebLandscape ? web(60) : mobile(70),
      avatarRecommendsTextMarginTop: isWebLandscape ? web(8) : mobile(10),
      avatarRecommendsTextFontSize: isWebLandscape ? web(14) : mobile(14),
      avatarRecommendsTextPaddingHorizontal: isWebLandscape
        ? web(0)
        : mobile(20),
      inputBlockMarginBottom: isWebLandscape ? web(32) : mobile(24),
      inputBlockBorderRadius: isWebLandscape ? web(8) : mobile(8),
      inputBlockPaddingVertical: isWebLandscape ? web(8) : mobile(8),
      labelPaddingHorizontal: isWebLandscape ? web(16) : mobile(16),
      labelPaddingTop: isWebLandscape ? web(4) : mobile(6),
      labelFontSize: isWebLandscape ? web(12) : mobile(12),
      inputPaddingHorizontal: isWebLandscape ? web(16) : mobile(16),
      inputBorderRadius: isWebLandscape ? web(8) : mobile(8),
      inputFontSize: isWebLandscape ? web(16) : mobile(16),
      multilineInputHeight: isWebLandscape ? web(100) : mobile(100),
      multilineInputMarginBottom: isWebLandscape ? web(25) : mobile(25),
      inputsContainerPaddingHorizontal: isWebLandscape ? web(10) : mobile(10),
      typeTagsSelectorMarginBottom: isWebLandscape ? web(32) : mobile(32),
      activeDotSize: isWebLandscape ? web(12) : mobile(12),
      secondDotSize: isWebLandscape ? web(8) : mobile(8),
      smallDotSize: isWebLandscape ? web(4) : mobile(4),
      arrowSideMove: isWebLandscape ? web(200) : mobile(10),
      checkboxSize: isWebLandscape ? web(18) : mobile(18),
      checkboxRadius: isWebLandscape ? web(3) : mobile(3),
      checkboxTextSize: isWebLandscape ? web(10) : mobile(10),
      inputMarginBottom: isWebLandscape ? web(3) : mobile(4),
      containerGap: isWebLandscape ? web(25) : mobile(25),
      containerPaddingHorizontal: isWebLandscape ? web(10) : mobile(10),
      primaryButtonWidth: isWebLandscape ? web(153) : null,
      step3Gap: isWebLandscape ? web(108) : 0,
      finalMarginBottom: isWebLandscape ? 0 : mobile(20),
      mobileSelectorPickersMarginVertical: mobile(24),
      inputHeight: isWebLandscape ? web(64) : mobile(64),
      inputWidth: isWebLandscape ? web(330) : '100%',
    };
  }, [isWebLandscape, height]);

  const [step, setStep] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    surname: '',
  });
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  // Step 3 states
  const [selectedJobTypes, setSelectedJobTypes] = useState([]);
  const [selectedLicenseTypes, setSelectedLicenseTypes] = useState([]);
  const [qualificationLevel, setQualificationLevel] = useState(null);

  const isNameValid = form.name.trim().length > 1;
  const isSurnameValid = form.surname.trim().length > 1;

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  // загрузка в supabase
  async function uploadImage(uri) {
    const res = await uploadImageToSupabase(uri, user?.current?.id, {
      bucket: 'avatars',
      isAvatar: true,
    });
    setAvatarUrl(res.publicUrl);
  }

  async function handleSubmit() {
    try {
      setLoading(true);
      const updatedUser = {};
      if (form.name) updatedUser.name = form.name;
      if (form.surname) updatedUser.surname = form.surname;
      if (form.description) updatedUser.about = form.description;
      if (avatarUrl) updatedUser.avatar = avatarUrl;
      if (selectedJobTypes.length > 0) updatedUser.jobTypes = selectedJobTypes;
      if (selectedLicenseTypes.length > 0)
        updatedUser.professions = selectedLicenseTypes;
      if (qualificationLevel)
        updatedUser.qualificationLevel = qualificationLevel;
      // if (experience) updatedUser.experience = experience;

      await user.update({ ...updatedUser, is_password_exist: true });
      setFinished(true);
      setTimeout(() => {
        // navigation.replace("MainApp");
      }, 1500);
    } catch (e) {
      console.error('❌ Ошибка при обновлении:', e);
    } finally {
      setLoading(false);
    }
  }

  // === Прогресс (точки) ===
  // const totalSteps = 4;
  const totalSteps = 2;
  const ProgressDots = () => (
    <View
      style={[
        styles.progressContainer,
        { marginVertical: sizes.progressContainerMarginVertical },
      ]}
    >
      {Array.from({ length: totalSteps }).map((_, i) => {
        const active = step === i + 1;
        const distance = Math.abs(step - (i + 1));
        const size = active
          ? sizes.activeDotSize
          : distance === 1
          ? sizes.secondDotSize
          : sizes.smallDotSize;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              { marginHorizontal: sizes.dotMarginHorizontal },
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: active
                  ? theme.primaryColor
                  : theme.buttonColorPrimaryDisabled,
              },
            ]}
          />
        );
      })}
    </View>
  );

  // === Кнопка ===
  const PrimaryButton = ({ title, onPress, disabled, customStyle }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        {
          paddingVertical: sizes.buttonPaddingVertical,
          borderRadius: sizes.buttonBorderRadius,
          width: sizes.buttonWidth,
          height: sizes.buttonHeight,
        },
        {
          backgroundColor: disabled
            ? theme.buttonColorPrimaryDisabled
            : theme.buttonColorPrimaryDefault,
        },
        customStyle?.btn,
      ]}
    >
      {typeof title === 'string' ? (
        <Text
          style={[
            styles.buttonText,
            {
              fontSize: sizes.buttonTextFontSize,
              color: theme.buttonTextColorPrimary,
            },
            customStyle?.btnText,
          ]}
        >
          {title}
        </Text>
      ) : (
        title
      )}
    </TouchableOpacity>
  );

  // === Навигационная стрелка ===
  const BackArrow = () => (
    <TouchableOpacity
      onPress={() => (step > 1 ? setStep(step - 1) : session.signOut())}
      style={[
        styles.backArrow,
        {
          top: sizes.backArrowTop,
          height: sizes.backArrowHeight,
          [isRTL ? 'right' : 'left']: sizes.backArrowSide,
        },
      ]}
    >
      <Image
        style={styles.backArrowImage}
        source={isRTL ? icons.arrowRight : icons.arrowLeft}
        tintColor={themeController?.current.unactiveTextColor}
      />
    </TouchableOpacity>
  );

  if (finished) {
    return (
      <View
        style={[
          styles.finishedContainer,
          { backgroundColor: theme.backgroundColor },
        ]}
      >
        <Text
          style={[
            styles.finishedText,
            { color: theme.textColor, fontSize: sizes.finishedTextFontSize },
          ]}
        >
          {t('register.register_success')}
        </Text>
      </View>
    );
  }

  // ограничитель ширины контента на web/landscape — не шире половины высоты окна
  const contentWidthStyle = isWebLandscape
    ? { width: step === 1 ? height * 0.7 : height * 0.4 }
    : { width: '100%' };

  const jobTypes = t('jobTypes', { returnObjects: true });
  const licenses = t('licenses', { returnObjects: true });

  const qualificationLevels = [
    { label: t('register.qualifications.beginner'), value: 'beginner' },
    { label: t('register.qualifications.intermediate'), value: 'intermediate' },
    { label: t('register.qualifications.advanced'), value: 'advanced' },
    {
      label: t('register.qualifications.professional'),
      value: 'professional',
    },
    { label: t('register.qualifications.expert'), value: 'expert' },
  ];

  // const experienceLevels = [
  //   { label: t('register.experience.none'), value: 'none' },
  //   { label: t('register.experience.less_1'), value: 'less_1' },
  //   { label: t('register.experience.1_3'), value: '1_3' },
  //   { label: t('register.experience.3_5'), value: '3_5' },
  //   { label: t('register.experience.5_plus'), value: '5_plus' },
  // ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundColor },
        isWebLandscape
          ? { justifyContent: 'center', alignItems: 'center', height: '100vh' }
          : null,
      ]}
    >
      <BackArrow />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: sizes.scrollContentPaddingHorizontal,
            paddingVertical: sizes.scrollContentPaddingVertical,
          },
          !isWebLandscape && { height: '100%' },
          !isWebLandscape &&
            step === 2 && {
              paddingHorizontal: 0,
            },
          !isWebLandscape &&
            step === 3 && {
              paddingHorizontal: sizes.containerPaddingHorizontal,
            },
          isWebLandscape
            ? {
                alignItems: 'center',
                justifyContent: 'center',
                height: scaleByHeight(688, height),
                boxSizing: 'border-box',
                marginTop: scaleByHeight(180, height),
              }
            : null,
        ]}
        keyboardShouldPersistTaps='handled'
        scrollEnabled={Platform.OS === 'web'} // на web скроллим, на мобиле контент влезает
      >
        <View
          style={[
            styles.contentBlock,
            contentWidthStyle,
            { height: '100%', justifyContent: 'space-between' },
            isWebLandscape &&
              step === 2 && {
                height: scaleByHeight(741, height),
                width: scaleByHeight(354, height),
              },
            isWebLandscape &&
              step === 3 && {
                height: scaleByHeight(741, height),
                width: scaleByHeight(951, height),
              },
          ]}
        >
          {step === 1 && (
            <>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.primaryColor,
                    fontSize: sizes.titleFontSize,
                    marginBottom: sizes.titleMarginBottom,
                  },
                ]}
              >
                {t('register.terms_title')}
              </Text>

              <ScrollView
                style={[
                  styles.termsBox,
                  {
                    paddingVertical: sizes.termsBoxPaddingVertical,
                    marginBottom: sizes.termsBoxMarginBottom,
                  },
                  isWebLandscape
                    ? { height: '40vh', maxHeight: '40vh' } // компактнее на web-экранах
                    : null,
                ]}
              >
                <Text
                  style={[
                    styles.termsBoxText,
                    {
                      color: theme.formInputLabelColor,
                      fontSize: sizes.termsBoxTextFontSize,
                      lineHeight: sizes.termsBoxTextLineHeight,
                    },
                  ]}
                >
                  {t('register.terms_text')}
                </Text>
              </ScrollView>

              <BouncyCheckbox
                size={sizes.checkboxSize}
                isChecked={accepted}
                onPress={setAccepted}
                text={t('register.terms_accept')}
                textStyle={[
                  styles.termsCheckboxText,
                  {
                    fontSize: sizes.termsCheckboxTextFontSize,
                    textAlign: isRTL ? 'right' : 'left',
                    color: theme.unactiveTextColor,
                    textDecorationLine: 'none',
                  },
                ]}
                textContainerStyle={{
                  [isRTL ? 'marginRight' : 'marginLeft']:
                    sizes.checkboxTextSize,
                }}
                fillColor={theme.primaryColor}
                innerIconStyle={{
                  borderWidth: 2,
                  borderRadius: sizes.checkboxRadius,
                }}
                iconStyle={{
                  borderRadius: sizes.checkboxRadius,
                }}
              />

              <ProgressDots />

              <PrimaryButton
                title={t('register.next')}
                onPress={() => setStep(2)}
                disabled={!accepted}
              />
            </>
          )}

          {step === 2 && (
            <>
              <Text
                style={[
                  styles.title,
                  {
                    color: theme.textColor,
                    fontSize: sizes.titleFontSize,
                    marginBottom: sizes.step2TitleMarginBottom,
                  },
                ]}
              >
                {t('register.profile_create')}
              </Text>

              {/* --- Аватар --- */}
              <View
                style={[
                  styles.avatarContainer,
                  {
                    marginBottom: sizes.avatarContainerMarginBottom,
                    height: sizes.avatarContainerHeight,
                  },
                ]}
              >
                <View
                  style={[
                    styles.avatarWrapper,
                    { borderRadius: sizes.avatarWrapperBorderRadius },
                  ]}
                >
                  <Image
                    source={
                      avatarUrl ? { uri: avatarUrl } : icons.defaultAvatar
                    }
                    style={[
                      styles.avatarImage,
                      { borderRadius: sizes.avatarImageBorderRadius },
                    ]}
                  />
                  <TouchableOpacity
                    style={[
                      styles.cameraButton,
                      {
                        width: sizes.cameraButtonWidth,
                        height: sizes.cameraButtonHeight,
                        borderRadius: sizes.cameraButtonBorderRadius,
                      },
                    ]}
                    onPress={() => setPickerVisible(true)}
                  >
                    <Image source={icons.camera} style={styles.cameraIcon} />
                  </TouchableOpacity>
                </View>
                <Text
                  style={[
                    styles.avatarRecommendsText,
                    {
                      color: theme.textColor,
                      marginTop: sizes.avatarRecommendsTextMarginTop,
                      fontSize: sizes.avatarRecommendsTextFontSize,
                      paddingHorizontal:
                        sizes.avatarRecommendsTextPaddingHorizontal,
                    },
                  ]}
                >
                  {t('register.profile_avatar_recommended')}
                </Text>
              </View>

              {/* --- Модалка выбора изображения --- */}
              <ImagePickerModal
                visible={pickerVisible}
                onClose={() => setPickerVisible(false)}
                onAdd={async (uris) => {
                  if (uris?.length > 0) {
                    await uploadImage(uris[0]);
                  }
                }}
              />

              {/* --- Имя и Фамилия + About--- */}
              <View
                style={[
                  styles.inputsContainer,
                  { paddingHorizontal: sizes.inputsContainerPaddingHorizontal },
                ]}
              >
                <View
                  style={[
                    styles.inputBlock,
                    {
                      backgroundColor: theme.formInputBackground,
                      marginBottom: sizes.inputBlockMarginBottom,
                      borderRadius: sizes.inputBlockBorderRadius,
                      paddingVertical: sizes.inputBlockPaddingVertical,
                      height: sizes.inputHeight,
                      width: sizes.inputWidth,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.label,
                      {
                        textAlign: isRTL ? 'right' : 'left',
                        color: theme.textColor,
                        paddingHorizontal: sizes.labelPaddingHorizontal,
                        paddingTop: sizes.labelPaddingTop,
                        fontSize: sizes.labelFontSize,
                      },
                    ]}
                  >
                    {t('register.name')} ({t('register.required')})
                  </Text>
                  <TextInput
                    placeholder={t('register.name')}
                    value={form.name}
                    onChangeText={(txt) => setForm({ ...form, name: txt })}
                    style={[
                      styles.input,
                      {
                        textAlign: isRTL ? 'right' : 'left',
                        color: theme.textColor,
                        backgroundColor: theme.defaultBlocksBackground,
                        borderColor: theme.borderColor,
                        borderWidth: 1,
                        // прозрачный инпут внутри окрашенного fieldBlock
                        backgroundColor: 'transparent',
                        borderWidth: 0,
                        marginBottom: sizes.inputMarginBottom,
                        paddingHorizontal: sizes.inputPaddingHorizontal,
                        borderRadius: sizes.inputBorderRadius,
                        fontSize: sizes.inputFontSize,
                      },
                      isWebLandscape
                        ? {
                            // убираем чёрную обводку (RN Web)
                            outlineStyle: 'none',
                            outlineWidth: 0,
                            outlineColor: 'transparent',
                            boxShadow: 'none',
                          }
                        : null,
                    ]}
                    placeholderTextColor={theme.formInputPlaceholderColor}
                  />
                </View>

                <View
                  style={[
                    styles.inputBlock,
                    {
                      backgroundColor: theme.formInputBackground,
                      marginBottom: sizes.inputBlockMarginBottom,
                      borderRadius: sizes.inputBlockBorderRadius,
                      paddingVertical: sizes.inputBlockPaddingVertical,
                      height: sizes.inputHeight,
                      width: sizes.inputWidth,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.label,
                      {
                        textAlign: isRTL ? 'right' : 'left',
                        color: theme.textColor,
                        paddingHorizontal: sizes.labelPaddingHorizontal,
                        paddingTop: sizes.labelPaddingTop,
                        fontSize: sizes.labelFontSize,
                      },
                    ]}
                  >
                    {t('register.surname')} ({t('register.required')})
                  </Text>
                  <TextInput
                    placeholder={t('register.surname')}
                    value={form.surname}
                    onChangeText={(txt) => setForm({ ...form, surname: txt })}
                    style={[
                      styles.input,
                      {
                        textAlign: isRTL ? 'right' : 'left',
                        color: theme.textColor,
                        backgroundColor: theme.defaultBlocksBackground,
                        borderColor: theme.borderColor,
                        borderWidth: 1,
                        // прозрачный инпут внутри окрашенного fieldBlock
                        backgroundColor: 'transparent',
                        borderWidth: 0,
                        marginBottom: sizes.inputMarginBottom,
                        paddingHorizontal: sizes.inputPaddingHorizontal,
                        borderRadius: sizes.inputBorderRadius,
                        fontSize: sizes.inputFontSize,
                      },
                      isWebLandscape
                        ? {
                            // убираем чёрную обводку (RN Web)
                            outlineStyle: 'none',
                            outlineWidth: 0,
                            outlineColor: 'transparent',
                            boxShadow: 'none',
                          }
                        : null,
                    ]}
                    placeholderTextColor={theme.formInputPlaceholderColor}
                  />
                </View>

                <View
                  style={[
                    styles.inputBlock,
                    {
                      backgroundColor: theme.formInputBackground,
                      marginBottom: sizes.inputBlockMarginBottom,
                      borderRadius: sizes.inputBlockBorderRadius,
                      paddingVertical: sizes.inputBlockPaddingVertical,
                      width: sizes.inputWidth,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.label,
                      {
                        textAlign: isRTL ? 'right' : 'left',
                        color: theme.textColor,
                        paddingHorizontal: sizes.labelPaddingHorizontal,
                        paddingTop: sizes.labelPaddingTop,
                        fontSize: sizes.labelFontSize,
                      },
                    ]}
                  >
                    {t('register.profile_description')}
                  </Text>
                  <TextInput
                    placeholder={t('register.description_placeholder')}
                    value={form.description}
                    onChangeText={(txt) =>
                      setForm({ ...form, description: txt })
                    }
                    multiline
                    style={[
                      styles.input,
                      {
                        height: sizes.multilineInputHeight,
                        textAlign: isRTL ? 'right' : 'left',
                        color: theme.textColor,
                        backgroundColor: theme.defaultBlocksBackground,
                        borderColor: theme.borderColor,
                        borderWidth: 1,
                        // прозрачный инпут внутри окрашенного fieldBlock
                        backgroundColor: 'transparent',
                        borderWidth: 0,
                        marginBottom: sizes.multilineInputMarginBottom,
                        paddingHorizontal: sizes.inputPaddingHorizontal,
                        borderRadius: sizes.inputBorderRadius,
                        fontSize: sizes.inputFontSize,
                      },
                      isWebLandscape
                        ? {
                            // убираем чёрную обводку (RN Web)
                            outlineStyle: 'none',
                            outlineWidth: 0,
                            outlineColor: 'transparent',
                            boxShadow: 'none',
                          }
                        : null,
                    ]}
                    placeholderTextColor={theme.formInputPlaceholderColor}
                  />
                </View>
              </View>

              <ProgressDots />

              <View
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  gap: sizes.containerGap,
                  paddingHorizontal: sizes.containerPaddingHorizontal,
                }}
              >
                <PrimaryButton
                  title={t('register.previous')}
                  onPress={() => setStep(1)}
                  customStyle={{
                    btn: {
                      flex: 1,
                      backgroundColor: 'transparent',
                      borderWidth: 1,
                      borderColor: theme.primaryColor,
                    },
                    btnText: { color: theme.primaryColor },
                  }}
                />
                <PrimaryButton
                  // title={t('register.next')}
                    title={
                      loading ? (
                        <ActivityIndicator
                          color={theme.buttonTextColorPrimary}
                        />
                      ) : (
                        t('register.create')
                      )
                    }
                  // onPress={() => setStep(3)}
                  onPress={handleSubmit}
                  disabled={!isNameValid || !isSurnameValid || loading}
                  customStyle={{ btn: { flex: 1 } }}
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {},
  contentBlock: {
    alignSelf: 'center',
  },

  title: {
    textAlign: 'center',
    fontFamily: 'Rubik-Bold',
  },

  button: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    width: '100%', // ширина контролируется контейнером contentBlock
  },
  buttonText: {},

  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {},

  backArrow: {
    position: 'absolute',
    zIndex: 10,
  },
  backArrowImage: { height: '100%', resizeMode: 'contain' },

  finishedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishedText: {},

  termsBox: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  termsBoxText: {},
  termsCheckboxText: {
    fontFamily: 'Rubik-SemiBold',
  },

  avatarContainer: {
    alignItems: 'center',
  },
  avatarWrapper: {
    height: '60%',
    aspectRatio: 1,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cameraButton: {
    position: 'absolute',
    bottom: '-2%',
    right: '-2%',
    overflow: 'hidden',
  },
  cameraIcon: { width: '100%', height: '100%' },
  avatarRecommendsText: {
    textAlign: 'center',
    opacity: 0.7,
  },

  inputsContainer: {
    flexGrow: 1,
  },
  inputBlock: {
    ...Platform.select({
      web: { zIndex: 1 },
    }),
  },
  label: {},
  input: {},
});


// 
          // {step === 3 && (
          //   <>
          //     <Text
          //       style={[
          //         styles.title,
          //         {
          //           color: theme.textColor,
          //           fontSize: sizes.titleFontSize,
          //         },
          //       ]}
          //     >
          //       {t('register.profile_create')}
          //     </Text>

          //     <View
          //       style={
          //         isWebLandscape
          //           ? { flexDirection: 'row', gap: sizes.step3Gap }
          //           : {}
          //       }
          //     >
          //       {/* Left Column */}
          //       <View
          //         style={
          //           isWebLandscape
          //             ? { flex: 1.5 }
          //             : {
          //                 marginVertical:
          //                   sizes.mobileSelectorPickersMarginVertical,
          //               }
          //         }
          //       >
          //         <TagSelector
          //           title={t('register.job_types_title')}
          //           subtitle={t('register.job_types_subtitle')}
          //           options={jobTypes}
          //           selectedItems={selectedJobTypes}
          //           setSelectedItems={setSelectedJobTypes}
          //           containerStyle={{
          //             marginBottom: sizes.typeTagsSelectorMarginBottom,
          //           }}
          //           numberOfRows={6}
          //         />
          //         <TagSelector
          //           title={t('register.license_types_title')}
          //           subtitle={t('register.license_types_subtitle')}
          //           options={licenses}
          //           selectedItems={selectedLicenseTypes}
          //           setSelectedItems={setSelectedLicenseTypes}
          //           numberOfRows={2}
          //         />
          //       </View>

          //       {/* Right Column */}
          //       <View
          //         style={
          //           isLandscape && Platform.OS === 'web' ? { flex: 1 } : {}
          //         }
          //       >
          //         <CustomPicker
          //           label={t('register.qualification_label')}
          //           options={qualificationLevels}
          //           selectedValue={qualificationLevel}
          //           onValueChange={setQualificationLevel}
          //           isRTL={isRTL}
          //           containerStyle={{
          //             marginBottom: sizes.typeTagsSelectorMarginBottom,
          //           }}
          //         />
          //         {/* <CustomPicker
          //           label={t('register.experience_label')}
          //           options={experienceLevels}
          //           selectedValue={experience}
          //           onValueChange={setExperience}
          //           isRTL={isRTL}
          //           containerStyle={{
          //             marginBottom: sizes.typeTagsSelectorMarginBottom,
          //           }}
          //         /> */}
          //         <View
          //           style={[
          //             styles.inputBlock,
          //             {
          //               backgroundColor: theme.formInputBackground,
          //               marginBottom: sizes.inputBlockMarginBottom,
          //               borderRadius: sizes.inputBlockBorderRadius,
          //               paddingVertical: sizes.inputBlockPaddingVertical,
          //             },
          //           ]}
          //         >
          //           <Text
          //             style={[
          //               styles.label,
          //               {
          //                 textAlign: isRTL ? 'right' : 'left',
          //                 color: theme.textColor,
          //                 paddingHorizontal: sizes.labelPaddingHorizontal,
          //                 paddingTop: sizes.labelPaddingTop,
          //                 fontSize: sizes.labelFontSize,
          //               },
          //             ]}
          //           >
          //             {t('register.profile_description')}
          //           </Text>
          //           <TextInput
          //             placeholder={t('register.description_placeholder')}
          //             value={form.description}
          //             onChangeText={(txt) =>
          //               setForm({ ...form, description: txt })
          //             }
          //             multiline
          //             style={[
          //               styles.input,
          //               {
          //                 height: sizes.multilineInputHeight,
          //                 textAlign: isRTL ? 'right' : 'left',
          //                 color: theme.textColor,
          //                 backgroundColor: theme.defaultBlocksBackground,
          //                 borderColor: theme.borderColor,
          //                 borderWidth: 1,
          //                 // прозрачный инпут внутри окрашенного fieldBlock
          //                 backgroundColor: 'transparent',
          //                 borderWidth: 0,
          //                 marginBottom: sizes.multilineInputMarginBottom,
          //                 paddingHorizontal: sizes.inputPaddingHorizontal,
          //                 borderRadius: sizes.inputBorderRadius,
          //                 fontSize: sizes.inputFontSize,
          //               },
          //               isWebLandscape
          //                 ? {
          //                     // убираем чёрную обводку (RN Web)
          //                     outlineStyle: 'none',
          //                     outlineWidth: 0,
          //                     outlineColor: 'transparent',
          //                     boxShadow: 'none',
          //                   }
          //                 : null,
          //             ]}
          //             placeholderTextColor={theme.formInputPlaceholderColor}
          //           />
          //         </View>
          //       </View>
          //     </View>
          //     <View>
          //       <ProgressDots />

          //       <View
          //         style={[
          //           {
          //             flexDirection: isRTL ? 'row-reverse' : 'row',
          //             justifyContent: 'center',
          //             gap: sizes.containerGap,
          //           },
          //           { marginBottom: sizes.finalMarginBottom },
          //         ]}
          //       >
          //         <PrimaryButton
          //           title={t('register.previous')}
          //           onPress={() => setStep(2)}
          //           customStyle={{
          //             btn: {
          //               backgroundColor: 'transparent',
          //               borderWidth: 1,
          //               borderColor: theme.primaryColor,
          //               width: sizes.primaryButtonWidth,
          //               flex: isWebLandscape ? null : 1,
          //             },
          //             btnText: { color: theme.primaryColor },
          //           }}
          //         />
          //         <PrimaryButton
          //           title={
          //             loading ? (
          //               <ActivityIndicator
          //                 color={theme.buttonTextColorPrimary}
          //               />
          //             ) : (
          //               t('register.create')
          //             )
          //           }
          //           onPress={handleSubmit}
          //           disabled={loading}
          //           customStyle={{
          //             btn: {
          //               width: sizes.primaryButtonWidth,
          //               flex: isWebLandscape ? null : 1,
          //             },
          //           }}
          //         />
          //       </View>
          //     </View>
          //   </>
          // )}
          // End of step 3