import { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { icons } from '../constants/icons';
import { JOB_SUB_TYPES } from '../constants/jobSubTypes';
import { JOB_TYPES } from '../constants/jobTypes';
import { LICENSES } from '../constants/licenses';
import { useComponentContext } from '../context/globalAppContext';
import { useWindowInfo } from '../context/windowContext';
import JobModalWrapper from './JobModalWrapper';
import { useTranslation } from 'react-i18next';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';

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
  const { height } = useWindowDimensions();
  const { isLandscape } = useWindowInfo();
  const isRTL = languageController?.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      headerTitle: isWebLandscape ? web(16) : mobile(16),
      icon: isWebLandscape ? web(24) : mobile(24),
      modalTop: isWebLandscape ? web(40) : mobile(40),
      modalSide: isWebLandscape ? web(16) : mobile(16),
      sortIcon: isWebLandscape ? web(14) : mobile(14),
      sortText: isWebLandscape ? web(13) : mobile(13),
      listBottom: isWebLandscape ? web(20) : mobile(20),
      cardRadius: isWebLandscape ? web(10) : mobile(10),
      cardPad: isWebLandscape ? web(12) : mobile(12),
      cardGap: isWebLandscape ? web(12) : mobile(12),
      cardDate: isWebLandscape ? web(13) : mobile(13),
      cardType: isWebLandscape ? web(13) : mobile(13),
      changeGap: isWebLandscape ? web(6) : mobile(6),
      bullet: isWebLandscape ? web(6) : mobile(6),
      bulletRadius: isWebLandscape ? web(3) : mobile(3),
      bulletRight: isWebLandscape ? web(8) : mobile(8),
      changeText: isWebLandscape ? web(12) : mobile(12),
      sortButtonMarginBottom: isWebLandscape ? web(10) : mobile(10),
      sortTextMarginLeft: isWebLandscape ? web(4) : mobile(4),
      cardHeaderMarginBottom: isWebLandscape ? web(8) : mobile(8),
      changeListMarginTop: isWebLandscape ? web(4) : mobile(4),
    };
  }, [height, isWebLandscape]);

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
        <View
          style={[
            styles.cardHeader,
            { marginBottom: sizes.cardHeaderMarginBottom },
          ]}
        >
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
        <View
          style={[styles.changeList, { marginTop: sizes.changeListMarginTop }]}
        >
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
    <CustomModal
      visible={visible}
      isWebLandscape={isWebLandscape}
      animationType='slide'
      transparent={false}
    >
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
        <View
          style={[
            styles.header,
            {
              marginBottom: sizes.cardGap,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            },
          ]}
        >
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
              marginBottom: sizes.sortButtonMarginBottom,
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
                marginLeft: sizes.sortTextMarginLeft,
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#0A62EA',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortText: {},
  listContent: {},
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardDate: {
    fontWeight: 'bold',
  },
  cardType: {},
  changeList: {},
  changeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {},
  changeText: {
    flex: 1,
  },
});
