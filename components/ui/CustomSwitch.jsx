import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, Easing } from 'react-native';
import { useComponentContext } from '../../context/globalAppContext';

const CustomSwitch = ({
  value,
  onValueChange,
  width,
  height,
  circleSize,
  padding,
  label,
  accessibilityLabel,
  disabled = false,
}) => {
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
    if (!disabled && onValueChange) {
      onValueChange(!value);
    }
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

  const isChecked = Boolean(value);

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="switch"
      accessibilityState={{ checked: isChecked, disabled }}
      accessibilityLabel={accessibilityLabel || label || undefined}
      role="switch"
      aria-checked={isChecked}
      style={{
        width: width,
        height: height,
        borderRadius: height / 2,
        backgroundColor: themeController.current?.switchTrackColor,
        justifyContent: 'center',
        opacity: disabled ? 0.6 : 1,
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
