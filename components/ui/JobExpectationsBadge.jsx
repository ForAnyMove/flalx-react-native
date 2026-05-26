import React, { useMemo } from 'react';
import { View, Text, Image, Platform } from 'react-native';
import { icons } from '../../constants/icons';
import { useComponentContext } from '../../context/globalAppContext';
import { useWindowInfo } from '../../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';

export default function JobExpectationsBadge({ expectations, isRTL, iconStyle, textStyle, badgeStyle, containerStyle }) {
  const { themeController } = useComponentContext();
  const theme = themeController.current;
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

  const { proposed_price, proposed_time_from, proposed_time_to } = expectations;
  if (!proposed_price && !proposed_time_from && !proposed_time_to) return null;

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

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
      dateText = formatDateTime(proposed_time_from);
    } else {
      dateText = `${formatDateTime(proposed_time_from)} - ${formatDateTime(proposed_time_to)}`;
    }
  } else if (proposed_time_from) {
    dateText = formatDateTime(proposed_time_from);
  } else if (proposed_time_to) {
    dateText = formatDateTime(proposed_time_to);
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

  return (
    <View style={[{
      flexDirection: isRTL ? 'row-reverse' : 'row',
      flexWrap: 'wrap',
      marginTop: sizes.marginTop,
      gap: sizes.gap
    }, containerStyle]}>
      {proposed_price && (
        <View style={defaultBadgeStyle}>
          <Image source={icons.salary} style={defaultIconStyle} />
          <Text style={defaultTextStyle}>${proposed_price}</Text>
        </View>
      )}
      {dateText !== '' && (
        <View style={defaultBadgeStyle}>
          <Image source={icons.calendar} style={dateIconStyle} />
          <Text style={dateTextStyle}>{dateText}</Text>
        </View>
      )}
    </View>
  );
}
