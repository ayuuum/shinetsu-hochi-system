import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getTodayInTokyo } from "@/lib/date";
import { getSupabaseEnv } from "@/lib/supabase-env";
import { getFastAuthSnapshot } from "@/lib/auth-server";

export async function GET(request: Request) {
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

    const auth = await getFastAuthSnapshot();
    if (auth.role !== "admin" && auth.role !== "hr") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const branch = searchParams.get("branch") || "";

    let query = supabase
        .from("employees")
        .select("*")
        .is("deleted_at", null);
    if (branch) query = query.eq("branch", branch);
    if (q) query = query.or(`name.ilike.%${q}%,name_kana.ilike.%${q}%,employee_number.ilike.%${q}%`);
    query = query.order("employee_number", { ascending: true });

    const { data: employees, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const headers = [
        "社員番号", "氏名", "フリガナ", "生年月日", "性別",
        "電話番号", "メール", "住所", "入社日", "退職日",
        "拠点", "雇用形態", "職種", "役職", "血液型",
    ];

    const rows = (employees || []).map(emp => [
        emp.employee_number,
        emp.name,
        emp.name_kana,
        emp.birth_date || "",
        emp.gender || "",
        emp.phone_number || "",
        emp.email || "",
        emp.address || "",
        emp.hire_date || "",
        emp.termination_date || "",
        emp.branch || "",
        emp.employment_type || "",
        emp.job_title || "",
        emp.position || "",
        emp.blood_type || "",
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="employees_${getTodayInTokyo()}.csv"`,
        },
    });
}
