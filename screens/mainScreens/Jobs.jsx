import {
  Animated,
  Dimensions,
  I18nManager,
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
import NewJobModal from '../../components/NewJobModal';
import NewScreen from './storeTabs/New';
import WaitingScreen from './storeTabs/Waiting';
import InProgressScreen from './storeTabs/InProgress';
import DoneScreen from './storeTabs/Done';

const SCREEN_WIDTH =
  Dimensions.get('window').width *
  (Platform.OS === 'web' &&
  Dimensions.get('window').height < Dimensions.get('window').width
    ? 0.8
    : 1);

const TAB_TITLES = ['new', 'waiting', 'in-progress', 'done'];

// Тестовые значения для badge
const badgeCounts = {
  new: 0,
  waiting: 3,
  'in-progress': 0,
  done: 5,
};

export default function Jobs() {
  const { themeController, appTabController } = useComponentContext();
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const screenWidthRef = useRef(SCREEN_WIDTH);
  const [screenWidth, setScreenWidth] = useState(SCREEN_WIDTH);
  const [newJobModalVisible, setNewJobModalVisible] = useState(false);

  const storeActiveTab = useRef(
    TAB_TITLES.indexOf(appTabController.activeSubTab) >= 0
      ? TAB_TITLES.indexOf(appTabController.activeSubTab)
      : 0
  );

  useEffect(() => {
    const onChange = ({ window }) => {
      const isLandscape = window.width > window.height;
      const landscapeMul = Platform.OS === 'web' && isLandscape ? 0.8 : 1;
      screenWidthRef.current = window.width * landscapeMul;
      setScreenWidth(window.width * landscapeMul);
    };

    const subscription = Dimensions.addEventListener('change', onChange);

    // Очистка при размонтировании
    return () => {
      if (subscription?.remove) {
        subscription.remove();
      } else {
        // Для старых версий React Native
        Dimensions.removeEventListener('change', onChange);
      }
    };
  }, []);

  const scrollX = useRef(
    new Animated.Value(-storeActiveTab.current * screenWidthRef.current)
  ).current;

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
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),

      onPanResponderGrant: () => {
        scrollX.setOffset(scrollX.__getValue());
        scrollX.setValue(0);
        isSwipeRight.current = null;
      },

      onPanResponderMove: (_, gestureState) => {
        if (isSwipeRight.current === null) {
          isSwipeRight.current = gestureState.dx > 0; // свайп вправо — true, влево — false
        }
        if (
          (storeActiveTab.current === 0 && isSwipeRight.current) ||
          (storeActiveTab.current === TAB_TITLES.length - 1 &&
            !isSwipeRight.current)
        )
          return;
        scrollX.setValue(gestureState.dx);
      },

      onPanResponderRelease: (_, gestureState) => {
        scrollX.flattenOffset();
        const dx = gestureState.dx;
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

  return (
    <View style={{ flex: 1, userSelect: 'none' }}>
      {/* Заголовки вкладок */}
      <View
        style={{
          flexDirection: 'row',
          height: RFPercentage(10),
          backgroundColor: themeController.current?.backgroundColor,
          overflow: 'hidden',
        }}
      >
        {TAB_TITLES.map((title, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleTabPress(idx)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingBottom: RFValue(3),
            }}
          >
            {/* Иконка */}
            <View style={{ position: 'relative' }}>
              <Animated.View
                style={{ opacity: interpolatedOpacityValues[idx] }}
              >
                <Image
                  source={icons[`${title}-dark`]}
                  style={{
                    width: RFValue(20),
                    height: RFValue(20),
                  }}
                  resizeMode='contain'
                />
              </Animated.View>
              {/* Badge если count > 0 */}
              {badgeCounts[title] > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: -RFValue(4),
                    right: -RFValue(10),
                    minWidth: RFValue(12),
                    height: RFValue(12),
                    borderRadius: RFValue(8),
                    backgroundColor:
                      themeController.current?.mainBadgeBackground,
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: RFValue(3),
                  }}
                >
                  <Text
                    style={{
                      color: themeController.current?.badgeTextColor,
                      fontSize: RFValue(8),
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
                height: RFPercentage(5), // Высота для 2 строк
                justifyContent: 'center', // Центровка по вертикали
                paddingHorizontal: RFValue(4), // Чуть больше пространства по бокам
              }}
            >
              <Animated.Text
                style={{
                  color: interpolatedColorValues[idx],
                  fontWeight: 'bold',
                  textAlign: 'center', // Центровка по горизонтали
                }}
                numberOfLines={2}
                ellipsizeMode='tail'
              >
                {t(`tabs.${title}`)}
              </Animated.Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Анимированное подчёркивание */}
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 0,
            left: underlineTranslateX,
            width: underlineAnimatedWidth,
            height: RFValue(2),
            backgroundColor: themeController.current?.primaryColor,
            borderRadius: RFValue(2),
            zIndex: 2,
          }}
        />
        {/* Внутренняя псевдо-тень */}
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: RFValue(2),
            backgroundColor: themeController.current?.formInputBackground,
            zIndex: 1,
          }}
        />
      </View>

      {/* Контент с анимацией и свайпом */}
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <Animated.View
          style={{
            flexDirection: 'row',
            width: screenWidthRef.current * TAB_TITLES.length,
            flex: 1,
            transform: [{ translateX: scrollX }],
          }}
        >
          {[
            InProgressScreen,
            InProgressScreen,
            InProgressScreen,
            InProgressScreen,
          ].map((Component, index) => (
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
      <Modal visible={newJobModalVisible} animationType='slide'>
        <NewJobModal closeModal={() => setNewJobModalVisible(false)} />
      </Modal>
    </View>
  );
}
