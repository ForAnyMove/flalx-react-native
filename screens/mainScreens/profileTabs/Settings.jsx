import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useComponentContext } from '../../../context/globalAppContext';
import { Picker } from '@react-native-picker/picker';
import { RFValue } from 'react-native-responsive-fontsize';
import { icons } from '../../../constants/icons';
import { useState } from 'react';

export default function Settings() {
  const { session, themeController, languageController } =
    useComponentContext();

  // Toggles
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Modals
  const [aboutVisible, setAboutVisible] = useState(false);
  const [regulationsVisible, setRegulationsVisible] = useState(false);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeController.current?.backgroundColor },
      ]}
    >
      {/* Language */}
      <View
        style={[
          styles.pickerContainer,
          { backgroundColor: themeController.current?.formInputBackground },
        ]}
      >
        <Picker
          selectedValue={languageController.current}
          onValueChange={(itemValue) => languageController.setLang(itemValue)}
          style={[styles.picker, { color: themeController.current?.textColor }]}
          dropdownIconColor={themeController.current?.textColor}
        >
          <Picker.Item label='English' value='en' />
          <Picker.Item label='עברית' value='he' />
        </Picker>
        <Text
          style={[
            styles.label,
            { color: themeController.current?.unactiveTextColor },
          ]}
        >
          Language
        </Text>
      </View>

      {/* Theme */}
      <View
        style={[
          styles.pickerContainer,
          { backgroundColor: themeController.current?.formInputBackground },
        ]}
      >
        <Picker
          selectedValue={themeController.isTheme}
          onValueChange={(itemValue) => themeController.setTheme(itemValue)}
          style={[styles.picker, { color: themeController.current?.textColor }]}
          dropdownIconColor={themeController.current?.textColor}
        >
          <Picker.Item label='Light' value='light' />
          <Picker.Item label='Dark' value='dark' />
        </Picker>
        <Text
          style={[
            styles.label,
            { color: themeController.current?.unactiveTextColor },
          ]}
        >
          Theme
        </Text>
      </View>

      {/* Break Line */}
      <View
        style={[
          styles.breakLine,
          { backgroundColor: themeController.current?.breakLineColor },
        ]}
      />

      {/* Switches */}
      <View style={styles.switchRow}>
        <Switch
          value={locationEnabled}
          onValueChange={setLocationEnabled}
          trackColor={{
            false: themeController.current?.switchTrackColor,
            true: themeController.current?.switchTrackColor,
          }}
          thumbColor={true ? themeController.current?.switchThumbColor : '#000'}
        />
        <Text
          style={[
            styles.switchName,
            { color: themeController.current?.buttonColorPrimaryDefault },
          ]}
        >
          Location
        </Text>
      </View>

      <View style={styles.switchRow}>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{
            false: themeController.current?.switchTrackColor,
            true: themeController.current?.switchTrackColor,
          }}
          thumbColor={true ? themeController.current?.switchThumbColor : '#000'}
        />
        <Text
          style={[
            styles.switchName,
            { color: themeController.current?.buttonColorPrimaryDefault },
          ]}
        >
          Notifications
        </Text>
      </View>

      {/* Break Line */}
      <View
        style={[
          styles.breakLine,
          { backgroundColor: themeController.current?.breakLineColor },
        ]}
      />

      {/* Buttons */}
      <TouchableOpacity
        style={[
          styles.primaryBtn,
          {
            backgroundColor: themeController.current?.buttonColorPrimaryDefault,
          },
        ]}
        onPress={() => setAboutVisible(true)}
      >
        <Text
          style={[
            styles.primaryText,
            { color: themeController.current?.buttonTextColorPrimary },
          ]}
        >
          About
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.primaryBtn,
          {
            backgroundColor: themeController.current?.buttonColorPrimaryDefault,
          },
        ]}
        onPress={() => setRegulationsVisible(true)}
      >
        <Text
          style={[
            styles.primaryText,
            {
              color: themeController.current?.buttonTextColorPrimary,
              fontWeight: 'bold',
            },
          ]}
        >
          Regulations
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: '#e36161ff' }]}
        onPress={() => session.signOut()}
      >
        <Text
          style={[
            styles.primaryText,
            {
              color: themeController.current?.buttonTextColorPrimary,
              fontWeight: 'bold',
            },
          ]}
        >
          Sign Out
        </Text>
      </TouchableOpacity>

      {/* Bottom Icons + Text */}
      <View style={styles.bottomRow}>
        <View style={styles.connectBtnsContainer}>
          <Image
            source={icons.email}
            style={[
              { with: RFValue(24), height: RFValue(24), marginRight: 10 },
            ]}
            resizeMode='contain'
          />
          <Image
            source={icons.phone}
            style={[{ with: RFValue(24), height: RFValue(24) }]}
            resizeMode='contain'
          />
        </View>
        <View>
          <Text
            style={[
              styles.bottomText,
              { color: themeController.current?.formInputTextColor },
            ]}
          >
            Do you have a question?
          </Text>
          <Text
            style={[
              styles.bottomText,
              { color: themeController.current?.formInputTextColor },
            ]}
          >
            Just want to cheer?
          </Text>
          <Text
            style={[
              styles.bottomText,
              { color: themeController.current?.formInputTextColor },
            ]}
          >
            Just want to cheer?
          </Text>
        </View>
      </View>
      <Text
        style={[
          styles.versionText,
          { color: themeController.current?.unactiveTextColor },
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
        />
      </Modal>

      {/* Regulations Modal */}
      <Modal visible={regulationsVisible} animationType='slide'>
        <ModalContent
          title='FLALX'
          onClose={() => setRegulationsVisible(false)}
          lines={50}
        />
      </Modal>
    </View>
  );
}

