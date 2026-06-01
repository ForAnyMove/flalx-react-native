import React, { useMemo, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import GooglePlacesTextInput from 'react-native-google-places-textinput';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import themeManager from '../../managers/themeManager';
import { API_BASE_URL } from '../../utils/config';
import { useNotification } from '../../src/render';
import { logError } from '../../utils/log_util';
import { useWindowInfo } from '../../context/windowContext';

const AddressPicker = ({
  label,
  onLocationSelect,
  initialAddress = '',
  placeholder,
  isRTL,
  error,
  containerStyle = {},
  language = 'en',
}) => {
  const { themeController } = useComponentContext();
  const { width, height, isLandscape } = useWindowInfo();
  const { showError } = useNotification();
  const { t } = useTranslation();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [displayValue, setDisplayValue] = useState(initialAddress);
  const [inputKey, setInputKey] = useState(0);

  useEffect(() => {
    setDisplayValue(initialAddress);
    setInputKey(k => k + 1);
  }, [initialAddress]);

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
      const formattedAddress = place.details.formattedAddress;
      setDisplayValue(formattedAddress);
      setInputKey(k => k + 1);
      const location = {
        latitude: place.details.location.latitude,
        longitude: place.details.location.longitude,
        address: formattedAddress,
        formattedAddress,
      };
      onLocationSelect(location);
    }
  };

  const handleError = (error) => {
    logError('Places API Error:', error);

    let errorMessage = t('address_picker.server_unavailable');

    if (error.message?.includes('Network request failed')) {
      errorMessage = t('address_picker.server_unavailable');
    } else if (error.message?.includes('Too many requests')) {
      errorMessage = t('address_picker.too_many_requests');
    } else if (error.message?.includes('API key')) {
      errorMessage = t('address_picker.api_key_error');
    }

    showError(t('address_picker.error_title', { message: errorMessage }));
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
      autocomplete: `/api/google-places/autocomplete?language=${language}`,
      details: `/api/google-places/details`
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
          key={inputKey}
          value={displayValue}
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
