import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getFastAuthSnapshot } from "@/lib/auth-server";
import { UsersClient, type UserRow } from "./users-client";

function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return null;
    return createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

export default async function AdminUsersPage() {
    const { user, role } = await getFastAuthSnapshot();

    if (!user || role !== "admin") {
        redirect("/dashboard");
    }

    const adminClient = createAdminClient();

    if (!adminClient) {
        return (
            <div className="p-6 space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">ユーザー管理</h1>
                <p className="text-sm text-destructive">
                    システム設定に問題があります。サーバーの認証キーが未設定です。技術担当者に連絡してください。
                </p>
            </div>
        );
    }

    const [listUsersResult, rolesResult] = await Promise.all([
        adminClient.auth.admin.listUsers({ perPage: 1000 }),
        adminClient.from("user_roles").select("id, role, employee_id"),
    ]);

    const { data: usersData, error: usersError } = listUsersResult;
    const { data: rolesData, error: rolesError } = rolesResult;

    if (usersError) {
        console.error("Failed to list users:", usersError);
    }
    if (rolesError) {
        console.error("Failed to fetch user_roles:", rolesError);
    }

    const rolesMap = new Map<string, { role: string | null; employee_id: string | null }>();
    for (const row of rolesData ?? []) {
        rolesMap.set(row.id, { role: row.role, employee_id: row.employee_id });
    }

    const rows: UserRow[] = (usersData?.users ?? []).map((u) => {
        const roleRow = rolesMap.get(u.id);
        return {
            id: u.id,
            email: u.email ?? null,
            role: (roleRow?.role ?? null) as UserRow["role"],
            lastSignInAt: u.last_sign_in_at ?? null,
        };
    });

    return <UsersClient users={rows} currentUserId={user.id} />;
}
