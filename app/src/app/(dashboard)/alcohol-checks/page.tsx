import { createSupabaseServer } from "@/lib/supabase-server";
import { getAuthSnapshot } from "@/lib/auth-server";
import { AlcoholClient, type AlcoholCheckRow } from "@/components/alcohol/alcohol-client";
import { getTodayInTokyo, getTokyoCalendarMonthBounds } from "@/lib/date";

const PAGE_SIZE = 50;

function parsePageParam(value?: string) {
    const parsed = Number.parseInt(value || "1", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AlcoholChecksPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; date?: string; location?: string; status?: string; employee?: string; month?: string }>;
}) {
    const params = await searchParams;
    const page = parsePageParam(params.page);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const currentDate = (params.date || "").trim() || getTodayInTokyo();
    const currentLocation = (params.location || "").trim();
    const currentStatus = (params.status || "").trim();
    const currentEmployee = (params.employee || "").trim();
    const currentMonth = (params.month || currentDate.slice(0, 7)).trim();

    let checksData: AlcoholCheckRow[] = [];
    let empData: { id: string; name: string }[] = [];
    let totalPages = 1;
    let monthlySummary: { employeeId: string; employeeName: string; branch: string; recordedDays: number; monthDays: number; completionRate: number }[] = [];

    try {
        const auth = await getAuthSnapshot();
        const supabase = await createSupabaseServer();
        const dateStart = `${currentDate}T00:00:00`;
        const dateEnd = `${currentDate}T23:59:59`;
        const monthBounds = getTokyoCalendarMonthBounds(`${currentMonth}-01`);

        let checksQuery = supabase
            .from("alcohol_checks")
            .select("*, employee:employees!alcohol_checks_employee_id_fkey(id, name), checker:employees!alcohol_checks_checker_id_fkey(id, name)", { count: "exact" })
            .is("deleted_at", null)
            .gte("check_datetime", dateStart)
            .lte("check_datetime", dateEnd)
            .order("check_datetime", { ascending: false })
            .range(from, to);

        if (currentLocation) {
            checksQuery = checksQuery.eq("location", currentLocation);
        }

        if (currentStatus === "abnormal") {
            checksQuery = checksQuery.eq("is_abnormal", true);
        }
        if (currentStatus === "normal") {
            checksQuery = checksQuery.eq("is_abnormal", false);
        }

        if (currentEmployee) {
            checksQuery = checksQuery.eq("employee_id", currentEmployee);
        }

        let employeesQuery = supabase
            .from("employees")
            .select("id, name")
            .is("deleted_at", null)
            .order("name");

        if (auth.role === "technician" && auth.linkedEmployeeId) {
            employeesQuery = employeesQuery.eq("id", auth.linkedEmployeeId);
        }

        const monthlyQuery = supabase
            .from("alcohol_checks")
            .select("employee_id, check_datetime, employees!alcohol_checks_employee_id_fkey(name, branch)")
            .is("deleted_at", null)
            .gte("check_datetime", `${monthBounds.start}T00:00:00`)
            .lte("check_datetime", `${monthBounds.end}T23:59:59`);

        const [checksResult, empResult, monthlyResult] = await Promise.all([
            checksQuery,
            employeesQuery,
            monthlyQuery,
        ]);
        checksData = (checksResult.data as AlcoholCheckRow[]) || [];
        empData = empResult.data || [];
        totalPages = Math.max(1, Math.ceil((checksResult.count || 0) / PAGE_SIZE));

        const monthlyChecks = monthlyResult.data || [];
        const recordedDaysByEmployee = new Map<string, Set<string>>();
        const metaByEmployee = new Map<string, { name: string; branch: string }>();

        for (const row of monthlyChecks) {
            if (!row.employee_id) continue;
            const dateKey = row.check_datetime?.slice(0, 10);
            if (!dateKey) continue;
            const current = recordedDaysByEmployee.get(row.employee_id) ?? new Set<string>();
            current.add(dateKey);
            recordedDaysByEmployee.set(row.employee_id, current);
            const employeeMeta = row.employees as { name: string | null; branch: string | null } | null;
            metaByEmployee.set(row.employee_id, {
                name: employeeMeta?.name || "不明",
                branch: employeeMeta?.branch || "未設定",
            });
        }

        const monthDays = Number(monthBounds.end.slice(-2));
        monthlySummary = empData.map((employee) => {
            const recordedDays = recordedDaysByEmployee.get(employee.id)?.size ?? 0;
            const meta = metaByEmployee.get(employee.id);
            return {
                employeeId: employee.id,
                employeeName: meta?.name || employee.name,
                branch: meta?.branch || "未設定",
                recordedDays,
                monthDays,
                completionRate: monthDays > 0 ? Math.round((recordedDays / monthDays) * 100) : 0,
            };
        }).sort((a, b) => b.completionRate - a.completionRate || a.employeeName.localeCompare(b.employeeName, "ja"));
    } catch (e) {
        console.error("Failed to load alcohol checks:", e);
    }

    return (
        <AlcoholClient
            initialChecks={checksData}
            employees={empData}
            currentDate={currentDate}
            currentLocation={currentLocation}
            currentStatus={currentStatus}
            currentEmployee={currentEmployee}
            currentMonth={currentMonth}
            monthlySummary={monthlySummary}
            currentPage={page}
            totalPages={totalPages}
        />
    );
}
