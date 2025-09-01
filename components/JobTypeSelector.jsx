import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform, Image } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTranslation } from 'react-i18next';
import { useWindowInfo } from '../context/windowContext';
import { useComponentContext } from '../context/globalAppContext';
import { icons } from '../constants/icons';

export default function JobTypeSelector({ selectedTypes, setSelectedTypes }) {
  const { t } = useTranslation();
  const { height, isLandscape } = useWindowInfo();
  const { themeController } = useComponentContext();

  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = {
    font:       isWebLandscape ? height * 0.012 : RFValue(9),
    padH:       isWebLandscape ? height * 0.012 : RFValue(10),
    padV:       isWebLandscape ? height * 0.007 : RFValue(5),
    radius:     isWebLandscape ? height * 0.006 : RFValue(5),
    rowGap:     isWebLandscape ? height * 0.01  : RFValue(6),
    colGap:     isWebLandscape ? height * 0.01  : RFValue(6),
    twoRowsH:   isWebLandscape ? height * 0.05  : RFValue(40),
    trashSize:  isWebLandscape ? height * 0.022 : RFValue(18),
  };

  const colors = {
    tagBg:            themeController.current?.formInputBackground,
    tagText:          themeController.current?.unactiveTextColor || '#777',
    tagSelectedBg:    themeController.current?.buttonColorPrimaryDefault,
    tagSelectedText:  themeController.current?.buttonTextColorPrimary,
    divider:          themeController.current?.breakLineColor,
    dangerActive:     'red' || '#d00',
    dangerInactive:   themeController.current?.unactiveTextColor || '#999',
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
    <View style={styles.container}>
      {/* Корзина (очистить всё) */}
      <TouchableOpacity onPress={clearAll} style={styles.trashButton}>
        <Image
          source={icons.delete}
          style={{
            width: sizes.trashSize,
            height: sizes.trashSize,
            tintColor: selectedTypes.length > 0 ? colors.dangerActive : colors.dangerInactive,
          }}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Теги */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.tagWrapper,
            { rowGap: sizes.rowGap, columnGap: sizes.colGap, height: sizes.twoRowsH },
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
                    paddingVertical: sizes.padV,
                    borderRadius: sizes.radius,
                    backgroundColor: active ? colors.tagSelectedBg : colors.tagBg,
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
  container: { flexDirection: 'row', alignItems: 'flex-start', padding: RFValue(4) },
  trashButton: { marginRight: RFValue(6) },
  scrollContent: { flexGrow: 1 },
  tagWrapper: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: {},
  tagText: {},
});
