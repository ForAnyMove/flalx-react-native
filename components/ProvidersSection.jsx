import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  Image,
} from 'react-native';
import { RFValue, RFPercentage } from 'react-native-responsive-fontsize';
import { useComponentContext } from '../context/globalAppContext';
import CustomFlatList from './ui/CustomFlatList';
import UserSummaryBlock from './UserSummaryBlock';
import { useWindowInfo } from '../context/windowContext'; // ориентация/размеры
import { useTranslation } from 'react-i18next'; // ⬅️ переводы
import { icons } from '../constants/icons';
import { scaleByHeight } from '../utils/resizeFuncs';

function showTitleByStatus(status, t) {
  switch (status) {
    case 'store-waiting':
      return t('providers.title.storeWaiting', {
        defaultValue: 'Interested Providers',
      });
    case 'store-in-progress':
      return t('providers.title.storeInProgress', {
        defaultValue: 'Provider working on request',
      });
    case 'store-done':
      return t('providers.title.storeDone', {
        defaultValue: 'Provider complete request',
      });
    case 'jobs-in-progress':
      return t('providers.title.jobsInProgress', {
        defaultValue: 'Customer placed request',
      });
    case 'jobs-done':
      return t('providers.title.jobsDone', {
        defaultValue: 'Customer placed request',
      });
    default:
      return '';
  }
}

function UserSummaryBlockWrapper({
  userId,
  status,
  currentJobId,
  closeAllModal,
  providersController,
  isFullScreen = false,
}) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;
    providersController.getUserById(userId).then((u) => {
      if (active) setUser(u);
    });
    return () => {
      active = false;
    };
  }, [userId]);

  if (!user) return null; // или можно <Loader />

  return (
    <UserSummaryBlock
      status={status}
      user={user}
      currentJobId={currentJobId}
      closeAllModal={closeAllModal}
      isFullScreen={isFullScreen}
    />
  );
}

