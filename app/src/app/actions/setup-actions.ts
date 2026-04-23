"use server";

import { updateTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";

type SetupResult =
    | { success: true }
    | { success: false; error: string };

function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

export async function setupAction(email: string, password: string): Promise<SetupResult> {
    try {
        const adminClient = createAdminClient();

        // Check if any admin already exists
        const { count, error: countError } = await adminClient
            .from("user_roles")
            .select("*", { count: "exact", head: true })
            .eq("role", "admin");

        if (countError) {
            console.error("Failed to count admin users:", countError);
            return { success: false, error: "データベースの確認に失敗しました。" };
        }

        if (count !== null && count > 0) {
            return { success: false, error: "セットアップは完了しています。" };
        }

        // Create the admin user
        const { data, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (createError) {
            console.error("Failed to create admin user:", createError);
            if (createError.message.includes("already been registered") || createError.message.includes("already exists")) {
                return { success: false, error: "このメールアドレスは既に登録されています。" };
            }
            return { success: false, error: "ユーザーの作成に失敗しました。" };
        }

        const userId = data.user.id;

        // Insert admin role
        const { error: insertError } = await adminClient
            .from("user_roles")
            .insert({ id: userId, role: "admin" });

        if (insertError) {
            console.error("Failed to insert user_roles:", insertError);
            // Rollback: delete the created user
            await adminClient.auth.admin.deleteUser(userId);
            return { success: false, error: "ロールの設定に失敗しました。" };
        }

        updateTag("user-roles");
        return { success: true };
    } catch (error) {
        console.error("Unexpected error in setupAction:", error);
        return { success: false, error: "セットアップに失敗しました。" };
    }
}

export async function getAdminCount(): Promise<number> {
    try {
        const adminClient = createAdminClient();
        const { count } = await adminClient
            .from("user_roles")
            .select("*", { count: "exact", head: true })
            .eq("role", "admin");
        return count ?? 0;
    } catch {
        return 0;
    }
}
