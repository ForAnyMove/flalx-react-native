import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import GooglePlacesTextInput from 'react-native-google-places-textinput';
import { useComponentContext } from '../../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import themeManager from '../../managers/themeManager';

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
      secondaryFont: scale(14),
      font: scale(12),
      pickerHeight: isWebLandscape ? web(64) : mobile(64),
      borderRadius: isWebLandscape ? web(8) : mobile(8),
      inputContainerPaddingHorizontal: isWebLandscape ? web(16) : mobile(16),
      labelGap: scale(3),
      suggestionItemWidth: isWebLandscape ? web(330) : '100%',
      suggestionItemLeft: scale(16),
      suggestionMaxHeight: scale(230),
      suggestionItemHeight: scale(57),
      suggestionItemPaddingHorizontal: scale(16),
    };
  }, [isWebLandscape, height]);

  const handleSelect = (place) => {
    console.log('Place: ', place);
    
    // if (place?.geometry?.location) {
    //   const location = {
    //     latitude: place.geometry.location.lat,
    //     longitude: place.geometry.location.lng,
    //     address: place.formatted_address,
    //   };
    //   onLocationSelect(location);
    // }
  };

  const customStyles = {
    container: {
      width: '100%',
      marginHorizontal: 0,
    },
    input: {
      paddingVertical: 0,
      paddingLeft: 0,
      paddingRight: 0,
      borderWidth: 0,
      borderRadius: sizes.borderRadius,
      fontSize: sizes.baseFont,
      backgroundColor: 'transparent',
      width: '100%',
    },
    suggestionsContainer: {
      backgroundColor: themeController.current?.formInputBackground,
      maxHeight: sizes.suggestionMaxHeight,
      width: sizes.suggestionItemWidth,
      position: 'absolute',
      top: '100%',
      left: -sizes.suggestionItemLeft,
      borderTopRightRadius: 0,
      borderTopLeftRadius: 0,
      borderBottomRightRadius: sizes.borderRadius,
      borderBottomLeftRadius: sizes.borderRadius,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      zIndex: 9999, // Устанавливаем высокий zIndex
      borderWidth: 1,
      borderColor: '#ddd',
    },
    suggestionItem: {
      paddingHorizontal: sizes.suggestionItemPaddingHorizontal,
      height: sizes.suggestionItemHeight,
      justifyContent: 'center',
      paddingVertical: 0,
    },
    suggestionText: {
      main: {
        fontSize: sizes.baseFont,
        color: themeController.current.textColor,
      },
      secondary: {
        fontSize: sizes.secondaryFont,
        color: themeController.current.unactiveTextColor,
      }
    },
    loadingIndicator: {
      color: themeController.current?.primaryColor,
    },
    placeholder: {
      color: themeController.current?.formInputLabelColor,
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
        <GooglePlacesTextInput
          apiKey={GOOGLE_PLACES_API_KEY}
          onPlaceSelected={handleSelect}
          clearButtonMode='never'
          placeholder={placeholder}
          clearElement={<></>}
          style={customStyles}
          fetchDetails={true}
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
