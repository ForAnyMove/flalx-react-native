import { useMemo, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import { icons } from '../constants/icons';
import { useTranslation } from 'react-i18next';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';

export default function SearchPanel({ searchValue, setSearchValue }) {
  const { themeController, languageController } = useComponentContext();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = useMemo(
    () => ({
      padding: isWebLandscape
        ? scaleByHeight(12, height)
        : scaleByHeightMobile(20, height),
      borderRadius: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(8, height),
      marginBottom: isWebLandscape
        ? scaleByHeight(16, height)
        : scaleByHeightMobile(16, height),
      inputHeight: isWebLandscape
        ? scaleByHeight(48, height)
        : scaleByHeightMobile(48, height),
      inputPadding: isWebLandscape
        ? scaleByHeight(16, height)
        : scaleByHeightMobile(16, height),
      icon: isWebLandscape ? scaleByHeight(24, height) : scaleByHeightMobile(24, height),
      fontSize: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(14, height),
      containerWidth: isWebLandscape ? scaleByHeight(384, height) : '100%',
    }),
    [isWebLandscape, height]
  );

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: themeController.current?.profileDefaultBackground,
          [isRTL ? 'paddingLeft' : 'paddingRight']: sizes.padding,
          borderRadius: sizes.borderRadius,
          marginBottom: sizes.marginBottom,
          flexDirection: isRTL ? 'row-reverse' : 'row',
          width: sizes.containerWidth,
        },
        searchInput: {
          color: themeController.current?.textColor,
          height: sizes.inputHeight,
          paddingHorizontal: sizes.inputPadding,
          fontSize: sizes.fontSize,
          textAlign: isRTL ? 'right' : 'left',
        },
        searchIcon: {
          marginLeft: isRTL ? 0 : sizes.padding,
          marginRight: isRTL ? sizes.padding : 0,
          width: sizes.icon,
          height: sizes.icon,
        },
      }),
    [sizes, themeController, isRTL]
  );

  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        dynamicStyles.container,
        isFocused && styles.containerFocused,
        isFocused && {
          shadowColor: themeController.current?.formInputBorderColor,
        },
      ]}
    >
      <TextInput
        placeholder={t('common.search')}
        value={searchValue}
        onChangeText={setSearchValue}
        style={[styles.searchInput, dynamicStyles.searchInput]}
        placeholderTextColor={
          themeController.current?.formInputPlaceholderColor
        }
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <Image source={icons.search} style={dynamicStyles.searchIcon} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  containerFocused: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    outlineStyle: 'none',
  },
});
