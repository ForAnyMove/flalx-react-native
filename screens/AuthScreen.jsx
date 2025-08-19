import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Button,
  TextInput,
} from 'react-native';
import { useComponentContext } from '../context/globalAppContext';
import { RFValue } from 'react-native-responsive-fontsize';
import { useState } from 'react';

export default function AuthScreen() {
  const {session} = useComponentContext();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  return (
    <>
          {session?.status ? (
            <>
              <Text style={styles.success}>Добро пожаловать, {email}!</Text>
              <Button title="Выйти" onPress={() => session?.signOut()} />
            </>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder='Введите email'
                value={email}
                onChangeText={setEmail}
                keyboardType='email-address'
              />
              <Button title='Получить код' onPress={()=>session?.sendCode(email)} />

              <TextInput
                style={styles.input}
                placeholder='Введите 6-значный код'
                value={code}
                onChangeText={setCode}
                keyboardType='numeric'
              />
              <Button title='Войти' onPress={()=>session?.checkCode(code)} />
            </>
          )}
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
