// Monthly alcohol check summary CSV export API
// Returns per-employee recorded days, month days, and completion rate for a given month.
// Query param: ?month=YYYY-MM (defaults to current month in Tokyo time)

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getTodayInTokyo, getTokyoCalendarMonthBounds } from "@/lib/date";
import { getSupabaseEnv } from "@/lib/supabase-env";

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

    // Auth check
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get("month") || getTodayInTokyo().slice(0, 7);

    const { start, end } = getTokyoCalendarMonthBounds(`${month}-01`);

    const [{ data: employees, error: employeeError }, { data: checks, error: checksError }] = await Promise.all([
        supabase
            .from("employees")
            .select("id, employee_number, name, branch")
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
        return NextResponse.json(
            { error: employeeError?.message || checksError?.message },
            { status: 500 }
        );
    }

    // Aggregate recorded days per employee
    const recordedDaysByEmployee = new Map<string, Set<string>>();
    for (const row of checks || []) {
        if (!row.employee_id || !row.check_datetime) continue;
        const current = recordedDaysByEmployee.get(row.employee_id) ?? new Set<string>();
        current.add(row.check_datetime.slice(0, 10));
        recordedDaysByEmployee.set(row.employee_id, current);
    }

    const monthDays = Number(end.slice(-2));
    const headers = ["社員番号", "氏名", "拠点", "記録日数", "月日数", "記録率(%)"];

    const lines = (employees || []).map((employee) => {
        const recordedDays = recordedDaysByEmployee.get(employee.id)?.size ?? 0;
        const rate = monthDays > 0 ? Math.round((recordedDays / monthDays) * 100) : 0;
        return [
            employee.employee_number ?? "",
            employee.name,
            employee.branch ?? "",
            recordedDays,
            monthDays,
            rate,
        ];
    });

    const csv =
        "\uFEFF" +
        [
            headers.join(","),
            ...lines.map((line) =>
                line
                    .map((value) => `"${String(value).replace(/"/g, '""')}"`)
                    .join(",")
            ),
        ].join("\n");

    return new NextResponse(csv, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="alcohol-monthly-report-${month}.csv"`,
        },
    });
}
