import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useComponentContext } from '../../context/globalAppContext';
import { scaleByHeight } from '../../utils/resizeFuncs';
import { RFValue } from 'react-native-responsive-fontsize';
import { useWindowInfo } from '../../context/windowContext';
import { useTranslation } from 'react-i18next';

export default function DateTimeInput({
  label,
  value,
  onChange,
  readOnly = false,
}) {
  const { themeController, languageController } = useComponentContext();
  const [showPicker, setShowPicker] = useState(false);

  const { width, height, isLandscape, sidebarWidth = 0 } = useWindowInfo();
  const isRTL = languageController.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const { t } = useTranslation();
  const [inputActive, setInputActive] = useState(false);
  const displayValue = value
    ? new Date(value).toLocaleString()
    : t(readOnly ? 'newJob.emptyDate' : 'newJob.select');

  const handleChange = (event, selectedDate) => {
    setShowPicker(false);
    if (event?.type === 'set' && selectedDate) {
      onChange(selectedDate.toISOString());
    }
  };

  const sizes = {
    font: isWebLandscape ? scaleByHeight(12, height) : RFValue(12),
    inputFont: isWebLandscape ? scaleByHeight(16, height) : RFValue(10),
    padding: isWebLandscape ? scaleByHeight(4, height) : RFValue(8),
    inputContainerPaddingHorizontal: isWebLandscape
      ? scaleByHeight(16, height)
      : RFValue(8),
    inputContainerPaddingVertical: isWebLandscape
      ? scaleByHeight(10, height)
      : RFValue(6),
    borderRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(6),
    inputHeight: isWebLandscape ? scaleByHeight(64, height) : RFValue(40),
  };
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.dateTimeBlock,
          {
            backgroundColor: themeController.current?.formInputBackground,
            paddingVertical: sizes.inputContainerPaddingVertical,
            paddingHorizontal: sizes.inputContainerPaddingHorizontal,
            height: sizes.inputHeight,
            borderRadius: sizes.borderRadius,
            height: sizes.inputHeight,
          },
        ]}
      >
        <Text
          style={[
            styles.label,
            {
              color: themeController.current?.unactiveTextColor,
              fontSize: sizes.font,
            },
          ]}
        >
          {label}
        </Text>
        {value || inputActive ? (
          <input
            disabled={readOnly}
            type='datetime-local'
            value={value ? new Date(value).toISOString().slice(0, 16) : ''}
            onChange={(e) => {
              const isoString = new Date(e.target.value).toISOString();
              onChange(isoString);
            }}
            onBlur={() => {
              if (!value) {
                setInputActive(false);
              }
            }}
            onFocus={() => setInputActive(true)}
            placeholderColor={
              themeController.current?.formInputPlaceholderColor
            }
            style={{
              fontSize: sizes.inputFont,
              color: themeController.current?.textColor,
              backgroundColor: 'transparent',
              borderWidth: 0,
              width: '100%',
              padding: 0,
              paddingTop: sizes.padding,
              fontWeight: '600',
              textAlign: isRTL ? 'right' : 'left',
            }}
          />
        ) : (
          <Text
            style={[
              styles.dateTimePlaceholder,
              {
                color: themeController.current?.formInputPlaceholderColor,
                fontSize: sizes.inputFont,
                padding: 0,
                paddingVertical: sizes.padding,
              },
            ]}
            onClick={() => !readOnly && setInputActive(true)}
          >
            {displayValue}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.dateTimeBlock,
        {
          backgroundColor: themeController.current?.formInputBackground,
          paddingVertical: sizes.inputContainerPaddingVertical,
          paddingHorizontal: sizes.inputContainerPaddingHorizontal,
          height: sizes.inputHeight,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: themeController.current?.formInputLabelColor,
            fontSize: sizes.font,
          },
        ]}
      >
        {label}
      </Text>
      <TouchableOpacity onPress={() => !readOnly && setShowPicker(true)}>
        <Text
          style={[
            value ? styles.dateTimeText : styles.dateTimePlaceholder,
            { color: themeController.current?.textColor },
          ]}
        >
          📅 {displayValue}
        </Text>
      </TouchableOpacity>

      {showPicker && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode='datetime'
          display='default'
          onChange={handleChange}
        />
      )}
    </View>
  );
}

const styles = {
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimeBlock: {
    flex: 1,
  },
  label: {},
  dateTimeText: {},
  dateTimePlaceholder: {},
};
