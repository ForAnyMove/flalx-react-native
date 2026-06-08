import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PaymentLegalNotice = ({
  title,
  texts = [],
  theme,
  isRTL = false,
  fontSize = 12,
  style,
}) => {
  const noticeColor = theme?.buttonColorSecondaryDefault || '#FE8A01';
  const visibleTexts = texts.filter(Boolean);

  if (!title && visibleTexts.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: noticeColor,
          backgroundColor: `${noticeColor}10`,
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
      {visibleTexts.map((text, index) => (
        <Text
          key={`${index}-${text.slice(0, 12)}`}
          style={[
            styles.text,
            {
              color: noticeColor,
              fontSize,
              textAlign: isRTL ? 'right' : 'left',
              marginTop: title || index > 0 ? 4 : 0,
            },
          ]}
        >
          {text}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  title: {
    fontFamily: 'Rubik-Bold',
  },
  text: {
    fontFamily: 'Rubik-Regular',
    lineHeight: 17,
  },
});

export default PaymentLegalNotice;
