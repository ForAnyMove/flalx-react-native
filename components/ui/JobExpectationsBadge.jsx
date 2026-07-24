import React, { useMemo } from 'react';
import { View, Text, Image, Platform } from 'react-native';
import { icons } from '../../constants/icons';
import { useComponentContext } from '../../context/globalAppContext';
import { useWindowInfo } from '../../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { formatLocalDateTime, formatTimezoneLabel } from '../../utils/datetimeTimezone';

export default function JobExpectationsBadge({ expectations, isRTL, iconStyle, textStyle, badgeStyle, containerStyle }) {
  const { themeController, languageController } = useComponentContext();
  const theme = themeController.current;
  const locale = languageController?.current === 'he' ? 'he-IL' : 'en-US';
  const { height, isLandscape } = useWindowInfo();

  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      paddingVertical: isWebLandscape ? web(4) : mobile(4),
      paddingHorizontal: isWebLandscape ? web(8) : mobile(8),
      gap: isWebLandscape ? web(8) : mobile(8),
      borderRadius: isWebLandscape ? web(4) : mobile(4),
      fontSize: isWebLandscape ? web(16) : mobile(16),
      iconSize: isWebLandscape ? web(24) : mobile(24),
      marginTop: isWebLandscape ? web(8) : mobile(8),
    };
  }, [height, isWebLandscape]);

  if (!expectations) return null;

  const {
    proposed_price,
    proposed_time_from,
    proposed_time_to,
    proposed_time_from_local,
    proposed_time_to_local,
    source_timezone,
  } = expectations;
  if (!proposed_price && !proposed_time_from && !proposed_time_to) return null;

  const formatDateTime = (dateString, localDateTime) => {
    if (localDateTime) {
      const formatted = formatLocalDateTime(localDateTime, locale, true);
      return source_timezone ? `${formatted}, ${formatTimezoneLabel(source_timezone)}` : formatted;
    }
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    if (source_timezone) {
      const formatted = new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: source_timezone,
      }).format(date);
      return `${formatted}, ${formatTimezoneLabel(source_timezone)}`;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Check if time is explicitly set
    const timeRegex = /T(\d{2}):(\d{2})/;
    const match = dateString.match(timeRegex);
    let hasTime = false;
    let hours = '';
    let minutes = '';

    if (match) {
      hasTime = true;
      hours = String(date.getHours()).padStart(2, '0');
      minutes = String(date.getMinutes()).padStart(2, '0');
    }

    if (hasTime) {
      return `${day}/${month} ${hours}:${minutes}`;
    }
    return `${day}/${month}`;
  };

  let dateText = '';
  if (proposed_time_from && proposed_time_to) {
    if (proposed_time_from === proposed_time_to) {
      dateText = formatDateTime(proposed_time_from, proposed_time_from_local);
    } else {
      dateText = `${formatDateTime(proposed_time_from, proposed_time_from_local)} - ${formatDateTime(proposed_time_to, proposed_time_to_local)}`;
    }
  } else if (proposed_time_from) {
    dateText = formatDateTime(proposed_time_from, proposed_time_from_local);
  } else if (proposed_time_to) {
    dateText = formatDateTime(proposed_time_to, proposed_time_to_local);
  }

  const defaultBadgeStyle = {
    flexDirection: isRTL ? 'row-reverse' : 'row',
    alignItems: 'center',
    backgroundColor: theme?.defaultBlocksMockBackground || '#DAE2FF',
    paddingHorizontal: sizes.paddingHorizontal,
    paddingVertical: sizes.paddingVertical,
    borderRadius: sizes.borderRadius,
    gap: sizes.gap,
    ...badgeStyle,
  };

  const defaultTextStyle = {
    fontSize: sizes.fontSize,
    color: theme?.primaryColor || '#0A62EA',
    fontFamily: 'Rubik-Medium',
    ...textStyle,
  };

  const defaultIconStyle = {
    width: sizes.iconSize,
    height: sizes.iconSize,
    tintColor: theme?.primaryColor || '#0A62EA',
    resizeMode: 'contain',
    ...iconStyle,
  };

  const dateTextStyle = {
    ...defaultTextStyle,
    color: theme?.textColor || '#3B4663',
    ...textStyle,
  };

  const dateIconStyle = {
    ...defaultIconStyle,
    tintColor: theme?.primaryColor || '#0A62EA',
    ...iconStyle,
  };

  // flexWrap + flexDirection:'row-reverse' together is unreliable across RN/
  // react-native-web (Yoga doesn't consistently reverse wrapped rows) — that
  // was why this cluster neither moved to the right side nor swapped
  // price/date order in RTL. Keep flexDirection fixed at 'row' and instead
  // reorder the badges themselves in JS, and position the whole cluster via
  // justifyContent (which IS reliable) instead of direction.
  const priceBadge = proposed_price ? (
    <View key='price' style={defaultBadgeStyle}>
      <Text style={defaultTextStyle}>₪ {proposed_price}</Text>
    </View>
  ) : null;
  const dateBadge = dateText !== '' ? (
    <View key='date' style={defaultBadgeStyle}>
      <Image source={icons.calendar} style={dateIconStyle} />
      <Text style={dateTextStyle}>{dateText}</Text>
    </View>
  ) : null;
  const badges = [priceBadge, dateBadge].filter(Boolean);
  if (isRTL) badges.reverse();

  return (
    <View style={[{
      // Forced LTR base direction: several callers (Waiting.jsx's screen
      // container, ProvidersSection.jsx's web grid) set an *ambient* CSS
      // `direction: isRTL ? 'rtl' : 'ltr'` on an ancestor, which is
      // inherited. Combined with this component's own isRTL-driven mirroring
      // below, that's a double-flip that cancels back out to looking
      // LTR — which is why the badges didn't visibly move at all. Resetting
      // direction here makes 'row' + justifyContent/array-order below mean
      // what they say, regardless of what any ancestor set.
      direction: 'ltr',
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: isRTL ? 'flex-end' : 'flex-start',
      marginTop: sizes.marginTop,
      gap: sizes.gap
    }, containerStyle]}>
      {badges}
    </View>
  );
}
