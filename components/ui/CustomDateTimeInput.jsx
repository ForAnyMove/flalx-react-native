import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Modal,
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
  const { height, isLandscape } = useWindowInfo();
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
    };
  }, [height, isWebLandscape]);

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
                textAlign: isRTL ? 'right' : 'left',
              },
              labelStyle,
            ]}
          >
            {label}
          </Text>
        )}

        <View style={[styles.valueRow, isRTL && { flexDirection: 'row-reverse' }]}>
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
            style={{ width: sizes.iconSize, height: sizes.iconSize, tintColor: theme?.formInputLabelColor }}
          />
        </View>
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={closePicker}>
        <View style={styles.overlay}>
          <View
            style={[
              styles.pickerCard,
              {
                width: sizes.modalWidth,
                backgroundColor: theme?.backgroundColor,
                borderRadius: sizes.borderRadius,
                padding: sizes.modalPadding,
              },
            ]}
          >
            <View style={[styles.header, isRTL && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
                <Text style={[styles.navText, { color: theme?.primaryColor, fontSize: sizes.navSize }]}>
                  {isRTL ? '>' : '<'}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.title, { color: theme?.textColor, fontSize: sizes.titleSize }]}>
                {monthTitle}
              </Text>
              <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
                <Text style={[styles.navText, { color: theme?.primaryColor, fontSize: sizes.navSize }]}>
                  {isRTL ? '<' : '>'}
                </Text>
              </TouchableOpacity>
            </View>

            {showTimezone && (
              <View style={[styles.timezoneBlock, timezoneListOpen && styles.timezoneBlockOpen]}>
                <View
                  style={[styles.timezoneRow, isRTL && { flexDirection: 'row-reverse' }]}
                  onLayout={(e) => setTimezoneRowHeight(e.nativeEvent.layout.height)}
                >
                  <Text style={[styles.timezoneText, { color: theme?.formInputLabelColor }]}>
                    {t('dateTimePicker.timezone')}: {formatTimezoneLabel(selectedTimezone)}
                  </Text>
                  {onTimezoneChange && (
                    <TouchableOpacity onPress={() => setTimezoneListOpen((v) => !v)}>
                      <Text style={[styles.timezoneChangeText, { color: theme?.primaryColor }]}>
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
                          borderBottomColor: theme?.defaultBlocksMockBackground || '#ccc',
                          textAlign: isRTL ? 'right' : 'left',
                        },
                      ]}
                    />
                    <ScrollView style={styles.timezoneDropdownList} keyboardShouldPersistTaps="handled">
                      {filteredTimezones.map((option) => {
                        const isSelected = option === selectedTimezone;
                        return (
                          <TouchableOpacity
                            key={option}
                            style={[
                              styles.timezoneOption,
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
                  style={[styles.weekday, { color: theme?.formInputLabelColor, fontSize: sizes.weekdaySize }]}
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
                    style={[
                      styles.dayCell,
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
                <Text style={[styles.selectedTimeText, { color: theme?.textColor, fontSize: sizes.timeTextSize }]}>
                  {pad(draftDate.getHours())}:{pad(draftDate.getMinutes())}
                </Text>

                <View style={[styles.timeSection, isRTL && { flexDirection: 'row-reverse' }]}>
                  <ScrollView
                    ref={hourScrollRef}
                    style={styles.timeColumn}
                    contentContainerStyle={styles.timeColumnContent}
                  >
                    {Array.from({ length: 24 }, (_, hour) => (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.timeOption,
                          draftDate.getHours() === hour && { backgroundColor: theme?.primaryColor },
                        ]}
                        onPress={() => setTimePart('hour', hour)}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            { color: draftDate.getHours() === hour ? theme?.buttonTextColorPrimary : theme?.textColor },
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
                    style={styles.timeColumn}
                    contentContainerStyle={styles.timeColumnContent}
                  >
                    {Array.from({ length: 60 }, (_, minute) => minute).map((minute) => (
                      <TouchableOpacity
                        key={minute}
                        style={[
                          styles.timeOption,
                          draftDate.getMinutes() === minute && { backgroundColor: theme?.primaryColor },
                        ]}
                        onPress={() => setTimePart('minute', minute)}
                      >
                        <Text
                          style={[
                            styles.timeOptionText,
                            { color: draftDate.getMinutes() === minute ? theme?.buttonTextColorPrimary : theme?.textColor },
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

            <View style={[styles.actions, isRTL && { flexDirection: 'row-reverse' }]}>
              <TouchableOpacity
                style={[styles.actionButton, { height: sizes.buttonHeight, borderColor: theme?.primaryColor }]}
                onPress={closePicker}
              >
                <Text style={[styles.actionText, { color: theme?.primaryColor }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.primaryAction,
                  { height: sizes.buttonHeight, backgroundColor: theme?.primaryColor },
                ]}
                onPress={applyPicker}
              >
                <Text style={[styles.actionText, { color: theme?.buttonTextColorPrimary }]}>
                  {t('dateTimePicker.apply')}
                </Text>
              </TouchableOpacity>
            </View>

            {validationError ? (
              <Text style={[styles.validationText, { color: theme?.errorTextColor || 'red' }]}>
                {validationError}
              </Text>
            ) : null}
          </View>
        </View>
      </Modal>
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
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
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
    maxWidth: 420,
    maxHeight: '92%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navButton: {
    width: 40,
    height: 40,
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
    marginBottom: 12,
  },
  timezoneBlockOpen: {
    zIndex: 100,
    overflow: 'visible',
  },
  timezoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timezoneText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 12,
    textAlign: 'center',
    flexShrink: 1,
  },
  timezoneChangeText: {
    fontFamily: 'Rubik-Bold',
    fontSize: 12,
  },
  timezoneDropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 8,
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  timezoneSearchInput: {
    fontFamily: 'Rubik-Medium',
    fontSize: 13,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  timezoneDropdownList: {
    maxHeight: 170,
  },
  timezoneOption: {
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  timezoneOptionText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  weekday: {
    width: '14.2857%',
    textAlign: 'center',
    fontFamily: 'Rubik-Medium',
    marginBottom: 6,
  },
  dayCell: {
    width: '14.2857%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dayText: {
    fontFamily: 'Rubik-Medium',
  },
  timeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 10,
  },
  selectedTimeText: {
    fontFamily: 'Rubik-Bold',
    textAlign: 'center',
    marginTop: 14,
  },
  timeColumn: {
    maxHeight: 132,
    width: 72,
  },
  timeColumnContent: {
  },
  timeOption: {
    height: 34,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  timeOptionText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
  },
  timeSeparator: {
    fontFamily: 'Rubik-Bold',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryAction: {
    borderWidth: 0,
  },
  actionText: {
    fontFamily: 'Rubik-Bold',
    fontSize: 16,
  },
  validationText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
  },
});
