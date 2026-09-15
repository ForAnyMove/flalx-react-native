import { Animated, Modal, Platform, View } from 'react-native';
import { useWindowInfo } from '../../context/windowContext';
import { MODAL_SLIDE_OFFSET, useModalTransition } from './useModalTransition';

// Single place that controls the open/close animation for every modal in the
// app. Drop-in replacement for react-native's <Modal>: same props, minus
// `animationType`.
//
// Phone: fade + scale (pops in slightly oversized, settles to 1).
// Web landscape / desktop (side nav lives there — see AppScreen.jsx): a
// scale transform on a full-bleed overlay drags off-center content toward
// the middle mid-animation, which visibly crosses over the sidebar. So this
// case gets fade + a short slide instead — Telegram-style, starting close
// to its final resting position rather than off-screen, since a small fixed
// offset can't bleed sideways the way scaling from a shared center can.
export default function AppModal({
  visible,
  children,
  duration,
  openScale,
  slideOffset = MODAL_SLIDE_OFFSET,
  onRequestClose,
  // Destructured (and ignored) so it can never reach the native <Modal> below —
  // a native `transparent={false}` paints an opaque backdrop the instant the
  // Modal mounts, before our own opacity animation runs, which kills the fade
  // and leaves only the scale/slide visible. Callers already paint their own
  // background in `children`, so forcing the native modal transparent doesn't
  // change the settled look, only makes the transition an actual fade.
  transparent,
  ...rest
}) {
  const { width, height } = useWindowInfo();
  const isWebLandscape = Platform.OS === 'web' && width > height;

  const { rendered, opacity, scale, translateY } = useModalTransition(visible, {
    duration,
    openScale,
    slideOffset,
  });

  // `<Modal>` itself stays mounted the whole time — only its own `visible`
  // prop toggles (true for the entire close animation, flipped to false only
  // once it finishes). Unmounting the <Modal> component between opens (e.g.
  // `if (!rendered) return null` before this) forces Android to tear down
  // and recreate the native Dialog window on every open, which paints one
  // opaque black frame before the transparent background takes effect — a
  // visible flash on full-screen content. Keeping it mounted lets RN reuse
  // the same native window and just show/hide it, same as every modal in
  // this app already did before AppModal existed.
  return (
    <Modal
      visible={rendered}
      transparent
      animationType="none"
      onRequestClose={onRequestClose}
      {...rest}
    >
      <View style={{ flex: 1 }}>
        <Animated.View
          style={
            isWebLandscape
              ? {
                  // Slides down from `slideOffset` to 0, so the box is
                  // grown upward by the same amount — otherwise sliding it
                  // down from rest exposes an empty strip above it (no
                  // backdrop painted there) for the duration of the slide.
                  position: 'absolute',
                  top: -slideOffset,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  opacity,
                  transform: [{ translateY }],
                }
              : { flex: 1, opacity, transform: [{ scale }] }
          }
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}
