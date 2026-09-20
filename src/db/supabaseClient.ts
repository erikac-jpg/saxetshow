import 'react-native-url-polyfill/auto';

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
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
