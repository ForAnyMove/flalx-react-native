import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { View, Text, TouchableOpacity, Image, Platform, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useComponentContext } from '../../context/globalAppContext';
import { icons } from '../../constants/icons';
import CustomTextInput from './CustomTextInput';
import CountrySelectModal from './CountrySelectModal';
import {
  formatAsYouType,
  parsePhone,
  callingCodeFor,
  getDeviceRegionFallback,
  flagSvgFor,
} from '../../src/phone/phoneUtils';
import { getMyCountryCached } from '../../src/geo/geoApi';
import { getPreferredRegion, setPreferredRegion } from '../../src/phone/phoneRegionPreference';

// Last-resort default when IP lookup and device locale both fail/are
// unavailable — business context (ILS currency elsewhere in the app).
const FALLBACK_COUNTRY = 'IL';

/**
 * Region picker + national number field, in one row. Real validation and
 * E.164 formatting come from libphonenumber-js (src/phone/phoneUtils.js) —
 * never a hand-rolled regex. Default region priority: an existing `value`
 * to parse or an explicit `initialCountry` prop (editing a known phone) >
 * the user's own previously hand-picked region, if any (persisted via
 * src/phone/phoneRegionPreference.js — once someone manually picks a
 * region here, it wins over IP detection everywhere, from then on) > IP
 * lookup (src/geo/geoApi.js) > device locale > FALLBACK_COUNTRY.
 *
 * Drop-in replacement for a labeled phone TextInput block: pass the same
 * `containerStyle`/`labelStyle`/`inputStyle` objects the screen already
 * computes for its other fields (email/password) to stay visually
 * consistent — this component doesn't do its own scaling/theming math.
 *
 * @param {{
 *   value: string,                        // controlled E.164 string, '' when empty
 *   onChangeValue: (e164: string) => void,
 *   onValidityChange?: (isValid: boolean) => void,
 *   label?: string,
 *   placeholder?: string,
 *   containerStyle?: object,
 *   labelStyle?: object,
 *   inputStyle?: object,
 *   autoFocus?: boolean,
 *   disabled?: boolean,
 *   initialCountry?: string,               // ISO 3166-1 alpha-2, skips geo lookup
 *   onSubmitEditing?: () => void,
 *   returnKeyType?: string,
 * }} props
 */
