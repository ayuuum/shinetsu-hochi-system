"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getStrictAuthSnapshot } from "@/lib/auth-server";

type UserRole = "admin" | "hr" | "technician";

type ActionResult =
    | { success: true }
    | { success: false; error: string };

function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

async function requireAdmin(): Promise<
    { ok: true; userId: string } | { ok: false; error: string }
> {
    const { user, role } = await getStrictAuthSnapshot();
    if (!user) {
        redirect("/login");
        return { ok: false, error: "ログインが必要です。" };
    }
    if (role !== "admin") {
        return { ok: false, error: "権限がありません" };
    }
    return { ok: true, userId: user.id };
}

export async function inviteUserAction(
    email: string,
    role: UserRole,
    employeeId?: string | null
): Promise<ActionResult> {
    const auth = await requireAdmin();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    try {
        const adminClient = createAdminClient();

        const { data, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email);
        if (inviteError) {
            console.error("Failed to invite user:", inviteError);
            if (inviteError.message.includes("already been registered")) {
                return { success: false, error: "このメールアドレスは既に登録されています。" };
            }
            return { success: false, error: "招待メールの送信に失敗しました。" };
        }

        const userId = data.user.id;
        const { error: upsertError } = await adminClient
            .from("user_roles")
            .upsert(
                {
                    id: userId,
                    role,
                    employee_id: role === "technician" ? employeeId || null : null,
                },
                { onConflict: "id" },
            );

        if (upsertError) {
            console.error("Failed to upsert user_roles after invite:", upsertError);
            return { success: false, error: "ロールの設定に失敗しました。" };
        }

        revalidatePath("/admin/users");
        updateTag("user-roles");
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while inviting user:", error);
        return { success: false, error: "招待メールの送信に失敗しました。" };
    }
}

// メール送信に依存せず、管理者が初期パスワードを直接設定してアカウントを作成する。
// 作成したパスワードは管理者が本人に直接伝える運用。
export async function createUserWithPasswordAction(
    email: string,
    password: string,
    role: UserRole,
    employeeId?: string | null
): Promise<ActionResult> {
    const auth = await requireAdmin();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
        return { success: false, error: "メールアドレスを入力してください。" };
    }
    if (password.length < 8) {
        return { success: false, error: "パスワードは8文字以上にしてください。" };
    }

    try {
        const adminClient = createAdminClient();
        const { data, error: createError } = await adminClient.auth.admin.createUser({
            email: trimmedEmail,
            password,
            email_confirm: true,
        });

        if (createError) {
            console.error("Failed to create user:", createError);
            if (createError.message.toLowerCase().includes("already")) {
                return { success: false, error: "このメールアドレスは既に登録されています。" };
            }
            return { success: false, error: "ユーザーの作成に失敗しました。" };
        }

        const userId = data.user.id;
        const { error: upsertError } = await adminClient
            .from("user_roles")
            .upsert(
                {
                    id: userId,
                    role,
                    employee_id: role === "technician" ? employeeId || null : null,
                },
                { onConflict: "id" },
            );

        if (upsertError) {
            console.error("Failed to upsert user_roles after create:", upsertError);
            return { success: false, error: "ロールの設定に失敗しました。" };
        }

        revalidatePath("/admin/users");
        updateTag("user-roles");
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while creating user:", error);
        return { success: false, error: "ユーザーの作成に失敗しました。" };
    }
}

// メール送信に依存せず、管理者が対象ユーザーのパスワードを直接再設定する。
export async function resetUserPasswordAction(
    userId: string,
    newPassword: string
): Promise<ActionResult> {
    const auth = await requireAdmin();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    if (newPassword.length < 8) {
        return { success: false, error: "パスワードは8文字以上にしてください。" };
    }

    try {
        const adminClient = createAdminClient();
        const { error } = await adminClient.auth.admin.updateUserById(userId, {
            password: newPassword,
        });

        if (error) {
            console.error("Failed to reset user password:", error);
            return { success: false, error: "パスワードの再設定に失敗しました。" };
        }

        return { success: true };
    } catch (error) {
        console.error("Unexpected error while resetting password:", error);
        return { success: false, error: "パスワードの再設定に失敗しました。" };
    }
}

export async function updateUserRoleAction(
    userId: string,
    role: UserRole
): Promise<ActionResult> {
    const auth = await requireAdmin();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    if (userId === auth.userId) {
        return { success: false, error: "自分自身のロールは変更できません。" };
    }

    try {
        const adminClient = createAdminClient();
        const { error } = await adminClient
            .from("user_roles")
            .upsert(
                {
                    id: userId,
                    role,
                    ...(role !== "technician" ? { employee_id: null } : {}),
                },
                { onConflict: "id" },
            );

        if (error) {
            console.error("Failed to update user role:", error);
            return { success: false, error: "ロールの更新に失敗しました。" };
        }

        revalidatePath("/admin/users");
        updateTag("user-roles");
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while updating user role:", error);
        return { success: false, error: "ロールの更新に失敗しました。" };
    }
}

export async function updateUserEmployeeLinkAction(
    userId: string,
    employeeId: string | null
): Promise<ActionResult> {
    const auth = await requireAdmin();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    try {
        const adminClient = createAdminClient();
        const { error } = await adminClient
            .from("user_roles")
            .update({ employee_id: employeeId })
            .eq("id", userId)
            .eq("role", "technician");

        if (error) {
            console.error("Failed to update user employee link:", error);
            return { success: false, error: "社員情報の紐づけに失敗しました。" };
        }

        revalidatePath("/admin/users");
        updateTag("user-roles");
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while updating user employee link:", error);
        return { success: false, error: "社員情報の紐づけに失敗しました。" };
    }
}

export async function deleteUserAction(userId: string): Promise<ActionResult> {
    const auth = await requireAdmin();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    if (userId === auth.userId) {
        return { success: false, error: "自分自身のアカウントは削除できません。" };
    }

    try {
        const adminClient = createAdminClient();
        const { error } = await adminClient.auth.admin.deleteUser(userId);

        if (error) {
            console.error("Failed to delete user:", error);
            return { success: false, error: "ユーザーの削除に失敗しました。" };
        }

        revalidatePath("/admin/users");
        updateTag("user-roles");
        return { success: true };
    } catch (error) {
        console.error("Unexpected error while deleting user:", error);
        return { success: false, error: "ユーザーの削除に失敗しました。" };
    }
}
