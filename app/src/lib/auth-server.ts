import "server-only";
import { cache } from "react";
import { createSupabaseServer } from "@/lib/supabase-server";
import type { AuthUser, UserRole } from "@/lib/auth-types";

export const getAuthSnapshot = cache(async (): Promise<{ user: AuthUser; role: UserRole }> => {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
        console.error("Failed to load authenticated user:", userError);
    }

    if (!user) {
        return { user: null, role: null };
    }

    const { data: roleRow, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    if (roleError) {
        console.error("Failed to load user role:", roleError);
    }

    return {
        user: {
            id: user.id,
            email: user.email ?? null,
        },
        role: (roleRow?.role as UserRole) ?? null,
    };
});
