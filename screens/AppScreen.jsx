import {
  Text,
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Dimensions,
  I18nManager,
} from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AppMainScreen from './AppMainScreen';
import AppProfileScreen from './AppProfileScreen';
import { RFValue } from 'react-native-responsive-fontsize';
import { icons } from '../constants/icons';

function useOrientation() {
  const [orientation, setOrientation] = useState(getOrientation());

  function getOrientation() {
    const { width, height } = Dimensions.get('window');
    return width > height ? 'landscape' : 'portrait';
  }

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setOrientation(getOrientation());
    });

    return () => subscription?.remove();
  }, []);

  return orientation;
}

export default function AppScreen() {
  const { appTabController, profileTabController, themeController } =
    useComponentContext();
  const [screenName, setScreenName] = useState('app');
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const { width, height } = Dimensions.get('window');
  const isLandscape = width > height;
  const orientation = useOrientation();

  const tabController =
    screenName === 'app' ? appTabController : profileTabController;
  const theme = themeController.current;

  const renderTab = (tabName = 'profile', isSub = false) => {
    const icon = icons[tabName];
    if (!icon) return null;

    const isActive =
      tabController.active === tabName ||
      tabController.activeSubTab === tabName;
    return (
      <TouchableOpacity
        key={tabName}
        style={[
          styles.tabContainer,
          isSub && styles.subTab,
          { opacity: isActive ? 1 : 0.5 },
        ]}
        onPress={() => {
          isSub ? tabController.goToSub(tabName) : tabController.goTo(tabName);
        }}
      >
        <Image source={icon} style={styles.icon} />
        {isLandscape && Platform.OS === 'web' ? (
          <Text
            style={[styles.tabText, { color: theme.tabBarTextColorActive }]}
          >
            {t(`tabs.${tabName}`)}
          </Text>
        ) : (
          <Text
            style={[
              styles.tabTextBottom,
              { color: theme.tabBarTextColorActive },
            ]}
          >
            {t(`tabs.${tabName}`)}
          </Text>
        )}
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
            { backgroundColor: theme.tabBarBackground },
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

    // нижняя панель
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
      {/* Контент */}
      <View style={{ flex: 1 }}>
        {screenName === 'app' ? (
          <AppMainScreen switchToProfile={() => setScreenName('profile')} />
        ) : (
          <AppProfileScreen switchToApp={() => setScreenName('app')} />
        )}
      </View>

      {/* Панель навигации */}
      {renderNav()}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: RFValue(10),
  },
  sidebar: {
    // position: 'absolute',
    width: '20%',
    paddingVertical: RFValue(20),
    paddingHorizontal: RFValue(10),
    justifyContent: 'flex-start',
  },
  tabContainer: {
    alignItems: 'center',
    marginVertical: RFValue(8),
  },
  subTab: {
    marginLeft: RFValue(20),
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    width: RFValue(24),
    height: RFValue(24),
    resizeMode: 'contain',
  },
  tabText: {
    fontSize: RFValue(14),
    marginLeft: RFValue(8),
  },
  tabTextBottom: {
    fontSize: RFValue(12),
    marginTop: RFValue(4),
  },
});
