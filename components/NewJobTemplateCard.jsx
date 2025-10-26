import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View, Platform, TouchableOpacity } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useComponentContext } from '../context/globalAppContext';
import { useWindowInfo } from '../context/windowContext';
import { useTranslation } from 'react-i18next';
import { scaleByHeight } from '../utils/resizeFuncs';
import { icons } from '../constants/icons';

const CARD_MARGIN = 8;

export default function NewJobTemplateCard({
  templateTitle,
  imageSource,
  likeStatus,
  switchLikeStatus,
}) {
  const { themeController } = useComponentContext();
  const { height, isLandscape } = useWindowInfo();
  const { t } = useTranslation();

  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  // размеры карточки для web-landscape считаем от height
  const sizes = {
    cardWidth: isWebLandscape ? scaleByHeight(242, height) : RFValue(120),
    cardHeight: isWebLandscape ? scaleByHeight(212, height) : RFValue(120),
    cardRadius: isWebLandscape ? scaleByHeight(8, height) : RFValue(4),
    font: isWebLandscape ? scaleByHeight(14, height) : RFValue(9),
    icon: isWebLandscape ? height * 0.04 : RFValue(26),
    padding: isWebLandscape ? height * 0.008 : RFValue(6),
    textPaddingVertical: isWebLandscape ? scaleByHeight(15, height) : RFValue(4),
    textMarginBottom: isWebLandscape ? scaleByHeight(14, height) : RFValue(4),
    textPaddingHorizontal: isWebLandscape ? scaleByHeight(16, height) : RFValue(6),
    imageContainerHeight: isWebLandscape
      ? scaleByHeight(138, height)
      : RFValue(70),
    likeIconSize: isWebLandscape ? scaleByHeight(40, height) : RFValue(25),
  };

  return (
    <View
      style={[
        styles.card,
        {
          width: sizes.cardWidth,
          height: sizes.cardHeight,
          borderRadius: sizes.cardRadius,
          backgroundColor: themeController.current?.formInputBackground,
        },
      ]}
    >
      <View
        style={{
          height: sizes.imageContainerHeight,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {imageSource ? (
          <Image
            source={{ uri: imageSource }}
            style={styles.image}
            resizeMode='cover'
          />
        ) : (
          <View
            style={[
              styles.placeholder,
              {
                backgroundColor:
                  themeController.current?.defaultBlocksMockBackground,
              },
            ]}
          >
            <Ionicons
              name='image-outline'
              size={sizes.icon}
              color={themeController.current?.defaultBlocksMockColor}
            />
          </View>
        )}
      </View>
      <Text
        style={[
          styles.title,
          {
            fontSize: sizes.font,
            color: themeController.current?.primaryColor,
            paddingHorizontal: sizes.textPaddingHorizontal,
            paddingTop: sizes.textPaddingVertical,
            marginBottom: sizes.textMarginBottom,
          },
        ]}
        numberOfLines={1}
        ellipsisMode='tail'
      >
        {t(`jobTypes.${templateTitle}`)}
      </Text>
      <Text
        style={[
          styles.title,
          {
            fontSize: sizes.font,
            color: themeController.current?.buttonColorSecondaryDefault,
            paddingHorizontal: sizes.textPaddingHorizontal,
            paddingBottom: sizes.textPaddingVertical,
            textDecoration: 'underline',
          },
        ]}
      >
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
    margin: CARD_MARGIN,
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
