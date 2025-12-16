import DateTimePicker from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useComponentContext } from '../../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';

export default function DateTimeInputDouble({
  label,
  value,
  onChange,
  readOnly = false,
}) {
  const { themeController } = useComponentContext();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const { width, height } = useWindowDimensions();
  const isWebLandscape = Platform.OS === 'web' && width > height;

  const date = value ? new Date(value) : new Date();

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      font: scale(12),
      inputFont: scale(16),
      padding: scale(12),
      borderRadius: scale(8),
      marginBottom: scale(8),
      labelMarginBottom: scale(6),
      containerPaddingVertical: scale(12),
      containerPaddingHorizontal: scale(18),
      containerMarginRight: scale(8),
      containerHeight: scale(94),
    };
  }, [isWebLandscape, height]);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (event?.type === 'set' && selectedDate) {
      const newDateTime = new Date(value || new Date());
      newDateTime.setFullYear(selectedDate.getFullYear());
      newDateTime.setMonth(selectedDate.getMonth());
      newDateTime.setDate(selectedDate.getDate());
      onChange(newDateTime.toISOString());
    }
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    if (event?.type === 'set' && selectedTime) {
      const newDateTime = new Date(value || new Date());
      newDateTime.setHours(selectedTime.getHours());
      newDateTime.setMinutes(selectedTime.getMinutes());
      newDateTime.setSeconds(0);
      newDateTime.setMilliseconds(0);
      onChange(newDateTime.toISOString());
    }
  };

  return (
    <View
      style={[
        styles.dateTimeBlock,
        {
          backgroundColor: themeController.current?.formInputBackground,
          paddingVertical: sizes.containerPaddingVertical,
          paddingHorizontal: sizes.containerPaddingHorizontal,
          borderRadius: sizes.borderRadius,
          marginRight: sizes.containerMarginRight,
          height: sizes.containerHeight,
        },
      ]}
    >
      <Text
        style={{
          fontWeight: 'bold',
          marginBottom: sizes.labelMarginBottom,
          color: themeController.current?.textColor,
          fontSize: sizes.font,
        }}
      >
        {label}
      </Text>

      {/* Кнопка выбора даты */}
      <TouchableOpacity
        onPress={() => !readOnly && setShowDatePicker(true)}
        style={{
          backgroundColor: 'transparent',
          padding: sizes.padding,
          borderRadius: sizes.borderRadius,
          marginBottom: sizes.marginBottom,
        }}
      >
        <Text style={{ color: themeController.current?.textColor, fontSize: sizes.inputFont }}>
          📅 {date.toLocaleDateString()}
        </Text>
      </TouchableOpacity>

      {/* Кнопка выбора времени */}
      <TouchableOpacity
        onPress={() => !readOnly && setShowTimePicker(true)}
        style={{
          backgroundColor: 'transparent',
          padding: sizes.padding,
          borderRadius: sizes.borderRadius,
        }}
      >
        <Text style={{ color: themeController.current?.textColor, fontSize: sizes.inputFont }}>
          🕒{' '}
          {date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </TouchableOpacity>

      {/* Пикеры */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode='date'
          display='default'
          onChange={handleDateChange}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={date}
          mode='time'
          display='default'
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateTimeBlock: {
    flex: 1,
  },
  label: {
    fontWeight: 'bold',
  },
  dateTimeText: {
    // fontSize: 16, // now in sizes
    // color: '#000',
  },
  dateTimePlaceholder: {
    // fontSize: 16, // now in sizes
    // color: '#666',
  },
});