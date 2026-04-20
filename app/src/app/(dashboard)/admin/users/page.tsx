import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getAuthSnapshot } from "@/lib/auth-server";
import { UsersClient, type UserRow } from "./users-client";

function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

export default async function AdminUsersPage() {
    const { user, role } = await getAuthSnapshot();

    if (!user || role !== "admin") {
        redirect("/");
    }

    const adminClient = createAdminClient();

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
