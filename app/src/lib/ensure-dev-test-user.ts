import "server-only";
import type { User } from "@supabase/supabase-js";
import { createSupabaseAdmin } from "@/lib/supabase-admin";

/** ローカル検証用（開発時のみ API から使用） */
export const DEV_TEST_LOGIN_EMAIL = "test@gmail.com";
export const DEV_TEST_LOGIN_PASSWORD = "test1234";
const DEV_TEST_ROLE = "admin" as const;

async function findUserByEmail(admin: NonNullable<ReturnType<typeof createSupabaseAdmin>>, email: string): Promise<User | null> {
    const normalized = email.toLowerCase();
    let page = 1;
    for (;;) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
        if (error) {
            throw new Error(error.message);
        }
        const found = data.users.find((u) => (u.email ?? "").toLowerCase() === normalized);
        if (found) {
            return found;
        }
        if (data.users.length < 1000) {
            return null;
        }
        page += 1;
    }
}

/**
 * 開発環境専用: 固定のテストユーザーが Auth / user_roles に存在するよう保証する。
 * SUPABASE_SERVICE_ROLE_KEY が .env.local にあることが前提。
 */
export async function ensureDevTestUser(): Promise<{ ok: true } | { ok: false; reason: string }> {
    if (process.env.NODE_ENV !== "development") {
        return { ok: false, reason: "forbidden" };
    }
    const admin = createSupabaseAdmin();
    if (!admin) {
        return { ok: false, reason: "no_service_role" };
    }

    try {
        const existing = await findUserByEmail(admin, DEV_TEST_LOGIN_EMAIL);
        let userId: string;

        if (!existing) {
            const { data: created, error: createErr } = await admin.auth.admin.createUser({
                email: DEV_TEST_LOGIN_EMAIL,
                password: DEV_TEST_LOGIN_PASSWORD,
                email_confirm: true,
            });
            if (createErr) {
                return { ok: false, reason: createErr.message };
            }
            userId = created.user.id;
        } else {
            userId = existing.id;
            const { error: updateErr } = await admin.auth.admin.updateUserById(userId, {
                password: DEV_TEST_LOGIN_PASSWORD,
                email_confirm: true,
            });
            if (updateErr) {
                return { ok: false, reason: updateErr.message };
            }
        }

        const { error: roleErr } = await admin.from("user_roles").upsert(
            { id: userId, role: DEV_TEST_ROLE },
            { onConflict: "id" },
        );
        if (roleErr) {
            return { ok: false, reason: roleErr.message };
        }

        return { ok: true };
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return { ok: false, reason: message };
    }
}
