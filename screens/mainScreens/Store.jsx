import {
  Animated,
  Modal,
  PanResponder,
  Text,
  TouchableOpacity,
  View,
  Image,
  Platform,
} from 'react-native';
import { useComponentContext } from '../../context/globalAppContext';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { icons } from '../../constants/icons';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { useWindowInfo } from '../../context/windowContext';
import NewJobModal from '../../components/NewJobModal';
import NewScreen from './storeTabs/New';
import WaitingScreen from './storeTabs/Waiting';
import InProgressScreen from './storeTabs/InProgress';
import DoneScreen from './storeTabs/Done';

const TAB_TITLES = ['new', 'waiting', 'in-progress', 'done'];

// Тестовые значения для badge
const badgeCounts = {
  new: 0,
  waiting: 3,
  'in-progress': 0,
  done: 5,
};

export default function Store({ sidebarWidth = 0 }) {
  const { themeController, appTabController, languageController } =
    useComponentContext();
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;
  const { width, height, isLandscape } = useWindowInfo();

  const SCREEN_WIDTH =
    Platform.OS === 'web' && isLandscape ? width - sidebarWidth : width;

  const screenWidthRef = useRef(SCREEN_WIDTH);
  const [screenWidth, setScreenWidth] = useState(SCREEN_WIDTH);
  const [newJobModalVisible, setNewJobModalVisible] = useState(false);

  const storeActiveTab = useRef(
    TAB_TITLES.indexOf(appTabController.activeSubTab) >= 0
      ? TAB_TITLES.indexOf(appTabController.activeSubTab)
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

  const tabWidth = screenWidthRef.current / TAB_TITLES.length;
  const positiveScrollX = Animated.multiply(scrollX, -1);

  const isSwipeRight = useRef(null);

  const underlineAnimatedWidth = useMemo(() => {
    return positiveScrollX.interpolate({
      inputRange: TAB_TITLES.flatMap((_, i) => [
        (i - 0.5) * screenWidth,
        i * screenWidth,
        (i + 0.5) * screenWidth,
      ]),
      outputRange: TAB_TITLES.flatMap(() => [
        tabWidth * 1,
        tabWidth * 0.7,
        tabWidth * 1,
      ]),
      extrapolate: 'clamp',
    });
  }, [screenWidth, tabWidth, positiveScrollX]);

  const underlineTranslateX = useMemo(() => {
    return positiveScrollX.interpolate({
      inputRange: TAB_TITLES.map((_, i) => i * screenWidth),
      outputRange: TAB_TITLES.map(
        (_, i) => i * tabWidth + (tabWidth - tabWidth * 0.7) / 2
      ),
      extrapolate: 'clamp',
    });
  }, [screenWidth, tabWidth, positiveScrollX]);

  const interpolatedColorValues = useMemo(() => {
    return TAB_TITLES.map((_, i) =>
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
    return TAB_TITLES.map((_, i) =>
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
          (storeActiveTab.current === TAB_TITLES.length - 1 &&
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
          storeActiveTab.current < TAB_TITLES.length - 1
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
          appTabController.goToSub(TAB_TITLES[newTab]);
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
      appTabController.goToSub(TAB_TITLES[index]);
    });
  };
  
  useEffect(() => {
    if (appTabController.activeSubTab) {
      const newIndex = TAB_TITLES.indexOf(appTabController.activeSubTab);
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
  
// высота панели
const panelHeight =
  Platform.OS === 'web' && isLandscape ? height*0.08 : RFPercentage(10);

  return (
    <View style={{ flex: 1, userSelect: 'none' }}>
      {/* Заголовки вкладок */}
      <View
        style={{
          flexDirection: 'row',
          height: panelHeight,
          backgroundColor: themeController.current?.backgroundColor,
          overflow: 'hidden',
        }}
      >
        {TAB_TITLES.map((title, idx) => {
    const iconSize = panelHeight * 0.35;
    const fontSize = panelHeight * 0.2;
    const badgeSize = panelHeight * 0.25;

          return (
          <TouchableOpacity
            key={idx}
            onPress={() => handleTabPress(idx)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'flex-end',
          paddingBottom: panelHeight * 0.1,
            }}
          >
            {/* Иконка */}
            <View style={{ position: 'relative' }}>
              <Animated.View
                style={{ opacity: interpolatedOpacityValues[idx] }}
              >
                <Image
                  source={icons[`${title}-dark`]}
              style={{ width: iconSize, height: iconSize }}
                  resizeMode='contain'
                />
              </Animated.View>
              {/* Badge */}
              {badgeCounts[title] > 0 && (
                <View
                  style={{
                    position: 'absolute',
                top: -badgeSize * 0.3,
                right: -badgeSize * 0.5,
                minWidth: badgeSize,
                height: badgeSize,
                borderRadius: badgeSize / 2,
                    backgroundColor:
                      themeController.current?.mainBadgeBackground,
                    justifyContent: 'center',
                    alignItems: 'center',
                paddingHorizontal: badgeSize * 0.3,
                  }}
                >
                  <Text
                    style={{
                      color: themeController.current?.badgeTextColor,
                  fontSize: badgeSize * 0.6,
                      fontWeight: 'bold',
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
            height: panelHeight * 0.35, 
                justifyContent: 'center',
                paddingHorizontal: RFValue(4),
              }}
            >
              <Animated.Text
                style={{
                  color: interpolatedColorValues[idx],
                  fontWeight: 'bold',
                  textAlign: 'center',
              fontSize: fontSize,
                }}
                numberOfLines={2}
                ellipsizeMode='tail'
              >
                {t(`tabs.${title}`)}
              </Animated.Text>
            </View>
          </TouchableOpacity>
        )})}
        {/* underline */}
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: underlineTranslateX,
            width: underlineAnimatedWidth,
      height: panelHeight * 0.05,
            backgroundColor: themeController.current?.primaryColor,
            borderRadius: RFValue(2),
            zIndex: 2,
          }}
        />
      </View>

      {/* Контент */}
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <Animated.View
          style={{
            flexDirection: 'row',
            width: screenWidthRef.current * TAB_TITLES.length,
            flex: 1,
            transform: [{ translateX: scrollX }],
          }}
        >
          {[NewScreen, WaitingScreen, InProgressScreen, DoneScreen].map(
            (Component, index) => (
              <View
                key={index}
                style={{
                  width: screenWidthRef.current,
                  flex: 1,
                }}
              >
                <Component />
              </View>
            )
          )}
        </Animated.View>
      </View>

      {/* Кнопка + */}
      <TouchableOpacity
        style={{
          backgroundColor: themeController.current?.mainBadgeBackground,
          width: RFPercentage(5),
          height: RFPercentage(5),
          borderRadius: RFValue(25),
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          right: RFPercentage(2),
          bottom: RFPercentage(2),
          ...Platform.select({
            web: { right: RFPercentage(4) },
          }),
        }}
        onPress={() => setNewJobModalVisible(true)}
      >
        <Image
          source={icons.plus}
          style={{
            width: RFPercentage(3),
            height: RFPercentage(3),
            tintColor: themeController.current?.buttonTextColorPrimary,
          }}
          resizeMode='contain'
        />
      </TouchableOpacity>

      <Modal visible={newJobModalVisible} animationType='slide'>
        <NewJobModal closeModal={() => setNewJobModalVisible(false)} />
      </Modal>
    </View>
  );
}
