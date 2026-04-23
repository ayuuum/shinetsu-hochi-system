"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { getAuthSnapshot } from "@/lib/auth-server";
import { createSupabaseServer } from "@/lib/supabase-server";
import {
    qualificationMasterCreateSchema,
    qualificationMasterUpdateSchema,
    toQualificationMasterDbFields,
} from "@/lib/validation/qualification-master";

type ActionResult = { success: true } | { success: false; error: string };

async function requireAdmin(): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
    const { user, role } = await getAuthSnapshot();

    if (!user || role !== "admin") {
        return { ok: false, error: "この操作は管理者のみ実行できます。" };
    }

    return { ok: true, userId: user.id };
}

export async function createQualificationMasterAction(raw: unknown): Promise<ActionResult> {
    const gate = await requireAdmin();
    if (!gate.ok) return { success: false, error: gate.error };

    const parsed = qualificationMasterCreateSchema.safeParse(raw);
    if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message ?? "入力内容を確認してください。";
        return { success: false, error: msg };
    }

    const supabase = await createSupabaseServer();
    const fields = toQualificationMasterDbFields(parsed.data);
    const { error } = await supabase.from("qualification_master").insert(fields);

    if (error) {
        if (error.code === "23505") {
            return { success: false, error: "同じ名前の資格が既に登録されています。" };
        }
        return { success: false, error: error.message || "登録に失敗しました。" };
    }

    revalidatePath("/qualifications/masters");
    revalidatePath("/qualifications");
    revalidatePath("/employees");
    updateTag("qualification-master");
    updateTag("qualifications");
    return { success: true };
}

export async function updateQualificationMasterAction(raw: unknown): Promise<ActionResult> {
    const gate = await requireAdmin();
    if (!gate.ok) return { success: false, error: gate.error };

    const parsed = qualificationMasterUpdateSchema.safeParse(raw);
    if (!parsed.success) {
        const msg = parsed.error.issues[0]?.message ?? "入力内容を確認してください。";
        return { success: false, error: msg };
    }

    const { id, ...rest } = parsed.data;
    const supabase = await createSupabaseServer();
    const fields = toQualificationMasterDbFields(rest);
    const { error } = await supabase.from("qualification_master").update(fields).eq("id", id);

    if (error) {
        if (error.code === "23505") {
            return { success: false, error: "同じ名前の資格が既に登録されています。" };
        }
        return { success: false, error: error.message || "更新に失敗しました。" };
    }

    revalidatePath("/qualifications/masters");
    revalidatePath("/qualifications");
    revalidatePath("/employees");
    updateTag("qualification-master");
    updateTag("qualifications");
    return { success: true };
}

export async function deleteQualificationMasterAction(id: string): Promise<ActionResult> {
    const gate = await requireAdmin();
    if (!gate.ok) return { success: false, error: gate.error };

    const idParsed = z.string().uuid().safeParse(id);
    if (!idParsed.success) {
        return { success: false, error: "無効なIDです。" };
    }

    const supabase = await createSupabaseServer();
    const { error } = await supabase.from("qualification_master").delete().eq("id", idParsed.data);

    if (error) {
        if (error.code === "23503") {
            return {
                success: false,
                error: "この資格は社員の保有資格で使われているため削除できません。",
            };
        }
        return { success: false, error: error.message || "削除に失敗しました。" };
    }

    revalidatePath("/qualifications/masters");
    revalidatePath("/qualifications");
    revalidatePath("/employees");
    updateTag("qualification-master");
    updateTag("qualifications");
    return { success: true };
}
