import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Button,
  TextInput,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';

export default function OnboardingScreen() {
  return (
    <>
      <Text style={styles.success}>Добро пожаловать!</Text>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  block: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  title: {
    fontSize: RFValue(18),
    fontWeight: 'bold',
    marginBottom: 10,
  },
  item: {
    fontSize: RFValue(14),
    marginBottom: 5,
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 5,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    marginVertical: 10,
    padding: 10,
    borderRadius: 8,
  },
  success: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'green',
  },
});
