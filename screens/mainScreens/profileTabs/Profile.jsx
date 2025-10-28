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
} from 'react-native';
import { useComponentContext } from '../../../context/globalAppContext';
import { useState } from 'react';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { icons } from '../../../constants/icons';
import { useWindowInfo } from '../../../context/windowContext';
import { useTranslation } from 'react-i18next';
import ImagePickerModal from '../../../components/ui/ImagePickerModal';
import { uploadImageToSupabase } from '../../../utils/supabase/uploadImageToSupabase';
import { scaleByHeight } from '../../../utils/resizeFuncs';
import SubscriptionsModal from '../../../components/SubscriptionsModal';

export default function Profile() {
  const { user, themeController, languageController, session } =
    useComponentContext();
  const [userState, setUserState] = useState(user.current || {});
  const [acceptModalVisible, setAcceptModalVisible] = useState(false);
  const [acceptModalVisibleTitle, setAcceptModalVisibleTitle] = useState('');
  const [acceptModalVisibleFunc, setAcceptModalVisibleFunc] = useState(
    () => {}
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const { height, isLandscape } = useWindowInfo();
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

  const [subscriptionsModal, setSubscriptionsModal] = useState(false);

  // базовые размеры
  const baseFont = RFValue(12);
  const avatarSize = RFValue(100);
  const btnPadding = RFValue(10);
  const btnFont = RFValue(12);
  const btnWidth = '100%';
  const fieldFont = RFValue(10);
  const fieldPadding = RFValue(10);
  const fieldMargin = RFValue(12);
  const containerPaddingH = RFValue(5);
  const containerPaddingV = RFValue(10);
  const containerWidth = '100%';
  const iconSize = RFValue(16);

  // для web-landscape переопределяем
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const sizes = {
    baseFont: isWebLandscape ? height * 0.016 : baseFont,
    avatarSize: isWebLandscape ? scaleByHeight(114, height) : avatarSize,
    btnPadding: isWebLandscape ? height * 0.0144 : btnPadding,
    btnMargin: isWebLandscape ? height * 0 : RFValue(12),
    btnFont: isWebLandscape ? scaleByHeight(20, height) : btnFont,
    btnHeight: isWebLandscape ? scaleByHeight(64, height) : RFValue(64),
    btnWidth: isWebLandscape ? '32%' : btnWidth,
    fieldFont: isWebLandscape ? height * 0.0145 : fieldFont,
    fieldPadding: isWebLandscape ? height * 0.009 : fieldPadding,
    fieldMargin: isWebLandscape ? height * 0 : fieldMargin,
    containerPaddingH: isWebLandscape ? height * 0.02 : containerPaddingH,
    containerPaddingV: isWebLandscape ? height * 0.01 : containerPaddingV,
    containerWidth: isWebLandscape ? '100%' : containerWidth,
    iconSize: isWebLandscape ? scaleByHeight(24, height) : iconSize,
    paddingVertical: isWebLandscape ? height * 0.005 : RFPercentage(2),
    modalWidth: isWebLandscape ? scaleByHeight(450, height) : '80%',
    modalHeight: isWebLandscape ? scaleByHeight(230, height) : '60%',
    modalFont: isWebLandscape ? scaleByHeight(24, height) : baseFont,
    modalTextMarginBottom: isWebLandscape
      ? scaleByHeight(32, height)
      : RFValue(12),
    modalBtnHeight: isWebLandscape ? scaleByHeight(62, height) : RFValue(50),
    modalBtnWidth: isWebLandscape ? scaleByHeight(153, height) : '40%',
    modalBtnFont: isWebLandscape ? scaleByHeight(20, height) : baseFont,
    modalBtnBorderRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(6),
    modalBtnsGap: isWebLandscape ? scaleByHeight(24, height) : RFValue(12),
    modalPadding: isWebLandscape ? scaleByHeight(32, height) : RFValue(16),
    modalLineHeight: isWebLandscape ? scaleByHeight(32, height) : 1,
    modalCloseBtnTopRightPosition: isWebLandscape
      ? scaleByHeight(7, height)
      : RFValue(5),
  };

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
              height: isWebLandscape ? scaleByHeight(250, height) : RFPercentage(30),
              marginBottom: isWebLandscape ? scaleByHeight(15, height) : RFValue(12),
              borderRadius: isWebLandscape ? scaleByHeight(10, height) : RFValue(10),
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
            gap: RFValue(6),
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
            />
          ))}
        </View>

        <View
          style={[
            styles.breakLine,
            {
              backgroundColor: themeController.current?.breakLineColor,
              marginVertical: isWebLandscape ? height * 0.015 : RFValue(12),
            },
          ]}
        />

        {/* Первые 3 кнопки */}
        <View
          style={{
            flexDirection: isWebLandscape ? 'row' : 'column',
            flexWrap: isWebLandscape ? 'wrap' : 'nowrap',
            justifyContent: isWebLandscape ? 'space-between' : 'center',
            gap: RFValue(6),
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
                  [isWebLandscape ? 'height' : 'padding']: isWebLandscape
                    ? sizes.btnHeight
                    : sizes.btnPadding,
                  marginBottom: sizes.btnMargin,
                  width: sizes.btnWidth,
                  borderRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(5),
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
              marginVertical: isWebLandscape ? height * 0.015 : RFValue(12),
            },
          ]}
        />

        {/* Остальные кнопки */}
        <View
          style={{
            flexDirection: isWebLandscape ? 'row' : 'column',
            flexWrap: isWebLandscape ? 'wrap' : 'nowrap',
            justifyContent: isWebLandscape ? 'space-between' : 'center',
            gap: RFValue(6),
            direction: isRTL ? 'rtl' : 'ltr',
            marginBottom: isWebLandscape ? height * 0.02 : RFValue(12),
          }}
        >
          {[
            {
              key: 'change_password',
              style: styles.primaryReverseBtn,
              textStyle: styles.primaryText,
              bg: themeController.current?.buttonTextColorPrimary,
              color: themeController.current?.buttonColorPrimaryDefault,
              border: themeController.current?.buttonColorPrimaryDefault,
              onPress: () => {},
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
                  [isWebLandscape ? 'height' : 'padding']: isWebLandscape
                    ? sizes.btnHeight
                    : sizes.btnPadding,
                  marginBottom: sizes.btnMargin,
                  width: sizes.btnWidth,
                  borderRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(5),
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
            gap: RFValue(6),
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
                [isWebLandscape ? 'height' : 'padding']: isWebLandscape
                  ? sizes.btnHeight
                  : sizes.btnPadding,
                marginBottom: sizes.btnMargin,
                width: sizes.btnWidth,
                borderRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(5),
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
                  width: sizes.iconSize,
                  height: sizes.iconSize,
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
          [Platform.OS === 'web' && isLandscape ? 'height' : 'paddingVertical']:
            Platform.OS === 'web' && isLandscape ? btnHeight : fieldPadding,
          marginBottom: fieldMargin,
          backgroundColor: editMode
            ? themeController.current?.formInputBackgroundEditMode
            : themeController.current?.formInputBackground,
          borderRadius: Platform.OS === 'web' && isLandscape ? 8 : RFValue(5),
          paddingHorizontal:
            Platform.OS === 'web' && isLandscape ? RFValue(8) : RFValue(14),
        },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.profileInfoLabel,
            {
              fontSize: baseFont * 0.9,
              color: themeController.current?.formInputLabelColor,
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
        <View style={styles.editPanel}>
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
  userProfile: { flex: 1, paddingVertical: RFPercentage(2) },
  profileBack: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RFValue(10),
    overflow: 'hidden',
    marginBottom: RFValue(12),
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
    borderRadius: 8,
    paddingHorizontal: RFValue(14),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakLine: { width: '100%', height: 1, marginVertical: RFValue(12) },
  primaryBtn: {
    borderRadius: RFValue(5),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RFValue(12),
  },
  primaryText: {
    // fontWeight: 'bold'
  },
  secondaryBtn: {
    borderRadius: RFValue(5),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RFValue(12),
  },
  secondaryText: {
    // fontWeight: 'bold'
  },
  primaryReverseBtn: {
    borderRadius: RFValue(5),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: RFValue(12),
  },
  secondaryReverseBtn: {
    borderRadius: RFValue(5),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: RFValue(12),
  },
  profileInfoLabel: { fontWeight: 'bold', marginBottom: RFValue(4) },
  profileInfoText: {
    width: '100%',
    fontFamily: 'Rubik-Medium',
    fontWeight: '500',
  },
  editPanel: { flexDirection: 'row', gap: RFValue(5) },
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
