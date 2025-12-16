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
import { useComponentContext } from '../context/globalAppContext';
import { icons } from '../constants/icons';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';

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

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      scrollContentPaddingHorizontal: isWebLandscape ? '6%' : '8%',
      scrollContentPaddingVertical: isWebLandscape ? web(0) : mobile(20),
      titleFontSize: isWebLandscape ? web(24) : mobile(20),
      titleMarginBottom: isWebLandscape ? web(0) : mobile(18),
      step2TitleMarginBottom: isWebLandscape ? web(36) : mobile(30),
      buttonPaddingVertical: isWebLandscape ? web(12) : mobile(14),
      buttonBorderRadius: isWebLandscape ? web(8) : mobile(7),
      buttonWidth: isWebLandscape ? web(330) : '100%',
      buttonHeight: isWebLandscape ? web(62) : undefined,
      buttonTextFontSize: isWebLandscape ? web(20) : mobile(16),
      progressContainerMarginVertical: isWebLandscape ? web(14) : mobile(20),
      dotMarginHorizontal: isWebLandscape ? web(14) : mobile(10),
      backArrowTop: isWebLandscape ? web(72) : mobile(20),
      backArrowHeight: isWebLandscape ? web(24) : mobile(22),
      backArrowSide: isWebLandscape
        ? web(height * 1.4 * 0.1)
        : mobile(10),
      finishedTextFontSize: isWebLandscape ? web(18) : mobile(20),
      termsBoxPaddingVertical: isWebLandscape ? web(5) : mobile(10),
      termsBoxMarginBottom: isWebLandscape ? web(12) : mobile(15),
      termsBoxTextFontSize: isWebLandscape ? web(16) : mobile(13),
      termsBoxTextLineHeight: isWebLandscape ? web(18) : mobile(16),
      termsCheckboxTextFontSize: isWebLandscape ? web(13) : mobile(14),
      avatarContainerMarginBottom: isWebLandscape ? web(40) : mobile(10),
      avatarContainerHeight: isWebLandscape ? web(158) : mobile(150),
      avatarWrapperBorderRadius: isWebLandscape ? web(50) : mobile(60),
      avatarImageBorderRadius: isWebLandscape ? web(50) : mobile(60),
      cameraButtonWidth: isWebLandscape ? web(26) : mobile(26),
      cameraButtonHeight: isWebLandscape ? web(26) : mobile(26),
      cameraButtonBorderRadius: isWebLandscape ? web(60) : mobile(70),
      avatarRecommendsTextMarginTop: isWebLandscape ? web(8) : mobile(10),
      avatarRecommendsTextFontSize: isWebLandscape ? web(14) : mobile(12),
      avatarRecommendsTextPaddingHorizontal: isWebLandscape
        ? web(0)
        : mobile(20),
      inputBlockMarginBottom: isWebLandscape ? web(24) : mobile(20),
      inputBlockBorderRadius: isWebLandscape ? web(8) : mobile(7),
      inputBlockPaddingVertical: isWebLandscape ? web(8) : mobile(5),
      inputBlockHeight: isWebLandscape ? web(64) : mobile(40),
      inputBlockWidth: isWebLandscape ? web(330) : '100%',
      labelPaddingHorizontal: isWebLandscape ? web(16) : mobile(10),
      labelPaddingTop: isWebLandscape ? web(4) : mobile(6),
      labelFontSize: isWebLandscape ? web(12) : mobile(12),
      inputPaddingHorizontal: isWebLandscape ? web(16) : mobile(10),
      inputBorderRadius: isWebLandscape ? web(8) : mobile(8),
      inputFontSize: isWebLandscape ? web(16) : mobile(14),
      multilineInputHeight: isWebLandscape ? web(100) : mobile(120),
      multilineInputMarginBottom: isWebLandscape ? web(25) : mobile(25),
      inputsContainerPaddingHorizontal: isWebLandscape ? web(10) : mobile(10),
      typeTagsSelectorMarginBottom: isWebLandscape ? web(32) : mobile(32),
      activeDotSize: isWebLandscape ? web(12) : mobile(10),
      secondDotSize: isWebLandscape ? web(8) : mobile(8),
      smallDotSize: isWebLandscape ? web(4) : mobile(4),
      arrowSideMove: isWebLandscape ? web(200) : mobile(10),
      checkboxSize: isWebLandscape ? web(18) : mobile(18),
      checkboxRadius: isWebLandscape ? web(3) : mobile(3),
      checkboxTextSize: isWebLandscape ? web(10) : mobile(8),
      inputMarginBottom: isWebLandscape ? web(3) : mobile(4),
      containerGap: isWebLandscape ? web(25) : mobile(10),
      containerPaddingHorizontal: isWebLandscape ? web(10) : mobile(10),
      primaryButtonWidth: isWebLandscape ? web(153) : null,
      errorMarginTop: isWebLandscape ? web(4) : mobile(4),
      eyeIconRight: isWebLandscape ? web(14) : mobile(12),
      eyeIconTop: isWebLandscape ? web(20) : mobile(38),
      eyeIconWidth: isWebLandscape ? web(24) : mobile(22),
      eyeIconHeight: isWebLandscape ? web(24) : mobile(22),
    };
  }, [isWebLandscape, height, isRTL]);

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
      onPress={() =>
        step > 1 ? setStep(step - 1) : registerControl.leaveRegisterScreen()
      }
      style={[
        styles.backArrow,
        {
          top: sizes.backArrowTop,
          height: sizes.backArrowHeight,
          [isRTL ? 'right' : 'left']: sizes.arrowSideMove,
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
          {
            paddingHorizontal: sizes.scrollContentPaddingHorizontal,
            paddingVertical: sizes.scrollContentPaddingVertical,
          },
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
                  {
                    color: theme.textColor,
                    fontSize: sizes.titleFontSize,
                    marginBottom: sizes.step2TitleMarginBottom,
                  },
                ]}
              >
                {t('register.profile_create')}
              </Text>

              {/* --- FIELDS --- */}
              <View
                style={[
                  styles.inputsContainer,
                  { paddingHorizontal: sizes.inputsContainerPaddingHorizontal },
                ]}
              >
                {/* --- EMAIL --- */}
                <View
                  style={[
                    styles.inputBlock,
                    {
                      backgroundColor: theme.formInputBackground,
                      marginBottom: sizes.inputBlockMarginBottom,
                      borderRadius: sizes.inputBlockBorderRadius,
                      paddingVertical: sizes.inputBlockPaddingVertical,
                      height: sizes.inputBlockHeight,
                      width: sizes.inputBlockWidth,
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
                      {
                        textAlign: isRTL ? 'right' : 'left',
                        color: theme.textColor,
                        backgroundColor: 'transparent',
                        borderWidth: 0,
                        marginBottom: sizes.inputMarginBottom,
                        paddingHorizontal: sizes.inputPaddingHorizontal,
                        borderRadius: sizes.inputBorderRadius,
                        fontSize: sizes.inputFontSize,
                      },
                      isWebLandscape && {
                        outlineStyle: 'none',
                        outlineWidth: 0,
                        outlineColor: 'transparent',
                        boxShadow: 'none',
                      },
                    ]}
                    placeholderTextColor={theme.formInputPlaceholderColor}
                  />

                  {emailError && (
                    <Text
                      style={{
                        color: theme.errorTextColor,
                        marginTop: sizes.multilineInputMarginBottom,
                        fontSize: sizes.labelFontSize,
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
                    {
                      backgroundColor: theme.formInputBackground,
                      position: 'relative',
                      marginBottom: sizes.inputBlockMarginBottom,
                      borderRadius: sizes.inputBlockBorderRadius,
                      paddingVertical: sizes.inputBlockPaddingVertical,
                      height: sizes.inputBlockHeight,
                      width: sizes.inputBlockWidth,
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
                      {
                        textAlign: isRTL ? 'right' : 'left',
                        color: theme.textColor,
                        backgroundColor: 'transparent',
                        borderWidth: 0,
                        marginBottom: sizes.inputMarginBottom,
                        paddingHorizontal: sizes.inputPaddingHorizontal,
                        borderRadius: sizes.inputBorderRadius,
                        fontSize: sizes.inputFontSize,
                      },
                      isWebLandscape && {
                        outlineStyle: 'none',
                        outlineWidth: 0,
                        outlineColor: 'transparent',
                        boxShadow: 'none',
                      },
                    ]}
                    placeholderTextColor={theme.formInputPlaceholderColor}
                  />

                  {passwordError && (
                    <Text
                      style={{
                        color: 'red',
                        marginTop: sizes.errorMarginTop,
                      }}
                    >
                      {passwordError}
                    </Text>
                  )}
                  <TouchableOpacity
                    onPress={() => setShowPassword((prev) => !prev)}
                    style={{
                      position: 'absolute',
                      right: isRTL ? undefined : sizes.eyeIconRight,
                      left: isRTL ? sizes.eyeIconRight : undefined,
                      top: sizes.eyeIconTop,
                      width: sizes.eyeIconWidth,
                      height: sizes.eyeIconHeight,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Image
                      source={showPassword ? icons.eyeOpen : icons.eyeClosed}
                      style={{
                        width: sizes.eyeIconWidth,
                        height: sizes.eyeIconHeight,
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
                    {
                      backgroundColor: theme.formInputBackground,
                      marginBottom: sizes.inputBlockMarginBottom,
                      borderRadius: sizes.inputBlockBorderRadius,
                      paddingVertical: sizes.inputBlockPaddingVertical,
                      height: sizes.inputBlockHeight,
                      width: sizes.inputBlockWidth,
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
                      {
                        textAlign: isRTL ? 'right' : 'left',
                        color: theme.textColor,
                        backgroundColor: 'transparent',
                        borderWidth: 0,
                        marginBottom: sizes.inputMarginBottom,
                        paddingHorizontal: sizes.inputPaddingHorizontal,
                        borderRadius: sizes.inputBorderRadius,
                        fontSize: sizes.inputFontSize,
                      },
                      isWebLandscape && {
                        outlineStyle: 'none',
                        outlineWidth: 0,
                        outlineColor: 'transparent',
                        boxShadow: 'none',
                      },
                    ]}
                    placeholderTextColor={theme.formInputPlaceholderColor}
                  />

                  {passwordRepeatError && (
                    <Text
                      style={{
                        color: theme.errorTextColor,
                        marginTop: sizes.multilineInputMarginBottom,
                        fontSize: sizes.labelFontSize,
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
                      fontSize: sizes.labelFontSize,
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
