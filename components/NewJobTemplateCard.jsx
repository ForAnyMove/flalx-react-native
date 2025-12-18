import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  StyleSheet,
  Text,
  View,
  Platform,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import { useTranslation } from 'react-i18next';
import { scaleByHeight, scaleByHeightMobile } from '../utils/resizeFuncs';
import { icons } from '../constants/icons';
import { useMemo } from 'react';

export default function NewJobTemplateCard({
  templateTitle,
  imageSource,
  likeStatus,
  switchLikeStatus,
}) {
  const { themeController } = useComponentContext();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const { t } = useTranslation();

  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  const sizes = useMemo(
    () => ({
      cardMargin: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(4, height),
      cardWidth: isWebLandscape
        ? scaleByHeight(242, height)
        : (width - scaleByHeightMobile(20, height)) / 2 -
        scaleByHeightMobile(17, height),
      cardHeight: isWebLandscape
        ? scaleByHeight(212, height)
        : scaleByHeightMobile(164, height),
      cardRadius: isWebLandscape
        ? scaleByHeight(8, height)
        : scaleByHeightMobile(4, height),
      font: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(14, height),
      icon: isWebLandscape ? height * 0.04 : scaleByHeightMobile(41, height),
      padding: isWebLandscape ? height * 0.008 : scaleByHeightMobile(6, height),
      textPaddingVertical: isWebLandscape
        ? scaleByHeight(15, height)
        : scaleByHeightMobile(8, height),
      textMarginBottom: isWebLandscape
        ? scaleByHeight(14, height)
        : scaleByHeightMobile(4, height),
      textPaddingHorizontal: isWebLandscape
        ? scaleByHeight(16, height)
        : scaleByHeightMobile(6, height),
      imageContainerHeight: isWebLandscape
        ? scaleByHeight(138, height)
        : scaleByHeightMobile(100, height),
      likeIconSize: isWebLandscape
        ? scaleByHeight(40, height)
        : scaleByHeightMobile(25, height),
    }),
    [isWebLandscape, height, width]
  );

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          margin: sizes.cardMargin,
          width: sizes.cardWidth,
          height: sizes.cardHeight,
          borderRadius: sizes.cardRadius,
          backgroundColor: themeController.current?.formInputBackground,
        },
        imageContainer: {
          height: sizes.imageContainerHeight,
          overflow: 'hidden',
          position: 'relative',
        },
        placeholder: {
          backgroundColor: themeController.current?.defaultBlocksMockBackground,
        },
        icon: {
          color: themeController.current?.defaultBlocksMockColor,
        },
        titleText: {
          fontSize: sizes.font,
          color: themeController.current?.primaryColor,
          paddingHorizontal: sizes.textPaddingHorizontal,
          paddingTop: sizes.textPaddingVertical,
          marginBottom: sizes.textMarginBottom,
        },
        readMoreText: {
          fontSize: sizes.font,
          color: themeController.current?.buttonColorSecondaryDefault,
          paddingHorizontal: sizes.textPaddingHorizontal,
          paddingBottom: sizes.textPaddingVertical,
          textDecorationLine: 'underline',
        },
      }),
    [sizes, themeController]
  );

  return (
    <View style={[styles.card, dynamicStyles.card]}>
      <View style={dynamicStyles.imageContainer}>
        {imageSource ? (
          <Image
            source={{ uri: imageSource }}
            style={styles.image}
            resizeMode='cover'
          />
        ) : (
          <View style={[styles.placeholder, dynamicStyles.placeholder]}>
            <Ionicons
              name='image-outline'
              size={sizes.icon}
              style={dynamicStyles.icon}
            />
          </View>
        )}
      </View>
      <Text
        style={[styles.title, dynamicStyles.titleText]}
        numberOfLines={1}
        ellipsizeMode='tail'
      >
        {`${templateTitle}`}
      </Text>
      <Text style={[styles.title, dynamicStyles.readMoreText]}>
        {t(`common.readMore`)}
      </Text>
      {/* <TouchableOpacity
        onPress={switchLikeStatus}
        style={[
          styles.likeIcon,
        ]}
      >
        <Image
          source={likeStatus ? icons.likeOn : icons.likeOff}
          style={{
            width: sizes.likeIconSize,
            height: sizes.likeIconSize,
          }}
          resizeMode='cover'
        />
      </TouchableOpacity> */}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.3,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '500',
  },
  likeIcon: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
