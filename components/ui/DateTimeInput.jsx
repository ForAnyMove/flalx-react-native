import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { useComponentContext } from '../../context/globalAppContext';

export default function DateTimeInput({ label, value, onChange, readOnly = false }) {
  const { activeThemeStyles } = useComponentContext();
  const [showPicker, setShowPicker] = useState(false);

  const displayValue = value
    ? new Date(value).toLocaleString()
    : 'Select';

  const handleChange = (event, selectedDate) => {
    setShowPicker(false);
    if (event?.type === 'set' && selectedDate) {
      onChange(selectedDate.toISOString());
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.dateTimeBlock, { backgroundColor: activeThemeStyles?.formInputBackground}]}>
        <Text style={styles.label}>{label}</Text>
        <input
          disabled={readOnly}
          type='datetime-local'
          value={value ? new Date(value).toISOString().slice(0, 16) : ''}
          onChange={(e) => {
            const isoString = new Date(e.target.value).toISOString();
            onChange(isoString);
          }}
          style={{
            margin: '0 auto',
            padding: 10,
            borderRadius: 6,
            backgroundColor: 'transparent',
            borderWidth: 0,
            width: '80%',
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.dateTimeBlock, { backgroundColor: activeThemeStyles?.formInputBackground}]}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        onPress={() => !readOnly && setShowPicker(true)}
      >
        <Text style={value ? styles.dateTimeText : styles.dateTimePlaceholder}>📅 {displayValue}</Text>
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
};
