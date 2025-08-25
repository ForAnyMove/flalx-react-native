import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useComponentContext } from '../../context/globalAppContext';

export default function DateTimeInputDouble({ label, value, onChange, readOnly = false }) {
  const { activeThemeStyles } = useComponentContext();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const date = value ? new Date(value) : new Date();

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
    <View style={[styles.dateTimeBlock, { backgroundColor: activeThemeStyles?.formInputBackground }]}>
      <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>{label}</Text>

      {/* Кнопка выбора даты */}
      <TouchableOpacity
        onPress={() => !readOnly && setShowDatePicker(true)}
        style={{ backgroundColor: 'transparent', padding: 12, borderRadius: 8, marginBottom: 8 }}
      >
        <Text>📅 {date.toLocaleDateString()}</Text>
      </TouchableOpacity>

      {/* Кнопка выбора времени */}
      <TouchableOpacity
        onPress={() => !readOnly && setShowTimePicker(true)}
        style={{ backgroundColor: 'transparent', padding: 12, borderRadius: 8 }}
      >
        <Text>🕒 {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
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
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginRight: 8,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#000',
  },
  dateTimePlaceholder: {
    fontSize: 16,
    color: '#666',
  },
});