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
      style={[isWeb && { overflow: 'auto' }]}
    >
      {data.map((item, index) => {
        const key = keyExtractor(item, index);
        const content = renderItem({ item, index });

        return (
          <View
            key={key}
            style={isWeb ? { position: 'relative', zIndex: 10-index } : undefined} // Важно: для web, чтобы убрать класс css-view-g5y9jx влияющий на z-index
          >
            {content}
          </View>
        );
      })}
    </ScrollView>
  );
}
