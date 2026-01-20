import { createClient } from '@supabase/supabase-js';

let SUPABASE_URL, SUPABASE_ANON_KEY;

SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
