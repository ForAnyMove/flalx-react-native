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

export default function Profile() {
  const { user, themeController, languageController, session } = useComponentContext();
  const [userState, setUserState] = useState(user.current || {});
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const { height, isLandscape } = useWindowInfo();
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

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
    avatarSize: isWebLandscape ? height * 0.13 : avatarSize,
    btnPadding: isWebLandscape ? height * 0.0144 : btnPadding,
    btnMargin: isWebLandscape ? height * 0 : RFValue(12),
    btnFont: isWebLandscape ? height * 0.017 : btnFont,
    btnWidth: isWebLandscape ? '32%' : btnWidth,
    fieldFont: isWebLandscape ? height * 0.0145 : fieldFont,
    fieldPadding: isWebLandscape ? height * 0.009 : fieldPadding,
    fieldMargin: isWebLandscape ? height * 0 : fieldMargin,
    containerPaddingH: isWebLandscape ? height * 0.02 : containerPaddingH,
    containerPaddingV: isWebLandscape ? height * 0.01 : containerPaddingV,
    containerWidth: isWebLandscape ? '98%' : containerWidth,
    iconSize: isWebLandscape ? RFValue(8) : iconSize,
    paddingVertical: isWebLandscape ? height * 0.005 : RFPercentage(2),
  };

  return (
    <ScrollView
      style={[
        styles.userProfile,
        { backgroundColor: themeController.current?.backgroundColor, paddingVertical: sizes.paddingVertical },
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
          resizeMode="cover"
          style={[
            styles.profileBack,
            {
              backgroundColor: themeController.current?.profileDefaultBackground,
              height: isWebLandscape ? height * 0.3 : RFPercentage(30),
              marginBottom: isWebLandscape ? height * 0.01 : RFValue(12),
              borderRadius: isWebLandscape ? RFValue(5) : RFValue(10),
            },
          ]}
        >
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
            { key: 'about', value: userState?.about, field: 'about', multiline: true },
            { key: 'location', value: userState?.location || '', field: 'location' },
            { key: 'email', value: userState?.email, field: 'email' },
            { key: 'phone', value: userState?.phoneNumber, field: 'phoneNumber' },
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
            { backgroundColor: themeController.current?.breakLineColor, marginVertical: isWebLandscape ? height * 0.015 : RFValue(12) },
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
                  backgroundColor: themeController.current?.buttonColorPrimaryDefault,
                  padding: sizes.btnPadding,
                  marginBottom: sizes.btnMargin,
                  width: sizes.btnWidth,
                  borderRadius: isWebLandscape ? RFValue(3) : RFValue(5),
                },
              ]}
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
            { backgroundColor: themeController.current?.breakLineColor, marginVertical: isWebLandscape ? height * 0.015 : RFValue(12) },
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
              onPress: () => { session.signOut() },
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
                  padding: sizes.btnPadding,
                  marginBottom: sizes.btnMargin,
                  width: sizes.btnWidth,
                  borderRadius: isWebLandscape ? RFValue(3) : RFValue(5),
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
                backgroundColor: themeController.current?.buttonColorSecondaryDefault,
                borderColor: themeController.current?.buttonColorSecondaryDefault,
                padding: sizes.btnPadding,
                marginBottom: sizes.btnMargin,
                width: sizes.btnWidth,
                borderRadius: isWebLandscape ? RFValue(3) : RFValue(5),
              },
            ]}
            onPress={() => setDeleteModalVisible(true)}
          >
            <Text
              style={[
                styles.secondaryText,
                { fontSize: sizes.btnFont, color: themeController.current?.buttonTextColorSecondary },
              ]}
            >
              {t('my_profile.delete')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal подтверждения удаления */}
      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: themeController.current?.backgroundColor }]}>
            <Text style={{ fontSize: sizes.baseFont, marginBottom: RFValue(12), textAlign: 'center', color: themeController.current?.textColor }}>
              {t('my_profile.confirm_delete')}
            </Text>
            <View style={[styles.modalButtonsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: themeController.current?.buttonColorPrimaryDefault }]}
                onPress={async () => {
                  try {
                    await user.delete();
                  } catch (err) {
                    console.error('Ошибка удаления:', err.message);
                  }
                  setDeleteModalVisible(false);
                }}
              >
                <Text style={{ color: themeController.current?.buttonTextColorPrimary, fontWeight: '600' }}>{t('common.yes')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: themeController.current?.buttonColorPrimaryDefault }]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={{ color: themeController.current?.buttonTextColorPrimary, fontWeight: '600' }}>
                  {t('common.no')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function InfoField({ label, value, changeInfo, multiline = false, baseFont, fieldPadding, fieldMargin, iconSize, isLandscape }) {
  const { themeController } = useComponentContext();
  const [editMode, setEditMode] = useState(false);
  const [textValue, setTextValue] = useState(value);

  return (
    <View
      style={[
        styles.profileInfoString,
        {
          width: Platform.OS === 'web' && isLandscape ? '32%' : '100%',
          paddingVertical: fieldPadding,
          marginBottom: fieldMargin,
          backgroundColor: editMode
            ? themeController.current?.formInputBackgroundEditMode
            : themeController.current?.formInputBackground,
          borderRadius: Platform.OS === 'web' && isLandscape ? RFValue(3) : RFValue(5),
          paddingHorizontal: Platform.OS === 'web' && isLandscape ? RFValue(8) : RFValue(14),
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
            <Image source={icons.cancel} style={{ width: iconSize, height: iconSize, resizeMode: 'contain', tintColor: '#00000080' }} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              setEditMode(false);
              await changeInfo(textValue);
            }}
          >
            <Image source={icons.checkCircle} style={{ width: iconSize, height: iconSize, resizeMode: 'contain', tintColor: '#00000080' }} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={() => setEditMode(true)}>
          <Image source={icons.edit} style={{ width: iconSize, height: iconSize, resizeMode: 'contain', tintColor: '#00000080' }} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  userProfile: { flex: 1, paddingVertical: RFPercentage(2) },
  profileBack: { width: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: RFValue(10), overflow: 'hidden', marginBottom: RFValue(12) },
  profileInfoString: { borderRadius: 8, paddingHorizontal: RFValue(14), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  breakLine: { width: '100%', height: 1, marginVertical: RFValue(12) },
  primaryBtn: { borderRadius: RFValue(5), alignItems: 'center', justifyContent: 'center', marginBottom: RFValue(12) },
  primaryText: { fontWeight: 'bold' },
  secondaryBtn: { borderRadius: RFValue(5), alignItems: 'center', justifyContent: 'center', marginBottom: RFValue(12) },
  secondaryText: { fontWeight: 'bold' },
  primaryReverseBtn: { borderRadius: RFValue(5), alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: RFValue(12) },
  secondaryReverseBtn: { borderRadius: RFValue(5), alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: RFValue(12) },
  profileInfoLabel: { fontWeight: 'bold', marginBottom: RFValue(4) },
  profileInfoText: { width: '100%' },
  editPanel: { flexDirection: 'row', gap: RFValue(5) },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalCard: { width: '80%', borderRadius: RFValue(8), padding: RFValue(16) },
  modalButtonsRow: { justifyContent: 'space-around', marginTop: RFValue(12) },
  modalBtn: { flex: 1, marginHorizontal: RFValue(6), padding: RFValue(10), borderRadius: RFValue(6), alignItems: 'center' },
});