const PhoneField = forwardRef(function PhoneField(
  {
    value,
    onChangeValue,
    onValidityChange,
    label,
    placeholder,
    containerStyle,
    labelStyle,
    inputStyle,
    autoFocus = false,
    disabled = false,
    initialCountry,
    onSubmitEditing,
    returnKeyType = 'done',
  },
  ref
) {
  const { themeController, languageController } = useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  // Only consulted once, at mount — afterwards countryCode/rawNumber are the
  // source of truth, resynced from `value` via the effect below.
  const parsedInitialRef = useRef(undefined);
  if (parsedInitialRef.current === undefined) {
    parsedInitialRef.current = parsePhone(value) || null;
  }
  const parsedInitial = parsedInitialRef.current;

  const [countryCode, setCountryCode] = useState(
    parsedInitial?.countryCode || initialCountry || 'US'
  );
  const [rawNumber, setRawNumber] = useState(parsedInitial?.nationalNumber || '');
  const [pickerVisible, setPickerVisible] = useState(false);

  const inputRef = useRef(null);
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  // Resolve a default region only when nothing already told us one (no
  // existing value to parse, no explicit initialCountry prop). Never blocks
  // typing — the field is usable immediately with the 'US' placeholder
  // default above while this resolves in the background. A remembered
  // manual pick (see setPreferredRegion below) always wins over IP/locale
  // detection — skip the geo lookup entirely once one exists.
  useEffect(() => {
    if (parsedInitial || initialCountry) return;
    let cancelled = false;
    (async () => {
      const preferred = await getPreferredRegion();
      if (cancelled) return;
      if (preferred) {
        setCountryCode((prev) => (rawNumber ? prev : preferred));
        return;
      }
      const geo = await getMyCountryCached();
      if (cancelled) return;
      const resolved = geo?.iso2 || getDeviceRegionFallback() || FALLBACK_COUNTRY;
      // Don't clobber a country the user already picked/typed against while this was resolving.
      setCountryCode((prev) => (rawNumber ? prev : resolved));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { formatted, e164, isValid } = useMemo(
    () => formatAsYouType(rawNumber, countryCode),
    [rawNumber, countryCode]
  );

  // Report changes upward — E.164 is '' while the field is empty (not an
  // invalid-but-truthy string), so callers can tell "empty" from "typing".
  const lastEmittedRef = useRef(undefined);
  useEffect(() => {
    const next = rawNumber ? (e164 || '') : '';
    if (lastEmittedRef.current === next) return;
    lastEmittedRef.current = next;
    onChangeValue?.(next);
    onValidityChange?.(!!rawNumber && isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e164, isValid, rawNumber]);

  // Resync from external resets (e.g. parent clears the form after submit).
  useEffect(() => {
    if (value === lastEmittedRef.current) return;
    if (!value) {
      setRawNumber('');
      return;
    }
    const parsed = parsePhone(value);
    if (parsed) {
      if (parsed.countryCode) setCountryCode(parsed.countryCode);
      setRawNumber(parsed.nationalNumber);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const callingCode = callingCodeFor(countryCode);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
        },
        pickerButton: {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          marginRight: isRTL ? 0 : 8,
          marginLeft: isRTL ? 8 : 0,
        },
        flag: {
          width: 22,
          height: Math.round((22 * 2) / 3),
          borderRadius: 2,
          overflow: 'hidden',
        },
        callingCodeText: {
          marginHorizontal: 4,
        },
        chevron: {
          width: 10,
          height: 10,
          tintColor: theme.formInputLabelColor,
        },
        divider: {
          width: 1,
          height: '60%',
          backgroundColor: theme.borderColor,
          marginRight: isRTL ? 0 : 8,
          marginLeft: isRTL ? 8 : 0,
        },
        input: {
          flex: 1,
        },
      }),
    [isRTL, theme]
  );

  const translation = languageController.current === 'he' ? 'isr' : 'common';

  return (
    <View style={containerStyle}>
      {!!label && <Text style={labelStyle}>{label}</Text>}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.pickerButton}
          onPress={() => !disabled && setPickerVisible(true)}
          disabled={disabled}
        >
          {flagSvgFor(countryCode) ? (
            <View style={styles.flag}>
              <SvgXml xml={flagSvgFor(countryCode)} width='100%' height='100%' />
            </View>
          ) : (
            <View style={[styles.flag, { backgroundColor: theme.formInputBackground }]} />
          )}
          <Text style={[inputStyle, styles.callingCodeText]}>
            {callingCode ? `+${callingCode}` : ''}
          </Text>
          <Image source={icons.arrowDown} style={styles.chevron} resizeMode='contain' />
        </TouchableOpacity>

        <View style={styles.divider} />

        <CustomTextInput
          ref={inputRef}
          style={[inputStyle, styles.input]}
          placeholder={placeholder}
          placeholderTextColor={theme.formInputPlaceholderColor}
          keyboardType='phone-pad'
          autoCapitalize='none'
          autoCorrect={false}
          autoFocus={autoFocus}
          editable={!disabled}
          value={formatted}
          onChangeText={(text) => setRawNumber(text.replace(/[^\d]/g, ''))}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
        />
      </View>

      <CountrySelectModal
        visible={pickerVisible}
        translation={translation}
        onSelect={(country) => {
          setCountryCode(country.cca2);
          setPickerVisible(false);
          inputRef.current?.focus();
          // Explicit manual pick — remember it so it wins over IP/locale
          // detection everywhere from now on (see the effect above).
          setPreferredRegion(country.cca2);
        }}
        onClose={() => setPickerVisible(false)}
      />
    </View>
  );
});

export default PhoneField;
