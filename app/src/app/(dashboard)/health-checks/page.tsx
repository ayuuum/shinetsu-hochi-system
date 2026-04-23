import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAuthSnapshot } from "@/lib/auth-server";
import { HealthChecksClient, type HealthCheckWithEmployee } from "@/components/health-checks/health-checks-client";
import { normalizeHealthCheckListResultValue } from "@/lib/display-labels";

const PAGE_SIZE = 50;

function parsePageParam(value?: string) {
    const parsed = Number.parseInt(value || "1", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildInCondition(column: string, ids: string[]) {
    return ids.length > 0 ? `${column}.in.(${ids.join(",")})` : null;
}

export default async function HealthChecksPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; q?: string; type?: string; result?: string }>;
}) {
    const auth = await getAuthSnapshot();
    if (auth.role === "technician") {
        redirect("/me");
    }

    const params = await searchParams;
    const currentPage = parsePageParam(params.page);
    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const currentSearch = (params.q || "").trim();
    const currentType = (params.type || "").trim();
    const currentResult = normalizeHealthCheckListResultValue((params.result || "").trim());

    let checkData: HealthCheckWithEmployee[] = [];
    let empData: { id: string; name: string }[] = [];
    let totalPages = 1;

    try {
        const supabase = await createSupabaseServer();
        const searchPattern = currentSearch ? `%${currentSearch.replace(/,/g, " ").trim()}%` : null;

        const [employeeSearchResult, empResult] = await Promise.all([
            currentSearch
                ? supabase
                    .from("employees")
                    .select("id")
                    .is("deleted_at", null)
                    .ilike("name", searchPattern!)
                    .limit(100)
                : Promise.resolve({ data: [] as { id: string }[], error: null }),
            supabase
                .from("employees")
                .select("id, name")
                .is("deleted_at", null)
                .order("name"),
        ]);

        let checkQuery = supabase
            .from("health_checks")
            .select("*, employees!inner(id, name, branch)", { count: "exact" })
            .is("deleted_at", null)
            .is("employees.deleted_at", null)
            .order("check_date", { ascending: false })
            .range(from, to);

        if (currentType) {
            checkQuery = checkQuery.eq("check_type", currentType);
        }

        if (currentResult === "normal") {
            checkQuery = checkQuery.eq("is_normal", true);
        }
        if (currentResult === "abnormal") {
            checkQuery = checkQuery.eq("is_normal", false);
        }

        if (currentSearch) {
            const employeeCondition = buildInCondition("employee_id", (employeeSearchResult.data || []).map((item) => item.id));
            checkQuery = checkQuery.or([
                `hospital_name.ilike.${searchPattern}`,
                employeeCondition,
            ].filter(Boolean).join(","));
        }

        const checkResult = await checkQuery;

        checkData = (checkResult.data as HealthCheckWithEmployee[]) || [];
        totalPages = Math.max(1, Math.ceil((checkResult.count || 0) / PAGE_SIZE));
        empData = empResult.data || [];
    } catch (e) {
        console.error("Failed to load health checks:", e);
    }

    return (
        <HealthChecksClient
            initialChecks={checkData}
            employees={empData}
            currentSearch={currentSearch}
            currentType={currentType}
            currentResult={currentResult}
            currentPage={currentPage}
            totalPages={totalPages}
        />
    );
}
