import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useComponentContext } from '../../../context/globalAppContext';
import SearchPanel from '../../../components/SearchPanel';
import { icons } from '../../../constants/icons';
import { useMemo, useState } from 'react';
import { useWindowInfo } from '../../../context/windowContext';
import { scaleByHeight, scaleByHeightMobile } from '../../../utils/resizeFuncs';
import { LICENSES } from '../../../constants/licenses';
import { FontAwesome6 } from '@expo/vector-icons';

export default function Profession() {
  const { user, themeController } = useComponentContext();
  const [searchValue, setSearchValue] = useState('');
  const { height } = useWindowDimensions();
  const { isLandscape } = useWindowInfo();

  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = useMemo(() => {
    const web = (size) => scaleByHeight(size, height);
    const mobile = (size) => scaleByHeightMobile(size, height);

    return {
      padding: isWebLandscape ? web(10) : mobile(10),
      containerRadius: isWebLandscape ? web(5) : mobile(5),
      containerPaddingV: isWebLandscape ? web(10) : mobile(10),
      containerPaddingH: isWebLandscape ? web(14) : mobile(14),
      containerGap: isWebLandscape ? web(8) : mobile(8),
      containerMarginBottom: isWebLandscape ? web(8) : mobile(8),
      iconSize: isWebLandscape ? web(14) : mobile(14),
      titleFontSize: isWebLandscape ? web(12) : mobile(10),
      markerFontSize: isWebLandscape ? web(12) : mobile(10),
      plusButtonSize: isWebLandscape ? web(45) : mobile(45),
      plusButtonRadius: isWebLandscape ? web(25) : mobile(25),
      plusButtonBottom: isWebLandscape ? web(20) : mobile(20),
      plusButtonRight: isWebLandscape ? web(40) : mobile(20),
    };
  }, [height, isWebLandscape]);

  return (
    <View
      style={[
        styles.professionScreen,
        {
          backgroundColor: themeController.current?.backgroundColor,
          padding: sizes.padding,
        },
      ]}
    >
      <SearchPanel searchValue={searchValue} setSearchValue={setSearchValue} />
      <ScrollView>
        {user.current?.professions
          ?.filter((val) =>
            LICENSES[val].toLowerCase().includes(searchValue.toLowerCase())
          )
          .map((prof, index) => (
            <View
              key={index}
              style={[
                styles.professionContainer,
                {
                  backgroundColor: themeController.current?.formInputBackground,
                  borderRadius: sizes.containerRadius,
                  paddingVertical: sizes.containerPaddingV,
                  paddingHorizontal: sizes.containerPaddingH,
                  gap: sizes.containerGap,
                  marginBottom: sizes.containerMarginBottom,
                },
              ]}
            >
              <FontAwesome6
                name='check'
                size={sizes.iconSize}
                color={themeController.current?.textColor}
              />
              <Image
                source={icons.checkCircle}
                style={[
                  {
                    width: sizes.iconSize,
                    height: sizes.iconSize,
                    tintColor: themeController.current?.textColor,
                  },
                ]}
                resizeMode='contain'
              />
              <Text
                style={[
                  styles.professionTitle,
                  {
                    color: themeController.current?.textColor,
                    fontSize: sizes.titleFontSize,
                  },
                ]}
              >
                {LICENSES[prof]}
              </Text>
              {true && (
                <Text
                  style={[
                    styles.verifiedMarker,
                    {
                      color: themeController.current?.unactiveTextColor,
                      fontSize: sizes.markerFontSize,
                    },
                  ]}
                >
                  verified
                </Text>
              )}
            </View>
          ))}
      </ScrollView>
      <TouchableOpacity
        style={{
          backgroundColor: themeController.current?.mainBadgeBackground,
          width: sizes.plusButtonSize,
          height: sizes.plusButtonSize,
          borderRadius: sizes.plusButtonRadius,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          right: sizes.plusButtonRight,
          bottom: sizes.plusButtonBottom,
        }}
        // onPress={() => router.push('/new-job-modal')}
      >
        <Image
          source={icons.plus}
          style={[
            {
              width: sizes.iconSize,
              height: sizes.iconSize,
              tintColor: themeController.current?.badgeTextColor,
            },
          ]}
          resizeMode='contain'
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  professionScreen: {
    flex: 1,
  },
  professionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  professionTitle: {
    fontWeight: '500',
  },
  verifiedMarker: {
    textAlign: 'right',
    flex: 1,
  },
});
