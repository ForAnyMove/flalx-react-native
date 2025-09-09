import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View, Platform } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useComponentContext } from '../context/globalAppContext';
import { useWindowInfo } from '../context/windowContext';
import { useTranslation } from 'react-i18next';

const CARD_MARGIN = 8;

export default function NewJobTemplateCard({ templateTitle, imageSource }) {
  const { themeController } = useComponentContext();
  const { height, isLandscape } = useWindowInfo();
  const { t } = useTranslation();

  const isWebLandscape = Platform.OS === 'web' && isLandscape;

  // размеры карточки для web-landscape считаем от height
  const sizes = {
    cardWidth: isWebLandscape ? height * 0.22 : RFValue(120),
    cardRadius: isWebLandscape ? height * 0.007 : RFValue(4),
    shadowRadius: isWebLandscape ? height * 0.001 : RFValue(2),
    font: isWebLandscape ? height * 0.018 : RFValue(9),
    icon: isWebLandscape ? height * 0.04 : RFValue(26),
    padding: isWebLandscape ? height * 0.008 : RFValue(6),
  };

  return (
    <View
      style={[
        styles.card,
        {
          width: sizes.cardWidth,
          borderRadius: sizes.cardRadius,
          shadowRadius: sizes.shadowRadius,
          backgroundColor: themeController.current?.defaultBlocksBackground,
        },
      ]}
    >
      {imageSource ? (
        <Image
          source={{ uri: imageSource }}
          style={styles.image}
          resizeMode="cover"
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
            name="image-outline"
            size={sizes.icon}
            color={themeController.current?.defaultBlocksMockColor}
          />
        </View>
      )}
      <Text
        style={[
          styles.title,
          {
            fontSize: sizes.font,
            color: themeController.current?.textColor,
            paddingHorizontal: sizes.padding,
            paddingVertical: sizes.padding,
          },
        ]}
      >
        {t(`jobTypes.${templateTitle}`)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: CARD_MARGIN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    elevation: 3,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  placeholder: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontWeight: '500',
  },
});