export default function ProvidersSection({
  styles,
  currentJobInfo,
  status = 'store-waiting',
  closeAllModal,
}) {
  const { providersController, themeController, languageController } =
    useComponentContext();
  const { t } = useTranslation();
  const isRTL = languageController?.isRTL;
  const [isModalVisible, setIsModalVisible] = useState(false);

  // размеры/ориентация экрана
  const { width, height, isLandscape, sidebarWidth } = useWindowInfo?.() || {
    width: 1280,
    height: 800,
    isLandscape: false,
  };
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const isShortProviderBlock = status !== 'store-waiting';

  // размеры (в веб-альбомной — компактнее и от высоты)
  const sizes = {
    font: isWebLandscape ? scaleByHeight(18, height) : RFValue(12),
    inputFont: isWebLandscape ? height * 0.014 : RFValue(10),
    padding: isWebLandscape ? height * 0.01 : RFValue(8),
    margin: isWebLandscape ? height * 0.012 : RFValue(10),
    borderRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(5),
    thumb: isWebLandscape ? height * 0.12 : RFValue(80),
    headerHeight: isWebLandscape ? height * 0.07 : RFPercentage(7),
    icon: isWebLandscape ? scaleByHeight(24, height) : RFValue(16),
    horizontalGap: isWebLandscape ? width * 0.01 : 0,
    containerPaddingVertical: isWebLandscape
      ? scaleByHeight(12, height)
      : RFValue(12),
    containerPaddingHorizontal: isWebLandscape
      ? scaleByHeight(15, height)
      : RFValue(10),
    badgeSize: isWebLandscape ? scaleByHeight(20, height) : RFValue(14),
    badgeFontSize: isWebLandscape ? scaleByHeight(12, height) : RFValue(8),
    sectionMarginBottom: isWebLandscape
      ? scaleByHeight(30, height)
      : RFValue(15),
    providerFullScreenPadding: isWebLandscape
      ? scaleByHeight(20, height)
      : RFValue(30),
  };

  // сетка 3×N для веб-альбомной
  const gridContainerStyleWeb = isWebLandscape
    ? {
        display: 'grid',
        gridTemplateColumns: `repeat(${isShortProviderBlock ? 1 : 3}, minmax(0, 1fr))`,
        gridAutoRows: 'auto',
        gridColumnGap: sizes.horizontalGap || RFValue(8),
        gridRowGap: sizes.horizontalGap || RFValue(8),
        alignItems: 'start',
        justifyItems: 'stretch',
        direction: isRTL ? 'rtl' : 'ltr',
      }
    : null;

  function checkListByStatus() {
    switch (status) {
      case 'store-waiting':
        return currentJobInfo?.providers;
      case 'store-in-progress':
        return [currentJobInfo?.executor];
      case 'store-done':
        return [currentJobInfo?.executor];
      case 'jobs-in-progress':
        return [currentJobInfo?.creator];
      case 'jobs-done':
        return [currentJobInfo?.creator];
      default:
        return [];
    }
  }

  const providerList = checkListByStatus();
  const renderProviderList = () => (
    <>
      {Platform.OS === 'web' ? (
        <CustomFlatList
          data={providerList || []}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <View style={styleRow.gridItem}>
              <UserSummaryBlockWrapper
                status={status}
                userId={item.id || item}
                currentJobId={currentJobInfo?.id}
                closeAllModal={closeAllModal}
                providersController={providersController}
              />
            </View>
          )}
          contentContainerStyle={[styles.container, gridContainerStyleWeb]}
          keyboardShouldPersistTaps='handled'
        />
      ) : (
        <FlatList
          data={providerList || []}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => (
            <UserSummaryBlock
              status={status}
              user={providersController.getUserById(item.id || item)}
              currentJobId={currentJobInfo?.id}
              closeAllModal={closeAllModal}
            />
          )}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps='handled'
        />
      )}
    </>
  );

  return (
    <>
      <View
        style={[
          {
            backgroundColor: themeController.current?.formInputBackground,
            maxHeight: isWebLandscape ? height * 0.25 : RFValue(200),
            overflow: 'hidden',
            // paddingHorizontal: sizes.containerPaddingHorizontal,
            paddingVertical: sizes.containerPaddingVertical,
            borderRadius: sizes.borderRadius,
            marginBottom: sizes.sectionMarginBottom,
          },
          isWebLandscape && { width: scaleByHeight(isShortProviderBlock ? 330 : 1040, height) },
        ]}
        key='providers'
      >
        <View>
          <View
            style={[
              styleRow.header,
              isRTL && { flexDirection: 'row-reverse' },
              {
                paddingHorizontal: sizes.containerPaddingHorizontal,
              },
            ]}
          >
            <View
              style={[
                {
                  flexDirection: isRTL ? 'row' : 'row-reverse',
                  alignItems: 'center',
                  gap: isWebLandscape ? sizes.margin / 2 : RFValue(8),
                },
                // isRTL && { flexDirection: 'row-reverse' },
                isWebLandscape && { height: scaleByHeight(32, height) },
              ]}
            >
              {status === 'store-waiting' && providerList?.length > 0 && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor:
                        themeController.current?.secondaryBadgeBackground,
                      alignSelf: 'flex-start',
                    },
                    isWebLandscape && {
                      height: sizes.badgeSize,
                      minWidth: sizes.badgeSize,
                      borderRadius: sizes.badgeSize / 2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color: themeController.current?.badgeTextColor,
                        fontSize: sizes.badgeFontSize,
                      },
                    ]}
                  >
                    {providerList.length}
                  </Text>
                </View>
              )}
              <Text
                style={[
                  styles.label,
                  {
                    marginBottom: 0,
                    fontSize: sizes.font,
                    color: themeController.current?.textColor,
                    textAlign: isRTL ? 'right' : 'left',
                    alignSelf: 'flex-end',
                  },
                ]}
              >
                {showTitleByStatus(status, t)}
              </Text>
            </View>

            {status === 'store-waiting' && (
              <Pressable
                onPress={() => setIsModalVisible(true)}
                style={[styleRow.iconButton, { padding: sizes.padding / 2 }]}
              >
                <Image
                  source={icons.fullScreen}
                  style={{
                    width: sizes.icon,
                    height: sizes.icon,
                    tintColor: themeController.current?.textColor || 'black',
                    opacity: 0.4,
                  }}
                />
              </Pressable>
            )}
          </View>
        </View>

        {renderProviderList()}
      </View>
      <Modal
        visible={isModalVisible}
        animationType='slide'
        // presentationStyle='fullScreen'
        transparent
      >
        <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}>
          <View style={{ flex: 1 }}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styleRow.modalContainer,
                  {
                    backgroundColor: themeController.current?.backgroundColor,
                    padding: sizes.providerFullScreenPadding,
                    paddingTop: isWebLandscape
                      ? scaleByHeight(30, height)
                      : RFValue(30),
                    ...(isWebLandscape && {
                      width: width - sidebarWidth,
                      alignSelf: isRTL ? 'flex-start' : 'flex-end',
                    }),
                  },
                ]}
              >
                <View
                  style={[
                    styleRow.modalHeader,
                    isRTL && { flexDirection: 'row-reverse' },
                    {
                      marginBottom: isWebLandscape
                        ? sizes.margin / 1.2
                        : RFValue(10),
                      borderBottomColor:
                        themeController.current?.formInputLabelColor,
                      borderBottomWidth: 2,
                      paddingBottom: sizes.padding / 2,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styleRow.modalTitle,
                      {
                        fontSize: sizes.font * 1.2,
                        textAlign: isRTL ? 'right' : 'left',
                      },
                    ]}
                  >
                    {t('providers.modalTitle', {
                      defaultValue: 'Interested Providers',
                    })}
                  </Text>
                  <Pressable onPress={() => setIsModalVisible(false)}>
                    <Ionicons
                      name='contract'
                      size={sizes.icon}
                      color={themeController.current?.textColor}
                      opacity={0.4}
                    />
                  </Pressable>
                </View>
                {renderProviderList()}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styleRow = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconButton: {
    padding: RFValue(4),
  },
  modalContainer: {
    flex: 1,
    padding: RFValue(10),
    paddingTop: RFValue(30),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: RFValue(10),
  },
  modalTitle: {
    fontSize: RFValue(16),
  },
  // элемент сетки
  gridItem: {
    width: '100%',
  },
});
