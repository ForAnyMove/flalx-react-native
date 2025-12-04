import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useMemo } from 'react';
import { useComponentContext } from '../context/globalAppContext';
import { icons } from '../constants/icons';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';

export default function Header({ switchToProfile }) {
  const { themeController, user, languageController } = useComponentContext();
  const { width, height } = useWindowDimensions();
  const userAvatar = user.current?.avatar;
  const isWebLandscape = Platform.OS === 'web' && width > height;
  const isRTL = languageController.isRTL;

  const sizes = useMemo(() => {
    const scale = isWebLandscape ? scaleByHeight : scaleByHeightMobile;
    return {
      headerHeight: isWebLandscape ? scaleByHeight(50, height) : height * 0.07,
      headerPaddingHorizontal: scale(9, height),
      headerMarginHorizontal: scale(31, height),
      headerMargin: scale(30, height),
      borderBottomWidth: isWebLandscape ? scaleByHeight(2, height) : 1,
      logoFontSize: scale(24, height),
      avatarSize: scale(32, height),
      avatarBorderRadius: scale(16, height),
    };
  }, [isWebLandscape, height]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeController.current?.backgroundColor,
          borderBottomColor: themeController.current?.profileDefaultBackground,
          height: sizes.headerHeight,
          marginHorizontal: sizes.headerMarginHorizontal,
          paddingHorizontal: sizes.headerPaddingHorizontal,
          marginTop: sizes.headerMargin,
          borderBottomWidth: sizes.borderBottomWidth,
        },
        isRTL && { flexDirection: 'row-reverse' },
      ]}
    >
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
      <TouchableOpacity onPress={() => switchToProfile()}>
        <Image
          source={userAvatar ? { uri: userAvatar } : icons.defaultAvatarInverse}
          style={{
            width: sizes.avatarSize,
            height: sizes.avatarSize,
            borderRadius: sizes.avatarBorderRadius,
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
  },
  logoText: {
    textTransform: 'uppercase',
    fontWeight: 'bold',
    color: '#0A62EA',
  },
});
