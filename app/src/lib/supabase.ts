import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../types/supabase';
import { getSupabaseEnv } from './supabase-env';

function createSupabaseBrowser() {
    const { url, anonKey } = getSupabaseEnv();
    return createBrowserClient<Database>(url, anonKey);
}

let _supabase: ReturnType<typeof createSupabaseBrowser> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseBrowser>, {
    get(_target, prop, receiver) {
        if (!_supabase) {
            _supabase = createSupabaseBrowser();
        }
        const value = Reflect.get(_supabase, prop, receiver);
        if (typeof value === 'function') {
            return value.bind(_supabase);
        }
        return value;
    },
});
