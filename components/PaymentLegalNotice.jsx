import React, { useState } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';

const PaymentLegalNotice = ({
  title,
  texts = [],
  theme,
  isRTL = false,
  fontSize = 12,
  style,
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const noticeColor = theme?.buttonColorSecondaryDefault || '#FE8A01';
  const textColor = theme?.textColor || noticeColor;
  const visibleTexts = texts.filter(Boolean);

  if (!title && visibleTexts.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
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
            {
              borderColor: noticeColor,
              marginLeft: isRTL ? 0 : 8,
              marginRight: isRTL ? 8 : 0,
            },
          ]}
        >
          <Text style={[styles.infoText, { color: noticeColor, fontSize }]}>i</Text>

          {isTooltipVisible && (
            <View
              style={[
                styles.tooltip,
                {
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
                    {
                      color: textColor,
                      fontSize,
                      textAlign: isRTL ? 'right' : 'left',
                      marginTop: index > 0 ? 6 : 0,
                    },
                  ]}
                >
                  {text}
                </Text>
              ))}
            </View>
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 30,
  },
  infoText: {
    fontFamily: 'Rubik-Bold',
    lineHeight: 18,
  },
  tooltip: {
    position: 'absolute',
    top: 28,
    width: 280,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 40,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  tooltipText: {
    fontFamily: 'Rubik-Regular',
    lineHeight: 17,
  },
});

export default PaymentLegalNotice;
