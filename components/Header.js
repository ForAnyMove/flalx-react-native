import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RFPercentage, RFValue } from 'react-native-responsive-fontsize';
import { useComponentContext } from '../context/globalAppContext';

export default function Header({ switchToProfile }) {
  const { themeController } = useComponentContext();
  const router = useRouter();
  const userAvatar = null; // Здесь позже будет аватар

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeController.current?.backgroundColor },
      ]}
    >
      <Text style={styles.logoText}>Flalx</Text>
      <TouchableOpacity onPress={() => switchToProfile()}>
        {userAvatar ? (
          <Image source={{ uri: userAvatar }} style={styles.avatar} />
        ) : (
          <Ionicons
            name='person-circle-outline'
            size={RFValue(30)}
            color='#888'
          />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: RFPercentage(7),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: RFValue(12),
  },
  logoText: {
    fontSize: RFValue(18),
    textTransform: 'uppercase',
    fontWeight: 'bold',
    color: '#0A62EA',
  },
  avatar: {
    width: RFValue(20),
    height: RFValue(20),
    borderRadius: RFValue(20),
  },
});
