import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAuthSnapshot } from "@/lib/auth-server";
import { HealthChecksClient, type HealthCheckWithEmployee } from "@/components/health-checks/health-checks-client";
import { normalizeHealthCheckListResultValue } from "@/lib/display-labels";
import { getCachedEmployeeList, getCachedHealthChecksPage } from "@/lib/cached-queries";

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
    const authPromise = getAuthSnapshot();
    const paramsPromise = searchParams;
    const [auth, params] = await Promise.all([authPromise, paramsPromise]);
    if (auth.role === "technician") {
        redirect("/me");
    }

    const currentPage = parsePageParam(params.page);
    const from = (currentPage - 1) * PAGE_SIZE;
    const toPlusOne = from + PAGE_SIZE;
    const currentSearch = (params.q || "").trim();
    const currentType = (params.type || "").trim();
    const currentResult = normalizeHealthCheckListResultValue((params.result || "").trim());

    let checkData: HealthCheckWithEmployee[] = [];
    let empData: { id: string; name: string }[] = [];
    let hasNextPage = false;

    try {
        const employeeListPromise = getCachedEmployeeList();

        if (!currentSearch && !currentType && !currentResult) {
            const [cachedPage, empResult] = await Promise.all([
                getCachedHealthChecksPage(currentPage),
                employeeListPromise,
            ]);

            checkData = cachedPage.items as HealthCheckWithEmployee[];
            hasNextPage = cachedPage.hasNextPage;
            empData = empResult;
        } else {
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
                employeeListPromise,
            ]);

            let checkQuery = supabase
                .from("health_checks")
                .select("*, employees!inner(id, name, branch)")
                .is("deleted_at", null)
                .is("employees.deleted_at", null)
                .order("check_date", { ascending: false })
                .range(from, toPlusOne);

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
            const items = (checkResult.data as HealthCheckWithEmployee[]) || [];
            checkData = items.slice(0, PAGE_SIZE);
            hasNextPage = items.length > PAGE_SIZE;
            empData = empResult;
        }
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
            hasNextPage={hasNextPage}
        />
    );
}
