import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { icons } from '../../constants/icons';
import { useComponentContext } from '../../context/globalAppContext';
import { useWindowInfo } from '../../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import AppModal from './AppModal';
import { ACCESSIBILITY_HIT_SLOP } from '../../constants/themes';
import {
  formatDisplayDateTime,
  formatLocalDateTime,
  formatTimezoneLabel,
  getDeviceTimezone,
  getTimezoneOptions,
  toLocalDateTimeString,
} from '../../utils/datetimeTimezone';

const pad = (value) => String(value).padStart(2, '0');

const getLocale = (language) => (language === 'he' ? 'he-IL' : 'en-US');

const normalizeDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const setDateParts = (baseDate, year, month, day) => {
  const next = new Date(baseDate);
  next.setFullYear(year);
  next.setMonth(month);
  next.setDate(day);
  next.setSeconds(0);
  next.setMilliseconds(0);
  return next;
};

const TIME_OPTION_HEIGHT = 40;

export default function CustomDateTimeInput({
  label,
  value,
  onChange,
  readOnly = false,
  error = false,
  mode = 'datetime',
  placeholder,
  containerStyle,
  inputStyle,
  labelStyle,
  textStyle,
  displayFormat,
  minValue,
  maxValue,
  minErrorMessage,
  maxErrorMessage,
  localValue,
  timezone,
  onTimezoneChange,
  showTimezone = true,
}) {
  const { themeController, languageController } = useComponentContext();
  const { height, width, isLandscape } = useWindowInfo();
  const { t } = useTranslation();
  const theme = themeController.current;
  const isRTL = languageController.isRTL;
  const locale = getLocale(languageController.current);
  const selectedTimezone = timezone || getDeviceTimezone();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const [isOpen, setIsOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(() => normalizeDate(value));
  const [visibleMonth, setVisibleMonth] = useState(() => normalizeDate(value));
  const [validationError, setValidationError] = useState('');
  const [timezoneListOpen, setTimezoneListOpen] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState('');
  const [timezoneRowHeight, setTimezoneRowHeight] = useState(28);
  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);
  const timezoneSearchRef = useRef(null);

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      inputHeight: scale(64),
      inputPaddingHorizontal: scale(16),
      inputPaddingVertical: scale(10),
      borderRadius: scale(8),
      labelSize: scale(12),
      textSize: scale(16),
      iconSize: scale(20),
      modalWidth: isWebLandscape ? scale(380) : '92%',
      modalPadding: scale(16),
      titleSize: scale(18),
      navSize: scale(20),
      weekdaySize: scale(12),
      daySize: scale(14),
      timeTextSize: scale(28),
      buttonHeight: scale(44),
      gap: scale(10),
      androidDayCellHeight: isWebLandscape ? undefined : (width * 0.92 - 2 * scale(16)) / 7,
      cardMaxWidth: scale(420),
      headerMarginBottom: scale(12),
      navButtonSize: scale(40),
      timezoneMarginBottom: scale(12),
      timezoneGap: scale(8),
      timezoneFontSize: scale(12),
      timezoneSearchFontSize: scale(13),
      timezoneSearchPaddingH: scale(10),
      timezoneSearchPaddingV: scale(8),
      timezoneDropdownMaxHeight: scale(170),
      timezoneOptionPaddingH: scale(10),
      timezoneOptionPaddingV: scale(9),
      weekdayMarginBottom: scale(6),
      timeSectionMarginTop: scale(14),
      timeColumnMaxHeight: scale(132),
      timeColumnWidth: scale(72),
      timeOptionHeight: scale(34),
      timeOptionMarginBottom: scale(6),
      timeOptionFontSize: scale(16),
      actionsMarginTop: scale(16),
      actionTextFontSize: scale(16),
      validationFontSize: scale(13),
      validationMarginTop: scale(10),
      labelMarginBottom: scale(8),
    };
  }, [width, height, isWebLandscape]);

  const timezoneOptions = useMemo(() => getTimezoneOptions(), []);
  const filteredTimezones = useMemo(
    () =>
      timezoneSearch.trim()
        ? timezoneOptions.filter((tz) =>
          formatTimezoneLabel(tz).toLowerCase().includes(timezoneSearch.toLowerCase())
        )
        : timezoneOptions,
    [timezoneSearch, timezoneOptions]
  );

  const selectedDate = normalizeDate(value);
  const includeTime = displayFormat !== 'date' && mode === 'datetime';
  const displayValue = localValue
    ? formatLocalDateTime(localValue, null, includeTime)
    : value
      ? formatDisplayDateTime(selectedDate, includeTime)
      : readOnly
        ? t('common.none', { defaultValue: 'None' })
        : placeholder || t('dateTimePicker.select');
  const displayWithTimezone =
    (value || localValue) && showTimezone && selectedTimezone
      ? `${displayValue}, ${formatTimezoneLabel(selectedTimezone)}`
      : displayValue;

  const openPicker = () => {
    if (readOnly) return;
    const current = normalizeDate(value);
    setDraftDate(current);
    setVisibleMonth(current);
    setValidationError('');
    setTimezoneListOpen(false);
    setIsOpen(true);
  };

  const closePicker = () => {
    setIsOpen(false);
  };

  const applyPicker = () => {
    const next = new Date(draftDate);
    if (mode === 'date') {
      next.setHours(0);
      next.setMinutes(0);
      next.setSeconds(0);
      next.setMilliseconds(0);
    }
    if (minValue && next.getTime() < normalizeDate(minValue).getTime()) {
      setValidationError(minErrorMessage || t('dateTimePicker.min_error'));
      return;
    }
    if (maxValue && next.getTime() > normalizeDate(maxValue).getTime()) {
      setValidationError(maxErrorMessage || t('dateTimePicker.max_error'));
      return;
    }
    onChange?.(next.toISOString(), {
      localDateTime: toLocalDateTimeString(next),
      timezone: selectedTimezone,
    });
    setIsOpen(false);
  };

  const selectDate = (day) => {
    const next = setDateParts(draftDate, visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
    setDraftDate(next);
    setValidationError('');
  };

  const setTimePart = (part, valueToSet) => {
    const next = new Date(draftDate);
    if (part === 'hour') next.setHours(valueToSet);
    if (part === 'minute') next.setMinutes(valueToSet);
    next.setSeconds(0);
    next.setMilliseconds(0);
    setDraftDate(next);
    setValidationError('');
  };

  const changeMonth = (delta) => {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  };

  const monthTitle = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth);

  const weekdayLabels = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2026, 0, 4 + index))
  );
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  const scrollTimeToSelected = () => {
    if (mode !== 'datetime') return;
    hourScrollRef.current?.scrollTo({
      y: Math.max(draftDate.getHours() * TIME_OPTION_HEIGHT - TIME_OPTION_HEIGHT, 0),
      animated: false,
    });
    minuteScrollRef.current?.scrollTo({
      y: Math.max(draftDate.getMinutes() * TIME_OPTION_HEIGHT - TIME_OPTION_HEIGHT, 0),
      animated: false,
    });
  };

  useEffect(() => {
    if (!isOpen || mode !== 'datetime') return;
    const frame = requestAnimationFrame(scrollTimeToSelected);
    return () => cancelAnimationFrame(frame);
  }, [isOpen, mode]);

  useEffect(() => {
    if (timezoneListOpen) {
      const timer = setTimeout(() => timezoneSearchRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    } else {
      setTimezoneSearch('');
    }
  }, [timezoneListOpen]);

  return (
    <>
      <TouchableOpacity
        activeOpacity={readOnly ? 1 : 0.75}
        onPress={openPicker}
        disabled={readOnly}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${label || ''}: ${displayWithTimezone || placeholder || ''}`}
        accessibilityHint={t('accessibility.selectDateTimeHint', { defaultValue: 'לחץ לבחירת תאריך ושעה' })}
        accessibilityState={{ disabled: readOnly, expanded: isOpen }}
        style={[
          styles.input,
          {
            backgroundColor: theme?.formInputBackground,
            minHeight: sizes.inputHeight,
            borderRadius: sizes.borderRadius,
            paddingHorizontal: sizes.inputPaddingHorizontal,
            paddingVertical: sizes.inputPaddingVertical,
          },
          error && { borderWidth: 1, borderColor: theme?.errorTextColor || 'red' },
          containerStyle,
          inputStyle,
        ]}
      >
        {label && (
          <Text
            style={[
              styles.label,
              {
                color: error ? (theme?.errorTextColor || 'red') : theme?.formInputLabelColor || theme?.unactiveTextColor,
                fontSize: sizes.labelSize,
                marginBottom: sizes.labelMarginBottom,
                textAlign: isRTL ? 'right' : 'left',
              },
              labelStyle,
            ]}
          >
            {label}
          </Text>
        )}

        <View style={[styles.valueRow, { gap: sizes.gap }, isRTL && { flexDirection: 'row-reverse' }]}>
          <Text
            style={[
              styles.valueText,
              {
                color: value ? theme?.textColor : theme?.formInputPlaceholderColor,
                fontSize: sizes.textSize,
                textAlign: isRTL ? 'right' : 'left',
              },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {displayWithTimezone}
          </Text>
          <Image
            source={mode === 'date' ? icons.calendar : icons.access_time}
            accessible={false}
            aria-hidden={true}
            style={{ width: sizes.iconSize, height: sizes.iconSize, tintColor: theme?.formInputLabelColor }}
          />
        </View>
      </TouchableOpacity>

      <AppModal visible={isOpen} transparent onRequestClose={closePicker}>
        <View style={styles.overlay}>
          <View
            style={[
              styles.pickerCard,
              {
                width: sizes.modalWidth,
                maxWidth: sizes.cardMaxWidth,
                backgroundColor: theme?.backgroundColor,
                borderRadius: sizes.borderRadius,
                padding: sizes.modalPadding,
              },
            ]}
          >
            <View style={[styles.header, { marginBottom: sizes.headerMarginBottom }, isRTL && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity
                onPress={() => changeMonth(-1)}
                style={[styles.navButton, { width: sizes.navButtonSize, height: sizes.navButtonSize }]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('accessibility.prevMonth', { defaultValue: 'חודש קודם' })}
                hitSlop={ACCESSIBILITY_HIT_SLOP}
              >
                <Text style={[styles.navText, { color: theme?.primaryColor, fontSize: sizes.navSize }]}>
                  {isRTL ? '>' : '<'}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.title, { color: theme?.textColor, fontSize: sizes.titleSize }]}>
                {monthTitle}
              </Text>
              <TouchableOpacity
                onPress={() => changeMonth(1)}
                style={[styles.navButton, { width: sizes.navButtonSize, height: sizes.navButtonSize }]}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('accessibility.nextMonth', { defaultValue: 'חודש הבа' })}
                hitSlop={ACCESSIBILITY_HIT_SLOP}
              >
                <Text style={[styles.navText, { color: theme?.primaryColor, fontSize: sizes.navSize }]}>
                  {isRTL ? '<' : '>'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flexShrink: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >

              {showTimezone && (
                <View style={[styles.timezoneBlock, { marginBottom: sizes.timezoneMarginBottom }, timezoneListOpen && styles.timezoneBlockOpen]}>
                  <View
                    style={[styles.timezoneRow, { gap: sizes.timezoneGap }, isRTL && { flexDirection: 'row-reverse' }]}
                    onLayout={(e) => setTimezoneRowHeight(e.nativeEvent.layout.height)}
                  >
                    <Text style={[styles.timezoneText, { color: theme?.formInputLabelColor, fontSize: sizes.timezoneFontSize }]}>
                      {t('dateTimePicker.timezone')}: {formatTimezoneLabel(selectedTimezone)}
                    </Text>
                    {onTimezoneChange && (
                      <TouchableOpacity onPress={() => setTimezoneListOpen((v) => !v)}>
                        <Text style={[styles.timezoneChangeText, { color: theme?.primaryColor, fontSize: sizes.timezoneFontSize }]}>
                          {t('dateTimePicker.change')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {timezoneListOpen && (
                    <View
                      style={[
                        styles.timezoneDropdown,
                        {
                          top: timezoneRowHeight + 4,
                          borderRadius: sizes.borderRadius,
                          backgroundColor: theme?.backgroundColor,
                          borderColor: theme?.defaultBlocksMockBackground || '#ccc',
                        },
                      ]}
                    >
                      <TextInput
                        ref={timezoneSearchRef}
                        value={timezoneSearch}
                        onChangeText={setTimezoneSearch}
                        placeholder={t('dateTimePicker.search')}
                        placeholderTextColor={theme?.formInputPlaceholderColor}
                        style={[
                          styles.timezoneSearchInput,
                          {
                            color: theme?.textColor,
                            fontSize: sizes.timezoneSearchFontSize,
                            paddingHorizontal: sizes.timezoneSearchPaddingH,
                            paddingVertical: sizes.timezoneSearchPaddingV,
                            borderBottomColor: theme?.defaultBlocksMockBackground || '#ccc',
                            textAlign: isRTL ? 'right' : 'left',
                          },
                        ]}
                      />
                      <ScrollView style={[styles.timezoneDropdownList, { maxHeight: sizes.timezoneDropdownMaxHeight }]} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
                        {filteredTimezones.map((option) => {
                          const isSelected = option === selectedTimezone;
                          return (
                            <TouchableOpacity
                              key={option}
                              style={[
                                styles.timezoneOption,
                                {
                                  paddingHorizontal: sizes.timezoneOptionPaddingH,
                                  paddingVertical: sizes.timezoneOptionPaddingV,
                                },
                                isSelected && { backgroundColor: `${theme?.primaryColor || '#000'}14` },
                              ]}
                              onPress={() => {
                                onTimezoneChange?.(option);
                                setTimezoneListOpen(false);
                                setValidationError('');
                              }}
                            >
                              <Text
                                style={[
                                  styles.timezoneOptionText,
                                  {
                                    color: isSelected ? theme?.primaryColor : theme?.textColor,
                                    fontSize: sizes.timezoneSearchFontSize,
                                    textAlign: isRTL ? 'right' : 'left',
                                  },
                                ]}
                              >
                                {formatTimezoneLabel(option)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.grid}>
                {weekdayLabels.map((dayLabel) => (
                  <Text
                    key={dayLabel}
                    style={[styles.weekday, { color: theme?.formInputLabelColor, fontSize: sizes.weekdaySize, marginBottom: sizes.weekdayMarginBottom }]}
                  >
                    {dayLabel}
                  </Text>
                ))}
                {cells.map((day, index) => {
                  const isSelected =
                    day &&
                    draftDate.getFullYear() === year &&
                    draftDate.getMonth() === month &&
                    draftDate.getDate() === day;
                  const isToday =
                    day &&
                    today.getFullYear() === year &&
                    today.getMonth() === month &&
                    today.getDate() === day;
                  return (
                    <TouchableOpacity
                      key={`${index}-${day || 'blank'}`}
                      disabled={!day}
                      onPress={() => day && selectDate(day)}
                      accessible={Boolean(day)}
                      accessibilityRole="button"
                      accessibilityLabel={day ? `${day} ${monthTitle}` : undefined}
                      accessibilityState={{ selected: Boolean(isSelected) }}
                      style={[
                        styles.dayCell,
                        { borderRadius: sizes.borderRadius },
                        Platform.OS === 'android' && !isWebLandscape && { height: sizes.androidDayCellHeight },
                        isToday && !isSelected && {
                          backgroundColor: `${theme?.primaryColor || '#000'}14`,
                          borderColor: theme?.primaryColor,
                          borderWidth: 1,
                        },
                        isSelected && { backgroundColor: theme?.primaryColor },
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          {
                            color: isSelected ? theme?.buttonTextColorPrimary : theme?.textColor,
                            fontSize: sizes.daySize,
                            textAlign: 'center',
                          },
                        ]}
                      >
                        {day || ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {mode === 'datetime' && (
                <>
                  <Text style={[styles.selectedTimeText, { color: theme?.textColor, fontSize: sizes.timeTextSize, marginTop: sizes.timeSectionMarginTop }]}>
                    {pad(draftDate.getHours())}:{pad(draftDate.getMinutes())}
                  </Text>

                  <View style={[styles.timeSection, { marginTop: sizes.timeSectionMarginTop, gap: sizes.gap }, isRTL && { flexDirection: 'row-reverse' }]}>
                    <ScrollView
                      ref={hourScrollRef}
                      style={[styles.timeColumn, { maxHeight: sizes.timeColumnMaxHeight, width: sizes.timeColumnWidth }]}
                      contentContainerStyle={styles.timeColumnContent}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={false}
                    >
                      {Array.from({ length: 24 }, (_, hour) => (
                        <TouchableOpacity
                          key={hour}
                          style={[
                            styles.timeOption,
                            {
                              height: sizes.timeOptionHeight,
                              marginBottom: sizes.timeOptionMarginBottom,
                              borderRadius: sizes.borderRadius,
                            },
                            draftDate.getHours() === hour && { backgroundColor: theme?.primaryColor },
                          ]}
                          onPress={() => setTimePart('hour', hour)}
                        >
                          <Text
                            style={[
                              styles.timeOptionText,
                              { fontSize: sizes.timeOptionFontSize, color: draftDate.getHours() === hour ? theme?.buttonTextColorPrimary : theme?.textColor },
                            ]}
                          >
                            {pad(hour)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <Text style={[styles.timeSeparator, { color: theme?.textColor, fontSize: sizes.timeTextSize }]}>:</Text>
                    <ScrollView
                      ref={minuteScrollRef}
                      style={[styles.timeColumn, { maxHeight: sizes.timeColumnMaxHeight, width: sizes.timeColumnWidth }]}
                      contentContainerStyle={styles.timeColumnContent}
                      nestedScrollEnabled={true}
                      showsVerticalScrollIndicator={false}
                    >
                      {Array.from({ length: 60 }, (_, minute) => minute).map((minute) => (
                        <TouchableOpacity
                          key={minute}
                          style={[
                            styles.timeOption,
                            {
                              height: sizes.timeOptionHeight,
                              marginBottom: sizes.timeOptionMarginBottom,
                              borderRadius: sizes.borderRadius,
                            },
                            draftDate.getMinutes() === minute && { backgroundColor: theme?.primaryColor },
                          ]}
                          onPress={() => setTimePart('minute', minute)}
                        >
                          <Text
                            style={[
                              styles.timeOptionText,
                              { fontSize: sizes.timeOptionFontSize, color: draftDate.getMinutes() === minute ? theme?.buttonTextColorPrimary : theme?.textColor },
                            ]}
                          >
                            {pad(minute)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </>
              )}

            </ScrollView>

            <View style={[styles.actions, { gap: sizes.gap, marginTop: sizes.actionsMarginTop }, isRTL && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity
                style={[styles.actionButton, { height: sizes.buttonHeight, borderRadius: sizes.borderRadius, borderColor: theme?.primaryColor }]}
                onPress={closePicker}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('common.cancel')}
              >
                <Text style={[styles.actionText, { fontSize: sizes.actionTextFontSize, color: theme?.primaryColor }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.primaryAction,
                  { height: sizes.buttonHeight, borderRadius: sizes.borderRadius, backgroundColor: theme?.primaryColor },
                ]}
                onPress={applyPicker}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('dateTimePicker.apply')}
              >
                <Text style={[styles.actionText, { fontSize: sizes.actionTextFontSize, color: theme?.buttonTextColorPrimary }]}>
                  {t('dateTimePicker.apply')}
                </Text>
              </TouchableOpacity>
            </View>

            {validationError ? (
              <Text style={[styles.validationText, { color: theme?.errorTextColor || 'red', fontSize: sizes.validationFontSize, marginTop: sizes.validationMarginTop }]}>
                {validationError}
              </Text>
            ) : null}
          </View>
        </View>
      </AppModal>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontFamily: 'Rubik-Medium',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueText: {
    flex: 1,
    fontFamily: 'Rubik-Medium',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(59, 70, 99, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerCard: {
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontFamily: 'Rubik-Bold',
  },
  title: {
    flex: 1,
    fontFamily: 'Rubik-Bold',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  timezoneBlock: {
  },
  timezoneBlockOpen: {
    zIndex: 100,
    overflow: 'visible',
  },
  timezoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timezoneText: {
    fontFamily: 'Rubik-Medium',
    textAlign: 'center',
    flexShrink: 1,
  },
  timezoneChangeText: {
    fontFamily: 'Rubik-Bold',
  },
  timezoneDropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 8,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  timezoneSearchInput: {
    fontFamily: 'Rubik-Medium',
    borderBottomWidth: 1,
  },
  timezoneDropdownList: {
  },
  timezoneOption: {
  },
  timezoneOptionText: {
    fontFamily: 'Rubik-Medium',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekday: {
    width: '14.2857%',
    textAlign: 'center',
    fontFamily: 'Rubik-Medium',
  },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontFamily: 'Rubik-Medium',
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedTimeText: {
    fontFamily: 'Rubik-Bold',
    textAlign: 'center',
  },
  timeColumn: {
  },
  timeColumnContent: {
  },
  timeOption: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeOptionText: {
    fontFamily: 'Rubik-Medium',
  },
  timeSeparator: {
    fontFamily: 'Rubik-Bold',
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAction: {
    borderWidth: 0,
  },
  actionText: {
    fontFamily: 'Rubik-Bold',
  },
  validationText: {
    fontFamily: 'Rubik-Medium',
    textAlign: 'center',
  },
});
