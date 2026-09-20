import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY - check .env.'
  );
}

/**
 * Client for the Supabase backend (see supabase/migrations/). Uses the
 * publishable/anon key, so access is governed by Row Level Security, not
 * by this key being secret.
 *
 * `auth.storage` persists the session in AsyncStorage so signing in
 * survives an app restart; `detectSessionInUrl` is off because there's
 * no browser URL to parse a token out of on a native device.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
