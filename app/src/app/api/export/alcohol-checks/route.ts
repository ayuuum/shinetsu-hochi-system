import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let query = supabase
        .from("alcohol_checks")
        .select("*, employee:employees!alcohol_checks_employee_id_fkey(name), checker:employees!alcohol_checks_checker_id_fkey(name)")
        .order("check_datetime", { ascending: false });

    if (from) query = query.gte("check_datetime", from);
    if (to) query = query.lte("check_datetime", to + "T23:59:59");

    const { data: checks, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const headers = [
        "検査日時", "社員名", "種別", "確認者",
        "検知値(mg/L)", "判定", "拠点", "備考",
    ];

    const rows = (checks || []).map((c: any) => [
        c.check_datetime || "",
        c.employee?.name || "",
        c.check_type || "",
        c.checker?.name || "",
        c.measured_value != null ? String(c.measured_value) : "",
        c.is_abnormal ? "不適正" : "適正",
        c.location || "",
        c.notes || "",
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="alcohol_checks_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
    });
}
