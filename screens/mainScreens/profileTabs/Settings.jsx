import { Button, Text, View } from 'react-native';
import { useComponentContext } from '../../../context/globalAppContext';

export default function Settings() {
  const { session } = useComponentContext();
  return (
    <View>
      <Text>Settings Screen</Text>
      <Button title='Log Out' onPress={() => session?.signOut()} />
    </View>
  );
}
