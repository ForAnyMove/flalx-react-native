import React, { forwardRef, useEffect, useMemo } from 'react';
import { TextInput, Platform } from 'react-native';
import { useWindowInfo } from '../../context/windowContext';

const CustomTextInput = forwardRef((props, ref) => {
  const { addFocusedInput, removeFocusedInput } = useWindowInfo();
  const uniqueId = useMemo(() => Math.random().toString(36).substr(2, 9), []);

  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const isMobileWeb = Platform.OS === 'web' && typeof window !== 'undefined' && window.innerWidth < 768;

  const handleFocus = (e) => {
    // Вызываем только на мобильных устройствах и если инпут редактируемый
    if ((isMobile || isMobileWeb) && props.editable !== false && !props.readOnly) {
      addFocusedInput(uniqueId);
    }
    // Вызываем оригинальный onFocus, если он был передан
    if (props.onFocus) {
      props.onFocus(e);
    }
  };

  const handleBlur = (e) => {
    if (isMobile || isMobileWeb) {
      removeFocusedInput(uniqueId);
    }
    // Вызываем оригинальный onBlur, если он был передан
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  // При размонтировании компонента убедимся, что он удален из списка
  useEffect(() => {
    return () => {
      if (isMobile || isMobileWeb) {
        removeFocusedInput(uniqueId);
      }
    };
  }, [uniqueId, removeFocusedInput, isMobile, isMobileWeb]);

  return (
    <TextInput
      {...props}
      ref={ref}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
});

export default CustomTextInput;
