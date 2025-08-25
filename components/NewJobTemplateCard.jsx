import { Ionicons } from '@expo/vector-icons';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { useComponentContext } from '../context/globalAppContext';

import { RFValue } from 'react-native-responsive-fontsize';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;
const ASPECT_RATIO = SCREEN_WIDTH / SCREEN_HEIGHT;

let numColumns = 2;
if (ASPECT_RATIO > 3 / 4) numColumns = 3;
if (ASPECT_RATIO > 4 / 3) numColumns = 4;

const CONTAINER_HORIZONTAL_PADDING = 32; // 16 * 2 из твоего контейнера
const CARD_MARGIN = 8;

const totalSpacing = CARD_MARGIN * 2 * numColumns + CONTAINER_HORIZONTAL_PADDING;
const CARD_WIDTH = ((SCREEN_WIDTH - totalSpacing) / numColumns) * 0.9; // Уменьшаем ширину карточки на 5% для отступов

export default function NewJobTemplateCard({ templateTitle, imageSource }) {
  const { themeController } = useComponentContext();

  return (
    <View style={[styles.card, { width: CARD_WIDTH, backgroundColor: themeController.current?.defaultBlocksBackground }]}>
      {imageSource ? (
        <Image
          source={{ uri: imageSource }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: themeController.current?.defaultBlocksMockBackground }]}>
          <Ionicons name="image-outline" size={RFValue(26)} color={themeController.current?.defaultBlocksMockColor} />
        </View>
      )}
      <Text style={styles.title}>{templateTitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: CARD_MARGIN,
    borderRadius: RFValue(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: RFValue(2),
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
    paddingHorizontal: RFValue(6),
    paddingVertical: RFValue(6),
    fontSize: RFValue(9),
  },
});
