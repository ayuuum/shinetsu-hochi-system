import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getTodayInTokyo, getTokyoCalendarMonthBounds } from "@/lib/date";
import { getSupabaseEnv } from "@/lib/supabase-env";
import { getFastAuthSnapshot } from "@/lib/auth-server";
import { Tables } from "@/types/supabase";

type AlcoholCheckExportRow = Tables<"alcohol_checks"> & {
    employee: Pick<Tables<"employees">, "name"> | null;
    checker: Pick<Tables<"employees">, "name"> | null;
};

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

    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const format = searchParams.get("format") || "csv";
    const report = searchParams.get("report");
    const month = searchParams.get("month") || getTodayInTokyo().slice(0, 7);

    if (report === "monthly") {
        const { start, end } = getTokyoCalendarMonthBounds(`${month}-01`);
        const [{ data: employees, error: employeeError }, { data: checks, error: checksError }] = await Promise.all([
            supabase
                .from("employees")
                .select("id, name, branch")
                .is("deleted_at", null)
                .order("branch")
                .order("name"),
            supabase
                .from("alcohol_checks")
                .select("employee_id, check_datetime")
                .is("deleted_at", null)
                .gte("check_datetime", `${start}T00:00:00`)
                .lte("check_datetime", `${end}T23:59:59`),
        ]);

        if (employeeError || checksError) {
            return NextResponse.json({ error: employeeError?.message || checksError?.message }, { status: 500 });
        }

        const recordedDaysByEmployee = new Map<string, Set<string>>();
        for (const row of checks || []) {
            if (!row.employee_id || !row.check_datetime) continue;
            const current = recordedDaysByEmployee.get(row.employee_id) ?? new Set<string>();
            current.add(row.check_datetime.slice(0, 10));
            recordedDaysByEmployee.set(row.employee_id, current);
        }

        const monthDays = Number(end.slice(-2));
        const headers = ["対象月", "拠点", "社員名", "記録日数", "月日数", "記録率(%)"];
        const lines = (employees || []).map((employee) => {
            const recordedDays = recordedDaysByEmployee.get(employee.id)?.size ?? 0;
            const rate = monthDays > 0 ? Math.round((recordedDays / monthDays) * 100) : 0;
            return [month, employee.branch || "", employee.name, recordedDays, monthDays, rate];
        });

        if (format === "excel") {
            const htmlRows = lines.map((line) => `<tr>${line.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("");
            return new NextResponse(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><table border="1"><thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead><tbody>${htmlRows}</tbody></table></body></html>`, {
                headers: {
                    "Content-Type": "application/vnd.ms-excel; charset=utf-8",
                    "Content-Disposition": `attachment; filename="alcohol-monthly-report-${month}.xls"`,
                },
            });
        }

        const csv = "\uFEFF" + [headers.join(","), ...lines.map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))].join("\n");
        return new NextResponse(csv, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="alcohol-monthly-report-${month}.csv"`,
            },
        });
    }

    let query = supabase
        .from("alcohol_checks")
        .select("*, employee:employees!alcohol_checks_employee_id_fkey(name), checker:employees!alcohol_checks_checker_id_fkey(name)")
        .is("deleted_at", null)
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

    const rows = ((checks || []) as AlcoholCheckExportRow[]).map((c) => [
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

    if (format === "excel") {
        const htmlRows = ((checks || []) as AlcoholCheckExportRow[]).map((c) => `
            <tr>
                <td>${c.check_datetime || ""}</td>
                <td>${c.employee?.name || ""}</td>
                <td>${c.check_type || ""}</td>
                <td>${c.checker?.name || ""}</td>
                <td>${c.measured_value != null ? String(c.measured_value) : ""}</td>
                <td>${c.is_abnormal ? "不適正" : "適正"}</td>
                <td>${c.location || ""}</td>
                <td>${c.notes || ""}</td>
            </tr>
        `).join("");

        return new NextResponse(`<!DOCTYPE html><html><head><meta charset="utf-8"></head><body><table border="1"><thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead><tbody>${htmlRows}</tbody></table></body></html>`, {
            headers: {
                "Content-Type": "application/vnd.ms-excel; charset=utf-8",
                "Content-Disposition": `attachment; filename="alcohol_checks_${getTodayInTokyo()}.xls"`,
            },
        });
    }

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="alcohol_checks_${getTodayInTokyo()}.csv"`,
        },
    });
}
