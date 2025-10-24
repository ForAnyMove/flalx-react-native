import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { useComponentContext } from '../context/globalAppContext';
import { useWindowInfo } from '../context/windowContext';
import { icons } from '../constants/icons';
import { scaleByHeight } from '../utils/resizeFuncs';

// адаптивный размер
const getResponsiveSize = (mobileSize, webSize, isLandscape) => {
  if (Platform.OS === 'web') {
    return isLandscape ? webSize : RFValue(mobileSize);
  }
  return RFValue(mobileSize);
};

export default function Header({ switchToProfile }) {
  const { themeController, user, languageController } = useComponentContext();
  const { isLandscape, height } = useWindowInfo();
  const userAvatar = user.current?.avatar;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const isRTL = languageController.isRTL;
  const sizes = {
    headerHeight: isWebLandscape ? scaleByHeight(50, height) : RFPercentage(7),
    headerPaddingHorizontal: isWebLandscape
      ? scaleByHeight(31, height)
      : RFValue(3),
    headerMargin: isWebLandscape ? scaleByHeight(30, height) : RFValue(5),
  };
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeController.current?.backgroundColor,
          borderBottomColor: themeController.current?.profileDefaultBackground,
          height: sizes.headerHeight,
          paddingHorizontal: sizes.headerPaddingHorizontal,
          marginTop: sizes.headerMargin,
        },
        isRTL && { flexDirection: 'row-reverse' },
      ]}
    >
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
      <TouchableOpacity onPress={() => switchToProfile()}>
        <Image
          source={userAvatar ? { uri: userAvatar } : icons.defaultAvatarInverse}
          style={{
            width: getResponsiveSize(
              30,
              scaleByHeight(32, height),
              isLandscape
            ),
            height: getResponsiveSize(
              30,
              scaleByHeight(32, height),
              isLandscape
            ),
            borderRadius: getResponsiveSize(
              30,
              scaleByHeight(16, height),
              isLandscape
            ),
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
