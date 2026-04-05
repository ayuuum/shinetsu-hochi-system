import "server-only";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import { getSupabaseServiceEnv } from "@/lib/supabase-env";

export function createSupabaseAdmin() {
    const env = getSupabaseServiceEnv();
    if (!env) {
        return null;
    }

    return createClient<Database>(env.url, env.serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
