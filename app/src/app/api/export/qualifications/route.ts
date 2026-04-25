import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { differenceInDays } from "date-fns";
import { getTodayInTokyo } from "@/lib/date";
import { getSupabaseEnv } from "@/lib/supabase-env";
import { getFastAuthSnapshot } from "@/lib/auth-server";

function getStatus(expiryDate: string | null): string {
    if (!expiryDate) return "有効期限なし";
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return "期限切れ";
    if (days <= 14) return "14日以内";
    if (days <= 30) return "30日以内";
    if (days <= 60) return "60日以内";
    return "正常";
}

export async function GET(request: Request) {
    const cookieStore = await cookies();
    const { url, anonKey } = getSupabaseEnv();
    const supabase = createServerClient(url, anonKey, {
        cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {}
            },
        },
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const auth = await getFastAuthSnapshot();
    if (auth.role !== "admin" && auth.role !== "hr") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const level = searchParams.get("level") || "";

    const { data: qualifications, error } = await supabase
        .from("employee_qualifications")
        .select("*, employees(employee_number, name, branch), qualification_master(name, category)")
        .order("expiry_date", { ascending: true, nullsFirst: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    let rows = (qualifications || []).filter((q_row) => {
        const emp = q_row.employees as { employee_number: string; name: string; branch: string | null } | null;
        const master = q_row.qualification_master as { name: string; category: string | null } | null;

        if (q) {
            const keyword = q.toLowerCase();
            const matchEmp = emp?.name?.toLowerCase().includes(keyword) || emp?.employee_number?.toLowerCase().includes(keyword);
            const matchQual = master?.name?.toLowerCase().includes(keyword);
            if (!matchEmp && !matchQual) return false;
        }
        if (category && master?.category !== category) return false;
        if (level) {
            const days = q_row.expiry_date ? differenceInDays(new Date(q_row.expiry_date), new Date()) : null;
            if (level === "danger" && (days === null || days >= 0)) return false;
            if (level === "urgent" && (days === null || days < 0 || days > 14)) return false;
            if (level === "warning" && (days === null || days < 0 || days > 30)) return false;
            if (level === "info" && (days === null || days < 0 || days > 60)) return false;
        }
        return true;
    });

    const csvHeaders = ["社員番号", "氏名", "拠点", "資格名", "カテゴリ", "取得日", "有効期限", "残日数", "ステータス"];

    const csvRows = rows.map((q_row) => {
        const emp = q_row.employees as { employee_number: string; name: string; branch: string | null } | null;
        const master = q_row.qualification_master as { name: string; category: string | null } | null;
        const days = q_row.expiry_date ? differenceInDays(new Date(q_row.expiry_date), new Date()) : null;
        return [
            emp?.employee_number || "",
            emp?.name || "",
            emp?.branch || "",
            master?.name || "",
            master?.category || "",
            q_row.acquired_date || "",
            q_row.expiry_date || "",
            days !== null ? String(days) : "",
            getStatus(q_row.expiry_date),
        ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
    });

    const csv = "﻿" + [csvHeaders.join(","), ...csvRows].join("\n");

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="qualifications_${getTodayInTokyo()}.csv"`,
        },
    });
}
