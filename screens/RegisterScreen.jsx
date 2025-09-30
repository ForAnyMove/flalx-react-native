import React, { useState } from 'react';
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

// универсальная адаптация размеров: на мобиле RFValue, на web — уменьшенный фикс
const getResponsiveSize = (mobileSize, webSize) => {
  if (Platform.OS === 'web') return webSize;
  return RFValue(mobileSize);
};

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { user, themeController, session, languageController } = useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [step, setStep] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    surname: '',
    // profession: '',
    // description: '',
  });
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

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
      await user.update({ ...form });
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
  const totalSteps = 4;
  const ProgressDots = () => (
    <View style={styles.progressContainer}>
      {Array.from({ length: totalSteps }).map((_, i) => {
        const active = step === i + 1;
        const distance = Math.abs(step - (i + 1));
        const size = active
          ? getResponsiveSize(10, 8)
          : distance === 1
          ? getResponsiveSize(8, 7)
          : getResponsiveSize(6, 6);
        return (
          <View
            key={i}
            style={[
              styles.dot,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor: active
                  ? theme.primaryColor
                  : theme.unactiveTextColor,
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
      ? { width: Math.min(height * 0.5, 560) }
      : { width: '100%' };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
    >
      <BackArrow />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          Platform.OS === 'web' && isLandscape
            ? { alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }
            : null,
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.contentBlock, contentWidthStyle]}>
          {step === 1 && (
            <>
              <Text style={[styles.title, { color: theme.primaryColor }]}>
                {t('register.terms_title')}
              </Text>

              <ScrollView
                style={[
                  styles.termsBox,
                  Platform.OS === 'web' && isLandscape
                    ? { height: '40vh' } // компактнее на web-экранах
                    : null,
                ]}
              >
                <Text style={[styles.termsBoxText, { color: theme.textColor }]}>
                  {t('register.terms_text')}
                </Text>
              </ScrollView>

              <BouncyCheckbox
                size={getResponsiveSize(18, 16)}
                isChecked={accepted}
                onPress={setAccepted}
                text={t('register.terms_accept')}
                textStyle={[
                  styles.termsCheckboxText,
                  {
                    textAlign: isRTL ? 'right' : 'left',
                    color: theme.textColor,
                    textDecorationLine: 'none',
                  },
                ]}
                fillColor={theme.primaryColor}
                innerIconStyle={{
                  borderWidth: getResponsiveSize(2, 2),
                  borderRadius: getResponsiveSize(3, 3),
                }}
                iconStyle={{ borderRadius: getResponsiveSize(3, 3) }}
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
              <Text style={[styles.title, { color: theme.textColor }]}>
                {t('register.profile_create')}
              </Text>

              {/* --- Аватар --- */}
              <View style={styles.avatarContainer}>
                <View style={styles.avatarWrapper}>
                  <Image
                    source={
                      avatarUrl ? { uri: avatarUrl } : icons.defaultAvatar
                    }
                    style={styles.avatarImage}
                  />
                  <TouchableOpacity
                    style={styles.cameraButton}
                    onPress={() => setPickerVisible(true)}
                  >
                    <Image source={icons.camera} style={styles.cameraIcon} />
                  </TouchableOpacity>
                </View>
                <Text
                  style={[
                    styles.avatarRecommendsText,
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
              <View style={styles.inputsContainer}>
                <View
                  style={[
                    styles.inputBlock,
                    { backgroundColor: theme.formInputBackground },
                  ]}
                >
                  <Text
                    style={[
                      styles.label,
                      {
                        textAlign: isRTL ? 'right' : 'left',
                        color: theme.textColor,
                      },
                    ]}
                  >
                    {t('register.name')}
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
                      },
                    ]}
                    placeholderTextColor={theme.formInputPlaceholderColor}
                  />
                </View>

                <View
                  style={[
                    styles.inputBlock,
                    { backgroundColor: theme.formInputBackground },
                  ]}
                >
                  <Text
                    style={[
                      styles.label,
                      {
                        textAlign: isRTL ? 'right' : 'left',
                        color: theme.textColor,
                      },
                    ]}
                  >
                    {t('register.surname')}
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
                      },
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
                  gap: getResponsiveSize(10, 8),
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

          {step === 3 && (
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
          )}

          {step === 4 && (
            <>
              <Text style={[styles.title, { color: theme.textColor }]}>
                {t('register.profile_description')}
              </Text>

              <View
                style={[
                  styles.inputBlock,
                  { backgroundColor: theme.formInputBackground },
                ]}
              >
                <Text
                  style={[
                    styles.label,
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
                  onChangeText={(txt) => setForm({ ...form, description: txt })}
                  multiline
                  style={[
                    styles.input,
                    {
                      height: getResponsiveSize(120, 100),
                      textAlign: isRTL ? 'right' : 'left',
                      color: theme.textColor,
                      backgroundColor: theme.defaultBlocksBackground,
                      borderColor: theme.borderColor,
                      borderWidth: 1,
                    },
                  ]}
                  placeholderTextColor={theme.formInputPlaceholderColor}
                />
              </View>

              <ProgressDots />

              <PrimaryButton
                title={
                  loading ? (
                    <ActivityIndicator color={theme.buttonTextColorPrimary} />
                  ) : (
                    t('register.finish')
                  )
                }
                onPress={handleSubmit}
                disabled={loading}
              />
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
    fontSize: getResponsiveSize(20, 18),
    marginBottom: getResponsiveSize(20, 14),
    textAlign: 'center',
    fontWeight: 'bold',
  },

  button: {
    paddingVertical: getResponsiveSize(14, 12),
    borderRadius: getResponsiveSize(10, 8),
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%', // ширина контролируется контейнером contentBlock
  },
  buttonText: {
    fontSize: getResponsiveSize(16, 14),
    fontWeight: '600',
  },

  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: getResponsiveSize(20, 14),
  },
  dot: { marginHorizontal: getResponsiveSize(4, 4) },

  backArrow: {
    position: 'absolute',
    top: getResponsiveSize(20, 16),
    zIndex: 10,
    height: getResponsiveSize(30, 26),
  },
  backArrowImage: { height: '100%', resizeMode: 'contain' },

  finishedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  finishedText: {
    fontSize: getResponsiveSize(20, 18),
  },

  termsBox: {
    flex: 1,
    height: RFPercentage(65),
    padding: getResponsiveSize(10, 8),
    marginBottom: getResponsiveSize(15, 12),
    backgroundColor: 'transparent',
  },
  termsBoxText: {
    fontSize: getResponsiveSize(14, 13),
    lineHeight: getResponsiveSize(20, 18),
    opacity: 0.6,
  },
  termsCheckboxText: {
    fontSize: getResponsiveSize(14, 13),
    opacity: 0.8,
    fontWeight: 'bold',
  },

  avatarContainer: {
    alignItems: 'center',
    marginBottom: getResponsiveSize(10, 8),
    height: RFPercentage(25),
  },
  avatarWrapper: {
    height: '60%',
    aspectRatio: 1,
    borderRadius: getResponsiveSize(60, 50),
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: getResponsiveSize(60, 50),
    resizeMode: 'cover',
  },
  cameraButton: {
    position: 'absolute',
    bottom: '-2%',
    right: '-2%',
    borderRadius: getResponsiveSize(70, 60),
    width: getResponsiveSize(30, 26),
    height: getResponsiveSize(30, 26),
    overflow: 'hidden',
  },
  cameraIcon: { width: '100%', height: '100%' },
  avatarRecommendsText: {
    marginTop: getResponsiveSize(10, 8),
    fontSize: getResponsiveSize(12, 11),
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: getResponsiveSize(20, 16),
  },

  inputsContainer: {
    height: RFPercentage(43),
  },
  inputBlock: {
    marginBottom: getResponsiveSize(20, 14),
    borderRadius: getResponsiveSize(10, 8),
    paddingVertical: getResponsiveSize(5, 4),
    ...Platform.select({
      web: { zIndex: 1 },
    }),
  },
  label: {
    fontWeight: 'bold',
    opacity: 0.7,
    paddingHorizontal: getResponsiveSize(10, 8),
    paddingTop: getResponsiveSize(6, 4),
    fontSize: getResponsiveSize(12, 11),
  },
  input: {
    paddingHorizontal: getResponsiveSize(10, 10),
    borderRadius: getResponsiveSize(8, 8),
    fontSize: getResponsiveSize(14, 13),
  },
});
