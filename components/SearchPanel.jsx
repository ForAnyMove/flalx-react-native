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
        ? height * 0.006
        : scaleByHeightMobile(6, height),
      borderRadius: isWebLandscape
        ? height * 0.008
        : scaleByHeightMobile(6, height),
      marginBottom: isWebLandscape
        ? height * 0.01
        : scaleByHeightMobile(10, height),
      inputHeight: isWebLandscape
        ? height * 0.04
        : scaleByHeightMobile(35, height),
      inputPadding: isWebLandscape
        ? height * 0.005
        : scaleByHeightMobile(8, height),
      icon: isWebLandscape ? height * 0.025 : scaleByHeightMobile(20, height),
      fontSize: isWebLandscape
        ? height * 0.015
        : scaleByHeightMobile(12, height),
      containerWidth: isWebLandscape ? '40%' : '100%',
    }),
    [isWebLandscape, height]
  );

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          backgroundColor: themeController.current?.formInputBackground,
          paddingHorizontal: sizes.padding,
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
