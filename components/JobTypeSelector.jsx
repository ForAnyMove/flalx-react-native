import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  Image,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTranslation } from 'react-i18next';
import { useWindowInfo } from '../context/windowContext';
import { useComponentContext } from '../context/globalAppContext';
import { icons } from '../constants/icons';
import { scaleByHeight } from '../utils/resizeFuncs';

export default function JobTypeSelector({ selectedTypes, setSelectedTypes }) {
  const { t } = useTranslation();
  const { height, isLandscape } = useWindowInfo();
  const { themeController, languageController } = useComponentContext();

  const isRTL = languageController?.isRTL;
  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = {
    font: isWebLandscape ? scaleByHeight(14, height) : RFValue(9),
    padH: isWebLandscape ? scaleByHeight(11, height) : RFValue(10),
    height: isWebLandscape ? scaleByHeight(34, height) : RFValue(25),
    radius: isWebLandscape ? scaleByHeight(4, height) : RFValue(5),
    rowGap: isWebLandscape ? scaleByHeight(9, height) : RFValue(6),
    colGap: isWebLandscape ? scaleByHeight(8, height) : RFValue(6),
    twoRowsH: isWebLandscape ? scaleByHeight(78, height) : RFValue(40),
    trashSize: isWebLandscape ? scaleByHeight(32, height) : RFValue(18),
    maxScrollWidth: isWebLandscape ? scaleByHeight(5200, height) : '520%',
    trashSizeMargin: isWebLandscape ? scaleByHeight(18, height) : RFValue(8),
    containerWidth: isWebLandscape ? scaleByHeight(830, height) : '100%',
    containerMarginBottom: isWebLandscape ? scaleByHeight(30, height) : RFValue(15),
  };

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

  return (
    <View style={[styles.container, { width: sizes.containerWidth, marginBottom: sizes.containerMarginBottom }]}>
      {/* Теги */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.tagWrapper,
            {
              rowGap: sizes.rowGap,
              columnGap: sizes.colGap,
              height: sizes.twoRowsH,
              width: sizes.maxScrollWidth,
            },
          ]}
        >
          {Object.entries(jobTypes || {})?.map(([key, label]) => {
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

      {/* Корзина (очистить всё) */}
      <TouchableOpacity
        onPress={clearAll}
        style={[
          styles.trashButton,
          { [isRTL ? 'marginRight' : 'marginLeft']: sizes.trashSizeMargin },
        ]}
      >
        <Image
          source={icons.delete}
          style={{
            width: sizes.trashSize,
            height: sizes.trashSize,
            tintColor:
              selectedTypes.length > 0
                ? colors.dangerActive
                : colors.dangerInactive,
          }}
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
    padding: RFValue(4),
  },
  trashButton: {
    // marginRight: RFValue(6)
  },
  scrollContent: { flexGrow: 1 },
  tagWrapper: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  tagText: {},
});
