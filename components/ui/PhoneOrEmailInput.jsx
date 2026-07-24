import React, { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../../context/globalAppContext';
import CustomTextInput from './CustomTextInput';
import PhoneField from './PhoneField';

const TAB_HEIGHT = 36;

/**
 * A "Phone" / "Email" tab pair attached on top of a normal input field — the
 * input is the base and keeps its usual look (all 4 corners rounded, same
 * as every other field in the app); the tabs are a narrower (92%),
 * horizontally centered strip above it, rounded only on their own outer top
 * corner (the pair's top-left and top-right), square on the bottom.
 * Switching tabs swaps which field renders: PhoneField (region picker +
 * number, real E.164/validation via libphonenumber-js) for 'phone', a plain
 * email CustomTextInput for 'email'.
 *
 * Fully controlled, same drop-in-replacement style as PhoneField — pass the
 * same `containerStyle`/`inputStyle` object the screen already computes for
 * its other fields (email/password) to stay visually consistent. No label
 * line is rendered (the active tab already says what the field is) — the
 * field box centers its content vertically instead of using the inherited
 * `paddingTop` (which assumes a label sits above the content).
 *
 * @param {{
 *   mode: 'phone' | 'email',
 *   onModeChange: (mode: 'phone' | 'email') => void,
 *   phoneValue: string,                        // controlled E.164 string
 *   onPhoneChange: (e164: string) => void,
 *   onPhoneValidityChange?: (isValid: boolean) => void,
 *   emailValue: string,
 *   onEmailChange: (text: string) => void,
 *   containerStyle?: object,                   // same shape as PhoneField's containerStyle
 *   inputStyle?: object,
 *   disabled?: boolean,
 *   autoFocus?: boolean,
 *   onSubmitEditing?: () => void,
 *   returnKeyType?: string,
 * }} props
 */
const PhoneOrEmailInput = forwardRef(function PhoneOrEmailInput(
  {
    mode,
    onModeChange,
    phoneValue,
    onPhoneChange,
    onPhoneValidityChange,
    emailValue,
    onEmailChange,
    containerStyle,
    inputStyle,
    disabled = false,
    autoFocus = false,
    onSubmitEditing,
    returnKeyType = 'done',
  },
  ref
) {
  const { t } = useTranslation();
  const { themeController, languageController } = useComponentContext();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;

  const fieldRef = useRef(null);
  useImperativeHandle(ref, () => ({
    focus: () => fieldRef.current?.focus(),
  }));

  // Refocus whenever the active mode changes (including the very first
  // mount, if autoFocus) — the underlying input swaps identity (PhoneField
  // <-> CustomTextInput), so the DOM/native node is fresh each time.
  useEffect(() => {
    if (!autoFocus) return;
    const timer = setTimeout(() => fieldRef.current?.focus(), 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const { marginBottom, width, borderRadius = 8, ...restContainerStyle } = containerStyle || {};

  const addAlpha = (hex, opacity) => {
    // Переводим 0-1 в шестнадцатеричную систему
    const alpha = Math.round(opacity * 255).toString(16).toUpperCase().padStart(2, '0');
    return `${hex}${alpha}`;
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: { width: width ?? '100%', marginBottom: marginBottom ?? 0 },
        tabsRow: {
          flexDirection: isRTL ? 'row-reverse' : 'row',
          // Explicit, fixed height — tabs are their own small strip, not a
          // reference frame for the (much taller) input below. Without this,
          // the row's height is ambiguous on web and the tab text ends up
          // centering against the wrong box.
          height: TAB_HEIGHT,
          // Narrower than the input and centered above it — tabs are a
          // decoration attached on top, not a full-width part of the field.
          width: '100%',
          alignSelf: 'center',
          marginBottom: 4,
          gap: 5,
        },
        tab: {
          flex: 1,
          height: TAB_HEIGHT,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: borderRadius,
        },
        tabActive: { backgroundColor: theme.formInputBackground },
        tabInactive: { backgroundColor: addAlpha(theme.formInputBackground, 0.4) },
        tabTextActive: {
          color: theme.primaryColor,
          fontFamily: 'Rubik-SemiBold',
        },
        tabTextInactive: {
          color: theme.unactiveTextColor,
          fontFamily: 'Rubik-Medium',
        },
        // A completely normal field box — all 4 corners rounded, like any
        // other input in the app. `restContainerStyle` was built assuming a
        // label sits above the content (paddingTop reserves space for it);
        // this component never renders that label (the tabs replace it), so
        // paddingTop is dropped and content is centered vertically instead
        // — otherwise the phone/email text sits high, offset by the
        // label's leftover reserved space, not centered in its own box.
        fieldBox: {
          ...restContainerStyle,
          borderRadius,
          paddingTop: 0,
          justifyContent: 'center',
          width: '100%',
        },
      }),
    // restContainerStyle is a fresh object every render (spread from the
    // containerStyle prop) — depend on containerStyle itself instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [width, marginBottom, isRTL, theme, containerStyle]
  );

  // const firstTabCorner = isRTL
  //   ? { borderTopRightRadius: borderRadius }
  //   : { borderTopLeftRadius: borderRadius };
  // const secondTabCorner = isRTL
  //   ? { borderTopLeftRadius: borderRadius }
  //   : { borderTopRightRadius: borderRadius };

  return (
    <View style={styles.wrapper}>
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, mode === 'phone' ? styles.tabActive : styles.tabInactive]}
          onPress={() => !disabled && onModeChange('phone')}
          disabled={disabled}
        >
          <Text style={mode === 'phone' ? styles.tabTextActive : styles.tabTextInactive}>
            {t('auth.tab_phone')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, mode === 'email' ? styles.tabActive : styles.tabInactive]}
          onPress={() => !disabled && onModeChange('email')}
          disabled={disabled}
        >
          <Text style={mode === 'email' ? styles.tabTextActive : styles.tabTextInactive}>
            {t('auth.tab_email')}
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'phone' ? (
        <PhoneField
          ref={fieldRef}
          value={phoneValue}
          onChangeValue={onPhoneChange}
          onValidityChange={onPhoneValidityChange}
          placeholder='50 123 4567'
          containerStyle={styles.fieldBox}
          inputStyle={inputStyle}
          disabled={disabled}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
        />
      ) : (
        <View style={styles.fieldBox}>
          <CustomTextInput
            ref={fieldRef}
            style={inputStyle}
            placeholder='name@example.com'
            placeholderTextColor={theme.formInputPlaceholderColor}
            keyboardType='email-address'
            autoCapitalize='none'
            autoCorrect={false}
            editable={!disabled}
            value={emailValue}
            onChangeText={onEmailChange}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
          />
        </View>
      )}
    </View>
  );
});

export default PhoneOrEmailInput;
