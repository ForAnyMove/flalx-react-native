import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
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

export default function ImagePickerModal({ visible, onClose, onAdd }) {
  const [url, setUrl] = useState('');

  const { width, height } = useWindowDimensions();
  const isWebLandscape = width > height && Platform.OS === 'web';

  const sizes = useMemo(() => {
    const scale = isWebLandscape ? scaleByHeight : scaleByHeightMobile;
    return {
      modalWidth: isWebLandscape ? scale(350, height) : '80%',
      borderRadius: scale(8, height),
      padding: scale(20, height),
      titleFontSize: scale(18, height),
      marginBottom: scale(10, height),
      inputPadding: scale(8, height),
    };
  }, [isWebLandscape, height]);

  const pickImageFromDevice = async () => {
    try {
      ImagePicker.getMediaLibraryPermissionsAsync();
      const result = await ImagePicker.launchImageLibraryAsync({
        base64: null,
        quality: 1,
      });

      console.log('Added image object: ', result);

      if (!result.canceled) {
        const normalized = await Promise.all(
          result.assets.map(async (asset) => {
            const n = await normalizeImageUri(asset.uri);
            return n; // объект { uri } для mobile или { blob, ext } для web
          })
        );
        console.log(normalized);

        onAdd(normalized);
        onClose();
      }
    } catch (error) {
      console.error('Error picking image:', error);
      // Здесь можно обработать ошибку, например, показать сообщение пользователю
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
      // Открытие камеры
      const result = await ImagePicker.launchCameraAsync({
        base64: null,
        quality: 1,
      });

      // Обработка результата
      if (!result.canceled) {
        onAdd(result.assets.map((asset) => asset.uri));
        onClose();
      }
    } catch (error) {
      console.error('Error picking image:', error);
      // Здесь можно обработать ошибку, например, показать сообщение пользователю
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
    <Modal visible={visible} transparent animationType='slide'>
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
            backgroundColor: 'white',
            padding: sizes.padding,
            borderRadius: sizes.borderRadius,
            width: sizes.modalWidth,
          }}
        >
          <Text
            style={{
              fontSize: sizes.titleFontSize,
              marginBottom: sizes.marginBottom,
            }}
          >
            Add Image
          </Text>
          <TouchableOpacity
            onPress={pickImageFromDevice}
            style={{ marginBottom: sizes.marginBottom }}
          >
            <Text style={{ color: '#0A62EA' }}>Pick from device gallery</Text>
          </TouchableOpacity>
          {Platform.OS !== 'web' && (
            <TouchableOpacity
              onPress={openCameraFromDevice}
              style={{ marginBottom: sizes.marginBottom }}
            >
              <Text style={{ color: '#0A62EA' }}>Open Camera</Text>
            </TouchableOpacity>
          )}
          <TextInput
            placeholder='Or enter image URL...'
            value={url}
            onChangeText={setUrl}
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              borderRadius: sizes.borderRadius,
              padding: sizes.inputPadding,
              marginBottom: sizes.marginBottom,
            }}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity
              onPress={onClose}
              style={{ marginRight: sizes.marginBottom }}
            >
              <Text>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddUrl}>
              <Text style={{ color: '#0A62EA' }}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
