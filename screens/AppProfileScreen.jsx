import {
  Text,
  Button,
  Touchable,
  TouchableOpacity,
  Image,
  StyleSheet,
  View,
  Platform,
} from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import { icons } from '../constants/icons';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import Profile from './mainScreens/profileTabs/Profile';
import Profession from './mainScreens/profileTabs/Profession';
import Settings from './mainScreens/profileTabs/Settings';
import { useWindowInfo } from '../context/windowContext';
import { scaleByHeight } from '../utils/resizeFuncs';

const getResponsiveSize = (mobileSize, webSize, isLandscape) => {
  if (Platform.OS === 'web') {
    return isLandscape ? webSize : RFValue(mobileSize);
  }
  return RFValue(mobileSize);
};

export default function AppProfileScreen({ switchToApp }) {
  const { session, profileTabController, themeController, languageController } =
    useComponentContext();
  const { isLandscape, height } = useWindowInfo();
  const isRTL = languageController?.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = {
    headerHeight: isWebLandscape ? scaleByHeight(50, height) : RFPercentage(7),
    headerPaddingHorizontal: isWebLandscape
      ? scaleByHeight(7, height)
      : RFValue(3),
    headerMarginHorizontal: isWebLandscape ? scaleByHeight(24, height) : RFValue(5),
    headerMargin: isWebLandscape ? scaleByHeight(30, height) : RFValue(5),
  };

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
            height: sizes.headerHeight,
            paddingHorizontal: sizes.headerPaddingHorizontal,
            marginHorizontal: sizes.headerMarginHorizontal,
            marginTop: sizes.headerMargin,
          },
          isRTL && { flexDirection: 'row-reverse' },
        ]}
      >
        {/* Back button to /store */}
        <TouchableOpacity onPress={() => switchToApp()} style={styles.backBtn}>
          <Image
            source={isRTL ? icons.forward : icons.back}
            style={{
              width: getResponsiveSize(
                30,
                scaleByHeight(24, height),
                isLandscape
              ),
              height: getResponsiveSize(
                30,
                scaleByHeight(24, height),
                isLandscape
              ),
              // margin: RFValue(10),
            }}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.logoText,
            {
              color: themeController.current?.primaryColor,
              fontSize: getResponsiveSize(
                18,
                scaleByHeight(24, height),
                isLandscape
              ),
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
    paddingHorizontal: RFValue(5),
    borderBottomWidth: 2,
    boxSizing: 'border-box',
  },
  logoText: {
    fontSize: RFValue(20),
    textTransform: 'uppercase',
    fontWeight: 'bold',
    color: '#0A62EA',
  },
  backBtn: {
    paddingHorizontal: RFValue(5),
  },
});
