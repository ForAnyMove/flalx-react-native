import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
  Image,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { icons } from '../constants/icons';
import { ActivityIndicator } from 'react-native-paper';
import { logError } from '../utils/log_util';

if (
  Platform.OS === 'android' &&
  UIManager.getConstants().LayoutAnimation
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const JobNotificationsComponent = ({ notifications = [], onClose }) => {
  const { t } = useTranslation();
  const { themeController } = useComponentContext();
  const { width, height } = useWindowDimensions();
  const isWebLandscape = Platform.OS === 'web' && width > height;
  const [localNotifications, setLocalNotifications] = useState(notifications);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);
    const scale = isWebLandscape ? web : mobile;

    return {
      containerPadding: scale(16),
      borderRadius: scale(8),
      titleFontSize: scale(18),
      messageFontSize: scale(14),
      closeIconSize: scale(16),
      cardHeight: isWebLandscape ? web(120) : mobile(90),
      stackOffset: scale(8),
      shadowElevation: 5,
      shadowOffsetY: 2,
      shadowOpacity: 0.1,
      shadowRadius: 4,
      containerWidth: isWebLandscape ? '60%' : '100%',
      containerMarginBottom: isWebLandscape ? web(8) : mobile(8),
    };
  }, [isWebLandscape, height]);

  const styles = useMemo(() => {
    return StyleSheet.create({
      wrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        height: sizes.cardHeight + sizes.stackOffset * 2,
        width: sizes.containerWidth,
        marginBottom: sizes.containerMarginBottom,
      },
      card: {
        position: 'absolute',
        width: '100%',
        height: sizes.cardHeight,
        backgroundColor: themeController.current?.formInputBackground,
        borderRadius: sizes.borderRadius,
        padding: sizes.containerPadding,
        elevation: sizes.shadowElevation,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: sizes.shadowOffsetY },
        shadowOpacity: sizes.shadowOpacity,
        shadowRadius: sizes.shadowRadius,
      },
      title: {
        fontSize: sizes.titleFontSize,
        fontWeight: 'bold',
        color: themeController.current?.errorTextColor,
      },
      message: {
        fontSize: sizes.messageFontSize,
        color: themeController.current?.unactiveTextColor,
        marginTop: 4,
      },
      closeButton: {
        position: 'absolute',
        top: sizes.containerPadding,
        right: sizes.containerPadding,
      },
      closeIcon: {
        width: sizes.closeIconSize,
        height: sizes.closeIconSize,
        tintColor: themeController.current?.unactiveColor,
      },
      dimOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: sizes.borderRadius,
      },
    });
  }, [sizes, themeController]);

  if (!localNotifications || localNotifications.length === 0) {
    return null;
  }

  const closeNotification = async (id) => {
    try {
      setLoading(true);
      const closed = await onClose(id);
    } catch (e) {
      logError('Error closing notification:', e);
    } finally {
      setLoading(false);
    }
  }

  const visibleNotifications = localNotifications.slice(-3);

  const handleClose = (id) => {
    const customAnimation = {
      duration: 300,
      update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 0.7,
      },
      delete: {
        type: LayoutAnimation.Types.easeInEaseOut,
        property: LayoutAnimation.Properties.opacity,
      },
    };
    LayoutAnimation.configureNext(customAnimation);
    onClose(id);
  };

  return (
    <View style={[styles.wrapper, { height: sizes.cardHeight + sizes.stackOffset * (visibleNotifications.length - 1) }]}>
      {visibleNotifications.map((notification, index) => {
        const isTopCard = index === visibleNotifications.length - 1;
        const stackIndex = visibleNotifications.length - 1 - index;

        const cardStyle = {
          transform: [
            { translateY: -stackIndex * sizes.stackOffset },
            { scale: 1 - stackIndex * 0.02 },
          ],
          zIndex: index,
        };

        return (
          <View key={notification.id} style={[styles.card, cardStyle]}>
            <Text style={styles.title}>{notification.rejectionType == 'initial_rejection' ? t('job_notifications.rejected_title') : t('job_notifications.update_rejected_title')} {notification.title}</Text>
            <Text style={styles.message} numberOfLines={3} ellipsizeMode='tail'>
              {notification.message != null ? t('job_notifications.rejected_message_reason', { reason: notification.message, jobType: notification.jobType, jobSubtype: notification.jobSubtype }) :
                (notification.rejectionType == 'initial_rejection' ? t('job_notifications.rejected_message', { jobType: notification.jobType, jobSubtype: notification.jobSubtype }) : t('job_notifications.update_rejected_message', { jobType: notification.jobType, jobSubtype: notification.jobSubtype }))}
            </Text>
            {isTopCard && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => closeNotification(notification.id)}
              >
                <Image source={icons.cross} style={styles.closeIcon} />
              </TouchableOpacity>
            )}
            {!isTopCard && (
              <View
                style={[
                  styles.dimOverlay,
                  {
                    backgroundColor: `rgba(0,0,0,${stackIndex * 0.05})`,
                  },
                ]}
              />
            )}
            {loading && index === notifications.length - 1 &&
              <View style={{ ...styles.card, ...cardStyle, position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#00000020', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator animating={true} size="large" color={themeController.current?.primaryColor} />
              </View>
            }
          </View>
        );
      })}
    </View>
  );
};

export default JobNotificationsComponent;
