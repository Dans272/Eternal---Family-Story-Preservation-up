import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || supabaseUrl.trim() === '') {
  throw new Error(
    '[supabaseClient] Missing env var: VITE_SUPABASE_URL\n' +
    'Add it to .env.local or your Vercel project settings.'
  );
}
if (!supabaseAnonKey || supabaseAnonKey.trim() === '') {
  throw new Error(
    '[supabaseClient] Missing env var: VITE_SUPABASE_ANON_KEY\n' +
    'Add it to .env.local or your Vercel project settings.'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
