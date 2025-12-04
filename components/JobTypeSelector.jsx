import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useComponentContext } from '../context/globalAppContext';
import { icons } from '../constants/icons';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { useEffect, useMemo, useRef } from 'react';

export default function JobTypeSelector({ selectedTypes, setSelectedTypes }) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { themeController, languageController } = useComponentContext();

  const scrollRef = useRef(null);
  const isRTL = languageController?.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = useMemo(
    () => ({
      font: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(9, height),
      padH: isWebLandscape
        ? scaleByHeight(11, height)
        : scaleByHeightMobile(10, height),
      height: isWebLandscape
        ? scaleByHeight(34, height)
        : scaleByHeightMobile(25, height),
      radius: isWebLandscape
        ? scaleByHeight(4, height)
        : scaleByHeightMobile(5, height),
      rowGap: isWebLandscape
        ? scaleByHeight(9, height)
        : scaleByHeightMobile(6, height),
      colGap: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(6, height),
      twoRowsH: isWebLandscape
        ? scaleByHeight(78, height)
        : scaleByHeightMobile(40, height),
      trashSize: isWebLandscape
        ? scaleByHeight(32, height)
        : scaleByHeightMobile(18, height),
      maxScrollWidth: isWebLandscape ? scaleByHeight(5200, height) : '520%',
      trashSizeMargin: isWebLandscape
        ? scaleByHeight(18, height)
        : scaleByHeightMobile(8, height),
      containerWidth: isWebLandscape ? scaleByHeight(830, height) : '100%',
      containerMarginBottom: isWebLandscape
        ? scaleByHeight(30, height)
        : scaleByHeightMobile(15, height),
      containerPadding: isWebLandscape ? 0 : scaleByHeightMobile(4, height),
    }),
    [isWebLandscape, height]
  );

  const colors = {
    tagBg: themeController.current?.formInputBackground,
    tagText: themeController.current?.formInputPlaceholderColor || '#9FAACD',
    tagSelectedBg: themeController.current?.buttonColorPrimaryDefault,
    tagSelectedText: themeController.current?.buttonTextColorPrimary,
    divider: themeController.current?.breakLineColor,
    dangerActive: 'red' || '#d00',
    dangerInactive: themeController.current?.unactiveTextColor || '#999',
    tagBgBorder:
      themeController.current?.formInputPlaceholderColor || '#9FAACD',
  };

  const isSelected = (type) => selectedTypes.includes(type);

  const toggleType = (type) => {
    if (isSelected(type)) {
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const clearAll = () => setSelectedTypes([]);

  // объект переведённых значений: { job_1: '...', job_2: '...', ... }
  const jobTypes = t('jobTypes', { returnObjects: true });

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (Platform.OS === 'web' && scrollElement) {
      const handleWheel = (e) => {
        // Если горизонтальный скролл (deltaX) уже есть (свайп на тачпаде),
        // то ничего не делаем, позволяя браузеру обработать его нативно.
        if (e.deltaX !== 0) {
          return;
        }

        // Если был только вертикальный скролл (deltaY, колесо мыши),
        // то мы перехватываем его.
        e.preventDefault();
        // и прокручиваем наш компонент по горизонтали.
        scrollElement.scrollBy({ left: e.deltaY, top: 0, behavior: 'smooth' });
      };

      // Добавляем "активный" слушатель, чтобы preventDefault работал
      scrollElement.addEventListener('wheel', handleWheel, { passive: false });

      // Очищаем слушатель при размонтировании компонента
      return () => {
        scrollElement.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          width: sizes.containerWidth,
          marginBottom: sizes.containerMarginBottom,
          padding: sizes.containerPadding,
        },
        tagWrapper: {
          rowGap: sizes.rowGap,
          columnGap: sizes.colGap,
          height: sizes.twoRowsH,
          width: sizes.maxScrollWidth,
        },
        tag: {
          paddingHorizontal: sizes.padH,
          height: sizes.height,
          borderRadius: sizes.radius,
        },
        tagText: {
          fontSize: sizes.font,
        },
        trashButton: {
          [isRTL ? 'marginRight' : 'marginLeft']: sizes.trashSizeMargin,
        },
        trashIcon: {
          width: sizes.trashSize,
          height: sizes.trashSize,
        },
      }),
    [sizes, isRTL]
  );

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      {/* Теги */}
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.tagWrapper, dynamicStyles.tagWrapper]}>
          {Object.entries(jobTypes || {})?.map(([key, label]) => {
            const active = isSelected(key);
            return (
              <TouchableOpacity
                key={key}
                onPress={() => toggleType(key)}
                style={[
                  styles.tag,
                  dynamicStyles.tag,
                  {
                    backgroundColor: active
                      ? colors.tagSelectedBg
                      : 'transparent',
                    borderColor: active
                      ? colors.tagSelectedBg
                      : colors.tagBgBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    dynamicStyles.tagText,
                    {
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

      {/* Корзина (очистить всё) */}
      <TouchableOpacity onPress={clearAll} style={[styles.trashButton, dynamicStyles.trashButton]}>
        <Image
          source={icons.delete}
          style={[
            dynamicStyles.trashIcon,
            {
              tintColor:
                selectedTypes.length > 0
                  ? colors.dangerActive
                  : colors.dangerInactive,
            },
          ]}
          resizeMode='contain'
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  trashButton: {},
  scrollContent: { flexGrow: 1 },
  tagWrapper: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  tagText: {},
});
