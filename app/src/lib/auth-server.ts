import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { createSupabaseServer } from "@/lib/supabase-server";
import type { AuthUser, UserRole } from "@/lib/auth-types";

export type AuthSnapshot = {
    user: AuthUser;
    role: UserRole;
    linkedEmployeeId: string | null;
};

type CachedRoleSnapshot = {
    role: UserRole;
    linkedEmployeeId: string | null;
};

const EMPTY_AUTH_SNAPSHOT: AuthSnapshot = {
    user: null,
    role: null,
    linkedEmployeeId: null,
};

export const getCachedUserRoleSnapshot = unstable_cache(
    async (userId: string): Promise<CachedRoleSnapshot> => {
        const supabase = createSupabaseAdmin();
        if (!supabase) {
            return { role: null, linkedEmployeeId: null };
        }
        const { data: roleRow, error } = await supabase
            .from("user_roles")
            .select("role, employee_id")
            .eq("id", userId)
            .maybeSingle();

        if (error) {
            console.error("Failed to load cached user role:", error);
        }

        return {
            role: (roleRow?.role as UserRole) ?? null,
            linkedEmployeeId: roleRow?.employee_id ?? null,
        };
    },
    ["user-role-snapshot"],
    { revalidate: 300, tags: ["user-roles"] }
);

export const getFastAuthSnapshot = cache(async (): Promise<AuthSnapshot> => {
    const supabase = await createSupabaseServer();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
        console.error("Failed to load auth session:", sessionError);
    }

    const user = session?.user;
    if (!user) {
        return EMPTY_AUTH_SNAPSHOT;
    }

    const roleSnapshot = await getCachedUserRoleSnapshot(user.id);
    return {
        user: {
            id: user.id,
            email: user.email ?? null,
        },
        role: roleSnapshot.role,
        linkedEmployeeId: roleSnapshot.linkedEmployeeId,
    };
});

export const getStrictAuthSnapshot = cache(async (): Promise<AuthSnapshot> => {
    const supabase = await createSupabaseServer();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
        console.error("Failed to load authenticated user:", userError);
    }

    if (!user) {
        return EMPTY_AUTH_SNAPSHOT;
    }

    const { data: roleRow, error: roleError } = await supabase
        .from("user_roles")
        .select("role, employee_id")
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
        linkedEmployeeId: roleRow?.employee_id ?? null,
    };
});

export const getAuthSnapshot = getStrictAuthSnapshot;
