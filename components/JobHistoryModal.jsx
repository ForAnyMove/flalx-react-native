import { useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Image,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { JOB_SUB_TYPES } from '../constants/jobSubTypes';
import { JOB_TYPES } from '../constants/jobTypes';
import { LICENSES } from '../constants/licenses';
import { useComponentContext } from '../context/globalAppContext';
import { useTranslation } from 'react-i18next';
import { useWindowInfo } from '../context/windowContext';
import { icons } from '../constants/icons';
import JobModalWrapper from './JobModalWrapper';

function CustomModal({isWebLandscape, visible, transparent, animationType, children}) {
  if (isWebLandscape) {
    return (
      <JobModalWrapper visible={visible} main={false}>
        {children}
      </JobModalWrapper>
    )
  }
  return (
    <Modal visible={visible} animationType={animationType} transparent={transparent}>
      {children}
    </Modal>
  )
}

export default function JobHistoryModal({ visible, onClose, history = [] }) {
  const { themeController, languageController } = useComponentContext();
  const { t } = useTranslation();
  const { height, isLandscape } = useWindowInfo();
  const isRTL = languageController?.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  // компактные размеры для веб-альбомной; на остальных — RFValue как раньше
  const sizes = {
    headerTitle: isWebLandscape ? height * 0.03 : RFValue(16),
    icon: isWebLandscape ? height * 0.035 : RFValue(24),
    modalTop: isWebLandscape ? height * 0.02 : RFValue(40),
    modalSide: isWebLandscape ? height * 0.018 : RFValue(16),
    sortIcon: isWebLandscape ? height * 0.018 : RFValue(14),
    sortText: isWebLandscape ? height * 0.014 : RFValue(13),
    listBottom: isWebLandscape ? height * 0.025 : RFValue(20),
    cardRadius: isWebLandscape ? height * 0.012 : RFValue(10),
    cardPad: isWebLandscape ? height * 0.016 : RFValue(12),
    cardGap: isWebLandscape ? height * 0.014 : RFValue(12),
    cardDate: isWebLandscape ? height * 0.016 : RFValue(13),
    cardType: isWebLandscape ? height * 0.015 : RFValue(13),
    changeGap: isWebLandscape ? height * 0.01 : RFValue(6),
    bullet: isWebLandscape ? height * 0.007 : RFValue(6),
    bulletRadius: isWebLandscape ? height * 0.0035 : RFValue(3),
    bulletRight: isWebLandscape ? height * 0.01 : RFValue(8),
    changeText: isWebLandscape ? height * 0.014 : RFValue(12),
  };

  const [sortNewFirst, setSortNewFirst] = useState(true);

  const sortedHistory = [...history].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return sortNewFirst ? dateB - dateA : dateA - dateB;
  });

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  // Локализация названий полей изменений
  const translateKey = (key) => {
    switch (key) {
      case 'type':
        return t('showJob.fields.type', { defaultValue: 'Type' });
      case 'subType':
        return t('showJob.fields.subType', { defaultValue: 'Sub type' });
      case 'profession':
        return t('showJob.fields.profession', { defaultValue: 'Profession' });
      case 'description':
        return t('showJob.fields.description', { defaultValue: 'Description' });
      case 'price':
        return t('showJob.fields.price', { defaultValue: 'Price' });
      case 'location':
        return t('showJob.fields.location', { defaultValue: 'Location' });
      case 'start':
      case 'startDateTime':
        return t('showJob.fields.start', { defaultValue: 'Start' });
      case 'end':
      case 'endDateTime':
        return t('showJob.fields.end', { defaultValue: 'End' });
      default:
        return capitalize(key);
    }
  };

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

    const eventTypeLabel = t(`history.eventTypes.${item.type}`, {
      defaultValue: item.type,
    });

    return (
      <View
        style={[
          styles.card,
          {
            backgroundColor:
              themeController.current?.formInputBackground || '#fff',
            borderRadius: sizes.cardRadius,
            padding: sizes.cardPad,
            marginBottom: sizes.cardGap,
            shadowColor: themeController.current?.textColor || '#000',
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text
            style={[
              styles.cardDate,
              {
                fontSize: sizes.cardDate,
                color: themeController.current?.textColor || '#000',
              },
            ]}
          >
            {formattedDate}
          </Text>
          <Text
            style={[
              styles.cardType,
              {
                fontSize: sizes.cardType,
                color:
                  themeController.current?.unactiveTextColor ||
                  'rgba(0,0,0,0.5)',
              },
            ]}
          >
            {eventTypeLabel}
          </Text>
        </View>
        <View style={[styles.changeList, { marginTop: sizes.changeGap / 2 }]}>
          {changeKeys.map((key, index) => (
            <View
              key={index}
              style={[styles.changeItem, { marginBottom: sizes.changeGap }]}
            >
              <View
                style={{
                  width: sizes.bullet,
                  height: sizes.bullet,
                  borderRadius: sizes.bulletRadius,
                  marginTop: sizes.bullet / 1.2,
                  marginRight: sizes.bulletRight,
                  backgroundColor: themeController.current?.unactiveTextColor
                    ? `${themeController.current.unactiveTextColor}55`
                    : 'rgba(0,0,0,0.2)',
                }}
              />
              <Text
                style={[
                  styles.changeText,
                  {
                    fontSize: sizes.changeText,
                    color: themeController.current?.textColor || '#444',
                  },
                ]}
              >
                {`${translateKey(key)} - ${getSpecialValue(key)}`}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <CustomModal visible={visible} isWebLandscape={isWebLandscape} animationType='slide' transparent={false}>
      <View
        style={[
          styles.modalContainer,
          {
            backgroundColor:
              themeController.current?.backgroundColor || '#f9fbfd',
            paddingTop: sizes.modalTop,
            paddingHorizontal: sizes.modalSide,
          },
        ]}
      >
        <View style={[styles.header, { marginBottom: sizes.cardGap, 
            flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity onPress={onClose}>
            <Image
              source={icons.cross}
              style={{
                width: sizes.icon,
                height: sizes.icon,
                tintColor: themeController.current?.textColor || 'black',
              }}
            />
          </TouchableOpacity>
          <Text
            style={[
              styles.headerTitle,
              {
                fontSize: sizes.headerTitle,
                color: themeController.current?.primaryColor || '#0A62EA',
              },
            ]}
          >
            FLALX
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setSortNewFirst(!sortNewFirst)}
          style={[
            styles.sortButton,
            {
              marginBottom: isWebLandscape ? sizes.cardGap / 1.4 : RFValue(10),
            },
          ]}
        >
          <Image
            source={icons.arrowDown}
            style={{
              transform: sortNewFirst ? '' : 'rotate(180deg)',
              width: sizes.sortIcon,
              height: sizes.sortIcon,
              tintColor: themeController.current?.textColor || 'black',
            }}
          />
          <Text
            style={[
              styles.sortText,
              {
                fontSize: sizes.sortText,
                color: themeController.current?.textColor || 'black',
              },
            ]}
          >
            {sortNewFirst
              ? t('history.sort.newFirst', { defaultValue: 'New ones first' })
              : t('history.sort.oldFirst', { defaultValue: 'Old ones first' })}
          </Text>
        </TouchableOpacity>

        <FlatList
          data={sortedHistory}
          keyExtractor={(_, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: sizes.listBottom },
          ]}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </CustomModal>
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
