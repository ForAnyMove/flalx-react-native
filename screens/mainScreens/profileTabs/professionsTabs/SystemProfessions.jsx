import React, { useMemo, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import SearchPanel from '../../../../components/SearchPanel';
import {
  scaleByHeight,
  scaleByHeightMobile,
} from '../../../../utils/resizeFuncs';
import { useWindowInfo } from '../../../../context/windowContext';
import { useComponentContext } from '../../../../context/globalAppContext';
import RegisterProfessionModal from '../../../../components/RegisterProfessionModal';
import { icons } from '../../../../constants/icons';

const SystemProfessions = () => {
  const [searchValue, setSearchValue] = useState('');
  const { height } = useWindowDimensions();
  const { isLandscape } = useWindowInfo();
  const isWebLandscape = isLandscape && Platform.OS === 'web';
  const { themeController, languageController } = useComponentContext();
  const isRTL = languageController.isRTL;

  const [isAdding, setIsAdding] = useState(false);

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      containerPaddingH: isWebLandscape ? web(10) : mobile(10),
      containerPaddingV: isWebLandscape ? web(14) : mobile(14),
      scrollContainerPaddingBottom: isWebLandscape ? web(20) : mobile(20),
      plusButtonSize: isWebLandscape ? web(64) : mobile(64),
      plusButtonLeft: isWebLandscape ? web(32) : mobile(16),
      plusButtonRight: isWebLandscape ? web(32) : mobile(16),
      plusButtonBottom: isWebLandscape ? web(16) : mobile(16),
      plusIconSize: isWebLandscape ? web(24) : mobile(24),
      plusButtonShadowColor: '#000',
      plusButtonShadowOffset: {
        width: 0,
        height: isWebLandscape ? web(4) : mobile(4),
      },
      plusButtonShadowOpacity: 0.3,
      plusButtonShadowRadius: isWebLandscape ? web(5) : mobile(5),
      plusButtonElevation: isWebLandscape ? 10 : 8,
    };
  }, [height, isWebLandscape]);

  const add = () => {
    // Логика добавления новой профессии
    setIsAdding(true);
  };

  return (
    <>
      <View
        style={[
          styles.container,
          {
            backgroundColor: themeController.current?.backgroundColor,
            direction: isRTL ? 'rtl' : 'ltr',
            paddingHorizontal: sizes.containerPaddingH,
            paddingVertical: sizes.containerPaddingV,
          },
        ]}
      >
        <View>
          <SearchPanel
            searchValue={searchValue}
            setSearchValue={setSearchValue}
          />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            { paddingBottom: sizes.scrollContainerPaddingBottom },
          ]}
        ></ScrollView>
        {/* Кнопка + */}
        <TouchableOpacity
          style={{
            backgroundColor: themeController.current?.mainBadgeBackground,
            width: sizes.plusButtonSize,
            height: sizes.plusButtonSize,
            borderRadius: sizes.plusButtonSize,
            justifyContent: 'center',
            alignItems: 'center',
            position: 'absolute',
            ...(isRTL
              ? {
                  left: sizes.plusButtonLeft,
                }
              : {
                  right: sizes.plusButtonRight,
                }),
            bottom: sizes.plusButtonBottom,
            shadowColor: sizes.plusButtonShadowColor,
            shadowOffset: sizes.plusButtonShadowOffset,
            shadowOpacity: sizes.plusButtonShadowOpacity,
            shadowRadius: sizes.plusButtonShadowRadius,
            elevation: sizes.plusButtonElevation,
          }}
          onPress={add}
        >
          <Image
            source={icons.plus}
            style={{
              width: sizes.plusIconSize,
              height: sizes.plusIconSize,
              tintColor: themeController.current?.buttonTextColorPrimary,
            }}
            resizeMode='contain'
          />
        </TouchableOpacity>
      </View>
      <RegisterProfessionModal visible={isAdding} onClose={() => setIsAdding(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  scrollContainer: {
    flexGrow: 1,
  },
});

export default SystemProfessions;
