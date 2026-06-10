import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { EmployeesClient, type EmployeeWithQualCount } from "@/components/employees/employees-client";
import { getCachedQualCountsByEmployee, getCachedQualificationMasters } from "@/lib/cached-queries";
import { Tables } from "@/types/supabase";

const PAGE_SIZE = 50;

// 一覧で渡してよい安全なカラム（機微カラムは含めない）。
// 一般アカウントも社員一覧を閲覧できるため、保険番号等は送らない。
const EMPLOYEE_LIST_COLUMNS: string = "id,employee_number,name,name_kana,branch,job_title,hire_date,person_type,partner_company,partner_contact_name";

function parsePageParam(value?: string) {
    const parsed = Number.parseInt(value || "1", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function EmployeesPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; q?: string; branch?: string; qualification?: string; sort?: string; type?: string }>;
}) {
    const params = await searchParams;

    const page = parsePageParam(params.page);
    const from = (page - 1) * PAGE_SIZE;
    const toPlusOne = from + PAGE_SIZE;
    const currentSearch = (params.q || "").trim();
    const currentBranch = (params.branch || "").trim();
    const currentQualification = (params.qualification || "").trim();
    const currentSort = (params.sort || "").trim();
    const currentPersonType = params.type === "partner" ? "partner" : params.type === "all" ? "all" : "employee";

    let employees: EmployeeWithQualCount[] = [];
    let mastersData: Tables<"qualification_master">[] = [];
    let hasNextPage = false;

    try {
        // 社員一覧は一般アカウントも閲覧可能。RLS では本人行しか見えないため、
        // 安全なカラムに限定したうえでサービスロールで全件取得する。
        const supabase = createSupabaseAdmin();
        if (!supabase) throw new Error("Service role client is unavailable");
        const searchPattern = currentSearch ? `%${currentSearch.replace(/,/g, " ").trim()}%` : null;

        const [masters, qualificationFilterResult, cachedQualCounts] = await Promise.all([
            getCachedQualificationMasters(),
            currentQualification
                ? supabase
                    .from("employee_qualifications")
                    .select("employee_id")
                    .eq("qualification_id", currentQualification)
                    .limit(5000)
                : Promise.resolve({ data: [] as { employee_id: string | null }[], error: null }),
            getCachedQualCountsByEmployee(),
        ]);

        mastersData = masters as typeof mastersData;
        const qualificationEmployeeIds = (qualificationFilterResult.data || [])
            .map((item) => item.employee_id)
            .filter((employeeId): employeeId is string => !!employeeId);

        if (!currentQualification || qualificationEmployeeIds.length > 0) {
            const sortColumn =
                currentSort === "hire_date_desc" || currentSort === "hire_date_asc" ? "hire_date" :
                currentSort === "name_asc" ? "name" :
                "employee_number";
            const sortAscending = currentSort !== "hire_date_desc";

            let employeeQuery = supabase
                .from("employees")
                .select(EMPLOYEE_LIST_COLUMNS)
                .is("deleted_at", null)
                .order(sortColumn, { ascending: sortAscending, nullsFirst: false })
                .range(from, toPlusOne);

            if (currentPersonType !== "all") {
                employeeQuery = employeeQuery.eq("person_type", currentPersonType);
            }

            if (currentSearch) {
                employeeQuery = employeeQuery.or([
                    `name.ilike.${searchPattern}`,
                    `name_kana.ilike.${searchPattern}`,
                    `employee_number.ilike.${searchPattern}`,
                ].join(","));
            }

            if (currentBranch) {
                employeeQuery = employeeQuery.eq("branch", currentBranch);
            }

            if (currentQualification) {
                employeeQuery = employeeQuery.in("id", qualificationEmployeeIds);
            }

            const { data: empData } = await employeeQuery;
            const empRows = (empData ?? []) as unknown as Tables<"employees">[];
            const items = empRows.slice(0, PAGE_SIZE);
            hasNextPage = empRows.length > PAGE_SIZE;

            employees = items.map((emp) => {
                const counts = cachedQualCounts[emp.id];
                return {
                    ...emp,
                    qualification_count: counts?.total || 0,
                    expiring_count: counts?.expiring || 0,
                };
            });
        }
    } catch (e) {
        console.error("Failed to load employees:", e);
    }

    return (
        <EmployeesClient
            initialEmployees={employees}
            qualMasters={mastersData}
            currentSearch={currentSearch}
            currentBranch={currentBranch}
            currentQualification={currentQualification}
            currentPersonType={currentPersonType}
            currentSort={currentSort}
            currentPage={page}
            hasNextPage={hasNextPage}
        />
    );
}
