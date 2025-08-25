import { useState } from 'react';
import { StyleSheet, TextInput, View, Image } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useComponentContext } from '../context/globalAppContext';
import { icons } from '../constants/icons';

export default function SearchPanel({ searchValue, setSearchValue }) {
  const { themeController } = useComponentContext();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.container,
        isFocused && styles.containerFocused,
        { backgroundColor: themeController.current?.formInputBackground },
        isFocused && { shadowColor: themeController.current?.formInputBorderColor},
      ]}
    >
      <TextInput
        placeholder="Search"
        value={searchValue}
        onChangeText={setSearchValue}
        style={[styles.searchInput, { color: themeController.current?.textColor }]}
        placeholderTextColor={themeController.current?.formInputPlaceholderColor}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <Image source={icons.search} style={[styles.icon]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RFValue(6),
    borderRadius: RFValue(6),
    marginBottom: RFValue(10),
  },
  containerFocused: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 4, // Для Android (имитация аутлайна через тень)
  },
  searchInput: {
    height: RFValue(35),
    flex: 1,
    paddingHorizontal: RFValue(8),
    paddingVertical: RFValue(5),
    outlineStyle: 'none',
  },
  icon: {
    marginLeft: RFValue(6),
    width: RFValue(20),
    height: RFValue(20),
  },
});
