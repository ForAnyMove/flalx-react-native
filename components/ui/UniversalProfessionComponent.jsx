import React, { use, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
  Image,
} from 'react-native';
import { useComponentContext } from '../../context/globalAppContext';
import { useWindowInfo } from '../../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../../utils/resizeFuncs';
import { FontAwesome6 } from '@expo/vector-icons';
import { PROFESSION_TYPES } from '../../constants/enums';
import { icons } from '../../constants/icons';

const UniversalProfessionComponent = ({ item, onPress }) => {
  const { themeController } = useComponentContext();
  const { height } = useWindowDimensions();
  const { isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const { type, title, subtitle, extra } = item;

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      containerWidth: isWebLandscape ? web(351) : '100%',
      padding: scale(16),
      borderRadius: scale(8),
      badgeBorderRadius: scale(6),
      iconContainerSize: scale(36),
      iconSize: scale(24),
      titleSize: scale(16),
      subtitleSize: scale(14),
      statusSize: scale(12),
      commentTitleSize: scale(12),
      commentContentSize: scale(12),
      commentPaddingV: scale(4),
      commentPaddingH: scale(26),
      commentBorderRadius: scale(8),
      badgePaddingV: scale(2),
      badgePaddingH: scale(8),
      badgeFontSize: scale(12),
      leftBorderWidth: scale(2),
      commentTitleMarginBottom: scale(2),
    };
  }, [height, isWebLandscape]);

  const typeConfig = useMemo(() => {
    const config = {
      [PROFESSION_TYPES.VERIFIED]: {
        icon: icons.verified_icon,
        color: themeController.current?.primaryColor,
        statusText: 'verified',
        titleColor: themeController.current?.textColor,
      },
      [PROFESSION_TYPES.PENDING]: {
        icon: icons.pending,
        color: themeController.current?.buttonColorSecondaryDefault,
        statusText: 'pending',
        titleColor: themeController.current?.unactiveTextColor,
      },
      [PROFESSION_TYPES.REJECTED]: {
        icon: icons.rejected,
        color: themeController.current?.errorTextColor,
        statusText: 'rejected',
        titleColor: themeController.current?.formInputLabelColor,
      },
      [PROFESSION_TYPES.NEW]: {
        icon: icons.profession_new,
        color: themeController.current?.verifiedMarkerColor,
        statusText: 'start verification',
        badgeText: 'New',
        titleColor: themeController.current?.textColor,
      },
    };
    return config[type] || config[PROFESSION_TYPES.NEW];
  }, [type, themeController.current]);

  const styles = StyleSheet.create({
    container: {
      backgroundColor: themeController.current?.formInputBackground,
      borderRadius: sizes.borderRadius,
      padding: sizes.padding,
      marginBottom: sizes.padding,
      width: sizes.containerWidth,
      position: 'relative',
    },
    mainContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      borderRadius: sizes.iconContainerSize / 2,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: sizes.padding,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: sizes.titleSize,
      color: typeConfig.titleColor,
    },
    subtitle: {
      fontSize: sizes.subtitleSize,
      color: typeConfig.titleColor,
    },
    statusContainer: {
      marginLeft: sizes.padding,
      alignItems: 'flex-end',
    },
    statusText: {
      fontSize: sizes.statusSize,
      color: typeConfig.color,
      fontFamily: 'Rubik-Regular',
    },
    badge: {
      position: 'absolute',
      top: -sizes.padding,
      right: -sizes.padding,
      backgroundColor: typeConfig.color,
      borderBottomLeftRadius: sizes.borderRadius,
      borderTopRightRadius: sizes.badgeBorderRadius,
      paddingVertical: sizes.badgePaddingV,
      paddingHorizontal: sizes.badgePaddingH,
    },
    badgeText: {
      color: '#fff',
      fontSize: sizes.badgeFontSize,
      fontFamily: 'Rubik-Regular',
    },
    commentBlock: {
      marginTop: sizes.padding,
    },
    commentTitle: {
      fontSize: sizes.commentTitleSize,
      color: typeConfig.color,
      marginBottom: sizes.commentTitleMarginBottom,
      fontFamily: 'Rubik-Regular',
    },
    commentContentContainer: {
      backgroundColor: themeController.current?.profileDefaultBackground,
      paddingVertical: sizes.commentPaddingV,
      paddingHorizontal: sizes.commentPaddingH,
      borderRadius: sizes.commentBorderRadius,
      borderLeftWidth: sizes.leftBorderWidth,
      borderLeftColor: typeConfig.color,
    },
    commentContent: {
      fontSize: sizes.commentContentSize,
      color: themeController.current?.unactiveTextColor,
      fontFamily: 'Rubik-Regular',
    },
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.mainContent}>
        <View
          style={[
            styles.iconContainer,
          ]}
        >
          <Image
            source={
              typeConfig.icon
            }
            style={{
              width: sizes.iconSize,
              height: sizes.iconSize,
            }}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{typeConfig.statusText}</Text>
        </View>
        {typeConfig.badgeText && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{typeConfig.badgeText}</Text>
          </View>
        )}
      </View>
      {extra?.comment && (
        <View style={styles.commentBlock}>
          <Text style={styles.commentTitle}>{extra.comment.title}</Text>
          <View style={styles.commentContentContainer}>
            <Text style={styles.commentContent}>{extra.comment.content}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default UniversalProfessionComponent;
