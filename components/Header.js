import { Image, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { useComponentContext } from '../context/globalAppContext';
import { useWindowInfo } from '../context/windowContext';
import { icons } from '../constants/icons';

// адаптивный размер
const getResponsiveSize = (mobileSize, webSize, isLandscape) => {
  if (Platform.OS === 'web') {
    return isLandscape ? webSize*1.6 : RFValue(mobileSize);
  }
  return RFValue(mobileSize);
};

export default function Header({ switchToProfile }) {
  const { themeController, user } = useComponentContext();
  const { isLandscape, height } = useWindowInfo();
  const userAvatar = user.current?.avatar;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeController.current?.backgroundColor, height: Platform.OS === 'web' && isLandscape ? height*0.07 : RFPercentage(7)},
      ]}
    >
      <Text
        style={[
          styles.logoText,
          { fontSize: getResponsiveSize(18, height*0.02, isLandscape) },
        ]}
      >
        Flalx
      </Text>
      <TouchableOpacity onPress={() => switchToProfile()}>
          <Image
            source={userAvatar ? { uri: userAvatar } : icons.defaultAvatarInverse }
            style={{
              width: getResponsiveSize(30, height*0.03, isLandscape),
              height: getResponsiveSize(30, height*0.03, isLandscape),
              borderRadius: getResponsiveSize(30, height*0.03, isLandscape),
            }}
          />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RFValue(12),
  },
  logoText: {
    textTransform: 'uppercase',
    fontWeight: 'bold',
    color: '#0A62EA',
  },
});
