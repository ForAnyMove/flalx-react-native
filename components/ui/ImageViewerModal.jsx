import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Modal,
  PanResponder,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { icons } from '../../constants/icons';

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const DOUBLE_TAP_MS = 280;

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

function getTouchDistance(touches) {
  const [a, b] = touches;
  return Math.sqrt((a.pageX - b.pageX) ** 2 + (a.pageY - b.pageY) ** 2);
}

export default function ImageViewerModal({ visible, images, initialIndex = 0, onClose }) {
  const [index, setIndex] = useState(initialIndex);

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  const scaleVal = useRef(1);
  const translateVal = useRef({ x: 0, y: 0 });
  const panStartOffset = useRef({ x: 0, y: 0 });
  const pinch = useRef({ active: false, initialDist: 0, initialScale: 1 });
  const prevTouchCount = useRef(0);
  const lastTapAt = useRef(0);

  const resetTransform = () => {
    scaleVal.current = 1;
    translateVal.current = { x: 0, y: 0 };
    scale.setValue(1);
    translateX.setValue(0);
    translateY.setValue(0);
  };

  useEffect(() => {
    if (visible) {
      setIndex(initialIndex);
      resetTransform();
    }
  }, [visible, initialIndex]);

  const indexRef = useRef(index);
  indexRef.current = index;
  const imagesRef = useRef(images);
  imagesRef.current = images;

  const goNext = () => {
    if (indexRef.current < imagesRef.current.length - 1) {
      setIndex(indexRef.current + 1);
      resetTransform();
    }
  };
  const goPrev = () => {
    if (indexRef.current > 0) {
      setIndex(indexRef.current - 1);
      resetTransform();
    }
  };

  // Web: keyboard + wheel zoom
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;

    const onKey = (e) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
    };

    const onWheel = (e) => {
      e.preventDefault();
      const factor = e.ctrlKey ? 0.015 : 0.003;
      const delta = -e.deltaY * factor;
      const next = clamp(scaleVal.current * (1 + delta), MIN_SCALE, MAX_SCALE);
      scaleVal.current = next;
      scale.setValue(next);
      if (next <= MIN_SCALE) {
        translateVal.current = { x: 0, y: 0 };
        translateX.setValue(0);
        translateY.setValue(0);
      }
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
    };
  }, [visible]);

  // Mobile: PanResponder (pinch + pan + double-tap)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt) =>
        evt.nativeEvent.touches.length >= 2 || scaleVal.current > 1,

      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        prevTouchCount.current = touches.length;

        if (touches.length === 1) {
          const now = Date.now();
          if (now - lastTapAt.current < DOUBLE_TAP_MS) {
            if (scaleVal.current > 1) {
              resetTransform();
            } else {
              scaleVal.current = 2.5;
              scale.setValue(2.5);
            }
            lastTapAt.current = 0;
          } else {
            lastTapAt.current = now;
          }
          panStartOffset.current = { ...translateVal.current };
        }

        if (touches.length === 2) {
          pinch.current = {
            active: true,
            initialDist: getTouchDistance(touches),
            initialScale: scaleVal.current,
          };
        }
      },

      onPanResponderMove: (evt, gesture) => {
        const touches = evt.nativeEvent.touches;
        const count = touches.length;

        if (prevTouchCount.current === 2 && count === 1) {
          panStartOffset.current = { ...translateVal.current };
          gesture.dx = 0;
          gesture.dy = 0;
        }
        prevTouchCount.current = count;

        if (count >= 2) {
          // Second finger may arrive during Move (not Grant) — initialize here
          // to avoid initialDist=0 which causes scale to jump to infinity/MAX.
          if (!pinch.current.active) {
            pinch.current = {
              active: true,
              initialDist: getTouchDistance(touches),
              initialScale: scaleVal.current,
            };
          }
          const dist = getTouchDistance(touches);
          const next = clamp(
            pinch.current.initialScale * (dist / pinch.current.initialDist),
            MIN_SCALE,
            MAX_SCALE
          );
          scaleVal.current = next;
          scale.setValue(next);
          if (next <= MIN_SCALE) {
            translateVal.current = { x: 0, y: 0 };
            translateX.setValue(0);
            translateY.setValue(0);
          }
        } else if (count === 1 && scaleVal.current > 1) {
          translateX.setValue(panStartOffset.current.x + gesture.dx);
          translateY.setValue(panStartOffset.current.y + gesture.dy);
        }
      },

      onPanResponderRelease: (_, gesture) => {
        if (scaleVal.current > 1) {
          translateVal.current = {
            x: panStartOffset.current.x + gesture.dx,
            y: panStartOffset.current.y + gesture.dy,
          };
        }
        pinch.current.active = false;
        prevTouchCount.current = 0;
      },

      onPanResponderTerminate: () => {
        pinch.current.active = false;
        prevTouchCount.current = 0;
      },
    })
  ).current;

  if (!visible || !images?.length) return null;

  const isFirst = index === 0;
  const isLast = index === images.length - 1;

  const content = (
    <View style={Platform.OS === 'web' ? styles.overlayFlex : styles.overlayAbsolute}>
      <StatusBar hidden />

      {/* Top bar */}
      <View style={styles.topBar}>
        {images.length > 1 ? (
          <Text style={styles.counter}>{index + 1} / {images.length}</Text>
        ) : <View />}
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Image source={icons.cross} style={styles.closeIcon} />
        </TouchableOpacity>
      </View>

      {/* Image area */}
      <View style={styles.imageArea} {...panResponder.panHandlers}>
        <Animated.Image
          source={{ uri: images[index] }}
          style={[
            styles.image,
            { transform: [{ translateX }, { translateY }, { scale }] },
          ]}
          resizeMode="contain"
        />
      </View>

      {/* Nav buttons (outside panResponder area so they always respond) */}
      {images.length > 1 && (
        <>
          <TouchableOpacity
            onPress={goPrev}
            disabled={isFirst}
            style={[styles.navBtn, styles.navBtnLeft, isFirst && styles.navBtnDisabled]}
          >
            <Image source={icons.arrowLeft} style={styles.navIcon} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={goNext}
            disabled={isLast}
            style={[styles.navBtn, styles.navBtnRight, isLast && styles.navBtnDisabled]}
          >
            <Image source={icons.arrowRight} style={styles.navIcon} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  // On web, use a proper Modal so it overlays sidebars / landscape layouts.
  // On native, ShowJobModal is already inside a JobModalWrapper <Modal>, so
  // nesting another <Modal> fails silently on Android. Render as an absolute
  // overlay instead — it covers the full-screen parent Modal area.
  if (Platform.OS === 'web') {
    return (
      <Modal
        visible
        transparent
        animationType="fade"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        {content}
      </Modal>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  overlayFlex: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
  },
  overlayAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    backgroundColor: 'rgba(0,0,0,0.96)',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 44 : 56,
    paddingBottom: 12,
    // Above navBtn (zIndex 10) — the nav strips span the full height
    // (top:0, bottom:0) and are rendered after this in JSX, so without a
    // higher z-index the right-side "next" strip sits on top of the close
    // button/counter and swallows taps meant for them.
    zIndex: 20,
  },
  counter: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Rubik-Medium',
    fontSize: 15,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    width: 18,
    height: 18,
    tintColor: 'white',
  },
  imageArea: {
    flex: 1,
    overflow: 'hidden',
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  navBtn: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  navBtnLeft: {
    left: 0,
  },
  navBtnRight: {
    right: 0,
  },
  navBtnDisabled: {
    opacity: 0.2,
  },
  navIcon: {
    width: 24,
    height: 24,
    tintColor: 'white',
  },
});
