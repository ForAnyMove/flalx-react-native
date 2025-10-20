import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { useComponentContext } from '../../../context/globalAppContext';
import { Picker } from '@react-native-picker/picker';
import { RFValue, RFPercentage } from 'react-native-responsive-fontsize';
import { icons } from '../../../constants/icons';
import { useState } from 'react';
import { useWindowInfo } from '../../../context/windowContext';
import { useTranslation } from 'react-i18next';
import { scaleByHeight } from '../../../utils/resizeFuncs';

const getResponsiveSize = (mobileSize, webSize, isLandscape) => {
  if (Platform.OS === 'web') {
    return isLandscape ? webSize * 1.6 : RFValue(mobileSize);
  }
  return RFValue(mobileSize);
};

export default function Settings() {
  const { themeController, languageController } = useComponentContext();
  const { height, isLandscape } = useWindowInfo();
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  // Toggles
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Modals
  const [aboutVisible, setAboutVisible] = useState(false);
  const [regulationsVisible, setRegulationsVisible] = useState(false);

  // размеры/отступы
  const sizes = {
    baseFont: isWebLandscape ? scaleByHeight(16, height) : RFValue(12),
    iconSize: isWebLandscape ? RFValue(16) : RFValue(22),
    containerPadding: isWebLandscape ? height * 0.02 : RFValue(10),
    pickerHeight: isWebLandscape ? height * 0.06 : RFValue(50),
    rowGap: isWebLandscape ? height * 0.015 : RFValue(10),
    colGap: isWebLandscape ? height * 0.02 : 0,
    switchMargin: isWebLandscape ? height * 0.02 : RFValue(16),
    btnPadding: isWebLandscape ? height * 0.015 : RFValue(12),
    btnFont: isWebLandscape ? scaleByHeight(20, height) : RFValue(12),
    rowsWidth: isWebLandscape ? '65%' : '100%',
    rowsAlign: isWebLandscape ? (isRTL ? 'flex-end' : 'flex-start') : 'stretch',
    bottomInset: isWebLandscape ? height * 0.02 : 0,
  };

  // помощник для контейнеров-строк
  const rowStyle = {
    width: sizes.rowsWidth,
    alignSelf: sizes.rowsAlign,
    flexDirection: isWebLandscape ? (isRTL ? 'row-reverse' : 'row') : 'column',
    justifyContent: isWebLandscape ? 'space-between' : 'center',
    gap: sizes.colGap,
    marginBottom: sizes.rowGap,
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeController.current?.backgroundColor,
          padding: sizes.containerPadding,
        },
      ]}
    >
      <ScrollView
        contentContainerStyle={{
          paddingBottom: isWebLandscape ? height * 0.18 : RFValue(40),
        }}
      >
        {/* Break Line */}
        <View
          style={[
            styles.breakLine,
            { backgroundColor: themeController.current?.breakLineColor },
          ]}
        />
        {/* Language + Theme */}
        <View
          style={[
            rowStyle,
            isWebLandscape && { height: scaleByHeight(64, height) },
          ]}
        >
          {/* Language */}
          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: themeController.current?.formInputBackground,
                height: sizes.pickerHeight,
                flex: isWebLandscape ? 1 : undefined,
                paddingHorizontal: isWebLandscape
                  ? scaleByHeight(15, height)
                  : RFValue(8),
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: themeController.current?.unactiveTextColor,
                  fontSize: sizes.baseFont * 0.75,
                  // зеркалка подписи
                  // top: isWebLandscape ? '20%' : RFValue(5),
                  // left: isRTL
                  //   ? undefined
                  //   : isWebLandscape
                  //   ? scaleByHeight(15, height)
                  //   : RFValue(8),
                  // right: isRTL
                  //   ? isWebLandscape
                  //     ? scaleByHeight(15, height)
                  //     : RFValue(8)
                  //   : undefined,
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
            >
              {t('settings.language')}
            </Text>
            <Picker
              selectedValue={languageController.current}
              onValueChange={(itemValue) =>
                languageController.setLang(itemValue)
              }
              style={[
                styles.picker,
                {
                  color: themeController.current?.textColor,
                },
              ]}
              dropdownIconColor={themeController.current?.primaryColor}
              itemStyle={{ marginTop: RFValue(10) }}
            >
              <Picker.Item
                label={t('settings.lang_en', 'English')}
                value='en'
              />
              <Picker.Item label={t('settings.lang_he', 'עברית')} value='he' />
            </Picker>
          </View>

          {/* Theme */}
          <View
            style={[
              styles.pickerContainer,
              {
                backgroundColor: themeController.current?.formInputBackground,
                height: sizes.pickerHeight,
                flex: isWebLandscape ? 1 : undefined,
                paddingHorizontal: isWebLandscape
                  ? scaleByHeight(15, height)
                  : RFValue(8),
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: themeController.current?.unactiveTextColor,
                  fontSize: sizes.baseFont * 0.75,
                  // left: isRTL ? undefined : RFValue(10),
                  // right: isRTL ? RFValue(10) : undefined,
                  textAlign: isRTL ? 'right' : 'left',
                },
              ]}
            >
              {t('settings.theme')}
            </Text>
            <Picker
              selectedValue={themeController.isTheme}
              onValueChange={(itemValue) => themeController.setTheme(itemValue)}
              style={[
                styles.picker,
                { color: themeController.current?.textColor },
              ]}
              dropdownIconColor={themeController.current?.primaryColor}
            >
              <Picker.Item
                label={t('settings.theme_light', 'Light')}
                value='light'
              />
              <Picker.Item
                label={t('settings.theme_dark', 'Dark')}
                value='dark'
              />
            </Picker>
          </View>
        </View>

        {/* Break Line */}
        <View
          style={[
            styles.breakLine,
            { backgroundColor: themeController.current?.breakLineColor },
          ]}
        />

        {/* Switches */}
        <View style={[rowStyle, { marginVertical: sizes.switchMargin }]}>
          <View
            style={[
              styles.switchRow,
              {
                width: isWebLandscape ? '47%' : '100%',
                flexDirection: isRTL ? 'row-reverse' : 'row',
              },
            ]}
          >
            <Text
              style={[
                styles.switchName,
                {
                  color: themeController.current?.unactiveTextColor,
                  fontSize: sizes.baseFont,
                },
              ]}
            >
              {t('settings.location')}
            </Text>
            <Switch
              value={locationEnabled}
              onValueChange={setLocationEnabled}
              trackColor={{
                false: themeController.current?.switchTrackColor,
                true: themeController.current?.switchTrackColor,
              }}
              thumbColor={
                true ? themeController.current?.switchThumbColor : '#000'
              }
            />
          </View>

          <View
            style={[
              styles.switchRow,
              {
                width: isWebLandscape ? '47%' : '100%',
                flexDirection: isRTL ? 'row-reverse' : 'row',
              },
            ]}
          >
            <Text
              style={[
                styles.switchName,
                {
                  color: themeController.current?.unactiveTextColor,
                  fontSize: sizes.baseFont,
                },
              ]}
            >
              {t('settings.notifications')}
            </Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{
                false: themeController.current?.switchTrackColor,
                true: themeController.current?.switchTrackColor,
              }}
              thumbColor={
                true ? themeController.current?.switchThumbColor : '#000'
              }
            />
          </View>
        </View>

        {/* Break Line */}
        <View
          style={[
            styles.breakLine,
            { backgroundColor: themeController.current?.breakLineColor },
          ]}
        />

        {/* Buttons */}
        <View style={rowStyle}>
          <TouchableOpacity
            style={[
              styles.primaryBtn,
              {
                backgroundColor:
                  themeController.current?.buttonColorPrimaryDefault,
                padding: sizes.btnPadding,
                flex: isWebLandscape ? 1 : undefined,
              },
              isWebLandscape && {
                height: scaleByHeight(62, height),
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
            onPress={() => setAboutVisible(true)}
          >
            <Text
              style={[
                styles.primaryText,
                {
                  color: themeController.current?.buttonTextColorPrimary,
                  fontSize: sizes.btnFont,
                },
              ]}
            >
              {t('settings.about')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              {
                backgroundColor:
                  themeController.current?.buttonColorPrimaryDefault,
                padding: sizes.btnPadding,
                flex: isWebLandscape ? 1 : undefined,
              },
              isWebLandscape && {
                height: scaleByHeight(62, height),
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
            onPress={() => setRegulationsVisible(true)}
          >
            <Text
              style={[
                styles.primaryText,
                {
                  color: themeController.current?.buttonTextColorPrimary,
                  fontSize: sizes.btnFont,
                },
              ]}
            >
              {t('settings.regulations')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Icons + Text — фиксируем у нижнего края в альбомном вебе */}
      <View
        style={[
          styles.bottomRow,
          {
            flexDirection: isRTL ? 'row-reverse' : 'row',
            position: isWebLandscape ? 'absolute' : 'relative',
            bottom: sizes.bottomInset,
            left: sizes.containerPadding,
            right: sizes.containerPadding,
          },
        ]}
      >
        <View
          style={[
            styles.connectBtnsContainer,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <Image
            source={icons.email}
            style={{
              width: sizes.iconSize,
              height: sizes.iconSize,
              marginRight: isRTL ? 0 : RFValue(10),
              marginLeft: isRTL ? RFValue(10) : 0,
            }}
            resizeMode='contain'
          />
          <Image
            source={icons.phone}
            style={{ width: sizes.iconSize, height: sizes.iconSize }}
            resizeMode='contain'
          />
        </View>
        <View>
          <Text
            style={[
              styles.bottomText,
              {
                color: themeController.current?.formInputTextColor,
                fontSize: sizes.baseFont * 0.9,
                textAlign: isRTL ? 'left' : 'right',
              },
            ]}
          >
            {t('settings.have_question')}
          </Text>
          <Text
            style={[
              styles.bottomText,
              {
                color: themeController.current?.formInputTextColor,
                fontSize: sizes.baseFont * 0.9,
                textAlign: isRTL ? 'left' : 'right',
              },
            ]}
          >
            {t('settings.just_cheer')}
          </Text>
        </View>
      </View>

      <Text
        style={[
          styles.versionText,
          {
            color: themeController.current?.unactiveTextColor,
            fontSize: sizes.baseFont * 0.8,
            textAlign: isRTL ? 'left' : 'right',
            position: isWebLandscape ? 'absolute' : 'relative',
            bottom: isWebLandscape ? sizes.bottomInset * 0.25 : 0,
            right: isWebLandscape ? sizes.containerPadding : 0,
            left: isWebLandscape && isRTL ? sizes.containerPadding : undefined,
          },
        ]}
      >
        v1.52
      </Text>

      {/* About Modal */}
      <Modal visible={aboutVisible} animationType='slide'>
        <ModalContent
          title='FLALX'
          onClose={() => setAboutVisible(false)}
          lines={20}
          isWebLandscape={isWebLandscape}
          sizes={sizes}
        />
      </Modal>

      {/* Regulations Modal */}
      <Modal visible={regulationsVisible} animationType='slide'>
        <ModalContent
          title='FLALX'
          onClose={() => setRegulationsVisible(false)}
          lines={50}
          isWebLandscape={isWebLandscape}
          sizes={sizes}
        />
      </Modal>
    </View>
  );
}

// Модальное содержимое
function ModalContent({ title, onClose, lines, isWebLandscape, sizes }) {
  const { themeController } = useComponentContext();
  const { isLandscape, height } = useWindowInfo();
  return (
    <View style={{ flex: 1 }}>
      <View
        style={[
          styles.modalHeader,
          {
            height:
              Platform.OS === 'web' && isLandscape
                ? height * 0.07
                : RFPercentage(7),
          },
        ]}
      >
        <TouchableOpacity onPress={onClose}>
          <Image
            source={icons.back}
            style={{
              width: getResponsiveSize(20, height * 0.02, isLandscape),
              height: getResponsiveSize(20, height * 0.02, isLandscape),
              margin: RFValue(10),
              tintColor: themeController.current?.textColor,
            }}
            resizeMode='contain'
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.modalTitle,
            { fontSize: getResponsiveSize(18, height * 0.02, isLandscape) },
          ]}
        >
          {title}
        </Text>
      </View>
      <ScrollView style={styles.modalContent}>
        {Array.from({ length: lines }).map((_, i) => (
          <Text
            key={i}
            style={[
              styles.modalText,
              {
                color: themeController.current?.textColor,
                fontSize: isWebLandscape ? sizes.baseFont : RFValue(12),
              },
            ]}
          >
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pickerContainer: {
    marginBottom: RFValue(8),
    borderRadius: RFValue(6),
    paddingBottom: RFValue(6),
    justifyContent: 'space-between',
    position: 'relative',
  },
  picker: { backgroundColor: 'transparent', borderWidth: 0 },
  label: {
    // position: 'absolute',
    top: RFValue(5),
  },
  switchName: { fontWeight: 'bold' },
  breakLine: { height: 1, marginVertical: RFValue(8) },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryBtn: {
    borderRadius: RFValue(6),
    alignItems: 'center',
    marginVertical: RFValue(5),
  },
  primaryText: { fontWeight: 'bold' },
  bottomRow: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: RFValue(20),
  },
  connectBtnsContainer: { gap: RFValue(5) },
  bottomText: { fontSize: RFValue(10) },
  versionText: { fontSize: RFValue(10), marginTop: RFValue(5) },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RFValue(10),
    borderBottomWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'space-between',
  },
  modalTitle: { fontSize: RFValue(20), fontWeight: 'bold', color: '#0A62EA' },
  modalContent: { padding: RFValue(10) },
  modalText: {
    fontSize: RFValue(12),
    marginBottom: RFValue(8),
    lineHeight: RFValue(16),
  },
});
