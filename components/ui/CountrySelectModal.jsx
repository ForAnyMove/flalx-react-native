import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';
import { getAllCountries, FlagType } from 'react-native-country-picker-modal';
import { useComponentContext } from '../../context/globalAppContext';
import { useWindowInfo } from '../../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { icons } from '../../constants/icons';
import CustomTextInput from './CustomTextInput';
import { flagSvgFor } from '../../src/phone/phoneUtils';

// The library's own <CountryPicker> renders an unstyled, full-page list with
// no height constraint on web — this replaces it with a small app-themed
// popup, reusing the library only as a country/calling-code data source
// (getAllCountries) — flags are vector SVGs from country-flag-icons (see
// flagSvgFor), not the library's Flag component and not Unicode emoji
// (Windows Chromium has no color flag-emoji font and falls back to showing
// literal two-letter codes). Same ~250-country list regardless of which
// PhoneField instance opens it, so cache per translation.
const countriesCache = {};
function loadCountries(translation) {
  if (!countriesCache[translation]) {
    countriesCache[translation] = getAllCountries(FlagType.EMOJI, translation);
  }
  return countriesCache[translation];
}

function countryName(item, translation) {
  if (typeof item.name === 'string') return item.name;
  return item.name?.[translation] || item.name?.common || '';
}

/**
 * @param {{ visible: boolean, onClose: () => void, onSelect: (country) => void, translation?: string }} props
 */
export default function CountrySelectModal({ visible, onClose, onSelect, translation = 'common' }) {
  const { t } = useTranslation();
  const { themeController, languageController } = useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;
  const { height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) return;
    setQuery('');
    let cancelled = false;
    setLoading(true);
    loadCountries(translation).then((list) => {
      if (cancelled) return;
      setCountries(list);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, translation]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((item) => {
      const name = countryName(item, translation).toLowerCase();
      return name.includes(q) || item.callingCode?.some((code) => code.includes(q));
    });
  }, [countries, query, translation]);

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;
    return {
      modalWidth: isWebLandscape ? scale(400) : '88%',
      modalHeight: isWebLandscape ? scale(520) : '75%',
      borderRadius: scale(12),
      headerPadding: scale(16),
      searchHeight: scale(44),
      rowPaddingVertical: scale(12),
      rowPaddingHorizontal: scale(16),
      fontSize: scale(16),
    };
  }, [height, isWebLandscape]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        },
        container: {
          width: sizes.modalWidth,
          height: sizes.modalHeight,
          maxHeight: '80%',
          backgroundColor: theme.backgroundColor,
          borderRadius: sizes.borderRadius,
          overflow: 'hidden',
        },
        header: {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          padding: sizes.headerPadding,
          borderBottomWidth: 1,
          borderBottomColor: theme.borderColor,
        },
        searchInput: {
          flex: 1,
          height: sizes.searchHeight,
          backgroundColor: theme.formInputBackground,
          borderRadius: sizes.borderRadius / 2,
          paddingHorizontal: 12,
          color: theme.formInputTextColor,
          fontSize: sizes.fontSize,
          textAlign: isRTL ? 'right' : 'left',
          marginRight: isRTL ? 0 : 8,
          marginLeft: isRTL ? 8 : 0,
          ...Platform.select({ web: { outlineStyle: 'none' } }),
        },
        closeButton: { padding: 4 },
        closeIcon: { width: 18, height: 18, tintColor: theme.textColor },
        row: {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          paddingVertical: sizes.rowPaddingVertical,
          paddingHorizontal: sizes.rowPaddingHorizontal,
          borderBottomWidth: 1,
          borderBottomColor: theme.borderColor,
        },
        flag: {
          width: 26,
          height: Math.round((26 * 2) / 3),
          borderRadius: 2,
          overflow: 'hidden',
        },
        rowText: {
          flex: 1,
          fontSize: sizes.fontSize,
          color: theme.textColor,
          marginHorizontal: 10,
          textAlign: isRTL ? 'right' : 'left',
          fontFamily: 'Rubik-Medium',
        },
        callingCode: {
          fontSize: sizes.fontSize,
          color: theme.unactiveTextColor,
        },
        emptyText: {
          textAlign: 'center',
          color: theme.unactiveTextColor,
          marginTop: 24,
          fontSize: sizes.fontSize,
        },
        loading: { marginTop: 24 },
      }),
    [sizes, isRTL, theme]
  );

  const renderItem = ({ item }) => {
    const xml = flagSvgFor(item.cca2);
    return (
      <TouchableOpacity style={styles.row} onPress={() => onSelect(item)}>
        {xml ? (
          <View style={styles.flag}>
            <SvgXml xml={xml} width='100%' height='100%' />
          </View>
        ) : (
          <View style={[styles.flag, { backgroundColor: theme.formInputBackground }]} />
        )}
        <Text style={styles.rowText} numberOfLines={1}>
          {countryName(item, translation)}
        </Text>
        <Text style={styles.callingCode}>+{item.callingCode?.[0]}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType='fade' onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <CustomTextInput
              style={styles.searchInput}
              placeholder={t('common.search')}
              placeholderTextColor={theme.formInputPlaceholderColor}
              value={query}
              onChangeText={setQuery}
              autoFocus
              autoCapitalize='none'
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Image source={icons.cross} style={styles.closeIcon} />
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator style={styles.loading} color={theme.primaryColor} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.cca2}
              renderItem={renderItem}
              keyboardShouldPersistTaps='handled'
              ListEmptyComponent={<Text style={styles.emptyText}>{t('common.no_results')}</Text>}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
