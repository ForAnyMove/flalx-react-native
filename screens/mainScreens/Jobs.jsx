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
import NewScreen from './jobsTabs/New';
import WaitingScreen from './jobsTabs/Waiting';
import InProgressScreen from './jobsTabs/InProgress';
import DoneScreen from './jobsTabs/Done';
import ShowJobModal from '../../components/ShowJobModal';
import JobModalWrapper from '../../components/JobModalWrapper';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';

const TAB_TITLES = ['new', 'waiting', 'in_progress', 'done'];
const TAB_TITLES_RTL = ['done', 'in_progress', 'waiting', 'new'];

const badgeCountsExample = {
  new: 0,
  waiting: 0,
  'in-progress': 0,
  done: 0,
};

export default function Jobs() {
  const {
    themeController,
    appTabController,
    languageController,
    jobsController,
  } = useComponentContext();
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
  const [showJobModalVisible, setShowJobModalVisible] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [jobModalStatus, setJobModalStatus] = useState(null);

  const [badgeCounts, setBadgeCounts] = useState(badgeCountsExample);

  useEffect(() => {
    setBadgeCounts({
      new: jobsController.executor.new.length,
      waiting: jobsController.executor.waiting.length,
      'in-progress': jobsController.executor.inProgress.length,
      done: jobsController.executor.done.length,
    });
  }, [jobsController.executor]);

  const storeActiveTab = useRef(
    orderedTabs.indexOf(appTabController.activeSubTab) >= 0
      ? orderedTabs.indexOf(appTabController.activeSubTab)
      : 0
  );

  useEffect(() => {
    const newWidth = SCREEN_WIDTH;
    screenWidthRef.current = newWidth;
    setScreenWidth(newWidth);
    // фиксируем scrollX при ресайзе
    scrollX.setValue(-storeActiveTab.current * newWidth);
  }, [SCREEN_WIDTH]);

  const scrollX = useRef(
    new Animated.Value(-storeActiveTab.current * screenWidthRef.current)
  ).current;

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
                  {t(`tabs.business_${title}`)}
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
                setShowJobModalVisible={setShowJobModalVisible}
                setCurrentJobId={setCurrentJobId}
                setJobModalStatus={setJobModalStatus}
              />
            </View>
          ))}
        </Animated.View>
      </View>

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
