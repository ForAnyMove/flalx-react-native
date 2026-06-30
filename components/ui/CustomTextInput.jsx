import React, { forwardRef, useEffect, useMemo } from 'react';
import { TextInput, Platform } from 'react-native';
import { useWindowInfo } from '../../context/windowContext';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  if (!document.getElementById('hide-pw-reveal')) {
    const s = document.createElement('style');
    s.id = 'hide-pw-reveal';
    s.textContent = 'input[type="password"]::-ms-reveal{display:none!important}input[type="password"]::-moz-reveal{display:none!important}';
    document.head.appendChild(s);
  }
}

const CustomTextInput = forwardRef((props, ref) => {
  const { addFocusedInput, removeFocusedInput } = useWindowInfo();
  const uniqueId = useMemo(() => Math.random().toString(36).substr(2, 9), []);

  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const isMobileWeb = Platform.OS === 'web' && typeof window !== 'undefined' && window.innerWidth < 768;

  const handleFocus = (e) => {
    // On native mobile, keyboard visibility is tracked via useKeyboardListener —
    // calling addFocusedInput here triggers an unnecessary windowContext re-render
    // that can cause the FlatList to rebuild and immediately dismiss the keyboard.
    if (isMobileWeb && props.editable !== false && !props.readOnly) {
      addFocusedInput(uniqueId);
    }
    if (props.onFocus) {
      props.onFocus(e);
    }
  };

  const handleBlur = (e) => {
    if (isMobileWeb) {
      removeFocusedInput(uniqueId);
    }
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  useEffect(() => {
    return () => {
      if (isMobileWeb) {
        removeFocusedInput(uniqueId);
      }
    };
  }, [uniqueId, removeFocusedInput, isMobileWeb]);

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
