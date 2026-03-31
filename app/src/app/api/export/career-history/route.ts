import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/supabase-env";

export async function GET() {
    const cookieStore = await cookies();
    const { url, anonKey } = getSupabaseEnv();
    const supabase = createServerClient(
        url,
        anonKey,
        {
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
        }
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: records, error } = await supabase
        .from("construction_records")
        .select("*, employees(name, branch)")
        .order("construction_date", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const headers = [
        "社員名", "拠点", "工事名", "カテゴリ", "施工日", "役割", "場所", "備考",
    ];

    type RecordWithEmployee = {
        construction_name: string;
        category: string | null;
        construction_date: string;
        role: string | null;
        location: string | null;
        notes: string | null;
        employees: { name: string; branch: string | null } | null;
    };

    const rows = ((records || []) as RecordWithEmployee[]).map(r => [
        r.employees?.name || "",
        r.employees?.branch || "",
        r.construction_name,
        r.category || "",
        r.construction_date,
        r.role || "",
        r.location || "",
        r.notes || "",
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="career-history-${date}.csv"`,
        },
    });
}
