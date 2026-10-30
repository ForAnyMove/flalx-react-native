import React, { useState, useEffect, useMemo } from 'react';
import { Pressable, View, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { useWindowInfo } from '../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';

const PaymentLegalNotice = ({
  title,
  texts = [],
  theme,
  isRTL = false,
  fontSize = 12,
  style,
}) => {
  const { width: screenWidth, height, isLandscape } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && isLandscape;
  const scale = isWebLandscape ? (s) => scaleByHeight(s, height) : (s) => scaleByHeightMobile(s, height);

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          borderRadius: scale(8),
          paddingHorizontal: scale(12),
          paddingVertical: scale(8),
        },
        infoButton: {
          width: scale(22),
          height: scale(22),
          borderRadius: scale(11),
        },
        infoText: {
          lineHeight: scale(18),
        },
        tooltip: {
          top: scale(28),
          borderRadius: scale(8),
          paddingHorizontal: scale(12),
          paddingVertical: scale(10),
        },
        tooltipText: {
          lineHeight: Math.round(fontSize * 1.4),
        },
      }),
    [height, isWebLandscape, fontSize]
  );

  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const noticeColor = theme?.buttonColorSecondaryDefault || '#FE8A01';
  const textColor = theme?.textColor || noticeColor;
  const visibleTexts = texts.filter(Boolean);

  useEffect(() => {
    if (Platform.OS === 'web' && isTooltipVisible) {
      const handleClick = () => setIsTooltipVisible(false);
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClick);
      }, 0);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleClick);
      };
    }
  }, [isTooltipVisible]);

  if (!title && visibleTexts.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        dynamicStyles.container,
        {
          borderColor: noticeColor,
          backgroundColor: `${noticeColor}10`,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
        style,
      ]}
    >
      {title && (
        <Text
          style={[
            styles.title,
            {
              color: noticeColor,
              fontSize: fontSize + 1,
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
        >
          {title}
        </Text>
      )}

      {visibleTexts.length > 0 && (
        <Pressable
          onHoverIn={() => setIsTooltipVisible(true)}
          onHoverOut={() => setIsTooltipVisible(false)}
          onPress={() => setIsTooltipVisible((visible) => !visible)}
          style={[
            styles.infoButton,
            dynamicStyles.infoButton,
            {
              borderColor: noticeColor,
              marginLeft: isRTL ? 0 : scale(8),
              marginRight: isRTL ? scale(8) : 0,
            },
          ]}
        >
          <Text style={[styles.infoText, dynamicStyles.infoText, { color: noticeColor, fontSize }]}>i</Text>

          {isTooltipVisible && (
            <>
              {Platform.OS !== 'web' && (
                <Pressable
                  style={{
                    position: 'absolute',
                    top: -Dimensions.get('window').height,
                    bottom: -Dimensions.get('window').height,
                    left: -Dimensions.get('window').width,
                    right: -Dimensions.get('window').width,
                    zIndex: -1,
                  }}
                  onPress={() => setIsTooltipVisible(false)}
                />
              )}
              <View
                style={[
                  styles.tooltip,
                  dynamicStyles.tooltip,
                  {
                    width: isLandscape ? scale(280) : screenWidth * 0.68,
                    borderColor: noticeColor,
                    backgroundColor: theme?.backgroundColor || '#fff',
                    [isRTL ? 'left' : 'right']: 0,
                  },
                ]}
              >
                {visibleTexts.map((text, index) => (
                  <Text
                    key={`${index}-${text.slice(0, 12)}`}
                    style={[
                      styles.tooltipText,
                      dynamicStyles.tooltipText,
                      {
                        color: textColor,
                        fontSize,
                        textAlign: isRTL ? 'right' : 'left',
                        marginTop: index > 0 ? scale(6) : 0,
                      },
                    ]}
                  >
                    {text}
                  </Text>
                ))}
              </View>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    zIndex: 20,
  },
  title: {
    fontFamily: 'Rubik-Bold',
    flex: 1,
  },
  infoButton: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 30,
  },
  infoText: {
    fontFamily: 'Rubik-Bold',
  },
  tooltip: {
    position: 'absolute',
    borderWidth: 1,
    zIndex: 40,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  tooltipText: {
    fontFamily: 'Rubik-Regular',
  },
});

export default PaymentLegalNotice;
