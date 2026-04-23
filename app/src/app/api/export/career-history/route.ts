import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getTodayInTokyo } from "@/lib/date";
import { getSupabaseEnv } from "@/lib/supabase-env";
import { getFastAuthSnapshot } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
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

    const searchParams = new URL(request.url).searchParams;
    const employeeId = searchParams.get("employeeId");
    const format = searchParams.get("format") || "csv";

    let query = supabase
        .from("construction_records")
        .select("*, employees!inner(name, branch, employee_number)")
        .is("deleted_at", null)
        .is("employees.deleted_at", null)
        .order("construction_date", { ascending: false });

    if (employeeId) {
        query = query.eq("employee_id", employeeId);
    }

    const { data: records, error } = await query;

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
        employees: { name: string; branch: string | null; employee_number: string | null } | null;
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
    const date = getTodayInTokyo();

    if (format === "excel") {
        const htmlRows = ((records || []) as RecordWithEmployee[]).map((r) => `
            <tr>
                <td>${r.employees?.name || ""}</td>
                <td>${r.employees?.employee_number || ""}</td>
                <td>${r.employees?.branch || ""}</td>
                <td>${r.construction_name}</td>
                <td>${r.category || ""}</td>
                <td>${r.construction_date}</td>
                <td>${r.role || ""}</td>
                <td>${r.location || ""}</td>
                <td>${r.notes || ""}</td>
            </tr>
        `).join("");

        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><table border="1">
            <thead><tr><th>社員名</th><th>社員番号</th><th>拠点</th><th>工事名</th><th>カテゴリ</th><th>施工日</th><th>役割</th><th>場所</th><th>備考</th></tr></thead>
            <tbody>${htmlRows}</tbody>
        </table></body></html>`;

        return new NextResponse(html, {
            headers: {
                "Content-Type": "application/vnd.ms-excel; charset=utf-8",
                "Content-Disposition": `attachment; filename="career-history-${date}.xls"`,
            },
        });
    }

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="career-history-${date}.csv"`,
        },
    });
}