// Модальное содержимое
function ModalContent({ title, onClose, lines }) {
  const { themeController } = useComponentContext();
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={onClose}>
          <Image
            source={icons.back}
            style={[
              {
                with: RFValue(22),
                height: RFValue(22),
                tintColor: themeController.current?.textColor,
              },
            ]}
            resizeMode='contain'
          />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>{title}</Text>
      </View>
      <ScrollView style={styles.modalContent}>
        {Array.from({ length: lines }).map((_, i) => (
          <Text key={i} style={styles.modalText}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua.
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: RFValue(10),
  },
  pickerContainer: {
    marginBottom: RFValue(8),
    borderRadius: RFValue(6),
    paddingHorizontal: RFValue(12),
    paddingVertical: RFValue(10),
    height: RFValue(50),
    justifyContent: 'center',
    // flexDirection: 'row',
    position: 'relative',
  },
  picker: {
    width: '80%',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  label: {
    position: 'absolute',
    fontSize: RFValue(11),
    right: RFValue(10),
    top: RFValue(5),
  },
  switchName: {
    fontSize: RFValue(12),
    fontWeight: 'bold',
  },
  breakLine: {
    height: 1,
    marginVertical: RFValue(8),
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: RFValue(16),
  },
  primaryBtn: {
    padding: RFValue(12),
    borderRadius: RFValue(6),
    alignItems: 'center',
    marginVertical: RFValue(5),
  },
  primaryText: {
    fontSize: RFValue(12),
    fontWeight: 'bold',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: RFValue(20),
  },
  connectBtnsContainer: {
    flexDirection: 'row',
    paddingHorizontal: RFValue(10),
    gap: RFValue(5),
  },
  bottomText: {
    fontSize: RFValue(10),
    textAlign: 'right',
  },
  versionText: {
    textAlign: 'right',
    fontSize: RFValue(10),
    marginTop: RFValue(5),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: RFValue(10),
    borderBottomWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: RFValue(20),
    fontWeight: 'bold',
    color: '#0A62EA',
  },
  modalContent: {
    padding: RFValue(10),
  },
  modalText: {
    fontSize: RFValue(12),
    marginBottom: RFValue(8),
    lineHeight: RFValue(16),
  },
});
