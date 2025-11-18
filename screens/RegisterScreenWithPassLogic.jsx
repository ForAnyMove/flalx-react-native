import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { RFValue } from 'react-native-responsive-fontsize';
import { useComponentContext } from '../context/globalAppContext';
import { icons } from '../constants/icons';
import { scaleByHeight } from '../utils/resizeFuncs';

export default function RegisterScreenWithPass() {
  const { t } = useTranslation();
  const {
    user,
    themeController,
    session,
    languageController,
    authControl,
    registerControl,
  } = useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const dynamicStyles = useMemo(() => {
    return {
      scrollContent: {
        paddingHorizontal: isWebLandscape ? '6%' : '8%',
        paddingVertical: isWebLandscape
          ? scaleByHeight(0, height)
          : RFValue(20),
      },
      title: {
        fontSize: isWebLandscape ? scaleByHeight(24, height) : RFValue(20),
        marginBottom: isWebLandscape ? scaleByHeight(0, height) : RFValue(18),
      },
      step2Title: {
        marginBottom: isWebLandscape ? scaleByHeight(36, height) : RFValue(30),
      },
      button: {
        paddingVertical: isWebLandscape
          ? scaleByHeight(12, height)
          : RFValue(14),
        borderRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(7),
        ...Platform.select({
          web: isWebLandscape && {
            width: scaleByHeight(330, height),
            height: scaleByHeight(62, height),
          },
        }),
      },
      buttonText: {
        fontSize: isWebLandscape ? scaleByHeight(20, height) : RFValue(16),
      },
      progressContainer: {
        marginVertical: isWebLandscape
          ? scaleByHeight(14, height)
          : RFValue(20),
      },
      dot: {
        marginHorizontal: isWebLandscape
          ? scaleByHeight(14, height)
          : RFValue(10),
      },
      backArrow: {
        top: isWebLandscape ? scaleByHeight(72, height) : RFValue(20),
        height: isWebLandscape ? scaleByHeight(24, height) : RFValue(22),
        [isRTL ? 'right' : 'left']: isWebLandscape
          ? scaleByHeight(height * 1.4 * 0.1, height)
          : RFValue(10),
      },
      finishedText: {
        fontSize: isWebLandscape ? scaleByHeight(18, height) : RFValue(20),
      },
      termsBox: {
        paddingVertical: isWebLandscape
          ? scaleByHeight(5, height)
          : RFValue(10),
        marginBottom: isWebLandscape ? scaleByHeight(12, height) : RFValue(15),
      },
      termsBoxText: {
        fontSize: isWebLandscape ? scaleByHeight(16, height) : RFValue(13),
        lineHeight: isWebLandscape ? scaleByHeight(18, height) : RFValue(16),
      },
      termsCheckboxText: {
        fontSize: isWebLandscape ? scaleByHeight(13, height) : RFValue(14),
      },
      avatarContainer: {
        marginBottom: isWebLandscape ? scaleByHeight(40, height) : RFValue(10),
        height: isWebLandscape ? scaleByHeight(158, height) : RFValue(150),
      },
      avatarWrapper: {
        borderRadius: isWebLandscape ? scaleByHeight(50, height) : RFValue(60),
      },
      avatarImage: {
        borderRadius: isWebLandscape ? scaleByHeight(50, height) : RFValue(60),
      },
      cameraButton: {
        width: isWebLandscape ? scaleByHeight(26, height) : RFValue(26),
        height: isWebLandscape ? scaleByHeight(26, height) : RFValue(26),
        borderRadius: isWebLandscape ? scaleByHeight(60, height) : RFValue(70),
      },
      avatarRecommendsText: {
        marginTop: isWebLandscape ? scaleByHeight(8, height) : RFValue(10),
        fontSize: isWebLandscape ? scaleByHeight(14, height) : RFValue(12),
        paddingHorizontal: isWebLandscape
          ? scaleByHeight(0, height)
          : RFValue(20),
      },
      inputBlock: {
        marginBottom: isWebLandscape ? scaleByHeight(24, height) : RFValue(20),
        borderRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(7),
        paddingVertical: isWebLandscape ? scaleByHeight(8, height) : RFValue(5),
        height: isWebLandscape ? scaleByHeight(64, height) : RFValue(40),
        width: isWebLandscape ? scaleByHeight(330, height) : '100%',
      },
      label: {
        paddingHorizontal: isWebLandscape
          ? scaleByHeight(16, height)
          : RFValue(10),
        paddingTop: isWebLandscape ? scaleByHeight(4, height) : RFValue(6),
        fontSize: isWebLandscape ? scaleByHeight(12, height) : RFValue(12),
      },
      input: {
        paddingHorizontal: isWebLandscape
          ? scaleByHeight(16, height)
          : RFValue(10),
        borderRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(8),
        fontSize: isWebLandscape ? scaleByHeight(16, height) : RFValue(14),
      },
      multilineInput: {
        height: isWebLandscape ? scaleByHeight(100, height) : RFValue(120),
        marginBottom: isWebLandscape ? scaleByHeight(25, height) : RFValue(25),
      },
      inputsContainer: {
        paddingHorizontal: isWebLandscape
          ? scaleByHeight(10, height)
          : RFValue(10),
      },
      typeTagsSelector: {
        marginBottom: isWebLandscape ? scaleByHeight(32, height) : RFValue(32),
      },
    };
  }, [height, isRTL]);

  const sizes = {
    activeDotSize: isWebLandscape ? scaleByHeight(12, height) : RFValue(10),
    secondDotSize: isWebLandscape ? scaleByHeight(8, height) : RFValue(8),
    smallDotSize: isWebLandscape ? scaleByHeight(4, height) : RFValue(4),
    arrowSideMove: isWebLandscape ? scaleByHeight(200, height) : RFValue(10),
    checkboxSize: isWebLandscape ? scaleByHeight(18, height) : RFValue(18),
    checkboxRadius: isWebLandscape ? scaleByHeight(3, height) : RFValue(3),
    checkboxTextSize: isWebLandscape ? scaleByHeight(10, height) : RFValue(8),
    inputMarginBottom: isWebLandscape ? scaleByHeight(3, height) : RFValue(4),
    containerGap: isWebLandscape ? scaleByHeight(25, height) : RFValue(10),
    containerPaddingHorizontal: isWebLandscape
      ? scaleByHeight(10, height)
      : RFValue(10),
    multilineInputHeight: isWebLandscape
      ? scaleByHeight(120, height)
      : RFValue(100),
    multilineInputMarginBottom: isWebLandscape
      ? scaleByHeight(10, height)
      : RFValue(25),
    primaryButtonWidth: isWebLandscape ? scaleByHeight(153, height) : null,
  };

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '',
    surname: '',
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepeat, setPasswordRepeat] = useState('');

  // ERRORS
  const [emailError, setEmailError] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordRepeatError, setPasswordRepeatError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState(null);

  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  // Step 3 states
  const [selectedJobTypes, setSelectedJobTypes] = useState([]);
  const [selectedLicenseTypes, setSelectedLicenseTypes] = useState([]);
  const [qualificationLevel, setQualificationLevel] = useState(null);
  const [experience, setExperience] = useState(null);

  const isNameValid = form.name.trim().length > 1;
  const isSurnameValid = form.surname.trim().length > 1;

  const validateEmail = (value) => {
    if (!value) return false;
    const re =
      /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i;

    return re.test(String(value).trim().toLowerCase());
  };

  const validatePassword = (pwd) => pwd && pwd.trim().length >= 6;
  const passwordsMatch = () =>
    password.trim() !== '' &&
    passwordRepeat.trim() !== '' &&
    password.trim() === passwordRepeat.trim();

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);


  async function handleSubmit() {
    setGeneralError(null);
    setEmailError(null);
    setPasswordError(null);
    setPasswordRepeatError(null);

    let ok = true;

    if (!validateEmail(email)) {
      setEmailError(t('register.email_invalid'));
      ok = false;
    }
    if (!validatePassword(password)) {
      setPasswordError(t('register.password_invalid'));
      ok = false;
    }
    if (!passwordsMatch()) {
      setPasswordRepeatError(t('register.password_mismatch'));
      ok = false;
    }
    if (!ok) return;
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

      const res = await session.createUser(email.trim(), password);

      if (!res.success) {
        const err = String(res.error || '').toLowerCase();

        if (err.includes('already') || err.includes('exists')) {
          setEmailError(t('register.email_busy'));
          setStep(2);
        } else {
          setGeneralError(res.error);
        }

        setLoading(false);
        return;
      }

      setFinished(true);
      registerControl.leaveRegisterScreen();
    } catch (e) {
      const err = String(e.message || e).toLowerCase();
      console.error('❌ Ошибка при обновлении:', e);
      if (err.includes('already') || err.includes('exists')) {
        setEmailError(t('register.email_busy'));
        setStep(2);
      } else {
        setGeneralError(String(e));
      }
    } finally {
      setLoading(false);
    }
  }

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
      onPress={() =>
        step > 1 ? setStep(step - 1) : registerControl.leaveRegisterScreen()
      }
      style={[
        styles.backArrow,
        dynamicStyles.backArrow,
        { [isRTL ? 'right' : 'left']: sizes.arrowSideMove },
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
        <Text style={[styles.finishedText, { color: theme.textColor }]}>
          {t('register.register_success')}
        </Text>
      </View>
    );
  }

  // ограничитель ширины контента на web/landscape — не шире половины высоты окна
  const contentWidthStyle = isWebLandscape
    ? { width: height * 0.4 }
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
          dynamicStyles.scrollContent,
          !isWebLandscape && { height: '100%' },
          !isWebLandscape &&
            step === 1 && {
              paddingHorizontal: 0,
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
              step === 1 && {
                height: scaleByHeight(741, height),
                width: scaleByHeight(354, height),
              },
          ]}
        >
          {/* ======================= STEP 2: PROFILE (NAME/SURNAME/AVATAR) ======================= */}
          {step === 1 && (
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

              {/* --- FIELDS --- */}
              <View
                style={[styles.inputsContainer, dynamicStyles.inputsContainer]}
              >
                {/* --- EMAIL --- */}
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
                    {t('register.email')} ({t('register.required')})
                  </Text>

                  <TextInput
                    value={email}
                    onChangeText={(txt) => {
                      setEmail(txt);
                      setEmailError(null);
                    }}
                    placeholder={t('register.email')}
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
                        marginBottom: sizes.inputMarginBottom,
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

                  {emailError && (
                    <Text
                      style={{
                        color: theme.errorTextColor,
                        marginTop: sizes.multilineInputMarginBottom,
                        fontSize: dynamicStyles.label.fontSize,
                      }}
                    >
                      {emailError}
                    </Text>
                  )}
                </View>

                {/* --- PASSWORD --- */}
                <View
                  style={[
                    styles.inputBlock,
                    dynamicStyles.inputBlock,
                    {
                      backgroundColor: theme.formInputBackground,
                      position: 'relative',
                    },
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
                    {t('register.password')} ({t('register.required')})
                  </Text>

                  <TextInput
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={(txt) => {
                      setPassword(txt);
                      setPasswordError(null);
                    }}
                    placeholder={t('register.password')}
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
                        marginBottom: sizes.inputMarginBottom,
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

                  {passwordError && (
                    <Text style={{ color: 'red', marginTop: RFValue(4) }}>
                      {passwordError}
                    </Text>
                  )}
                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={{
                      position: 'absolute',
                      right: isRTL
                        ? undefined
                        : isWebLandscape
                        ? scaleByHeight(14, height)
                        : RFValue(12),
                      left: isRTL
                        ? isWebLandscape
                          ? scaleByHeight(14, height)
                          : RFValue(12)
                        : undefined,
                      top: isWebLandscape
                        ? scaleByHeight(20, height)
                        : RFValue(38),
                      width: isWebLandscape
                        ? scaleByHeight(24, height)
                        : RFValue(22),
                      height: isWebLandscape
                        ? scaleByHeight(24, height)
                        : RFValue(22),
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Image
                      source={showPassword ? icons.eyeOpen : icons.eyeClosed}
                      style={{
                        width: isWebLandscape
                          ? scaleByHeight(24, height)
                          : RFValue(22),
                        height: isWebLandscape
                          ? scaleByHeight(24, height)
                          : RFValue(22),
                        tintColor: theme.formInputLabelColor,
                      }}
                      resizeMode='contain'
                    />
                  </TouchableOpacity>
                </View>

                {/* --- PASSWORD REPEAT --- */}
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
                    {t('register.repeat_password')} ({t('register.required')})
                  </Text>

                  <TextInput
                    secureTextEntry={true}
                    value={passwordRepeat}
                    onChangeText={(txt) => {
                      setPasswordRepeat(txt);
                      setPasswordRepeatError(null);
                    }}
                    placeholder={t('register.repeat_password')}
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
                        marginBottom: sizes.inputMarginBottom,
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

                  {passwordRepeatError && (
                    <Text
                      style={{
                        color: theme.errorTextColor,
                        marginTop: sizes.multilineInputMarginBottom,
                        fontSize: dynamicStyles.label.fontSize,
                      }}
                    >
                      {passwordRepeatError}
                    </Text>
                  )}
                </View>

                {/* ERROR under form */}
                {generalError && (
                  <Text
                    style={{
                      textAlign: 'center',
                      color: theme.errorTextColor,
                      marginTop: sizes.multilineInputMarginBottom,
                      fontSize: dynamicStyles.label.fontSize,
                    }}
                  >
                    {generalError}
                  </Text>
                )}
              </View>

              <View
                style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  gap: sizes.containerGap,
                  paddingHorizontal: sizes.containerPaddingHorizontal,
                }}
              >
                <PrimaryButton
                  title={t('common.cancel')}
                  onPress={() => registerControl.leaveRegisterScreen()}
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
                  title={t('common.create')}
                  onPress={handleSubmit}
                  disabled={
                    !validateEmail(email) ||
                    !validatePassword(password) ||
                    !passwordsMatch()
                  }
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
