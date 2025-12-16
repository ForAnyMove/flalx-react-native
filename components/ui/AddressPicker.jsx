import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { LocationAutocomplete } from '@julekgwa/react-native-places-autocomplete';
import { useComponentContext } from '../../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';

// ВАЖНО: Замените на ваш API ключ. Лучше хранить его в переменных окружения.
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

const AddressPicker = ({
  label,
  onLocationSelect,
  initialAddress = '',
  placeholder,
  isRTL,
  error,
  containerStyle = {},
}) => {
  const { themeController } = useComponentContext();
  const { width, height } = useWindowDimensions();
  const isWebLandscape = Platform.OS === 'web' && width > height;

  // --- Размеры и стили ---
  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      baseFont: scale(16),
      font: scale(12),
      pickerHeight: isWebLandscape ? web(64) : mobile(64),
      borderRadius: isWebLandscape ? web(8) : mobile(8),
      inputContainerPaddingHorizontal: isWebLandscape ? web(16) : mobile(16),
      labelGap: scale(3),
    };
  }, [isWebLandscape, height]);

  const handleSelect = (data, details) => {
    if (details?.geometry?.location) {
      const location = {
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
        address: data.description,
      };
      onLocationSelect(location);
    }
  };

  return (
    <View
      style={[
        styles.pickerContainer,
        {
          backgroundColor: themeController.current?.formInputBackground,
          height: sizes.pickerHeight,
          paddingHorizontal: sizes.inputContainerPaddingHorizontal,
          borderRadius: sizes.borderRadius,
        },
        error && { borderColor: 'red', borderWidth: 1 },
        containerStyle,
      ]}
    >
      <View style={{ flex: 1, justifyContent: 'center', gap: sizes.labelGap }}>
        <Text
          style={[
            styles.label,
            {
              color: error ? 'red' : themeController.current?.unactiveTextColor,
              fontSize: sizes.font,
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
        >
          {label}
        </Text>
        <LocationAutocomplete
          // provider='openstreetmap'
          // debounce={300}
  provider="google"
  providerConfig={{
    apiKey: GOOGLE_PLACES_API_KEY,
  }}
  queryOptions={{
    components: "country:us",
    types: "geocode"
  }}
          placeholder={placeholder || ''}
          // onPress={handleSelect}
          // query={{
          //   // key: GOOGLE_PLACES_API_KEY,
          //   language: 'ru',
          // }}
      // queryOptions={{
      //   countrycodes: "us,ca,gb", // Limit to specific countries
      //   limit: 8
      // }}
      onLocationSelect={handleSelect}
      showRecentSearches={true}
          // onFail={(error) => console.error('Google Places Autocomplete Error:', error)}
          // fetchDetails={true}
          // textInputProps={{
          //   style: [
          //     styles.input,
          //     {
          //       color: themeController.current?.textColor,
          //       fontSize: sizes.baseFont,
          //       textAlign: isRTL ? 'right' : 'left',
          //     },
          //   ],
          //   placeholderTextColor: themeController.current?.formInputLabelColor,
          // }}
          // styles={{
          //   container: {
          //     flex: 1,
          //   },
          //   textInput: {
          //     backgroundColor: 'transparent',
          //     height: sizes.baseFont * 1.5,
          //     padding: 0,
          //     margin: 0,
          //   },
          //   listView: {
          //     position: 'absolute',
          //     top: sizes.pickerHeight - sizes.labelGap,
          //     left: -sizes.inputContainerPaddingHorizontal,
          //     right: -sizes.inputContainerPaddingHorizontal,
          //     backgroundColor: themeController.current?.formInputBackground,
          //     borderBottomLeftRadius: sizes.borderRadius,
          //     borderBottomRightRadius: sizes.borderRadius,
          //     elevation: 5,
          //     zIndex: 1000,
          //   },
          //   row: {
          //     padding: 15,
          //     height: 'auto',
          //   },
          //   description: {
          //     color: themeController.current?.textColor,
          //   },
          //   separator: {
          //     height: 1,
          //     backgroundColor:
          //       themeController.current?.profileDefaultBackground,
          //   },
          // }}
          // enablePoweredByContainer={false}
          // defaultValue={initialAddress}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pickerContainer: {
    justifyContent: 'center',
    zIndex: 1,
  },
  label: {
    // Стили для лейбла
  },
  input: {
    padding: 0,
    width: '100%',
  },
});

export default AddressPicker;
