export function normalizeSupabaseEnvValue(value: string | undefined): string {
    return (value ?? "").trim().replace(/\\[rn]/g, "");
}

export function getSupabaseEnv() {
    return {
        url: normalizeSupabaseEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL),
        anonKey: normalizeSupabaseEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    };
}
