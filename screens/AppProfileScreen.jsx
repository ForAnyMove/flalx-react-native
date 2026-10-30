import {
  Text,
  Button,
  TouchableOpacity,
  Image,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import { icons } from '../constants/icons';
import Profile from './mainScreens/profileTabs/Profile';
import Profession from './mainScreens/profileTabs/Profession';
import Settings from './mainScreens/profileTabs/Settings';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWindowInfo } from '../context/windowContext';
import { ACCESSIBILITY_HIT_SLOP } from '../constants/themes';

export default function AppProfileScreen({ switchToApp }) {
  const { t } = useTranslation();
  const { session, profileTabController, themeController, languageController } =
    useComponentContext();
  const { width, height, isLandscape } = useWindowInfo();
  const isRTL = languageController?.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      headerHeight: isWebLandscape ? web(50) : mobile(56),
      headerPaddingHorizontal: isWebLandscape ? web(7) : mobile(3),
      headerMarginHorizontal: isWebLandscape ? web(24) : mobile(5),
      headerMargin: isWebLandscape ? web(30) : mobile(5),
      iconSize: isWebLandscape ? web(24) : mobile(30),
      logoFontSize: isWebLandscape ? web(24) : mobile(18),
      backBtnPadding: mobile(5),
    };
  }, [isWebLandscape, height, width]);

  function renderScreen() {
    switch (profileTabController.active) {
      case 'profile':
        return <Profile />;
      case 'professions':
        return <Profession />;
      case 'settings':
        return <Settings />;
      default:
        <Button title='Выйти' onPress={() => session?.signOut()} />;
    }
  }
  return (
    <>
      <View
        style={[
          styles.profileHeader,
          {
            backgroundColor: themeController.current?.backgroundColor,
            borderBottomColor: themeController.current?.profileDefaultBackground,
            minHeight: sizes.headerHeight,
            paddingHorizontal: sizes.headerPaddingHorizontal,
            marginHorizontal: sizes.headerMarginHorizontal,
            marginTop: sizes.headerMargin,
          },
          isRTL && { flexDirection: 'row-reverse' },
        ]}
      >
        <TouchableOpacity
          onPress={() => switchToApp()}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('common.back', { defaultValue: 'Back' })}
          hitSlop={ACCESSIBILITY_HIT_SLOP}
          style={[styles.backBtn, { paddingHorizontal: sizes.backBtnPadding }]}
        >
          <Image
            source={isRTL ? icons.forward : icons.back}
            accessible={false}
            aria-hidden={true}
            style={{
              width: sizes.iconSize,
              height: sizes.iconSize,
              tintColor: themeController.current?.textColor,
            }}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.logoText,
            {
              color: themeController.current?.primaryColor,
              fontSize: sizes.logoFontSize,
            },
          ]}
        >
          Flalx
        </Text>
      </View>
      {renderScreen()}
    </>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    boxSizing: 'border-box',
  },
  logoText: {
    textTransform: 'uppercase',
    fontWeight: 'bold',
    color: '#0A62EA',
  },
  backBtn: {},
});
