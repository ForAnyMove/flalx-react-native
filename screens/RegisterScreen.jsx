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
import { RFValue, RFPercentage } from 'react-native-responsive-fontsize';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { useComponentContext } from '../context/globalAppContext';
import ImagePickerModal from '../components/ui/ImagePickerModal';
import { uploadImageToSupabase } from '../utils/supabase/uploadImageToSupabase';
import { icons } from '../constants/icons';
import { scaleByHeight } from '../utils/resizeFuncs';
import TagSelector from '../components/TagSelector';
import CustomPicker from '../components/ui/CustomPicker';

// универсальная адаптация размеров: на мобиле RFValue, на web — уменьшенный фикс
const getResponsiveSize = (mobileSize, webSize) => {
  if (Platform.OS === 'web') return webSize;
  return RFValue(mobileSize);
};

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { user, themeController, session, languageController } =
    useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const dynamicStyles = useMemo(() => {
    return {
      title: {
        fontSize: getResponsiveSize(20, scaleByHeight(24, height)),
        // marginBottom: getResponsiveSize(20, scaleByHeight(20, height)),
      },
      step2Title: {
        marginBottom: getResponsiveSize(30, scaleByHeight(36, height)),
      },
      button: {
        paddingVertical: getResponsiveSize(14, scaleByHeight(12, height)),
        borderRadius: getResponsiveSize(10, scaleByHeight(8, height)),
        ...Platform.select({
          web: {
            width: scaleByHeight(330, height),
            height: scaleByHeight(62, height),
          },
        }),
      },
      buttonText: {
        fontSize: getResponsiveSize(16, scaleByHeight(20, height)),
      },
      progressContainer: {
        marginVertical: getResponsiveSize(20, scaleByHeight(14, height)),
      },
      dot: {
        marginHorizontal: getResponsiveSize(10, scaleByHeight(14, height)),
      },
      backArrow: {
        top: getResponsiveSize(20, scaleByHeight(72, height)),
        height: getResponsiveSize(30, scaleByHeight(24, height)),
        [isRTL ? 'right' : 'left']: getResponsiveSize(
          10,
          scaleByHeight(height * 1.4 * 0.1, height)
        ),
      },
      finishedText: {
        fontSize: getResponsiveSize(20, scaleByHeight(18, height)),
      },
      termsBox: {
        paddingVertical: getResponsiveSize(10, scaleByHeight(5, height)),
        marginBottom: getResponsiveSize(15, scaleByHeight(12, height)),
      },
      termsBoxText: {
        fontSize: getResponsiveSize(14, scaleByHeight(16, height)),
        lineHeight: getResponsiveSize(16, scaleByHeight(18, height)),
      },
      termsCheckboxText: {
        fontSize: getResponsiveSize(14, scaleByHeight(13, height)),
      },
      avatarContainer: {
        marginBottom: getResponsiveSize(10, scaleByHeight(40, height)),
        height: getResponsiveSize(150, scaleByHeight(158, height)),
      },
      avatarWrapper: {
        borderRadius: getResponsiveSize(60, scaleByHeight(50, height)),
      },
      avatarImage: {
        borderRadius: getResponsiveSize(60, scaleByHeight(50, height)),
      },
      cameraButton: {
        width: getResponsiveSize(26, scaleByHeight(26, height)),
        height: getResponsiveSize(26, scaleByHeight(26, height)),
        borderRadius: getResponsiveSize(70, scaleByHeight(60, height)),
      },
      avatarRecommendsText: {
        marginTop: getResponsiveSize(10, scaleByHeight(8, height)),
        fontSize: getResponsiveSize(12, scaleByHeight(14, height)),
        paddingHorizontal: getResponsiveSize(20, scaleByHeight(0, height)),
      },
      inputBlock: {
        marginBottom: getResponsiveSize(20, scaleByHeight(32, height)),
        borderRadius: getResponsiveSize(10, scaleByHeight(8, height)),
        paddingVertical: getResponsiveSize(5, scaleByHeight(8, height)),
      },
      label: {
        paddingHorizontal: getResponsiveSize(10, scaleByHeight(16, height)),
        paddingTop: getResponsiveSize(6, scaleByHeight(4, height)),
        fontSize: getResponsiveSize(12, scaleByHeight(12, height)),
      },
      input: {
        paddingHorizontal: getResponsiveSize(10, scaleByHeight(16, height)),
        borderRadius: getResponsiveSize(8, scaleByHeight(8, height)),
        fontSize: getResponsiveSize(14, scaleByHeight(16, height)),
      },
      multilineInput: {
        height: getResponsiveSize(120, scaleByHeight(100, height)),
        marginBottom: getResponsiveSize(25, scaleByHeight(10, height)),
      },
      inputsContainer: {
        paddingHorizontal: getResponsiveSize(10, scaleByHeight(10, height)),
      },
      typeTagsSelector: {
        marginBottom: getResponsiveSize(32, scaleByHeight(32, height)),
      },
    };
  }, [height, isRTL]);

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
  const [experience, setExperience] = useState(null);

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
      if (experience) updatedUser.experience = experience;

      await user.update({ ...updatedUser });
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
  const totalSteps = 3;
  const ProgressDots = () => (
    <View style={[styles.progressContainer, dynamicStyles.progressContainer]}>
      {Array.from({ length: totalSteps }).map((_, i) => {
        const active = step === i + 1;
        const distance = Math.abs(step - (i + 1));
        const size = active
          ? getResponsiveSize(10, scaleByHeight(12, height))
          : distance === 1
          ? getResponsiveSize(8, scaleByHeight(8, height))
          : getResponsiveSize(4, scaleByHeight(4, height));
        return (
          <View
            key={i}
            style={[
              styles.dot,
              dynamicStyles.dot,
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
        dynamicStyles.button,
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
            dynamicStyles.buttonText,
            { color: theme.buttonTextColorPrimary },
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
        dynamicStyles.backArrow,
        { [isRTL ? 'right' : 'left']: getResponsiveSize(10, 12) },
      ]}
    >
      <Image
        style={styles.backArrowImage}
        source={isRTL ? icons.arrowRight : icons.arrowLeft}
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
        <Text style={[styles.finishedText, { color: theme.textColor }]}>
          {t('register.register_success')}
        </Text>
      </View>
    );
  }

  // ограничитель ширины контента на web/landscape — не шире половины высоты окна
  const contentWidthStyle =
    Platform.OS === 'web' && isLandscape
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

  const experienceLevels = [
    { label: t('register.experience.none'), value: 'none' },
    { label: t('register.experience.less_1'), value: 'less_1' },
    { label: t('register.experience.1_3'), value: '1_3' },
    { label: t('register.experience.3_5'), value: '3_5' },
    { label: t('register.experience.5_plus'), value: '5_plus' },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundColor },
        Platform.OS === 'web' && isLandscape
          ? { justifyContent: 'center', alignItems: 'center', height: '100vh' }
          : null,
      ]}
    >
      <BackArrow />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          !(Platform.OS === 'web' && isLandscape) && { height: '100%' },
          Platform.OS === 'web' && isLandscape
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
            Platform.OS === 'web' &&
              isLandscape &&
              step === 2 && {
                height: scaleByHeight(741, height),
                width: scaleByHeight(354, height),
              },
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
                  dynamicStyles.title,
                  { color: theme.primaryColor },
                ]}
              >
                {t('register.terms_title')}
              </Text>

              <ScrollView
                style={[
                  styles.termsBox,
                  dynamicStyles.termsBox,
                  Platform.OS === 'web' && isLandscape
                    ? { height: '40vh', maxHeight: '40vh' } // компактнее на web-экранах
                    : null,
                ]}
              >
                <Text
                  style={[
                    styles.termsBoxText,
                    dynamicStyles.termsBoxText,
                    { color: theme.formInputLabelColor },
                  ]}
                >
                  {t('register.terms_text')}
                </Text>
              </ScrollView>

              <BouncyCheckbox
                size={getResponsiveSize(18, scaleByHeight(18, height))}
                isChecked={accepted}
                onPress={setAccepted}
                text={t('register.terms_accept')}
                textStyle={[
                  styles.termsCheckboxText,
                  dynamicStyles.termsCheckboxText,
                  {
                    textAlign: isRTL ? 'right' : 'left',
                    color: theme.unactiveTextColor,
                    textDecorationLine: 'none',
                  },
                ]}
                textContainerStyle={{
                  [isRTL ? 'marginRight' : 'marginLeft']: getResponsiveSize(
                    8,
                    scaleByHeight(10, height)
                  ),
                }}
                fillColor={theme.primaryColor}
                innerIconStyle={{
                  borderWidth: getResponsiveSize(2, scaleByHeight(2, height)),
                  borderRadius: getResponsiveSize(3, scaleByHeight(3, height)),
                }}
                iconStyle={{
                  borderRadius: getResponsiveSize(3, scaleByHeight(3, height)),
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
                  dynamicStyles.title,
                  dynamicStyles.step2Title,
                  { color: theme.textColor },
                ]}
              >
                {t('register.profile_create')}
              </Text>

              {/* --- Аватар --- */}
              <View
                style={[styles.avatarContainer, dynamicStyles.avatarContainer]}
              >
                <View
                  style={[styles.avatarWrapper, dynamicStyles.avatarWrapper]}
                >
                  <Image
                    source={
                      avatarUrl ? { uri: avatarUrl } : icons.defaultAvatar
                    }
                    style={[styles.avatarImage, dynamicStyles.avatarImage]}
                  />
                  <TouchableOpacity
                    style={[styles.cameraButton, dynamicStyles.cameraButton]}
                    onPress={() => setPickerVisible(true)}
                  >
                    <Image source={icons.camera} style={styles.cameraIcon} />
                  </TouchableOpacity>
                </View>
                <Text
                  style={[
                    styles.avatarRecommendsText,
                    dynamicStyles.avatarRecommendsText,
                    { color: theme.textColor },
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

              {/* --- Имя и Фамилия --- */}
              <View
                style={[styles.inputsContainer, dynamicStyles.inputsContainer]}
              >
                <View
                  style={[
                    styles.inputBlock,
                    dynamicStyles.inputBlock,
                    { backgroundColor: theme.formInputBackground },
                  ]}
                >
                  <Text
                    style={[
                      styles.label,
                      dynamicStyles.label,
                      {
                        textAlign: isRTL ? 'right' : 'left',
                        color: theme.textColor,
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
                      dynamicStyles.input,
                      {
                        textAlign: isRTL ? 'right' : 'left',
                        color: theme.textColor,
                        backgroundColor: theme.defaultBlocksBackground,
                        borderColor: theme.borderColor,
                        borderWidth: 1,
                        // прозрачный инпут внутри окрашенного fieldBlock
                        backgroundColor: 'transparent',
                        borderWidth: 0,
                        marginBottom: getResponsiveSize(4, 3),
                      },
                      Platform.OS === 'web' && isLandscape
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
                    dynamicStyles.inputBlock,
                    { backgroundColor: theme.formInputBackground },
                  ]}
                >
                  <Text
                    style={[
                      styles.label,
                      dynamicStyles.label,
                      {
                        textAlign: isRTL ? 'right' : 'left',
                        color: theme.textColor,
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
                      dynamicStyles.input,
                      {
                        textAlign: isRTL ? 'right' : 'left',
                        color: theme.textColor,
                        backgroundColor: theme.defaultBlocksBackground,
                        borderColor: theme.borderColor,
                        borderWidth: 1,
                        // прозрачный инпут внутри окрашенного fieldBlock
                        backgroundColor: 'transparent',
                        borderWidth: 0,
                        marginBottom: getResponsiveSize(4, 3),
                      },
                      Platform.OS === 'web' && isLandscape
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
                  gap: getResponsiveSize(10, scaleByHeight(25, height)),
                  paddingHorizontal: getResponsiveSize(
                    10,
                    scaleByHeight(10, height)
                  ),
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
                  title={t('register.next')}
                  onPress={() => setStep(3)}
                  disabled={!isNameValid || !isSurnameValid}
                  customStyle={{ btn: { flex: 1 } }}
                />
              </View>
            </>
          )}

          {/* {step === 3 && (
            <>
              <Text style={[styles.title, { color: theme.textColor }]}>
                {t('register.profile_profession')}
              </Text>

              <TextInput
                placeholder={t('register.profession_placeholder')}
                value={form.profession}
                onChangeText={(txt) => setForm({ ...form, profession: txt })}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.defaultBlocksBackground,
                    borderColor: theme.borderColor,
                    borderWidth: 1,
                    textAlign: isRTL ? 'right' : 'left',
                    color: theme.textColor,
                  },
                ]}
                placeholderTextColor={theme.formInputPlaceholderColor}
              />

              <ProgressDots />

              <View
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  gap: getResponsiveSize(10, 8),
                }}
              >
                <PrimaryButton
                  title={t('register.previous')}
                  onPress={() => setStep(2)}
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
                  title={t('register.next')}
                  onPress={() => setStep(4)}
                  disabled={!isNameValid || !isSurnameValid}
                  customStyle={{ btn: { flex: 1 } }}
                />
              </View>
            </>
          )} */}

          {step === 3 && (
            <>
              <Text
                style={[
                  styles.title,
                  dynamicStyles.title,
                  {
                    color: theme.textColor,
                  },
                ]}
              >
                {t('register.profile_create')}
              </Text>

              <View
                style={
                  isLandscape && Platform.OS === 'web'
                    ? { flexDirection: 'row', gap: scaleByHeight(108, height) }
                    : {}
                }
              >
                {/* Left Column */}
                <View
                  style={
                    isLandscape && Platform.OS === 'web'
                      ? { flex: 1.5 }
                      : { }
                  }
                >
                  <TagSelector
                    title={t('register.job_types_title')}
                    subtitle={t('register.job_types_subtitle')}
                    options={jobTypes}
                    selectedItems={selectedJobTypes}
                    setSelectedItems={setSelectedJobTypes}
                    containerStyle={dynamicStyles.typeTagsSelector}
                    numberOfRows={6}
                  />
                  <TagSelector
                    title={t('register.license_types_title')}
                    subtitle={t('register.license_types_subtitle')}
                    options={licenses}
                    selectedItems={selectedLicenseTypes}
                    setSelectedItems={setSelectedLicenseTypes}
                    numberOfRows={2}
                  />
                </View>

                {/* Right Column */}
                <View
                  style={
                    isLandscape && Platform.OS === 'web' ? { flex: 1 } : {}
                  }
                >
                  <CustomPicker
                    label={t('register.qualification_label')}
                    options={qualificationLevels}
                    selectedValue={qualificationLevel}
                    onValueChange={setQualificationLevel}
                    isRTL={isRTL}
                    containerStyle={dynamicStyles.typeTagsSelector}
                  />
                  <CustomPicker
                    label={t('register.experience_label')}
                    options={experienceLevels}
                    selectedValue={experience}
                    onValueChange={setExperience}
                    isRTL={isRTL}
                    containerStyle={dynamicStyles.typeTagsSelector}
                  />
                  <View
                    style={[
                      styles.inputBlock,
                      dynamicStyles.inputBlock,
                      { backgroundColor: theme.formInputBackground },
                    ]}
                  >
                    <Text
                      style={[
                        styles.label,
                        dynamicStyles.label,
                        {
                          textAlign: isRTL ? 'right' : 'left',
                          color: theme.textColor,
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
                        dynamicStyles.input,
                        dynamicStyles.multilineInput,
                        {
                          height: getResponsiveSize(120, 100),
                          textAlign: isRTL ? 'right' : 'left',
                          color: theme.textColor,
                          backgroundColor: theme.defaultBlocksBackground,
                          borderColor: theme.borderColor,
                          borderWidth: 1,
                          // прозрачный инпут внутри окрашенного fieldBlock
                          backgroundColor: 'transparent',
                          borderWidth: 0,
                          marginBottom: getResponsiveSize(25, 10),
                        },
                        Platform.OS === 'web' && isLandscape
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
              </View>
              <View>
                <ProgressDots />

                <View
                  style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    justifyContent: 'center',
                    gap: getResponsiveSize(10, scaleByHeight(25, height)),
                    paddingHorizontal: getResponsiveSize(
                      10,
                      scaleByHeight(10, height)
                    ),
                  }}
                >
                  <PrimaryButton
                    title={t('register.previous')}
                    onPress={() => setStep(2)}
                    customStyle={{
                      btn: {
                        backgroundColor: 'transparent',
                        borderWidth: 1,
                        borderColor: theme.primaryColor,
                        width: getResponsiveSize(
                          75,
                          scaleByHeight(153, height)
                        ),
                      },
                      btnText: { color: theme.primaryColor },
                    }}
                  />
                  <PrimaryButton
                    title={
                      loading ? (
                        <ActivityIndicator
                          color={theme.buttonTextColorPrimary}
                        />
                      ) : (
                        t('register.create')
                      )
                    }
                    onPress={handleSubmit}
                    disabled={loading}
                    customStyle={{
                      btn: {
                        width: getResponsiveSize(
                          75,
                          scaleByHeight(153, height)
                        ),
                      },
                    }}
                  />
                </View>
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
  scrollContent: {
    paddingHorizontal: '6%',
    paddingVertical: RFValue(20),
  },
  contentBlock: {
    alignSelf: 'center',
  },

  title: {
    // fontSize: getResponsiveSize(20, 18),
    // marginBottom: getResponsiveSize(20, '4vh'),
    textAlign: 'center',
    fontFamily: 'Rubik-Bold',
  },

  button: {
    // paddingVertical: getResponsiveSize(14, 12),
    // borderRadius: getResponsiveSize(10, 8),
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    width: '100%', // ширина контролируется контейнером contentBlock
  },
  buttonText: {
    // fontSize: getResponsiveSize(16, 14),
  },

  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    // marginVertical: getResponsiveSize(20, 14),
  },
  dot: {
    // marginHorizontal: getResponsiveSize(4, 4)
  },

  backArrow: {
    position: 'absolute',
    // top: getResponsiveSize(20, 16),
    zIndex: 10,
    // height: getResponsiveSize(30, 26),
  },
  backArrowImage: { height: '100%', resizeMode: 'contain' },

  finishedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishedText: {
    // fontSize: getResponsiveSize(20, 18),
  },

  termsBox: {
    flex: 1,
    // height: RFPercentage(65),
    // padding: getResponsiveSize(10, 8),
    // marginBottom: getResponsiveSize(15, 12),
    backgroundColor: 'transparent',
  },
  termsBoxText: {
    // fontSize: getResponsiveSize(14, 13),
    // lineHeight: getResponsiveSize(20, 18),
    // opacity: 0.6,
  },
  termsCheckboxText: {
    // fontSize: getResponsiveSize(14, 13),
    // opacity: 0.8,
    fontFamily: 'Rubik-SemiBold',
  },

  avatarContainer: {
    alignItems: 'center',
    // marginBottom: getResponsiveSize(10, '5vh'),
    // height: getResponsiveSize(150, 120),
  },
  avatarWrapper: {
    height: '60%',
    aspectRatio: 1,
    // borderRadius: getResponsiveSize(60, 50),
    position: 'relative',
    // overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    // borderRadius: getResponsiveSize(60, 50),
    resizeMode: 'cover',
  },
  cameraButton: {
    position: 'absolute',
    bottom: '-2%',
    right: '-2%',
    // borderRadius: getResponsiveSize(70, 60),
    // width: getResponsiveSize(26, 26),
    // height: getResponsiveSize(26, 26),
    overflow: 'hidden',
  },
  cameraIcon: { width: '100%', height: '100%' },
  avatarRecommendsText: {
    // marginTop: getResponsiveSize(10, 8),
    // fontSize: getResponsiveSize(12, 11),
    textAlign: 'center',
    opacity: 0.7,
    // paddingHorizontal: getResponsiveSize(20, 16),
  },

  inputsContainer: {
    flexGrow: 1,
  },
  inputBlock: {
    // marginBottom: getResponsiveSize(20, 14),
    // borderRadius: getResponsiveSize(10, 8),
    // paddingVertical: getResponsiveSize(5, '2vh'),
    ...Platform.select({
      web: { zIndex: 1 },
    }),
  },
  label: {
    // opacity: 0.7,
    // paddingHorizontal: getResponsiveSize(10, 10),
    // paddingTop: getResponsiveSize(6, 4),
    // fontSize: getResponsiveSize(12, 11),
  },
  input: {
    // paddingHorizontal: getResponsiveSize(10, 10),
    // borderRadius: getResponsiveSize(8, 8),
    // fontSize: getResponsiveSize(14, 13),
  },
});
