// import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
// import AsyncStorage from '@react-native-async-storage/async-storage';

let SUPABASE_URL, SUPABASE_ANON_KEY;

SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    // detectSessionInUrl: false, // Отключаем автоматический парсинг URL для предотвращения ошибок при открытии приложения через deep link
  },
});