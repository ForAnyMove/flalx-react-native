import {
  Animated,
  Modal,
  PanResponder,
  Text,
  TouchableOpacity,
  View,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useComponentContext } from '../../context/globalAppContext';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { icons } from '../../constants/icons';
import { useWindowInfo } from '../../context/windowContext';
import NewJobModal from '../../components/NewJobModal';
import NewScreen from './storeTabs/New';
import WaitingScreen from './storeTabs/Waiting';
import InProgressScreen from './storeTabs/InProgress';
import DoneScreen from './storeTabs/Done';
import JobModalWrapper from '../../components/JobModalWrapper';
import ShowJobModal from '../../components/ShowJobModal';
import { checkHasPendingJob } from '../../src/api/jobs';
import { useNotification } from '../../src/render';
import { useWebView } from '../../context/webViewContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';

const TAB_TITLES = ['new', 'waiting', 'in_progress', 'done'];
const TAB_TITLES_RTL = ['done', 'in_progress', 'waiting', 'new'];

// Тестовые значения для badge
const badgeCountsExample = {
  new: 0,
  waiting: 0,
  'in-progress': 0,
  done: 0,
};

export default function Store() {
  const {
    themeController,
    appTabController,
    languageController,
    jobsController,
    session,
  } = useComponentContext();
  const { showWarning } = useNotification();
  const { openWebView } = useWebView();

  const { t } = useTranslation();
  const isRTL = languageController.isRTL;
  const { width, height } = useWindowDimensions();
  const { sidebarWidth, isLandscape } = useWindowInfo();
  const isWebLandscape = isLandscape && Platform.OS === 'web';

  const orderedTabs = isRTL ? TAB_TITLES_RTL : TAB_TITLES;
  const orderedScreens = isRTL
    ? [DoneScreen, InProgressScreen, WaitingScreen, NewScreen]
    : [NewScreen, WaitingScreen, InProgressScreen, DoneScreen];

  const SCREEN_WIDTH = isWebLandscape ? width - sidebarWidth : width;

  const screenWidthRef = useRef(SCREEN_WIDTH);
  const [screenWidth, setScreenWidth] = useState(SCREEN_WIDTH);
  // Стейты для модальных окон
  const [newJobModalVisible, setNewJobModalVisible] = useState(false);
  const [activeKey, setActiveKey] = useState(null);
  const [showJobModalVisible, setShowJobModalVisible] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [jobModalStatus, setJobModalStatus] = useState(null);

  const [badgeCounts, setBadgeCounts] = useState(badgeCountsExample);

  useEffect(() => {
    setBadgeCounts({
      new: 0,
      waiting: jobsController.creator.waiting.length,
      'in-progress': jobsController.creator.inProgress.length,
      done: jobsController.creator.done.length,
    });
  }, [jobsController.creator]);

  const storeActiveTab = useRef(
    orderedTabs.indexOf(appTabController.activeSubTab) >= 0
      ? orderedTabs.indexOf(appTabController.activeSubTab)
      : 0
  );

  const scrollX = useRef(
    new Animated.Value(-storeActiveTab.current * screenWidthRef.current)
  ).current;

  // пересчёт ширины и фиксация scrollX при ресайзе
  useEffect(() => {
    const newWidth = SCREEN_WIDTH;
    screenWidthRef.current = newWidth;
    setScreenWidth(newWidth);

    // фиксация позиции scrollX для активного таба
    scrollX.setValue(-storeActiveTab.current * newWidth);
  }, [SCREEN_WIDTH]);

  const tabWidth = screenWidthRef.current / orderedTabs.length;
  const positiveScrollX = Animated.multiply(scrollX, -1);

  const isSwipeRight = useRef(null);

  const underlineAnimatedWidth = useMemo(() => {
    return positiveScrollX.interpolate({
      inputRange: orderedTabs.flatMap((_, i) => [
        (i - 0.5) * screenWidth,
        i * screenWidth,
        (i + 0.5) * screenWidth,
      ]),
      outputRange: orderedTabs.flatMap(() => [
        tabWidth * 1,
        tabWidth * 0.7,
        tabWidth * 1,
      ]),
      extrapolate: 'clamp',
    });
  }, [screenWidth, tabWidth, positiveScrollX]);

  const underlineTranslateX = useMemo(() => {
    return positiveScrollX.interpolate({
      inputRange: orderedTabs.map((_, i) => i * screenWidth),
      outputRange: orderedTabs.map(
        (_, i) => i * tabWidth + (tabWidth - tabWidth * 0.7) / 2
      ),
      extrapolate: 'clamp',
    });
  }, [screenWidth, tabWidth, positiveScrollX]);

  const interpolatedColorValues = useMemo(() => {
    return orderedTabs.map((_, i) =>
      positiveScrollX.interpolate({
        inputRange: [
          (i - 1) * screenWidth,
          i * screenWidth,
          (i + 1) * screenWidth,
        ],
        outputRange: [
          themeController.current?.unactiveTextColor,
          themeController.current?.textColor,
          themeController.current?.unactiveTextColor,
        ],
        extrapolate: 'clamp',
      })
    );
  }, [screenWidth, themeController.current, positiveScrollX]);

  const interpolatedOpacityValues = useMemo(() => {
    return orderedTabs.map((_, i) =>
      positiveScrollX.interpolate({
        inputRange: [
          (i - 1) * screenWidth,
          i * screenWidth,
          (i + 1) * screenWidth,
        ],
        outputRange: [0.5, 1, 0.5],
        extrapolate: 'clamp',
      })
    );
  }, [screenWidth, positiveScrollX]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        scrollX.setOffset(scrollX.__getValue());
        scrollX.setValue(0);
        isSwipeRight.current = null;
      },
      onPanResponderMove: (_, g) => {
        if (isSwipeRight.current === null) {
          isSwipeRight.current = g.dx > 0;
        }
        if (
          (storeActiveTab.current === 0 && isSwipeRight.current) ||
          (storeActiveTab.current === orderedTabs.length - 1 &&
            !isSwipeRight.current)
        )
          return;
        scrollX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        scrollX.flattenOffset();
        const dx = g.dx;
        const swipeThreshold = screenWidthRef.current * 0.25;

        let newTab = storeActiveTab.current;
        if (
          dx < swipeThreshold * -1 &&
          storeActiveTab.current < orderedTabs.length - 1
        ) {
          newTab = storeActiveTab.current + 1;
        } else if (dx > swipeThreshold && storeActiveTab.current > 0) {
          newTab = storeActiveTab.current - 1;
        }

        Animated.timing(scrollX, {
          toValue: -newTab * screenWidthRef.current,
          duration: 250,
          useNativeDriver: false,
        }).start(() => {
          storeActiveTab.current = newTab;
          appTabController.goToSub(orderedTabs[newTab]);
        });
      },
    })
  ).current;

  const handleTabPress = (index) => {
    Animated.timing(scrollX, {
      toValue: -index * screenWidthRef.current,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      storeActiveTab.current = index;
      appTabController.goToSub(orderedTabs[index]);
    });
  };

  useEffect(() => {
    if (appTabController.activeSubTab) {
      const newIndex = orderedTabs.indexOf(appTabController.activeSubTab);
      if (newIndex >= 0 && newIndex !== storeActiveTab.current) {
        Animated.timing(scrollX, {
          toValue: -newIndex * screenWidthRef.current,
          duration: 250,
          useNativeDriver: false,
        }).start(() => {
          storeActiveTab.current = newIndex;
        });
      }
    }
  }, [appTabController.activeSubTab]);

  // следим за сменой isRTL и синхронизируем активный таб
  useEffect(() => {
    const newIndex = orderedTabs.indexOf(appTabController.activeSubTab);
    if (newIndex >= 0) {
      storeActiveTab.current = newIndex;
      scrollX.setValue(-newIndex * screenWidthRef.current);
    }
  }, [isRTL, orderedTabs]);

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    const panelHeight = isWebLandscape ? web(65) : mobile(81);
    const badgeSize = isWebLandscape ? web(20) : panelHeight * 0.25;

    return {
      panelHeight,
      iconSize: isWebLandscape ? web(24) : mobile(24),
      fontSize: isWebLandscape ? web(12) : mobile(12),
      badgeSize,
      underlineHeight: isWebLandscape ? web(2) : mobile(2),
      tabPaddingBottom: panelHeight * 0.1,
      badgeTop: -badgeSize * 0.3,
      badgeRight: -badgeSize * 0.8,
      badgePaddingHorizontal: badgeSize * 0.3,
      badgeFontSize: badgeSize * 0.6,
      titleHeight: panelHeight * 0.35,
      titlePaddingHorizontal: isWebLandscape ? web(4) : mobile(4),
      underlineBorderRadius: isWebLandscape ? web(2) : mobile(2),
      plusButtonSize: isWebLandscape ? web(64) : mobile(64),
      plusButtonLeft: isWebLandscape ? web(24) : mobile(16),
      plusButtonRight: isWebLandscape ? web(24) : mobile(16),
      plusButtonBottom: isWebLandscape ? web(24) : mobile(24),
      plusIconSize: isWebLandscape ? web(24) : mobile(24),
      plusButtonShadowColor: '#000',
      plusButtonShadowOffset: {
        width: 0,
        height: isWebLandscape ? web(4) : mobile(4),
      },
      plusButtonShadowOpacity: 0.3,
      plusButtonShadowRadius: isWebLandscape ? web(5) : mobile(5),
      plusButtonElevation: isWebLandscape ? 10 : 8,
      plusButtonLabelFontSize: isWebLandscape ? web(12) : mobile(12),
      plusButtonLabelMarginTop: isWebLandscape ? web(8) : mobile(8),
    };
  }, [height, isWebLandscape]);

  return (
    <View style={{ flex: 1, userSelect: 'none' }}>
      {/* Заголовки вкладок */}
      <View
        style={{
          flexDirection: 'row',
          height: sizes.panelHeight,
          backgroundColor: themeController.current?.backgroundColor,
          overflow: 'hidden',
        }}
      >
        {orderedTabs.map((title, idx) => {
          return (
            <TouchableOpacity
              key={idx}
              onPress={() => handleTabPress(idx)}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingBottom: sizes.tabPaddingBottom,
              }}
            >
              {/* Иконка */}
              <View style={{ position: 'relative' }}>
                <Animated.View
                  style={{ opacity: interpolatedOpacityValues[idx] }}
                >
                  <Image
                    source={icons[`${title}-dark`]}
                    style={{ width: sizes.iconSize, height: sizes.iconSize }}
                    resizeMode='contain'
                    tintColor={themeController?.current.textColor}
                  />
                </Animated.View>
                {/* Badge */}
                {badgeCounts[title] > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      top: sizes.badgeTop,
                      right: sizes.badgeRight,
                      minWidth: sizes.badgeSize,
                      height: sizes.badgeSize,
                      borderRadius: sizes.badgeSize / 2,
                      backgroundColor:
                        themeController.current?.mainBadgeBackground,
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: sizes.badgePaddingHorizontal,
                    }}
                  >
                    <Text
                      style={{
                        color: themeController.current?.badgeTextColor,
                        fontSize: sizes.badgeFontSize,
                        // fontWeight: 'bold',
                      }}
                    >
                      {badgeCounts[title]}
                    </Text>
                  </View>
                )}
              </View>
              {/* Заголовок */}
              <View
                style={{
                  height: sizes.titleHeight,
                  justifyContent: 'center',
                  paddingHorizontal: sizes.titlePaddingHorizontal,
                }}
              >
                <Animated.Text
                  style={{
                    color: interpolatedColorValues[idx],
                    // fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: sizes.fontSize,
                  }}
                  numberOfLines={2}
                  ellipsizeMode='tail'
                >
                  {t(`tabs.client_${title}`)}
                </Animated.Text>
              </View>
            </TouchableOpacity>
          );
        })}
        {/* underline */}
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: underlineTranslateX,
            width: underlineAnimatedWidth,
            height: sizes.underlineHeight,
            backgroundColor: themeController.current?.primaryColor,
            borderRadius: sizes.underlineBorderRadius,
            zIndex: 2,
          }}
        />
      </View>

      {/* Контент */}
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <Animated.View
          style={{
            flexDirection: 'row',
            width: screenWidthRef.current * orderedTabs.length,
            flex: 1,
            transform: [{ translateX: scrollX }],
          }}
        >
          {orderedScreens.map((Component, index) => (
            <View
              key={index}
              style={{
                width: screenWidthRef.current,
                flex: 1,
              }}
            >
              <Component
                newJobModalVisible={newJobModalVisible}
                setNewJobModalVisible={setNewJobModalVisible}
                setActiveKey={setActiveKey}
                setShowJobModalVisible={setShowJobModalVisible}
                setCurrentJobId={setCurrentJobId}
                setJobModalStatus={setJobModalStatus}
              />
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Кнопка + */}
      <View
        style={{
          position: 'absolute',
          ...(isRTL
            ? {
                left: sizes.plusButtonLeft,
              }
            : {
                right: sizes.plusButtonRight,
              }),
          bottom: sizes.plusButtonBottom,
          alignItems: 'center',
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: themeController.current?.mainBadgeBackground,
            width: sizes.plusButtonSize,
            height: sizes.plusButtonSize,
            borderRadius: sizes.plusButtonSize,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: sizes.plusButtonShadowColor,
            shadowOffset: sizes.plusButtonShadowOffset,
            shadowOpacity: sizes.plusButtonShadowOpacity,
            shadowRadius: sizes.plusButtonShadowRadius,
            elevation: sizes.plusButtonElevation,
          }}
          onPress={async () => {
            const pendingJobRequest = await checkHasPendingJob(session);
            if (!pendingJobRequest.job) {
              setActiveKey(null);
              setNewJobModalVisible(true);
            } else {
              const url =
                pendingJobRequest.payment?.paymentMetadata?.paypalApproval
                  ?.href;
              const message = [
                t('subscriptions.messages.pendingJob'),
                '',
                t('subscriptions.messages.paymentURL', { url: url }),
                '',
                t('subscriptions.messages.cancelPendingJob'),
              ].join('\n');

              showWarning(message, [
                {
                  title: t('subscriptions.messages.moveToPayment'),
                  backgroundColor: '#3B82F6',
                  textColor: '#FFFFFF',
                  onPress: () => openWebView(url),
                },
              ]);
            }
          }}
        >
          <Image
            source={icons.plus}
            style={{
              width: sizes.plusIconSize,
              height: sizes.plusIconSize,
              tintColor: themeController.current?.buttonTextColorPrimary,
            }}
            resizeMode='contain'
          />
        </TouchableOpacity>
        <Text
          style={{
            color: themeController.current?.formInputLabelColor,
            fontSize: sizes.plusButtonLabelFontSize,
            marginTop: sizes.plusButtonLabelMarginTop,
          }}
        >
          {t('common.create_request')}
        </Text>
      </View>

      {isWebLandscape ? (
        <JobModalWrapper visible={newJobModalVisible} main={true}>
          <NewJobModal
            closeModal={() => setNewJobModalVisible(false)}
            activeKey={activeKey}
          />
        </JobModalWrapper>
      ) : (
        <Modal visible={newJobModalVisible} animationType='slide' transparent>
          <NewJobModal
            closeModal={() => setNewJobModalVisible(false)}
            activeKey={activeKey}
          />
        </Modal>
      )}
      {isWebLandscape ? (
        <JobModalWrapper visible={showJobModalVisible} main={true}>
          <ShowJobModal
            closeModal={() => setShowJobModalVisible(false)}
            status={jobModalStatus}
            currentJobId={currentJobId}
          />
        </JobModalWrapper>
      ) : (
        <Modal visible={showJobModalVisible} animationType='slide'>
          <ShowJobModal
            closeModal={() => setShowJobModalVisible(false)}
            status={jobModalStatus}
            currentJobId={currentJobId}
          />
        </Modal>
      )}
    </View>
  );
}
