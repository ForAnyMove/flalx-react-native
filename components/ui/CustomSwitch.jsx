import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, Easing } from 'react-native';
import { useComponentContext } from '../../context/globalAppContext';

const CustomSwitch = ({ value, onValueChange, width, height, circleSize, padding }) => {
  const { themeController } = useComponentContext();
  const switchAnimation = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(switchAnimation, {
      toValue: value ? 1 : 0,
      duration: 200,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [value]);

  const handlePress = () => {
    onValueChange(!value);
  };

  const circlePosition = switchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [padding, width - circleSize - padding],
  });

  const backgroundColor = switchAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [
      themeController.current?.buttonColorPrimaryDefault,
      themeController.current?.buttonColorSecondaryDefault,
    ],
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        width: width,
        height: height,
        borderRadius: height / 2,
        backgroundColor: themeController.current?.switchTrackColor,
        justifyContent: 'center',
      }}
      activeOpacity={1}
    >
      <Animated.View
        style={{
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          backgroundColor: backgroundColor,
          transform: [{ translateX: circlePosition }],
        }}
      />
    </TouchableOpacity>
  );
};

export default CustomSwitch;
