import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

// Shared open/close animation state for every modal-like surface in the app
// (AppModal, JobModalWrapper) so they all transition identically instead of
// drifting apart. See AppModal.jsx for why phone gets scale and web
// landscape gets slide.
export const MODAL_TRANSITION_DURATION = 180;
export const MODAL_OPEN_SCALE = 1.1;
export const MODAL_SLIDE_OFFSET = 24;

export function useModalTransition(
  visible,
  {
    duration = MODAL_TRANSITION_DURATION,
    openScale = MODAL_OPEN_SCALE,
    slideOffset = MODAL_SLIDE_OFFSET,
  } = {}
) {
  const [rendered, setRendered] = useState(visible);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(openScale)).current;
  const translateY = useRef(new Animated.Value(slideOffset)).current;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      opacity.stopAnimation();
      scale.stopAnimation();
      translateY.stopAnimation();
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration, useNativeDriver: true }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration, useNativeDriver: true }),
        Animated.timing(scale, { toValue: openScale, duration, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: slideOffset, duration, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
  }, [visible]);

  return { rendered, opacity, scale, translateY };
}
