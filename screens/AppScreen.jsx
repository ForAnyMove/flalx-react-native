// AppScreen.jsx
import React, { useMemo, useState } from 'react';
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
import AppMainScreen from './AppMainScreen';
import AppProfileScreen from './AppProfileScreen';
import { icons } from '../constants/icons';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { useWindowInfo } from '../context/windowContext';

export default function AppScreen() {
  const {
    user,
    appTabController,
    profileTabController,
    themeController,
    languageController,
  } = useComponentContext();

  const { t } = useTranslation();
  const [screenName, setScreenName] = useState('app');
  const isRTL = languageController.isRTL;

  const { width, height, isLandscape, effectiveSidebarWidth, setSidebarOverride } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const isClient = user?.current?.account_type === 'client';
  const theme = themeController.current;
  const tabController =
    screenName === 'app' ? appTabController : profileTabController;

  const filteredTabList = useMemo(() => {
    if (screenName === 'app' && isClient) {
      return tabController.list.filter(tab => tab === 'client');
    }
    if (screenName === 'profile' && isClient) {
      return tabController.list.filter(tab => tab !== 'professions');
    }
    return tabController.list;
  }, [tabController.list, screenName, isClient]);

  const shouldHideNav = screenName === 'app' && isClient && filteredTabList.length <= 1;

  React.useEffect(() => {
    if (shouldHideNav) {
      setSidebarOverride(0);
    } else {
      setSidebarOverride(null);
    }
  }, [shouldHideNav, setSidebarOverride]);

  React.useEffect(() => {
    if (screenName === 'profile' && isClient && profileTabController.active === 'professions') {
      profileTabController.goTo('profile');
    }
  }, [screenName, isClient, profileTabController.active]);

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      iconSize: isWebLandscape ? web(24) : mobile(22),
      fontSize: isWebLandscape ? web(12) : mobile(12),
      tabTitleGap: isWebLandscape ? web(12) : mobile(5),
      sideBarPaddingHorizontal: isWebLandscape ? web(18) : mobile(8),
      sideBarPaddingVertical: isWebLandscape ? web(30) : mobile(6),
      subTabPadding: isWebLandscape ? web(12) : 0,
      borderRadius: mobile(6),
      tabContainerMarginVertical: isWebLandscape ? web(6) : mobile(6),
      bottomBarPaddingVertical: mobile(10),
      textMarginTop: mobile(3),
    };
  }, [isWebLandscape, height]);

  const renderTab = (tabName = 'profile', isSub = false, tab = '') => {
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
          { marginVertical: sizes.tabContainerMarginVertical },
          isSub && styles.subTab,
          isSideMenu && {
            flexDirection: isRTL ? 'row-reverse' : 'row',
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 0,
            marginVertical: height * 0.007,
            gap: sizes.tabTitleGap,
          },
          isSub &&
          (isRTL
            ? { paddingRight: sizes.subTabPadding }
            : { paddingLeft: sizes.subTabPadding }),
          isSubActive && {
            backgroundColor: theme.buttonColorPrimaryDefault + '22',
            borderRadius: sizes.borderRadius,
          },
          { opacity: isActive || isSubActive ? 1 : 0.6 },
        ]}
      >
        <Image
          source={icon}
          style={
            isSideMenu
              ? {
                width: sizes.iconSize,
                height: sizes.iconSize,
                resizeMode: 'contain',
              }
              : [styles.icon, { width: sizes.iconSize, height: sizes.iconSize }]
          }
        />
        <Text
          style={
            isSideMenu
              ? {
                fontSize: sizes.fontSize,
                color: theme.tabBarTextColorActive,
                flexShrink: 1,
                textAlign: isRTL ? 'right' : 'left',
              }
              : [
                styles.tabTextBottom,
                {
                  color: theme.tabBarTextColorActive,
                  fontSize: sizes.fontSize,
                  marginTop: sizes.textMarginTop,
                },
              ]
          }
          numberOfLines={1}
          ellipsizeMode='tail'
        >
          {t(`tabs.${tab}${tabName}`)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderNav = () => {
    if (shouldHideNav) return null;

    if (Platform.OS === 'web' && isLandscape) {
      // боковая панель
      return (
        <View
          style={[
            styles.sidebar,
            {
              backgroundColor: theme.tabBarBackground,
              width: effectiveSidebarWidth,
              paddingHorizontal: sizes.sideBarPaddingHorizontal,
              paddingVertical: sizes.sideBarPaddingVertical,
            },
            isRTL ? { right: 0 } : { left: 0 },
          ]}
        >
          {filteredTabList.map((tab) => (
            <View key={tab}>
              {renderTab(tab)}
              {screenName === 'app' &&
                tabController.active === tab &&
                tabController.subList &&
                ['client', 'business'].includes(tab) &&
                tabController.subList.map((sub) =>
                  renderTab(sub, true, tab + '_')
                )}
            </View>
          ))}
        </View>
      );
    }

    // нижняя панель (мобильная)
    return (
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.tabBarBackground,
            flexDirection: isRTL ? 'row-reverse' : 'row',
            paddingVertical: sizes.bottomBarPaddingVertical,
          },
        ]}
      >
        {filteredTabList.map((tab) => renderTab(tab))}
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
      <View
        style={{ flex: 1, width: width, height: height, overflow: 'hidden' }}
      >
        {screenName === 'app' ? (
          <AppMainScreen
            sidebarWidth={effectiveSidebarWidth}
            switchToProfile={() => setScreenName('profile')}
          />
        ) : (
          <AppProfileScreen
            sidebarWidth={effectiveSidebarWidth}
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
  },
  sidebar: {
    justifyContent: 'flex-start',
  },
  tabContainer: {
    alignItems: 'center',
  },
  subTab: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    resizeMode: 'contain',
  },
  tabTextBottom: {},
});
