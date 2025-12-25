import * as ImagePicker from 'expo-image-picker';
import { use, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { normalizeImageUri } from '../../utils/supabase/uriHelpers';
import { useComponentContext } from '../../context/globalAppContext';

export default function ImagePickerModal({ visible, onClose, onAdd }) {
  const [url, setUrl] = useState('');
  const { themeController } = useComponentContext();
  const theme = themeController.current;
  const { width, height } = useWindowDimensions();
  const isWebLandscape = width > height && Platform.OS === 'web';

  const sizes = useMemo(() => {
    const scale = isWebLandscape ? scaleByHeight : scaleByHeightMobile;
    return {
      modalWidth: isWebLandscape ? scale(450, height) : '80%',
      borderRadius: scale(8, height),
      padding: scale(20, height),
      titleFontSize: scale(20, height),
      titleMarginBottom: scale(25, height),
      buttonMarginBottom: scale(20, height),
      inputPadding: scale(12, height),
      inputFontSize: scale(16, height),
      buttonFontSize: scale(16, height),
      buttonsGap: scale(20, height),
      modalBtnWidth: scale(120, height),
      modalBtnHeight: scale(62, height),
      modalBtnBorderRadius: scale(8, height),
    };
  }, [isWebLandscape, height]);

  const pickImageFromDevice = async () => {
    try {
      await ImagePicker.getMediaLibraryPermissionsAsync();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: null,
      });

      if (!result.canceled) {
        const normalized = await Promise.all(
          result.assets.map(async (asset) => {
            return await normalizeImageUri(asset.uri);
          })
        );
        onAdd(normalized);
        onClose();
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

  const openCameraFromDevice = async () => {
    if (Platform.OS === 'web') return;
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert(
          'Камера недоступна. Разрешите доступ к камере в настройках устройства.'
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: null,
      });

      if (!result.canceled) {
        const normalized = await Promise.all(
          result.assets.map(async (asset) => {
            return await normalizeImageUri(asset.uri);
          })
        );
        onAdd(normalized);
        onClose();
      }
    } catch (error) {
      console.error('Error opening camera:', error);
    }
  };

  const handleAddUrl = () => {
    if (url.trim()) {
      onAdd([url.trim()]);
      setUrl('');
      onClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType='fade'>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}
      >
        <View
          style={{
            backgroundColor: theme.backgroundColor,
            padding: sizes.padding,
            borderRadius: sizes.borderRadius,
            width: sizes.modalWidth,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontSize: sizes.titleFontSize,
              marginBottom: sizes.titleMarginBottom,
              color: theme.textColor,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            {/* Замените на ключ локализации, если он есть */}
            Change avatar
          </Text>

          <TouchableOpacity
            onPress={pickImageFromDevice}
            style={{ marginBottom: sizes.buttonMarginBottom }}
          >
            <Text style={{ color: theme.primaryColor, fontSize: sizes.buttonFontSize, textAlign: 'center' }}>
              Pick from device gallery
            </Text>
          </TouchableOpacity>

          {Platform.OS !== 'web' && (
            <TouchableOpacity
              onPress={openCameraFromDevice}
              style={{ marginBottom: sizes.buttonMarginBottom }}
            >
              <Text style={{ color: theme.primaryColor, fontSize: sizes.buttonFontSize, textAlign: 'center' }}>
                Open Camera
              </Text>
            </TouchableOpacity>
          )}

          <TextInput
            placeholder='Or enter image URL...'
            placeholderTextColor={theme.formInputPlaceholderColor}
            value={url}
            onChangeText={setUrl}
            style={{
              borderWidth: 1,
              borderColor: theme.borderColor,
              borderRadius: sizes.borderRadius,
              padding: sizes.inputPadding,
              marginBottom: sizes.buttonMarginBottom,
              color: theme.formInputTextColor,
              backgroundColor: theme.formInputBackground,
              fontSize: sizes.inputFontSize,
              width: '100%',
            }}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: sizes.buttonsGap }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: theme.buttonColorPrimaryDefault,
                height: sizes.modalBtnHeight,
                width: sizes.modalBtnWidth,
                borderRadius: sizes.modalBtnBorderRadius,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: theme.buttonTextColorPrimary, fontSize: sizes.buttonFontSize }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleAddUrl}
              style={{
                backgroundColor: theme.backgroundColor,
                height: sizes.modalBtnHeight,
                width: sizes.modalBtnWidth,
                borderRadius: sizes.modalBtnBorderRadius,
                borderWidth: 1,
                borderColor: theme.buttonColorPrimaryDefault,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: theme.buttonColorPrimaryDefault, fontSize: sizes.buttonFontSize, fontWeight: 'bold' }}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
