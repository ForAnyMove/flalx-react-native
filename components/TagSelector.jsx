import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function TagSelector({
  title,
  subtitle,
  options,
  selectedItems,
  setSelectedItems,
  containerStyle,
  numberOfRows = 1,
}) {
  const { width, height } = useWindowDimensions();
  const { themeController } = useComponentContext();

  const scrollRef = useRef(null);
  const isWebLandscape = Platform.OS === 'web' && width > height;

  const [containerWidth, setContainerWidth] = useState(null);

  const sizes = useMemo(() => {
    const webScale = (size) => scaleByHeight(size, height);
    const mobileScale = (size) => scaleByHeightMobile(size, height);
    return {
      font: isWebLandscape ? webScale(14) : mobileScale(12),
      padH: isWebLandscape ? webScale(12) : mobileScale(12),
      height: isWebLandscape ? webScale(38) : mobileScale(32),
      radius: isWebLandscape ? webScale(4) : mobileScale(8),
      rowGap: isWebLandscape ? webScale(10) : mobileScale(8),
      colGap: isWebLandscape ? webScale(10) : mobileScale(8),
      titleFont: isWebLandscape ? webScale(16) : mobileScale(14),
      subtitleFont: isWebLandscape ? webScale(14) : mobileScale(12),
      titleGap: isWebLandscape ? webScale(6) : mobileScale(2),
      subtitleGap: isWebLandscape ? webScale(16) : mobileScale(10),
    };
  }, [height, isWebLandscape]);

  const wrapperHeight =
    numberOfRows * sizes.height + (numberOfRows - 1) * sizes.rowGap;

  const handleContainerLayout = (event) => {
    if (containerWidth === null && numberOfRows > 1) {
      const fullWidth = event.nativeEvent.layout.width;
      // Рассчитываем ширину одной "колонки"
      const calculatedWidth = fullWidth / numberOfRows;
      setContainerWidth(calculatedWidth);
    }
  };

  const colors = useMemo(
    () => ({
      tagBg: 'transparent',
      tagText: themeController.current?.formInputPlaceholderColor || '#9FAACD',
      tagSelectedBg: themeController.current?.buttonColorPrimaryDefault,
      tagSelectedText: themeController.current?.buttonTextColorPrimary,
      tagBorder: themeController.current?.formInputPlaceholderColor || '#9FAACD',
      title: themeController.current?.textColor,
      subtitle: themeController.current?.unactiveTextColor,
    }),
    [themeController]
  );

  const isSelected = (type) => selectedItems.includes(type);

  const toggleType = (type) => {
    if (isSelected(type)) {
      setSelectedItems(selectedItems.filter((t) => t !== type));
    } else {
      setSelectedItems([...selectedItems, type]);
    }
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (Platform.OS === 'web' && scrollElement) {
      const handleWheel = (e) => {
        if (e.deltaX !== 0) {
          return;
        }
        e.preventDefault();
        scrollElement.scrollBy({ left: e.deltaY, top: 0, behavior: 'smooth' });
      };
      scrollElement.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        scrollElement.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);

  return (
    <View style={containerStyle}>
      <Text
        style={[
          styles.title,
          {
            fontSize: sizes.titleFont,
            color: colors.title,
            marginBottom: sizes.titleGap,
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.subtitle,
          {
            fontSize: sizes.subtitleFont,
            color: colors.subtitle,
            marginBottom: sizes.subtitleGap,
          },
        ]}
      >
        {subtitle}
      </Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          onLayout={handleContainerLayout}
          style={[
            styles.tagWrapper,
            {
              rowGap: sizes.rowGap,
              columnGap: sizes.colGap,
              height: wrapperHeight,
              // Применяем вычисленную ширину, если она есть.
              // Если нет (первый рендер), ширина не ограничена, чтобы измерить полную длину.
              width: containerWidth || undefined,
            },
          ]}
        >
          {Object.entries(options || {})?.map(([key, label]) => {
            const active = isSelected(key);
            return (
              <TouchableOpacity
                key={key}
                onPress={() => toggleType(key)}
                style={[
                  styles.tag,
                  {
                    paddingHorizontal: sizes.padH,
                    height: sizes.height,
                    borderRadius: sizes.radius,
                    backgroundColor: active
                      ? colors.tagSelectedBg
                      : colors.tagBg,
                    borderColor: active
                      ? colors.tagSelectedBg
                      : colors.tagBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    {
                      fontSize: sizes.font,
                      color: active ? colors.tagSelectedText : colors.tagText,
                    },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 5, // небольшой отступ для тени/обводки
  },
  tagWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  tag: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  tagText: {
    fontWeight: '500',
  },
  title: {
    fontFamily: 'Rubik-SemiBold',
  },
  subtitle: {
    
  },
});
