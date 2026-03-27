import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../types/supabase';
import { getSupabaseEnv } from './supabase-env';

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseEnv();

export const supabase = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
