import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { config } from '../../config';

// Session in AsyncStorage for the beta; SecureStore is parked until public launch (README, parked list).
export const supabase = createClient(config.supabaseUrl || 'http://localhost:54321', config.supabaseKey || 'missing', {
  auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});
