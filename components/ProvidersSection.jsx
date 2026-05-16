import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { useWindowInfo } from '../context/windowContext';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  TouchableOpacity,
  View,
  Image,
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
      return t('providersSection.title.storeWaiting', {
        defaultValue: 'Interested Providers',
      });
    case 'store-in-progress':
      return t('providersSection.title.storeInProgress', {
        defaultValue: 'Provider working on request',
      });
    case 'store-done':
      return t('providersSection.title.storeDone', {
        defaultValue: 'Provider complete request',
      });
    case 'jobs-in-progress':
      return t('providersSection.title.jobsInProgress', {
        defaultValue: 'Customer placed request',
      });
    case 'jobs-done':
      return t('providersSection.title.jobsDone', {
        defaultValue: 'Customer placed request',
      });
    case 'jobs-new':
      return t('providersSection.title.jobsDone', {
        defaultValue: 'Customer placed request',
      });
    case 'jobs-waiting':
      return t('providersSection.title.jobsDone', {
        defaultValue: 'Customer placed request',
      });
    default:
      return '';
  }
}

function UserSummaryBlockWrapper({
  userId,
  jobAgreement,
  status,
  currentJobId,
  closeAllModal,
  providersController,
  isFullScreen = false,
  preloadedUser = null,
  isClientCreator = false,
}) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (preloadedUser && (preloadedUser.name || preloadedUser.name_i18n)) {
      setUser(preloadedUser);
      return;
    }
    let active = true;
    providersController.getUserById(userId).then((u) => {
      if (active) setUser(u);
    });
    return () => {
      active = false;
    };
  }, [userId, preloadedUser]);

  if (!user) return null; // или можно <Loader />

  return (
    <UserSummaryBlock
      status={status}
      user={user}
      currentJobId={currentJobId}
      closeAllModal={closeAllModal}
      isFullScreen={isFullScreen}
      jobAgreement={jobAgreement}
      isClientCreator={isClientCreator}
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
  const [sortField, setSortField] = useState('rating');
  const [sortOrder, setSortOrder] = useState('desc');

  // размеры/ориентация экрана
  const { width, height, isLandscape, effectiveSidebarWidth } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

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
      headerMarginBottom: scale(16, height),
      icon: icon,
      iconSize: scale(24, height),
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
      sectionMaxHeight: isWebLandscape
        ? scaleByHeight(112 * 3 + 16 * 2, height)
        : 400,
      sectionMinHeight: isWebLandscape ? scaleByHeight(112, height) : 50,
      headerGap: isWebLandscape ? margin / 2 : staticScale(8, height),
      headerInnerHeight: isWebLandscape
        ? scaleByHeight(32, height)
        : undefined,
      listGap: scale(16, height),
      badgeBorderRadius: badgeSize / 2,
      modalHeaderMarginBottom: isWebLandscape
        ? margin / 1.2
        : staticScale(10, height),
      modalTitleFontSize: font * 1.2,
      gridGap: staticScale(8, height),
      sortGap: staticScale(16, height),
      sortPanelGap: staticScale(24, height),
    };
  }, [isWebLandscape, height, width, isShortProviderBlock]);

  // сетка 3×N для веб-альбомной
  const gridContainerStyleWeb = isWebLandscape
    ? {
      display: 'grid',
      gridTemplateColumns: `repeat(1, minmax(0, 1fr))`,
      gridAutoRows: 'auto',
      gridColumnGap: sizes.horizontalGap || sizes.gridGap,
      gridRowGap: sizes.listGap,
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
      case 'jobs-new':
        return [currentJobInfo?.creator];
      case 'jobs-waiting':
        return [currentJobInfo?.creator];
      default:
        return [];
    }
  }

  const rawProviderList = checkListByStatus() || [];

  const providerList = useMemo(() => {
    return [...rawProviderList].sort((a, b) => {
      let valA, valB;

      if (sortField === 'rating') {
        valA = a.rating || 0;
        valB = b.rating || 0;
      } else if (sortField === 'price') {
        valA = parseFloat(a.executor_expectations?.salary || 0);
        valB = parseFloat(b.executor_expectations?.salary || 0);
      } else if (sortField === 'time') {
        valA = new Date(a.executor_expectations?.startDateTime || 0).getTime();
        valB = new Date(b.executor_expectations?.startDateTime || 0).getTime();
      }

      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }, [rawProviderList, sortField, sortOrder]);

  const handleSortPress = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const renderSortBadge = (field, label) => {
    const isActive = sortField === field;
    return (
      <TouchableOpacity
        onPress={() => handleSortPress(field)}
        style={{
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          backgroundColor: isActive ? themeController.current?.primaryColor + '1A' : themeController.current?.formInputBackground,
          paddingVertical: isWebLandscape ? scaleByHeight(5, height) : scaleByHeightMobile(5, height),
          paddingHorizontal: isWebLandscape ? scaleByHeight(16, height) : scaleByHeightMobile(16, height),
          borderRadius: sizes.borderRadius,
          borderWidth: 1,
          borderColor: isActive ? themeController.current?.primaryColor : 'transparent',
          gap: isWebLandscape ? scaleByHeight(6, height) : scaleByHeightMobile(6, height),
        }}
      >
        <Text
          style={{
            fontSize: sizes.smallFont,
            color: isActive ? themeController.current?.primaryColor : themeController.current?.textColor,
            fontFamily: isActive ? 'Rubik-Medium' : 'Rubik-Regular',
          }}
        >
          {label}
        </Text>
        <Image
          source={icons.back}
          style={{
            width: sizes.iconSize,
            height: sizes.iconSize,
            tintColor: themeController.current?.primaryColor,
            transform: [{ rotate: (isActive && sortOrder === 'asc') ? '90deg' : '270deg' }],
          }}
        />
      </TouchableOpacity>
    );
  };

  if (status === 'store-waiting' && providerList?.length > 0) {
    console.log('[ProvidersSection] providers:', JSON.stringify(providerList.map(p => ({ id: p?.id || p, job_agreement: p?.job_agreement }))));
  }

  const renderProviderList = (isFull = false) => (
    <>
      {Platform.OS === 'web' ? (
        <CustomFlatList
          data={providerList || []}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={[
              styleRow.gridItem,
              {
                marginBottom: index === providerList.length - 1 || isWebLandscape ? 0 : sizes.listGap,
                ...(isFull && { width: '70%', alignSelf: isRTL ? 'flex-end' : 'flex-start' })
              }
            ]}>
              <UserSummaryBlockWrapper
                status={status}
                userId={item?.id || item}
                jobAgreement={item?.job_agreement}
                currentJobId={currentJobInfo?.id}
                closeAllModal={closeAllModal}
                providersController={providersController}
                preloadedUser={item}
                isClientCreator={currentJobInfo?.creator_account_type === 'client'}
                isFullScreen={isFull}
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
          renderItem={({ item, index }) => (
            <View style={[
              styleRow.gridItem,
              {
                marginBottom: index === providerList.length - 1 ? 0 : sizes.listGap,
                ...(isFull && { width: '70%', alignSelf: isRTL ? 'flex-end' : 'flex-start' })
              }
            ]}>
              <UserSummaryBlockWrapper
                status={status}
                userId={item?.id || item}
                jobAgreement={item?.job_agreement}
                currentJobId={currentJobInfo?.id}
                closeAllModal={closeAllModal}
                providersController={providersController}
                preloadedUser={item}
                isClientCreator={currentJobInfo?.creator_account_type === 'client'}
                isFullScreen={isFull}
              />
            </View>
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
            // backgroundColor: themeController.current?.formInputBackground,
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
                marginBottom: sizes.headerMarginBottom
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

        {renderProviderList(false)}
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
                    flex: 1,
                    ...(isWebLandscape && {
                      width: width - effectiveSidebarWidth,
                      alignSelf: isRTL ? 'flex-start' : 'flex-end',
                      [isRTL ? 'marginRight' : 'marginLeft']: effectiveSidebarWidth,
                    }),
                  },
                ]}
              >
                <View style={[styleRow.header, { marginBottom: sizes.headerMarginBottom }]}>
                  <Text style={[styleRow.modalTitle, { fontSize: sizes.font * 1.2, fontFamily: 'Rubik-Bold' }]}>
                    {t('providersSection.interested_providers', { defaultValue: 'Interested providers' })}
                  </Text>
                  <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                    <Image source={icons.cross} style={{ width: sizes.icon, height: sizes.icon, tintColor: themeController.current?.textColor }} />
                  </TouchableOpacity>
                </View>

                {/* Sorting Filter */}
                <View
                  style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    gap: sizes.sortPanelGap,
                    marginBottom: sizes.headerMarginBottom,
                    paddingBottom: sizes.padding,
                    borderBottomWidth: 1,
                    borderBottomColor: 'rgba(0,0,0,0.05)',
                  }}
                >
                  <Text style={{ fontSize: sizes.font, color: themeController.current?.formInputLabelColor, }}>
                    {t('common.sort_by', { defaultValue: 'Sort by:' })}
                  </Text>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: sizes.sortGap }}>
                    {renderSortBadge('rating', t('common.rating', { defaultValue: 'Rating' }))}
                    {currentJobInfo?.creator_account_type === 'client' && (
                      <>
                        {renderSortBadge('price', t('common.price', { defaultValue: 'Price' }))}
                        {renderSortBadge('time', t('common.time', { defaultValue: 'Time' }))}
                      </>
                    )}
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  {renderProviderList(true)}
                </View>
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
