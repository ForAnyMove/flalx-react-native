import { useState } from 'react';
import { StyleSheet, TextInput, View, Image, Platform } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useComponentContext } from '../context/globalAppContext';
import { useWindowInfo } from '../context/windowContext';
import { icons } from '../constants/icons';
import { useTranslation } from 'react-i18next';

export default function SearchPanel({ searchValue, setSearchValue }) {
  const { themeController, languageController } = useComponentContext();
  const { height, isLandscape } = useWindowInfo();
  const { t } = useTranslation();
  const isRTL = languageController.isRTL;

  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const sizes = {
    padding: isWebLandscape ? height * 0.006 : RFValue(6),
    borderRadius: isWebLandscape ? height * 0.008 : RFValue(6),
    marginBottom: isWebLandscape ? height * 0.01 : RFValue(10),
    inputHeight: isWebLandscape ? height * 0.04 : RFValue(35),
    inputPadding: isWebLandscape ? height * 0.005 : RFValue(8),
    icon: isWebLandscape ? height * 0.025 : RFValue(20),
    fontSize: isWebLandscape ? height * 0.015 : RFValue(12),
    containerWidth: isWebLandscape ? '40%' : '100%',
  };

  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: themeController.current?.formInputBackground,
          paddingHorizontal: sizes.padding,
          borderRadius: sizes.borderRadius,
          marginBottom: sizes.marginBottom,
          flexDirection: isRTL ? 'row-reverse' : 'row',
          width: sizes.containerWidth,
        },
        isFocused && styles.containerFocused,
        isFocused && { shadowColor: themeController.current?.formInputBorderColor },
      ]}
    >
      <TextInput
        placeholder={t('common.search')}
        value={searchValue}
        onChangeText={setSearchValue}
        style={[
          styles.searchInput,
          {
            color: themeController.current?.textColor,
            height: sizes.inputHeight,
            paddingHorizontal: sizes.inputPadding,
            fontSize: sizes.fontSize,
            textAlign: isRTL ? 'right' : 'left',
          },
        ]}
        placeholderTextColor={themeController.current?.formInputPlaceholderColor}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <Image
        source={icons.search}
        style={{
          marginLeft: isRTL ? 0 : sizes.padding,
          marginRight: isRTL ? sizes.padding : 0,
          width: sizes.icon,
          height: sizes.icon,
        }}
      />
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
