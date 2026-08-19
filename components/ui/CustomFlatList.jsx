import React, { useRef, useEffect } from 'react';
import { Platform, ScrollView, View, DeviceEventEmitter } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function CustomFlatList({
  data = [],
  renderItem,
  keyExtractor = (_, index) => index.toString(),
  contentContainerStyle,
  horizontal = false,
  keyboardShouldPersistTaps = 'never',
  enableKeyboardAware = false,
}) {
  const isWeb = Platform.OS === 'web';
  const ScrollComponent = (!isWeb && enableKeyboardAware) ? KeyboardAwareScrollView : ScrollView;
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!enableKeyboardAware || Platform.OS !== 'android') return;
    const subscription = DeviceEventEmitter.addListener('scrollToFocusedInput', (node) => {
      if (scrollRef.current && scrollRef.current.scrollToFocusedInput) {
        scrollRef.current.scrollToFocusedInput(node);
      }
    });
    return () => subscription.remove();
  }, [enableKeyboardAware]);

  const extraProps = (!isWeb && enableKeyboardAware) ? {
    enableOnAndroid: true,
    extraScrollHeight: Platform.OS === 'android' ? 80 : 40,
    keyboardOpeningTime: 0,
    ref: scrollRef,
  } : {};

  return (
    <ScrollComponent
      horizontal={horizontal}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      style={[isWeb && { overflow: 'auto', maxWidth: '100%', overflowX: 'hidden' }]}
      {...extraProps}
    >
      {data.map((item, index) => {
        const key = keyExtractor(item, index);
        const content = renderItem({ item, index });

        return (
          <View
            key={key}
            style={{ position: 'relative', zIndex: 100 - index, ...(isWeb ? {} : { elevation: 100 - index, shadowColor: 'transparent' }) }} // Важно: для правильного отображения выпадающих списков
          >
            {content}
          </View>
        );
      })}
    </ScrollComponent>
  );
}
