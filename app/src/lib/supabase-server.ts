import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '../types/supabase';
import { getSupabaseEnv } from './supabase-env';

export async function createSupabaseServer() {
    const cookieStore = await cookies();
    const { url, anonKey } = getSupabaseEnv();

    return createServerClient<Database>(
        url,
        anonKey,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // Server Componentからのset呼び出しは無視
                    }
                },
            },
        }
    );
}
