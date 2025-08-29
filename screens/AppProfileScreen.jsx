import {
  Text,
  Button,
  Touchable,
  TouchableOpacity,
  Image,
  StyleSheet,
  View,
} from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import { icons } from '../constants/icons';
import { RFValue } from 'react-native-responsive-fontsize';
import Profile from './mainScreens/profileTabs/Profile';
import Profession from './mainScreens/profileTabs/Profession';
import Settings from './mainScreens/profileTabs/Settings';

export default function AppProfileScreen({ switchToApp }) {
  const { session, profileTabController, themeController } =
    useComponentContext();
console.log(profileTabController.active);

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
          },
        ]}
      >
        {/* Back button to /store */}
        <TouchableOpacity onPress={() => switchToApp()} style={styles.backBtn}>
          <Image
            source={icons.back}
            style={{
              width: RFValue(24),
              height: RFValue(24),
              margin: RFValue(10),
            }}
          />
        </TouchableOpacity>
        <Text style={styles.logoText}>Flalx</Text>
      </View>
      {renderScreen()}
    </>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    width: '100%',
    height: '8%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: RFValue(5),
    borderBottomWidth: 1,
  },
  logoText: {
    fontSize: RFValue(22),
    textTransform: 'uppercase',
    fontWeight: 'bold',
    color: '#0A62EA',
  },
  backBtn: {
    paddingHorizontal: RFValue(5),
  },
});
