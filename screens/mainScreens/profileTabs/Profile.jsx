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
  const { height, isLandscape } = useWindowInfo();
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

  // базовые размеры (для мобайла и портретного веба)
  const baseFont = RFValue(12);
  const avatarSize = RFValue(100);
  const btnPadding = RFValue(10);
  const btnFont = RFValue(12);
  const btnWidth = '100%';
  const fieldFont = RFValue(10);
  const fieldPadding = RFValue(10);
  const fieldMargin = RFValue(12);
  const containerPadding = RFValue(5);
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
    containerPadding: isWebLandscape ? height*0.02 : containerPadding,
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
          paddingHorizontal: sizes.containerPadding,
          width: sizes.containerWidth,
        }}
      >
        <ImageBackground
          source={userState?.profileBack}
          resizeMode="cover"
          style={[
            styles.profileBack,
            {
              backgroundColor:
                themeController.current?.profileDefaultBackground,
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
              changeInfo={(v) => setUserState((p) => ({ ...p, [f.field]: v }))}
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
                  backgroundColor:
                    themeController.current?.buttonColorPrimaryDefault,
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
              onPress: () => {session.signOut()},
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
        <View
          style={{
            flexDirection: isWebLandscape ? 'row' : 'column',
            flexWrap: isWebLandscape ? 'wrap' : 'nowrap',
            justifyContent: 'center',
            gap: RFValue(6),
            direction: isRTL ? 'rtl' : 'ltr',
          }}
        >
          {[
            {
              key: 'delete',
              style: styles.secondaryBtn,
              textStyle: styles.secondaryText,
              bg: themeController.current?.buttonColorSecondaryDefault,
              color: themeController.current?.buttonTextColorSecondary,
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
                  onPress: () => {},
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
      </View>
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
          paddingVertical: fieldPadding,
          marginBottom: fieldMargin,
          backgroundColor: editMode
            ? themeController.current?.formInputBackgroundEditMode
            : themeController.current?.formInputBackground,
          borderRadius:  Platform.OS === 'web' && isLandscape ? RFValue(3) : RFValue(5),
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
            onPress={() => {
              setEditMode(false);
              changeInfo(textValue);
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
  primaryText: { fontWeight: 'bold' },
  secondaryBtn: {
    borderRadius: RFValue(5),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: RFValue(12),
  },
  secondaryText: { fontWeight: 'bold' },
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
  profileInfoText: { width: '100%' },
  editPanel: { flexDirection: 'row', gap: RFValue(5) },
});
