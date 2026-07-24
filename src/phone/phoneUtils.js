import { Platform } from 'react-native';
import * as Localization from 'expo-localization';
import {
  AsYouType,
  parsePhoneNumberFromString,
  isValidPhoneNumber as libIsValidPhoneNumber,
  getCountryCallingCode,
} from 'libphonenumber-js/mobile';
import * as flagSvgs from 'country-flag-icons/string/3x2';

// `/mobile` metadata (not the default `/max` build) — smaller bundle, covers
// mobile numbers for every country, which is all this app ever collects.
// Real validation always goes through this library, never a hand-rolled
// regex — per-country phone rules are too varied to approximate correctly.

/**
 * @param {string} nationalNumber - digits as typed, no country code
 * @param {string} countryCode - ISO 3166-1 alpha-2, e.g. 'UA'
 * @returns {{ formatted: string, e164: string | undefined, isValid: boolean }}
 */
export function formatAsYouType(nationalNumber, countryCode) {
  const formatter = new AsYouType(countryCode);
  const formatted = formatter.input(nationalNumber || '');
  return {
    formatted,
    e164: formatter.getNumberValue(),
    isValid: formatter.isValid(),
  };
}

/**
 * @param {string} e164 - full phone string, e.g. '+380975504857'
 * @returns {{ countryCode: string | undefined, nationalNumber: string } | null}
 */
export function parsePhone(e164) {
  if (!e164) return null;
  const parsed = parsePhoneNumberFromString(e164);
  if (!parsed) return null;
  return { countryCode: parsed.country, nationalNumber: parsed.nationalNumber };
}

/**
 * Reformats any phone string into canonical E.164 (or returns null if it
 * doesn't parse) — for comparing an already-stored phone number (which may
 * have inconsistent formatting/spacing) against a PhoneField's output.
 */
export function normalizeE164(raw) {
  if (!raw) return null;
  const parsed = parsePhoneNumberFromString(raw);
  return parsed?.number ?? null;
}

/**
 * International display format, e.g. '+972 50-123-4567' — for read-only
 * phone number text anywhere in the UI (profile fields, provider/creator
 * summary cards). Falls back to the raw input if it doesn't parse, so a
 * malformed stored value still shows something instead of going blank.
 * @param {string} e164
 * @returns {string}
 */
export function formatPhoneDisplay(e164) {
  if (!e164) return '';
  const parsed = parsePhoneNumberFromString(e164);
  return parsed ? parsed.formatInternational() : e164;
}

export function isValidPhone(e164) {
  if (!e164) return false;
  return libIsValidPhoneNumber(e164);
}

export function callingCodeFor(countryCode) {
  try {
    return getCountryCallingCode(countryCode);
  } catch {
    return '';
  }
}

/**
 * Vector flag (SVG markup string, 3:2 aspect ratio) for an ISO 3166-1
 * alpha-2 code, from `country-flag-icons` (same author as libphonenumber-js;
 * zero runtime deps). Render with react-native-svg's `SvgXml` — works
 * identically on iOS/Android/web, unlike Unicode flag emoji, which many
 * browsers (Windows Chromium in particular) don't have a color font for and
 * fall back to showing the raw two-letter code instead of a flag.
 * @param {string} countryCode
 * @returns {string | null}
 */
export function flagSvgFor(countryCode) {
  if (!countryCode) return null;
  return flagSvgs[countryCode.toUpperCase()] || null;
}

/**
 * Best-effort device region (not IP-based) — used as a fallback when the
 * IP-based lookup (src/geo/geoApi.js) hasn't resolved yet or fails outright.
 * @returns {string | null} ISO 3166-1 alpha-2, e.g. 'US'
 */
export function getDeviceRegionFallback() {
  if (Platform.OS === 'web') {
    const lang = typeof navigator !== 'undefined' ? navigator.language : null;
    const region = lang?.split('-')[1];
    return region ? region.toUpperCase() : null;
  }
  const locales = Localization.getLocales();
  return locales?.[0]?.regionCode || null;
}
