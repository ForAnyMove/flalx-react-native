// AppScreen.jsx
import React, { useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import { useWindowInfo } from '../context/windowContext'; // 👈 добавили
import AppMainScreen from './AppMainScreen';
import AppProfileScreen from './AppProfileScreen';
import { RFValue } from 'react-native-responsive-fontsize';
import { icons } from '../constants/icons';

export default function AppScreen() {
  const {
    appTabController,
    profileTabController,
    themeController,
    languageController,
  } = useComponentContext();

  const { t } = useTranslation();
  const [screenName, setScreenName] = useState('app');
  const isRTL = languageController.isRTL;

  // ✅ Берём размеры и ориентацию из WindowProvider
  const { width, height, isLandscape } = useWindowInfo();

  const theme = themeController.current;
  const tabController =
    screenName === 'app' ? appTabController : profileTabController;

  // ширина боковой панели зависит от высоты
  const sidebarWidth =
    Platform.OS === 'web' && isLandscape
      ? Math.max(90, Math.min(280, height * 0.22))
      : 0;

  // размеры для боковой панели (web+landscape) зависят от высоты
  const iconSizeSide = Math.max(12, Math.min(30, height * 0.025));
  const fontSizeSide = Math.max(9, Math.min(30, height * 0.018));

  const renderTab = (tabName = 'profile', isSub = false) => {
    const icon = icons[tabName];
    if (!icon) return null;

    const isActive =
      tabController.active === tabName ||
      tabController.activeSubTab === tabName;

    const isSideMenu = Platform.OS === 'web' && isLandscape;
    const isSubActive = isSub && tabController.activeSubTab === tabName;

    return (
      <TouchableOpacity
        key={tabName}
        onPress={() =>
          isSub ? tabController.goToSub(tabName) : tabController.goTo(tabName)
        }
        style={[
          styles.tabContainer,
          isSub && styles.subTab,
          isSideMenu && {
            flexDirection: isRTL ? 'row-reverse' : 'row',
            justifyContent: 'center',
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 0,
            marginVertical: height*0.007,
          },
          // isSub &&
          //   (isRTL
          //     ? { paddingRight: RFValue(12) }
          //     : { paddingLeft: RFValue(12) }),
          isSubActive && {
            backgroundColor: theme.buttonColorPrimaryDefault + '22',
            borderRadius: RFValue(6),
          },
          { opacity: isActive || isSubActive ? 1 : 0.6 },
        ]}
      >
        <Image
          source={icon}
          style={
            isSideMenu
              ? {
                  width: iconSizeSide,
                  height: iconSizeSide,
                  resizeMode: 'contain',
                  marginHorizontal: 6,
                }
              : styles.icon
          }
        />
        <Text
          style={
            isSideMenu
              ? {
                  fontSize: fontSizeSide,
                  color: theme.tabBarTextColorActive,
                  flexShrink: 1,
                  textAlign: isRTL ? 'right' : 'left',
                }
              : [styles.tabTextBottom, { color: theme.tabBarTextColorActive }]
          }
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {t(`tabs.${tabName}`)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderNav = () => {
    if (Platform.OS === 'web' && isLandscape) {
      // боковая панель
      return (
        <View
          style={[
            styles.sidebar,
            { backgroundColor: theme.tabBarBackground, width: sidebarWidth },
            isRTL ? { right: 0 } : { left: 0 },
          ]}
        >
          {tabController.list.map((tab) => (
            <View key={tab}>
              {renderTab(tab)}
              {screenName === 'app' &&
                tabController.active === tab &&
                tabController.subList &&
                ['store', 'jobs'].includes(tab) &&
                tabController.subList.map((sub) => renderTab(sub, true))}
            </View>
          ))}
        </View>
      );
    }

    // нижняя панель (мобильная)
    return (
      <View
        style={[styles.bottomBar, { backgroundColor: theme.tabBarBackground }]}
      >
        {tabController.list.map((tab) => renderTab(tab))}
      </View>
    );
  };

  return (
    <View
      style={{
        flex: 1,
        flexDirection: !isLandscape ? 'column' : isRTL ? 'row' : 'row-reverse',
      }}
    >
      <View style={{ flex: 1 }}>
        {screenName === 'app' ? (
          <AppMainScreen
            sidebarWidth={sidebarWidth}
            switchToProfile={() => setScreenName('profile')}
          />
        ) : (
          <AppProfileScreen
            sidebarWidth={sidebarWidth}
            switchToApp={() => setScreenName('app')}
          />
        )}
      </View>
      {renderNav()}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: RFValue(10), // адаптив для мобилок
  },
  sidebar: {
    paddingVertical: RFValue(6),
    paddingHorizontal: RFValue(8),
    justifyContent: 'flex-start',
  },
  tabContainer: {
    alignItems: 'center',
    marginVertical: RFValue(6),
  },
  subTab: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // иконки
  icon: {
    width: RFValue(22),
    height: RFValue(22),
    resizeMode: 'contain',
  },
  // текст для нижней панели
  tabTextBottom: {
    fontSize: RFValue(12),
    marginTop: RFValue(3),
  },
});
