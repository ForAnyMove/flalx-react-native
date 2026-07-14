import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logError } from '../../utils/log_util';

// Once a user manually picks a region in any PhoneField, that choice should
// win over the IP-based default (src/geo/geoApi.js) everywhere, from then
// on — this persists it. Same web/native storage split as
// managers/themeManager.js / languageManager.js.
const STORAGE_KEY = 'app_phone_region';

export async function getPreferredRegion() {
  try {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    }
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch (e) {
    logError('getPreferredRegion error:', e);
    return null;
  }
}

export async function setPreferredRegion(countryCode) {
  if (!countryCode) return;
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, countryCode);
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEY, countryCode);
  } catch (e) {
    logError('setPreferredRegion error:', e);
  }
}
