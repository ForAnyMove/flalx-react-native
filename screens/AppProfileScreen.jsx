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

const getResponsiveSize = (mobileSize, webSize, isLandscape) => {
  if (Platform.OS === 'web') {
    return isLandscape ? webSize*1.6 : RFValue(mobileSize);
  }
  return RFValue(mobileSize);
};

export default function AppProfileScreen({ switchToApp }) {
  const { session, profileTabController, themeController } =
    useComponentContext();
  const { isLandscape, height } = useWindowInfo();

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
            borderBottomColor: themeController.current?.formInputBackground,
            height: Platform.OS === 'web' && isLandscape ? height*0.07 : RFPercentage(7)
          },
        ]}
      >
        {/* Back button to /store */}
        <TouchableOpacity onPress={() => switchToApp()} style={styles.backBtn}>
          <Image
            source={icons.back}
            style={{
              width: getResponsiveSize(20, height*0.02, isLandscape),
              height: getResponsiveSize(20, height*0.02, isLandscape),
              margin: RFValue(10),
            }}
          />
        </TouchableOpacity>
        <Text style={[styles.logoText, { fontSize: getResponsiveSize(18, height*0.02, isLandscape) }]}>Flalx</Text>
      </View>
      {renderScreen()}
    </>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    width: '100%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: RFValue(5),
    borderBottomWidth: 1,
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
