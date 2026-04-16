import { createSupabaseServer } from "@/lib/supabase-server";
import { getAuthSnapshot } from "@/lib/auth-server";
import { AlcoholClient, type AlcoholCheckRow } from "@/components/alcohol/alcohol-client";
import { getTodayInTokyo } from "@/lib/date";

const PAGE_SIZE = 50;

function parsePageParam(value?: string) {
    const parsed = Number.parseInt(value || "1", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function AlcoholChecksPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; date?: string; location?: string; status?: string; employee?: string }>;
}) {
    const params = await searchParams;
    const page = parsePageParam(params.page);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const currentDate = (params.date || "").trim() || getTodayInTokyo();
    const currentLocation = (params.location || "").trim();
    const currentStatus = (params.status || "").trim();
    const currentEmployee = (params.employee || "").trim();

    let checksData: AlcoholCheckRow[] = [];
    let empData: { id: string; name: string }[] = [];
    let totalPages = 1;

    try {
        const auth = await getAuthSnapshot();
        const supabase = await createSupabaseServer();
        const dateStart = `${currentDate}T00:00:00`;
        const dateEnd = `${currentDate}T23:59:59`;

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

        const [checksResult, empResult] = await Promise.all([
            checksQuery,
            employeesQuery,
        ]);
        checksData = (checksResult.data as AlcoholCheckRow[]) || [];
        empData = empResult.data || [];
        totalPages = Math.max(1, Math.ceil((checksResult.count || 0) / PAGE_SIZE));
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
            currentPage={page}
            totalPages={totalPages}
        />
    );
}
