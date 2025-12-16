import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { useComponentContext } from '../../../context/globalAppContext';
import { useMemo, useState } from 'react';
import { icons } from '../../../constants/icons';
import { useWindowInfo } from '../../../context/windowContext';
import { useTranslation } from 'react-i18next';
import ImagePickerModal from '../../../components/ui/ImagePickerModal';
import { uploadImageToSupabase } from '../../../utils/supabase/uploadImageToSupabase';
import { scaleByHeight, scaleByHeightMobile } from '../../../utils/resizeFuncs';
import SubscriptionsModal from '../../../components/SubscriptionsModal';

export default function Profile() {
  const { user, themeController, languageController, session } =
    useComponentContext();
  const [userState, setUserState] = useState(user.current || {});
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [acceptModalVisibleTitle, setAcceptModalVisibleTitle] = useState('');
  const [acceptModalVisibleFunc, setAcceptModalVisibleFunc] = useState(
    () => () => {}
  );
  const [changePasswordModal, showPasswordModal] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const { height } = useWindowDimensions();
  const { isLandscape } = useWindowInfo();
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

  const [subscriptionsModal, setSubscriptionsModal] = useState(false);

  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      baseFont: isWebLandscape ? web(12) : mobile(12),
      avatarSize: isWebLandscape ? web(114) : mobile(114),
      btnPadding: isWebLandscape ? web(10) : mobile(10),
      btnMargin: isWebLandscape ? 0 : mobile(5),
      btnFont: isWebLandscape ? web(20) : mobile(20),
      btnHeight: isWebLandscape ? web(64) : mobile(64),
      btnWidth: isWebLandscape ? '32%' : '100%',
      labelFont: isWebLandscape ? web(12) : mobile(12),
      fieldFont: isWebLandscape ? web(16) : mobile(16),
      fieldPadding: isWebLandscape ? web(10) : mobile(10),
      fieldMargin: isWebLandscape ? 0 : mobile(5),
      containerPaddingH: isWebLandscape ? web(24) : mobile(12),
      containerPaddingV: isWebLandscape ? web(10) : mobile(10),
      containerWidth: '100%',
      iconSize: isWebLandscape ? web(24) : mobile(24),
      paddingVertical: isWebLandscape ? web(10) : mobile(10),
      modalWidth: isWebLandscape ? web(450) : '80%',
      modalHeight: isWebLandscape ? web(230) : '60%',
      modalFont: isWebLandscape ? web(24) : mobile(24),
      modalTextMarginBottom: isWebLandscape ? web(32) : mobile(32),
      modalBtnHeight: isWebLandscape ? web(62) : mobile(62),
      modalBtnWidth: isWebLandscape ? web(153) : '40%',
      modalBtnFont: isWebLandscape ? web(20) : mobile(20),
      modalBtnBorderRadius: isWebLandscape ? web(8) : mobile(8),
      modalBtnsGap: isWebLandscape ? web(24) : mobile(24),
      modalPadding: isWebLandscape ? web(32) : mobile(32),
      modalLineHeight: isWebLandscape ? web(32) : mobile(32),
      modalCloseBtnTopRightPosition: isWebLandscape ? web(7) : mobile(7),
      modalIconSize: isWebLandscape ? web(22) : mobile(22),
      modalFieldMargin: isWebLandscape ? web(18) : mobile(18),
      profileBackHeight: isWebLandscape ? web(250) : mobile(250),
      profileBackMarginBottom: isWebLandscape ? web(15) : mobile(15),
      profileBackBorderRadius: isWebLandscape ? web(10) : mobile(10),
      infoFieldsGap: isWebLandscape ? web(6) : mobile(6),
      breakLineMarginVertical: isWebLandscape ? web(15) : mobile(15),
      buttonsMarginBottom: isWebLandscape ? web(20) : mobile(20),
      infoFieldBorderRadius: isWebLandscape ? web(8) : mobile(8),
      infoFieldPaddingH: isWebLandscape ? web(16) : mobile(16),
      labelMarginBottom: isWebLandscape ? web(4) : mobile(4),
      editPanelGap: isWebLandscape ? web(5) : mobile(5),
    };
  }, [height, isWebLandscape]);

  // Функция загрузки и обновления аватара
  async function uploadAvatar(uri) {
    try {
      const res = await uploadImageToSupabase(uri, user?.current?.id, {
        bucket: 'avatars',
        isAvatar: true,
      });
      if (res.publicUrl) {
        const updated = await user.update({ avatar: res.publicUrl });
        setUserState(updated); // Обновляем локальное состояние
      }
    } catch (err) {
      console.error('Ошибка загрузки аватара:', err.message);
    }
  }

  return (
    <ScrollView
      style={[
        styles.userProfile,
        {
          backgroundColor: themeController.current?.backgroundColor,
          paddingVertical: sizes.paddingVertical,
        },
      ]}
      contentContainerStyle={{
        alignItems: isWebLandscape ? 'center' : 'stretch',
      }}
    >
      <View
        style={{
          paddingHorizontal: sizes.containerPaddingH,
          paddingBottom: sizes.containerPaddingV,
          width: sizes.containerWidth,
        }}
      >
        <ImageBackground
          source={userState?.profileBack}
          resizeMode='cover'
          style={[
            styles.profileBack,
            {
              backgroundColor:
                themeController.current?.profileDefaultBackground,
              height: sizes.profileBackHeight,
              marginBottom: sizes.profileBackMarginBottom,
              borderRadius: sizes.profileBackBorderRadius,
            },
          ]}
        >
          <View style={{ position: 'relative' }}>
            <Image
              source={
                userState.avatar
                  ? { uri: userState.avatar }
                  : icons.defaultAvatarInverse
              }
              style={{
                width: sizes.avatarSize,
                height: sizes.avatarSize,
                borderRadius: sizes.avatarSize / 2,
                backgroundColor: '#ccc',
              }}
            />
            {/* Кнопка редактирования аватара */}
            <TouchableOpacity
              style={[
                styles.cameraButton,
                {
                  width: sizes.avatarSize * 0.3,
                  height: sizes.avatarSize * 0.3,
                },
              ]}
              onPress={() => setPickerVisible(true)}
            >
              <Image source={icons.camera} style={styles.cameraIcon} />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Инфо-поля */}
        <View
          style={{
            flexDirection: isWebLandscape ? 'row' : 'column',
            flexWrap: isWebLandscape ? 'wrap' : 'nowrap',
            justifyContent: isWebLandscape ? 'space-between' : 'center',
            gap: sizes.infoFieldsGap,
            direction: isRTL ? 'rtl' : 'ltr',
          }}
        >
          {[
            { key: 'first_name', value: userState?.name, field: 'name' },
            { key: 'surname', value: userState?.surname, field: 'surname' },
            {
              key: 'about',
              value: userState?.about,
              field: 'about',
              multiline: true,
            },
            {
              key: 'location',
              value: userState?.location || '',
              field: 'location',
            },
            { key: 'email', value: userState?.email, field: 'email' },
            {
              key: 'phone',
              value: userState?.phoneNumber,
              field: 'phoneNumber',
            },
          ].map((f) => (
            <InfoField
              key={f.key}
              label={t(`my_profile.${f.key}`)}
              value={f.value}
              changeInfo={async (v) => {
                setUserState((p) => ({ ...p, [f.field]: v }));
                try {
                  const updated = await user.update({ [f.field]: v });
                  setUserState(updated);
                } catch (err) {
                  console.error('Ошибка сохранения:', err.message);
                }
              }}
              baseFont={sizes.fieldFont}
              fieldPadding={sizes.fieldPadding}
              btnHeight={sizes.btnHeight}
              fieldMargin={sizes.fieldMargin}
              iconSize={sizes.iconSize}
              isLandscape={isLandscape}
              multiline={f.multiline}
              height={height}
              sizes={sizes}
            />
          ))}
        </View>

        <View
          style={[
            styles.breakLine,
            {
              backgroundColor: themeController.current?.breakLineColor,
              marginVertical: sizes.breakLineMarginVertical,
            },
          ]}
        />

        {/* Первые 3 кнопки */}
        <View
          style={{
            flexDirection: isWebLandscape ? 'row' : 'column',
            flexWrap: isWebLandscape ? 'wrap' : 'nowrap',
            justifyContent: isWebLandscape ? 'space-between' : 'center',
            gap: sizes.infoFieldsGap,
            direction: isRTL ? 'rtl' : 'ltr',
          }}
        >
          {['cupons', 'subscription', 'payment'].map((key) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor:
                    themeController.current?.buttonColorPrimaryDefault,
                  height: sizes.btnHeight,
                  marginBottom: sizes.btnMargin,
                  width: sizes.btnWidth,
                  borderRadius: sizes.infoFieldBorderRadius,
                },
              ]}
              onPress={() => {
                /* Навигация по кнопкам */
                if (key === 'subscription') {
                  // Открыть модалку подписок
                  setSubscriptionsModal(true);
                }
              }}
            >
              <Text
                style={[
                  styles.primaryText,
                  {
                    fontSize: sizes.btnFont,
                    color: themeController.current?.buttonTextColorPrimary,
                  },
                ]}
              >
                {t(`my_profile.${key}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View
          style={[
            styles.breakLine,
            {
              backgroundColor: themeController.current?.breakLineColor,
              marginVertical: sizes.breakLineMarginVertical,
            },
          ]}
        />

        {/* Остальные кнопки */}
        <View
          style={{
            flexDirection: isWebLandscape ? 'row' : 'column',
            flexWrap: isWebLandscape ? 'wrap' : 'nowrap',
            justifyContent: isWebLandscape ? 'space-between' : 'center',
            gap: sizes.infoFieldsGap,
            direction: isRTL ? 'rtl' : 'ltr',
            marginBottom: sizes.buttonsMarginBottom,
          }}
        >
          {[
            {
              key: user.current?.is_password_exist
                ? 'change_password'
                : 'create_password',
              style: styles.primaryReverseBtn,
              textStyle: styles.primaryText,
              bg: themeController.current?.buttonTextColorPrimary,
              color: themeController.current?.buttonColorPrimaryDefault,
              border: themeController.current?.buttonColorPrimaryDefault,
              onPress: () => {
                setOldPassword('');
                setNewPassword('');
                setRepeatPassword('');
                showPasswordModal(true);
              },
            },
            {
              key: 'logout',
              style: styles.secondaryReverseBtn,
              textStyle: styles.secondaryText,
              bg: themeController.current?.buttonTextColorSecondary,
              color: themeController.current?.buttonColorSecondaryDefault,
              border: themeController.current?.buttonColorSecondaryDefault,
              onPress: () => {
                setAcceptModalVisible(true);
                setAcceptModalVisibleTitle(t('my_profile.confirm_logout'));
                setAcceptModalVisibleFunc(() => async () => {
                  try {
                    await session.signOut();
                  } catch (err) {
                    console.error('Ошибка выхода из системы:', err.message);
                  }
                  setAcceptModalVisible(false);
                });
              },
            },
            {
              key: 'export_data',
              style: styles.secondaryReverseBtn,
              textStyle: styles.secondaryText,
              bg: themeController.current?.buttonTextColorSecondary,
              color: themeController.current?.buttonColorSecondaryDefault,
              border: themeController.current?.buttonColorSecondaryDefault,
              onPress: () => {},
            },
          ].map((btn) => (
            <TouchableOpacity
              key={btn.key}
              onPress={btn.onPress}
              style={[
                btn.style,
                {
                  backgroundColor: btn.bg,
                  borderColor: btn.border,
                  height: sizes.btnHeight,
                  marginBottom: sizes.btnMargin,
                  width: sizes.btnWidth,
                  borderRadius: sizes.infoFieldBorderRadius,
                },
              ]}
            >
              <Text
                style={[
                  btn.textStyle,
                  { fontSize: sizes.btnFont, color: btn.color },
                ]}
              >
                {t(`my_profile.${btn.key}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Кнопка Delete */}
        <View
          style={{
            flexDirection: isWebLandscape ? 'row' : 'column',
            flexWrap: isWebLandscape ? 'wrap' : 'nowrap',
            justifyContent: 'center',
            gap: sizes.infoFieldsGap,
            direction: isRTL ? 'rtl' : 'ltr',
          }}
        >
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              {
                backgroundColor:
                  themeController.current?.buttonColorSecondaryDefault,
                borderColor:
                  themeController.current?.buttonColorSecondaryDefault,
                height: sizes.btnHeight,
                marginBottom: sizes.btnMargin,
                width: sizes.btnWidth,
                borderRadius: sizes.infoFieldBorderRadius,
              },
            ]}
            onPress={() => {
              setAcceptModalVisible(true);
              setAcceptModalVisibleTitle(t('my_profile.confirm_delete'));
              setAcceptModalVisibleFunc(() => async () => {
                try {
                  await user.delete();
                } catch (err) {
                  console.error('Ошибка удаления:', err.message);
                }
                setAcceptModalVisible(false);
              });
            }}
          >
            <Text
              style={[
                styles.secondaryText,
                {
                  fontSize: sizes.btnFont,
                  color: themeController.current?.buttonTextColorSecondary,
                },
              ]}
            >
              {t('my_profile.delete')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal подтверждения */}
      <Modal visible={acceptModalVisible} transparent animationType='fade'>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: themeController.current?.backgroundColor,
                width: sizes.modalWidth,
                padding: sizes.modalPadding,
                borderRadius: sizes.modalBtnBorderRadius,
              },
              isWebLandscape && { height: sizes.modalHeight },
            ]}
          >
            <TouchableOpacity
              style={[
                {
                  position: 'absolute',
                  top: sizes.modalCloseBtnTopRightPosition,
                  right: sizes.modalCloseBtnTopRightPosition,
                },
              ]}
              onPress={() => setAcceptModalVisible(false)}
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
                styles.modalText,
                {
                  fontSize: sizes.modalFont,
                  marginBottom: sizes.modalTextMarginBottom,
                  textAlign: 'center',
                  color: themeController.current?.textColor,
                  lineHeight: sizes.modalLineHeight,
                },
              ]}
            >
              {acceptModalVisibleTitle}
            </Text>
            <View
              style={[
                styles.modalButtonsRow,
                {
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  gap: sizes.modalBtnsGap,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor:
                      themeController.current?.buttonColorPrimaryDefault,
                    height: sizes.modalBtnHeight,
                    width: sizes.modalBtnWidth,
                    borderRadius: sizes.modalBtnBorderRadius,
                  },
                ]}
                onPress={() => setAcceptModalVisible(false)}
              >
                <Text
                  style={{
                    color: themeController.current?.buttonTextColorPrimary,
                    fontSize: sizes.modalBtnFont,
                  }}
                >
                  {t('common.no')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor:
                      themeController.current?.buttonTextColorPrimary,
                    height: sizes.modalBtnHeight,
                    width: sizes.modalBtnWidth,
                    borderRadius: sizes.modalBtnBorderRadius,
                    borderWidth: 1,
                    borderColor:
                      themeController.current?.buttonColorPrimaryDefault,
                  },
                ]}
                onPress={() => acceptModalVisibleFunc()}
              >
                <Text
                  style={{
                    color: themeController.current?.buttonColorPrimaryDefault,
                    fontSize: sizes.modalBtnFont,
                  }}
                >
                  {t('common.yes')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal смены пароля */}
      <Modal visible={changePasswordModal} transparent animationType='fade'>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: themeController.current?.backgroundColor,
                width: sizes.modalWidth,
                padding: sizes.modalPadding,
                borderRadius: sizes.modalBtnBorderRadius,
              },
              // isWebLandscape && { height: sizes.modalHeight },
            ]}
          >
            <TouchableOpacity
              style={[
                {
                  position: 'absolute',
                  top: sizes.modalCloseBtnTopRightPosition,
                  right: sizes.modalCloseBtnTopRightPosition,
                },
              ]}
              onPress={() => showPasswordModal(false)}
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
                styles.modalText,
                {
                  fontSize: sizes.modalFont,
                  marginBottom: sizes.modalTextMarginBottom,
                  textAlign: 'center',
                  color: themeController.current?.textColor,
                  lineHeight: sizes.modalLineHeight,
                },
              ]}
            >
              {user.current?.is_password_exist
                ? t('my_profile.change_password')
                : t('my_profile.create_password')}
            </Text>

            {/* Поля ввода паролей */}
            <View style={{ width: '100%', marginBottom: sizes.fieldMargin }}>
              {/* Старый пароль — только если пароль уже существует */}
              {user.current?.is_password_exist && (
                <View
                  style={[
                    styles.profileInfoString,
                    {
                      backgroundColor:
                        themeController.current?.formInputBackground,
                      borderRadius: sizes.infoFieldBorderRadius,
                      height: sizes.btnHeight,
                      paddingHorizontal: sizes.infoFieldPaddingH,
                      marginBottom: sizes.modalFieldMargin,
                      position: 'relative',
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.profileInfoLabel,
                        {
                          fontSize: sizes.labelFont,
                          color: themeController.current?.formInputLabelColor,
                        },
                      ]}
                    >
                      {t('my_profile.old_password')}
                    </Text>

                    <TextInput
                      secureTextEntry={!showOldPassword}
                      value={oldPassword}
                      onChangeText={setOldPassword}
                      style={[
                        styles.profileInfoText,
                        {
                          fontSize: sizes.fieldFont,
                          color: themeController.current?.formInputTextColor,
                        },
                      ]}
                    />
                  </View>

                  {/* ICON */}
                  <TouchableOpacity
                    onPress={() => setShowOldPassword((p) => !p)}
                    style={{
                      position: 'absolute',
                      right: isRTL ? undefined : sizes.iconSize / 2,
                      left: isRTL ? sizes.iconSize / 2 : undefined,
                      top: '56%',
                      transform: [{ translateY: -sizes.iconSize / 2 }],
                    }}
                  >
                    <Image
                      source={showOldPassword ? icons.eyeOpen : icons.eyeClosed}
                      style={{
                        width: sizes.iconSize,
                        height: sizes.iconSize,
                        tintColor: themeController.current?.formInputLabelColor,
                      }}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Новый пароль */}
              <View
                style={[
                  styles.profileInfoString,
                  {
                    backgroundColor:
                      themeController.current?.formInputBackground,
                    borderRadius: sizes.infoFieldBorderRadius,
                    height: sizes.btnHeight,
                    paddingHorizontal: sizes.infoFieldPaddingH,
                    marginBottom: sizes.modalFieldMargin,
                    position: 'relative',
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.profileInfoLabel,
                      {
                        fontSize: sizes.labelFont,
                        color: themeController.current?.formInputLabelColor,
                      },
                    ]}
                  >
                    {t('my_profile.new_password')}
                  </Text>

                  <TextInput
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    style={[
                      styles.profileInfoText,
                      {
                        fontSize: sizes.fieldFont,
                        color: themeController.current?.formInputTextColor,
                      },
                    ]}
                  />
                </View>

                {/* ICON */}
                <TouchableOpacity
                  onPress={() => setShowNewPassword((p) => !p)}
                  style={{
                    position: 'absolute',
                    right: isRTL ? undefined : sizes.iconSize / 2,
                    left: isRTL ? sizes.iconSize / 2 : undefined,
                    top: '56%',
                    transform: [{ translateY: -sizes.iconSize / 2 }],
                  }}
                >
                  <Image
                    source={showNewPassword ? icons.eyeOpen : icons.eyeClosed}
                    style={{
                      width: sizes.iconSize,
                      height: sizes.iconSize,
                      tintColor: themeController.current?.formInputLabelColor,
                    }}
                  />
                </TouchableOpacity>
              </View>

              {/* Повтор нового пароля */}
              <View
                style={[
                  styles.profileInfoString,
                  {
                    backgroundColor:
                      themeController.current?.formInputBackground,
                    borderRadius: sizes.infoFieldBorderRadius,
                    height: sizes.btnHeight,
                    paddingHorizontal: sizes.infoFieldPaddingH,
                    marginBottom: sizes.modalFieldMargin,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.profileInfoLabel,
                      {
                        fontSize: sizes.labelFont,
                        color: themeController.current?.formInputLabelColor,
                      },
                    ]}
                  >
                    {t('my_profile.repeat_new_password')}
                  </Text>

                  <TextInput
                    secureTextEntry={true}
                    value={repeatPassword}
                    onChangeText={setRepeatPassword}
                    style={[
                      styles.profileInfoText,
                      {
                        fontSize: sizes.fieldFont,
                        color: themeController.current?.formInputTextColor,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            <View
              style={[
                styles.modalButtonsRow,
                {
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  gap: sizes.modalBtnsGap,
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor:
                      themeController.current?.buttonColorPrimaryDefault,
                    height: sizes.modalBtnHeight,
                    width: sizes.modalBtnWidth,
                    borderRadius: sizes.modalBtnBorderRadius,
                  },
                ]}
                onPress={() => showPasswordModal(false)}
              >
                <Text
                  style={{
                    color: themeController.current?.buttonTextColorPrimary,
                    fontSize: sizes.modalBtnFont,
                  }}
                >
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalBtn,
                  {
                    backgroundColor:
                      themeController.current?.buttonTextColorPrimary,
                    height: sizes.modalBtnHeight,
                    width: sizes.modalBtnWidth,
                    borderRadius: sizes.modalBtnBorderRadius,
                    borderWidth: 1,
                    borderColor:
                      themeController.current?.buttonColorPrimaryDefault,
                  },
                ]}
                onPress={async () => {
                  if (newPassword !== repeatPassword) {
                    alert(t('errors.passwords_not_match'));
                    return;
                  }

                  if (user.current?.is_password_exist) {
                    const res = await session.changePassword(
                      oldPassword,
                      newPassword
                    );
                    if (!res.success) {
                      alert(res.error);
                      return;
                    }
                  } else {
                    const res = await session.createPassword(newPassword);
                    if (!res.success) {
                      alert(res.error);
                      return;
                    }
                  }

                  showPasswordModal(false);
                }}
              >
                <Text
                  style={{
                    color: themeController.current?.buttonColorPrimaryDefault,
                    fontSize: sizes.modalBtnFont,
                  }}
                >
                  {user.current?.is_password_exist
                    ? t('common.change')
                    : t('common.create')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal выбора изображения */}
      <ImagePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onAdd={async (uris) => {
          if (uris?.length > 0) {
            await uploadAvatar(uris[0]);
          }
        }}
      />

      {/* Subscriptions */}
      <SubscriptionsModal
        visible={subscriptionsModal}
        main={false}
        closeModal={() => {
          setSubscriptionsModal(false);
        }}
      />
    </ScrollView>
  );
}

function InfoField({
  label,
  value,
  changeInfo,
  multiline = false,
  baseFont,
  fieldPadding,
  fieldMargin,
  iconSize,
  isLandscape,
  btnHeight,
  height,
  sizes,
}) {
  const { themeController } = useComponentContext();
  const [editMode, setEditMode] = useState(false);
  const [textValue, setTextValue] = useState(value);

  return (
    <View
      style={[
        styles.profileInfoString,
        {
          width: Platform.OS === 'web' && isLandscape ? '32%' : '100%',
          height: btnHeight,
          marginBottom: fieldMargin,
          backgroundColor: editMode
            ? themeController.current?.formInputBackgroundEditMode
            : themeController.current?.formInputBackground,
          borderRadius: sizes.infoFieldBorderRadius,
          paddingHorizontal: sizes.infoFieldPaddingH,
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.profileInfoLabel,
            {
              fontSize: sizes.labelFont,
              color: themeController.current?.formInputLabelColor,
              marginBottom: sizes.labelMarginBottom,
            },
          ]}
        >
          {label}
        </Text>
        {editMode ? (
          <TextInput
            style={[
              styles.profileInfoText,
              {
                fontSize: baseFont,
                color: themeController.current?.formInputTextColor,
              },
            ]}
            value={textValue}
            onChangeText={setTextValue}
            multiline={multiline}
          />
        ) : (
          <Text
            style={[
              styles.profileInfoText,
              {
                fontSize: baseFont,
                color: themeController.current?.formInputTextColor,
                minHeight: baseFont * 0.9,
              },
            ]}
          >
            {textValue}
          </Text>
        )}
      </View>
      {editMode ? (
        <View style={[styles.editPanel, { gap: sizes.editPanelGap }]}>
          <TouchableOpacity
            onPress={() => {
              setEditMode(false);
              setTextValue(value);
            }}
          >
            <Image
              source={icons.cancel}
              style={{
                width: iconSize,
                height: iconSize,
                resizeMode: 'contain',
                tintColor: '#00000080',
              }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              setEditMode(false);
              await changeInfo(textValue);
            }}
          >
            <Image
              source={icons.checkCircle}
              style={{
                width: iconSize,
                height: iconSize,
                resizeMode: 'contain',
                tintColor: '#00000080',
              }}
            />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={() => setEditMode(true)}>
          <Image
            source={icons.edit}
            style={{
              width: iconSize,
              height: iconSize,
              resizeMode: 'contain',
              tintColor: '#00000080',
            }}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  userProfile: { flex: 1 },
  profileBack: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  profileInfoString: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakLine: { width: '100%', height: 1 },
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    // fontWeight: 'bold'
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    // fontWeight: 'bold'
  },
  primaryReverseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryReverseBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  profileInfoLabel: {
    // fontWeight: 'bold'
  },
  profileInfoText: {
    width: '100%',
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
  },
  editPanel: { flexDirection: 'row' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: { width: '80%', position: 'relative' },
  modalButtonsRow: { justifyContent: 'center' },
  modalBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
  },
  modalText: {
    fontFamily: 'Rubik-Bold',
  },
});
