import {
  Animated,
  PanResponder,
  Text,
  TouchableOpacity,
  View,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useComponentContext } from '../../../context/globalAppContext';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { icons } from '../../../constants/icons';
import { useWindowInfo } from '../../../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../../../utils/resizeFuncs';
import MyProfessions from './professionsTabs/MyProfessions';
import SystemProfessions from './professionsTabs/SystemProfessions';

const TAB_TITLES = ['my_professions', 'system_professions'];
const TAB_TITLES_RTL = ['system_professions', 'my_professions'];

export default function Profession() {
  const { themeController, appTabController, languageController } =
    useComponentContext();

  const { t } = useTranslation();
  const isRTL = languageController.isRTL;
  const { width, height } = useWindowDimensions();
  const { sidebarWidth, isLandscape } = useWindowInfo();
  const isWebLandscape = isLandscape && Platform.OS === 'web';

  const orderedTabs = isRTL ? TAB_TITLES_RTL : TAB_TITLES;
  const orderedScreens = isRTL
    ? [SystemProfessions, MyProfessions]
    : [MyProfessions, SystemProfessions];

  const SCREEN_WIDTH = isWebLandscape ? width - sidebarWidth : width;

  const screenWidthRef = useRef(SCREEN_WIDTH);
  const [screenWidth, setScreenWidth] = useState(SCREEN_WIDTH);

  const activeTabRef = useRef(
    orderedTabs.indexOf(appTabController.activeSubTab) >= 0
      ? orderedTabs.indexOf(appTabController.activeSubTab)
      : 0
  );

  const scrollX = useRef(
    new Animated.Value(-activeTabRef.current * screenWidthRef.current)
  ).current;

  useEffect(() => {
    const newWidth = SCREEN_WIDTH;
    screenWidthRef.current = newWidth;
    setScreenWidth(newWidth);
    scrollX.setValue(-activeTabRef.current * newWidth);
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
          (activeTabRef.current === 0 && isSwipeRight.current) ||
          (activeTabRef.current === orderedTabs.length - 1 &&
            !isSwipeRight.current)
        )
          return;
        scrollX.setValue(g.dx);
      },
      onPanResponderRelease: (_, g) => {
        scrollX.flattenOffset();
        const dx = g.dx;
        const swipeThreshold = screenWidthRef.current * 0.25;

        let newTab = activeTabRef.current;
        if (
          dx < swipeThreshold * -1 &&
          activeTabRef.current < orderedTabs.length - 1
        ) {
          newTab = activeTabRef.current + 1;
        } else if (dx > swipeThreshold && activeTabRef.current > 0) {
          newTab = activeTabRef.current - 1;
        }

        Animated.timing(scrollX, {
          toValue: -newTab * screenWidthRef.current,
          duration: 250,
          useNativeDriver: false,
        }).start(() => {
          activeTabRef.current = newTab;
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
      activeTabRef.current = index;
      appTabController.goToSub(orderedTabs[index]);
    });
  };

  useEffect(() => {
    if (appTabController.activeSubTab) {
      const newIndex = orderedTabs.indexOf(appTabController.activeSubTab);
      if (newIndex >= 0 && newIndex !== activeTabRef.current) {
        Animated.timing(scrollX, {
          toValue: -newIndex * screenWidthRef.current,
          duration: 250,
          useNativeDriver: false,
        }).start(() => {
          activeTabRef.current = newIndex;
        });
      }
    }
  }, [appTabController.activeSubTab]);

  useEffect(() => {
    const newIndex = orderedTabs.indexOf(appTabController.activeSubTab);
    if (newIndex >= 0) {
      activeTabRef.current = newIndex;
      scrollX.setValue(-newIndex * screenWidthRef.current);
    }
  }, [isRTL, orderedTabs]);

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    const panelHeight = isWebLandscape ? web(65) : mobile(81);

    return {
      panelHeight,
      iconSize: isWebLandscape ? web(24) : mobile(24),
      fontSize: isWebLandscape ? web(12) : mobile(12),
      underlineHeight: isWebLandscape ? web(2) : mobile(2),
      tabPaddingBottom: panelHeight * 0.1,
      titleHeight: panelHeight * 0.35,
      titlePaddingHorizontal: isWebLandscape ? web(4) : mobile(4),
      underlineBorderRadius: isWebLandscape ? web(2) : mobile(2),
    };
  }, [height, isWebLandscape]);

  return (
    <View style={{ flex: 1, userSelect: 'none' }}>
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
              </View>
              <View
                style={{
                  height: sizes.titleHeight,
                  justifyContent: 'center',
                  paddingHorizontal: sizes.titlePaddingHorizontal,
                }}
              >
                <Animated.Text
                  style={{
                    opacity: interpolatedOpacityValues[idx],
                    color: interpolatedColorValues[idx],
                    textAlign: 'center',
                    fontSize: sizes.fontSize,
                  }}
                  numberOfLines={2}
                  ellipsizeMode='tail'
                >
                  {t(`tabs.${title}`)}
                </Animated.Text>
              </View>
            </TouchableOpacity>
          );
        })}
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
              <Component />
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}
