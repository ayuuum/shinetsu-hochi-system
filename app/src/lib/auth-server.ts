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
    linkedEmployeeName: string | null;
};

type CachedRoleSnapshot = {
    role: UserRole;
    linkedEmployeeId: string | null;
    linkedEmployeeName: string | null;
};

const EMPTY_AUTH_SNAPSHOT: AuthSnapshot = {
    user: null,
    role: null,
    linkedEmployeeId: null,
    linkedEmployeeName: null,
};

export const getCachedUserRoleSnapshot = unstable_cache(
    async (userId: string): Promise<CachedRoleSnapshot> => {
        const supabase = createSupabaseAdmin();
        if (!supabase) {
            return { role: null, linkedEmployeeId: null, linkedEmployeeName: null };
        }
        const { data: roleRow, error } = await supabase
            .from("user_roles")
            .select("role, employee_id, employees(name)")
            .eq("id", userId)
            .maybeSingle();

        if (error) {
            console.error("Failed to load cached user role:", error);
        }

        const employee = roleRow?.employees as { name: string } | null | undefined;

        return {
            role: (roleRow?.role as UserRole) ?? null,
            linkedEmployeeId: roleRow?.employee_id ?? null,
            linkedEmployeeName: employee?.name ?? null,
        };
    },
    ["user-role-snapshot"],
    { revalidate: 300, tags: ["user-roles"] }
);

export const getFastAuthSnapshot = cache(async (): Promise<AuthSnapshot> => {
    const supabase = await createSupabaseServer();
    // getSession() は Cookie 内の JWT を署名検証しないため、権限判定には使わない。
    // getUser() は Supabase Auth サーバーで JWT を検証するため、サービスロールで
    // RLS を迂回するページの権限判定でも安全に使える（React cache でリクエスト毎に1回）。
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
        // 未ログイン時も AuthSessionMissingError が返るため、通常運用ではログ不要
        if (userError.name !== "AuthSessionMissingError") {
            console.error("Failed to load authenticated user:", userError);
        }
    }

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
        linkedEmployeeName: roleSnapshot.linkedEmployeeName,
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
        .select("role, employee_id, employees(name)")
        .eq("id", user.id)
        .maybeSingle();

    if (roleError) {
        console.error("Failed to load user role:", roleError);
    }

    const employee = roleRow?.employees as { name: string } | null | undefined;

    return {
        user: {
            id: user.id,
            email: user.email ?? null,
        },
        role: (roleRow?.role as UserRole) ?? null,
        linkedEmployeeId: roleRow?.employee_id ?? null,
        linkedEmployeeName: employee?.name ?? null,
    };
});

export const getAuthSnapshot = getStrictAuthSnapshot;
