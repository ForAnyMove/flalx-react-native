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
import { API_BASE_URL } from '../../utils/config';
import { useNotification } from '../../src/render';
import { logError } from '../../utils/log_util';

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
  const { showError } = useNotification();
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

    if (place?.details) {
      const location = {
        latitude: place.details.location.latitude,
        longitude: place.details.location.longitude,
        address: place.details.displayName.text,
        formatterAddress: place.details.formattedAddress,
      };
      onLocationSelect(location);
    }
  };

  const handleError = (error) => {
    logError('Places API Error:', error);

    let errorMessage = 'There is a problem connecting to the server';

    if (error.message?.includes('Network request failed')) {
      errorMessage = 'Proxy server is unavailable. Please run: cd proxy-server && npm start';
    } else if (error.message?.includes('Too many requests')) {
      errorMessage = 'Too many requests. Please try again later.';
    } else if (error.message?.includes('API key')) {
      errorMessage = 'There is a problem with the API key on the server';
    }

    showError(`Address pick error: ${errorMessage}`);
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
      color: themeController.current?.textColor,
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
        color: themeController.current.formInputLabelColor,
      },
      secondary: {
        fontSize: sizes.secondaryFont,
        color: themeController.current.formInputLabelColor,
      }
    },
    loadingIndicator: {
      color: themeController.current?.primaryColor,
    },
    placeholder: {
      color: themeController.current?.formInputLabelColor,
    }
  };

  const PROXY_CONFIG = {
    baseUrl: API_BASE_URL,
    endpoints: {
      autocomplete: '/api/google-places/autocomplete',
      details: '/api/google-places/details'
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
          value={initialAddress}
          proxyUrl={`${PROXY_CONFIG.baseUrl}${PROXY_CONFIG.endpoints.autocomplete}`}
          detailsProxyUrl={`${PROXY_CONFIG.baseUrl}${PROXY_CONFIG.endpoints.details}`}
          onPlaceSelect={handleSelect}
          clearButtonMode='never'
          placeHolderText={placeholder}
          clearElement={<></>}
          style={customStyles}
          fetchDetails={true}
          detailsFields={['location']}
          onError={(error) => {
            handleError(error);
          }}

          debounceDelay={300}
          minCharsToFetch={3}
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
