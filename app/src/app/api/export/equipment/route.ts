import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getTodayInTokyo } from "@/lib/date";
import { getSupabaseEnv } from "@/lib/supabase-env";

export async function GET() {
    const cookieStore = await cookies();
    const { url, anonKey } = getSupabaseEnv();
    const supabase = createServerClient(url, anonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                } catch {}
            },
        },
    });

    const {
        data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: rows, error } = await supabase
        .from("equipment_items")
        .select("management_number, name, category, purchase_date, purchase_amount, branch, notes")
        .is("deleted_at", null)
        .order("management_number", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const headers = ["管理番号", "品名", "カテゴリ", "購入日", "購入金額", "所属部署・拠点", "備考"];

    const lines = (rows || []).map((row) =>
        [
            row.management_number,
            row.name,
            row.category || "",
            row.purchase_date || "",
            row.purchase_amount != null ? String(row.purchase_amount) : "",
            row.branch || "",
            row.notes || "",
        ]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(","),
    );

    const csv = "\uFEFF" + [headers.join(","), ...lines].join("\n");

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="equipment_${getTodayInTokyo()}.csv"`,
        },
    });
}
