import { AntDesign } from '@expo/vector-icons';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { JOB_SUB_TYPES } from '../constants/jobSubTypes';
import { JOB_TYPES } from '../constants/jobTypes';
import { LICENSES } from '../constants/licenses';
import { useComponentContext } from '../context/globalAppContext';

export default function JobHistoryModal({ visible, onClose, history = [] }) {
  const {activeThemeStyles} = useComponentContext();
  const [sortNewFirst, setSortNewFirst] = useState(true);

  const sortedHistory = [...history].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return sortNewFirst ? dateB - dateA : dateA - dateB;
  });

  const renderItem = ({ item }) => {
    const formattedDate =
      new Date(item.date).toDateString() +
      ' ' +
      new Date(item.date).toLocaleTimeString();

    const changeKeys = Object.keys(item.changes || {});
    function getSpecialValue(type) {
      switch (type) {
        case 'type':
          return JOB_TYPES[item.changes[type]];
        case 'subType':
          return JOB_SUB_TYPES[item.changes[type]];
        case 'profession':
          return LICENSES[item.changes[type]];
      
        default:
          return item.changes[type];
      }
    }
    return (
      <View style={[styles.card, { backgroundColor: '#fff' }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardDate}>{formattedDate}</Text>
          <Text style={styles.cardType}>{item.type}</Text>
        </View>
        <View style={styles.changeList}>
          {changeKeys.map((key, index) => (
            <View key={index} style={styles.changeItem}>
              <View
                style={[styles.bullet, { backgroundColor: 'rgba(0,0,0,0.2)' }]}
              />
              <Text style={styles.changeText}>
                {`${capitalize(key)} - ${getSpecialValue(key)}`}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <Modal visible={visible} animationType='slide' transparent={false}>
      <View style={[styles.modalContainer, { backgroundColor: '#f9fbfd' }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <AntDesign name='close' size={RFValue(24)} color='black' />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FLALX</Text>
        </View>

        <TouchableOpacity
          onPress={() => setSortNewFirst(!sortNewFirst)}
          style={styles.sortButton}
        >
          <AntDesign
            name={sortNewFirst ? 'down' : 'up'}
            size={RFValue(14)}
            color='black'
          />
          <Text style={styles.sortText}>
            {sortNewFirst ? 'New ones first' : 'Old ones first'}
          </Text>
        </TouchableOpacity>
        <FlatList
          data={sortedHistory}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    paddingTop: RFValue(40),
    paddingHorizontal: RFValue(16),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: RFValue(16),
  },
  headerTitle: {
    fontSize: RFValue(16),
    fontWeight: 'bold',
    color: '#0A62EA',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFValue(10),
  },
  sortText: {
    fontSize: RFValue(13),
    marginLeft: RFValue(4),
  },
  listContent: {
    paddingBottom: RFValue(20),
  },
  card: {
    borderRadius: RFValue(10),
    padding: RFValue(12),
    marginBottom: RFValue(12),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: RFValue(8),
  },
  cardDate: {
    fontSize: RFValue(13),
    fontWeight: 'bold',
    color: '#000',
  },
  cardType: {
    fontSize: RFValue(13),
    color: 'rgba(0,0,0,0.5)',
  },
  changeList: {
    marginTop: RFValue(4),
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: RFValue(6),
  },
  bullet: {
    width: RFValue(6),
    height: RFValue(6),
    borderRadius: RFValue(3),
    marginTop: RFValue(6),
    marginRight: RFValue(8),
  },
  changeText: {
    flex: 1,
    fontSize: RFValue(12),
    color: '#444',
  },
});
