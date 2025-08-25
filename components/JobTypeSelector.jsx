import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { JOB_TYPES } from '../constants/jobTypes';

export default function JobTypeSelector({ selectedTypes, setSelectedTypes }) {
  const isSelected = (type) => selectedTypes.includes(type);

  const toggleType = (type) => {
    if (isSelected(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const clearAll = () => setSelectedTypes([]);

  return (
    <View style={styles.container}>
      {/* Иконка корзины */}
      <TouchableOpacity onPress={clearAll} style={styles.trashButton}>
        <Ionicons
          name="trash"
          size={RFValue(18)}
          color={selectedTypes.length > 0 ? 'red' : 'gray'}
        />
      </TouchableOpacity>

      {/* Список тегов */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.tagWrapper}>
          {Object.entries(JOB_TYPES)?.map(([key, label]) => (
            <TouchableOpacity
              key={key}
              onPress={() => toggleType(key)}
              style={[styles.tag, isSelected(key) && styles.tagSelected]}
            >
              <Text style={[styles.tagText, isSelected(key) && styles.tagTextSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: RFValue(4),
  },
  trashButton: {
    marginRight: RFValue(6),
  },
  scrollContent: {
    flexGrow: 1,
  },
  tagWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: RFValue(6),
    columnGap: RFValue(6),
    height: RFValue(40), // Высота для двух строк
  },
  tag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: RFValue(10),
    paddingVertical: RFValue(5),
    borderRadius: RFValue(5),
  },
  tagSelected: {
    backgroundColor: '#007AFF',
  },
  tagText: {
    color: 'gray',
    fontSize: RFValue(9),
  },
  tagTextSelected: {
    color: 'white',
  },
});
