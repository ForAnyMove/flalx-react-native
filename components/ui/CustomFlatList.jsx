import { Platform, ScrollView, View } from 'react-native';

export default function CustomFlatList({
  data = [],
  renderItem,
  keyExtractor = (_, index) => index.toString(),
  contentContainerStyle,
  horizontal = false,
  keyboardShouldPersistTaps = 'never',
}) {
  const isWeb = Platform.OS === 'web';

  return (
    <ScrollView
      horizontal={horizontal}
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      style={[isWeb && { overflow: 'auto', maxWidth: '100%', overflowX: 'hidden' }]}
    >
      {data.map((item, index) => {
        const key = keyExtractor(item, index);
        const content = renderItem({ item, index });

        return (
          <View
            key={key}
            style={{ position: 'relative', zIndex: 100 - index, ...(isWeb ? {} : { elevation: 100 - index, shadowColor: 'transparent' }) }} // Важно: для правильного отображения выпадающих списков
          >
            {content}
          </View>
        );
      })}
    </ScrollView>
  );
}
