export function normalizeSupabaseEnvValue(value: string | undefined): string {
    return (value ?? "").trim().replace(/\\[rn]/g, "");
}

export function getSupabaseEnv() {
    return {
        url: normalizeSupabaseEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL),
        anonKey: normalizeSupabaseEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    };
}

export function getSupabaseServiceEnv() {
    const url = normalizeSupabaseEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
    const serviceRoleKey = normalizeSupabaseEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY);

    if (!url || !serviceRoleKey) {
        return null;
    }

    return {
        url,
        serviceRoleKey,
    };
}
