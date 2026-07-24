import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { useMemo } from 'react';
import { useComponentContext } from '../context/globalAppContext';
import { useWebSocket } from '../context/webSocketContext';
import { icons } from '../constants/icons';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { useWindowInfo } from '../context/windowContext';
import CustomPicker from './ui/CustomPicker';
import { useTranslation } from 'react-i18next';

export default function Header({ switchToProfile }) {
  const { themeController, user, languageController } = useComponentContext();
  const { connected: wsConnected } = useWebSocket();
  const { width, height, isLandscape } = useWindowInfo();
  const userAvatar = user.current?.pending_avatar || user.current?.avatar;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const isRTL = languageController.isRTL;
  const { t } = useTranslation();

  const sizes = useMemo(() => {
    return {
      headerHeight: isWebLandscape ? scaleByHeight(50, height) : height * 0.07,
      headerPaddingHorizontal: isWebLandscape ? scaleByHeight(6, height) : scaleByHeightMobile(10, height),
      headerMarginHorizontal: isWebLandscape ? scaleByHeight(31, height) : 0,
      headerMargin: isWebLandscape ? scaleByHeight(30, height) : scaleByHeightMobile(0, height),
      borderBottomWidth: isWebLandscape ? scaleByHeight(2, height) : 1,
      logoFontSize: isWebLandscape ? scaleByHeight(24, height) : scaleByHeightMobile(24, height),
      avatarSize: isWebLandscape ? scaleByHeight(32, height) : scaleByHeightMobile(32, height),
      avatarBorderRadius: isWebLandscape ? scaleByHeight(16, height) : scaleByHeightMobile(16, height),
      wsIndicatorBorderWidth: isWebLandscape ? scaleByHeight(2, height) : scaleByHeightMobile(2, height),
    };
  }, [isWebLandscape, height]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeController.current?.backgroundColor,
          // borderBottomColor: themeController.current?.profileDefaultBackground,
          height: sizes.headerHeight,
          marginHorizontal: sizes.headerMarginHorizontal,
          paddingHorizontal: sizes.headerPaddingHorizontal,
          marginTop: sizes.headerMargin,
          // borderBottomWidth: sizes.borderBottomWidth,
        },
        isRTL && { flexDirection: 'row-reverse' },
      ]}
    >
      <CustomPicker
        options={[
          { label: t('settings.lang_en', 'English'), value: 'en' },
          { label: t('settings.lang_he', 'עברית'), value: 'he' },
        ]}
        selectedValue={languageController.current}
        onValueChange={(itemValue) => languageController.setLang(itemValue)}
        isRTL={isRTL}
        headerStyle={true}
        iconOnly={true}
      />
      <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
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
      <TouchableOpacity onPress={() => switchToProfile()}>
        <Image
          source={userAvatar ? { uri: userAvatar } : icons.defaultAvatarInverse}
          style={{
            width: sizes.avatarSize,
            height: sizes.avatarSize,
            borderRadius: sizes.avatarBorderRadius,
            // TEMP debug indicator (prod WS-drop investigation): green while
            // the websocket is connected, red once it's dropped. Remove once
            // the connection-stability issue is confirmed/resolved.
            borderWidth: sizes.wsIndicatorBorderWidth,
            borderColor: wsConnected
              ? themeController.current?.verifiedMarkerColor
              : themeController.current?.errorTextColor,
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
