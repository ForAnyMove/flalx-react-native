import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
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
  useWindowDimensions,
} from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import CustomFlatList from './ui/CustomFlatList';
import UserSummaryBlock from './UserSummaryBlock';
import { useTranslation } from 'react-i18next'; // ⬅️ переводы
import { icons } from '../constants/icons';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';

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
  const { width, height } = useWindowDimensions();
  const isWebLandscape = Platform.OS === 'web' && width > height;

  const isShortProviderBlock = status !== 'store-waiting';

  // размеры (в веб-альбомной — компактнее и от высоты)
  const sizes = useMemo(() => {
    const scale = isWebLandscape ? scaleByHeight : scaleByHeightMobile;
    const staticScale = scaleByHeightMobile;

    const font = scale(18, height);
    const margin = scale(12, height);
    const badgeSize = scale(20, height);
    const padding = scale(8, height);
    const icon = scale(24, height);

    return {
      font: font,
      inputFont: scale(14, height),
      padding: padding,
      margin: margin,
      borderRadius: scale(8, height),
      thumb: scale(80, height),
      headerHeight: isWebLandscape ? height * 0.07 : height * 0.07,
      icon: icon,
      horizontalGap: isWebLandscape ? width * 0.01 : 0,
      containerPaddingVertical: scale(12, height),
      containerPaddingHorizontal: scale(15, height),
      badgeSize: badgeSize,
      badgeFontSize: scale(12, height),
      sectionMarginBottom: scale(30, height),
      providerFullScreenPadding: scale(20, height),
      modalPaddingTop: scale(30, height),
      // Новые значения
      sectionWidth: isWebLandscape
        ? scaleByHeight(isShortProviderBlock ? 330 : 1040, height)
        : '100%',
      sectionMaxHeight: isWebLandscape ? height * 0.25 : 200,
      sectionMinHeight: isWebLandscape ? scaleByHeight(136, height) : 50,
      headerGap: isWebLandscape ? margin / 2 : staticScale(8, height),
      headerInnerHeight: isWebLandscape
        ? scaleByHeight(32, height)
        : undefined,
      badgeBorderRadius: badgeSize / 2,
      modalHeaderMarginBottom: isWebLandscape
        ? margin / 1.2
        : staticScale(10, height),
      modalTitleFontSize: font * 1.2,
      gridGap: staticScale(8, height),
    };
  }, [isWebLandscape, height, width, isShortProviderBlock]);

  // сетка 3×N для веб-альбомной
  const gridContainerStyleWeb = isWebLandscape
    ? {
        display: 'grid',
        gridTemplateColumns: `repeat(${
          isShortProviderBlock ? 1 : 3
        }, minmax(0, 1fr))`,
        gridAutoRows: 'auto',
        gridColumnGap: sizes.horizontalGap || sizes.gridGap,
        gridRowGap: sizes.horizontalGap || sizes.gridGap,
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
                userId={item?.id || item}
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
            maxHeight: sizes.sectionMaxHeight,
            minHeight: sizes.sectionMinHeight,
            overflow: 'hidden',
            // paddingHorizontal: sizes.containerPaddingHorizontal,
            paddingVertical: sizes.containerPaddingVertical,
            borderRadius: sizes.borderRadius,
            marginBottom: sizes.sectionMarginBottom,
            width: sizes.sectionWidth,
          },
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
                  gap: sizes.headerGap,
                  height: sizes.headerInnerHeight,
                },
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
                      height: sizes.badgeSize,
                      minWidth: sizes.badgeSize,
                      borderRadius: sizes.badgeBorderRadius,
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
                    paddingTop: sizes.modalPaddingTop,
                    ...(isWebLandscape && {
                      width: width,
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
                      marginBottom: sizes.modalHeaderMarginBottom,
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
                        fontSize: sizes.modalTitleFontSize,
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
  iconButton: {},
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {},
  // элемент сетки
  gridItem: {
    width: '100%',
  },
});
