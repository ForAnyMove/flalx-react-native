import { useState } from 'react';
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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { RFValue, RFPercentage } from 'react-native-responsive-fontsize';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import { useComponentContext } from '../context/globalAppContext';
import ImagePickerModal from '../components/ui/ImagePickerModal';
import { uploadImageToSupabase } from '../utils/supabase/uploadImageToSupabase';
import { icons } from '../constants/icons';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const { user, themeController, session } = useComponentContext();
  const theme = themeController.current;
  const isRTL = I18nManager.isRTL;

  const [step, setStep] = useState(1);
  const [accepted, setAccepted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    surname: '',
  });
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  const isNameValid = form.name.trim().length > 1;
  const isSurnameValid = form.surname.trim().length > 1;

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  // загрузка в supabase
  async function uploadImage(uri) {
    const avatarUrl = await uploadImageToSupabase(uri, user.current.id, {
      bucket: 'avatars',
      isAvatar: true,
    });
    setAvatarUrl(avatarUrl.publicUrl);
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
        let size = active
          ? RFValue(10)
          : distance === 1
          ? RFValue(8)
          : RFValue(6);
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
      <Text
        style={[
          styles.buttonText,
          { color: theme.buttonTextColorPrimary },
          customStyle?.btnText,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  // === Навигационная стрелка ===
  const BackArrow = () => (
    <TouchableOpacity
      onPress={() => (step > 1 ? setStep(step - 1) : session.signOut())}
      style={[styles.backArrow, { [isRTL ? 'right' : 'left']: RFValue(10) }]}
    >
      <Image
        style={styles.backArrowImage}
        source={
          isRTL
            ? icons.arrowRight
            : icons.arrowLeft
        }
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
        {/* <Image
          source={require("../assets/register/check.png")}
          style={styles.checkImage}
        /> */}
        <Text style={[styles.finishedText, { color: theme.textColor }]}>
          {t('register.register_success')}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
    >
      <BackArrow />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: RFValue(40) }}
      >
        {step === 1 && (
          <>
            <Text style={[styles.title, { color: theme.primaryColor }]}>
              {t('register.terms_title')}
            </Text>
            <ScrollView style={[styles.termsBox]}>
              <Text style={[styles.termsBoxText, { color: theme.textColor }]}>
                {t('register.terms_text')}
              </Text>
            </ScrollView>
            <BouncyCheckbox
              size={RFValue(18)}
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
                borderWidth: RFValue(2),
                borderRadius: RFValue(3),
              }}
              iconStyle={{ borderRadius: RFValue(3) }}
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
                    avatarUrl
                      ? { uri: avatarUrl }
                      : icons.defaultAvatar // заглушка
                  }
                  style={styles.avatarImage}
                />
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={() => setPickerVisible(true)}
                >
                  <Image
                    source={icons.camera}
                    style={styles.cameraIcon}
                  />
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
                    },
                  ]}
                  placeholderTextColor={theme.placeholderTextColor}
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
                    },
                  ]}
                  placeholderTextColor={theme.placeholderTextColor}
                />
              </View>
            </View>
            <ProgressDots />
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                justifyContent: 'space-between',
                gap: RFValue(10),
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
                  backgroundColor: theme.formInputBackground,
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
              placeholderTextColor={theme.placeholderTextColor}
            />
            <ProgressDots />
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                justifyContent: 'space-between',
                gap: RFValue(10),
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
                    height: RFValue(120),
                    textAlign: isRTL ? 'right' : 'left',
                    color: theme.textColor,
                  },
                ]}
                placeholderTextColor={theme.placeholderTextColor}
              />
            </View>
            <ProgressDots />
            <PrimaryButton
              title={t('register.finish')}
              onPress={handleSubmit}
              disabled={loading}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1, padding: RFValue(20) },
  title: {
    fontSize: RFValue(20),
    marginBottom: RFValue(20),
    textAlign: 'center',
    fontWeight: 'bold',
  },
  button: {
    padding: RFValue(14),
    borderRadius: RFValue(10),
    alignItems: 'center',
  },
  buttonText: {
    fontSize: RFValue(16),
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: RFValue(20),
  },
  dot: { marginHorizontal: RFValue(4) },
  backArrow: {
    position: 'absolute',
    top: RFValue(20),
    zIndex: 10,
    height: RFValue(30),
  },
  backArrowText: { fontSize: RFValue(20) },
  backArrowImage: { height: '100%', resizeMode: 'contain' },
  finishedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkImage: {
    width: RFValue(100),
    height: RFValue(100),
    marginBottom: RFValue(20),
  },
  finishedText: {
    fontSize: RFValue(20),
  },
  termsBox: {
    flex: 1,
    height: RFPercentage(65),
    padding: RFValue(10),
    marginBottom: RFValue(15),
  },
  termsBoxText: {
    fontSize: RFValue(14),
    lineHeight: RFValue(20),
    opacity: 0.6,
  },
  termsCheckboxText: {
    fontSize: RFValue(14),
    opacity: 0.6,
    fontWeight: 'bold',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: RFValue(10),
    height: RFPercentage(25),
  },
  avatarWrapper: {
    height: '60%',
    aspectRatio: 1,
    borderRadius: RFValue(60),
    // overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: RFValue(60),
    resizeMode: 'cover',
  },
  cameraButton: {
    position: 'absolute',
    bottom: '-2%',
    right: '-2%',
    borderRadius: RFValue(70),
    width: RFValue(30),
    height: RFValue(30),
  },
  cameraIcon: {
    width: '100%',
    height: '100%',
  },
  avatarRecommendsText: {
    marginTop: RFValue(10),
    fontSize: RFValue(12),
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: RFValue(20),
  },
  inputsContainer: {
    height: RFPercentage(43),
  },
  inputBlock: {
    marginBottom: RFValue(20),
    borderRadius: RFValue(10),
    paddingVertical: RFValue(5),
    ...Platform.select({
      web: {
        zIndex: 1,
      },
    }),
  },
  imageInputBlock: {
    marginBottom: RFValue(10),
    ...Platform.select({
      web: {
        zIndex: 1,
      },
    }),
  },
  label: {
    fontWeight: 'bold',
    opacity: 0.6,
    paddingHorizontal: RFValue(10),
    paddingTop: RFValue(6),
  },
  input: {
    paddingHorizontal: RFValue(10),
    borderRadius: RFValue(8),
  },
});
