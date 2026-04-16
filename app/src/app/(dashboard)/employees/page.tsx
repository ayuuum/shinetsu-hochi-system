import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { EmployeesClient, type EmployeeWithQualCount } from "@/components/employees/employees-client";
import { getAuthSnapshot } from "@/lib/auth-server";
import { Tables } from "@/types/supabase";

const PAGE_SIZE = 50;

function parsePageParam(value?: string) {
    const parsed = Number.parseInt(value || "1", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function EmployeesPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; q?: string; branch?: string; qualification?: string }>;
}) {
    const auth = await getAuthSnapshot();
    if (auth.role === "technician") {
        redirect(auth.linkedEmployeeId ? `/employees/${auth.linkedEmployeeId}` : "/me");
    }

    const params = await searchParams;
    const page = parsePageParam(params.page);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const currentSearch = (params.q || "").trim();
    const currentBranch = (params.branch || "").trim();
    const currentQualification = (params.qualification || "").trim();

    let employees: EmployeeWithQualCount[] = [];
    let mastersData: Tables<"qualification_master">[] = [];
    let totalPages = 1;

    try {
        const supabase = await createSupabaseServer();
        const searchPattern = currentSearch ? `%${currentSearch.replace(/,/g, " ").trim()}%` : null;

        const [{ data: masters }, qualificationFilterResult] = await Promise.all([
            supabase.from("qualification_master").select("*").order("category"),
            currentQualification
                ? supabase
                    .from("employee_qualifications")
                    .select("employee_id")
                    .eq("qualification_id", currentQualification)
                    .limit(5000)
                : Promise.resolve({ data: [] as { employee_id: string | null }[], error: null }),
        ]);

        mastersData = masters || [];
        const qualificationEmployeeIds = (qualificationFilterResult.data || [])
            .map((item) => item.employee_id)
            .filter((employeeId): employeeId is string => !!employeeId);

        if (!currentQualification || qualificationEmployeeIds.length > 0) {
            let employeeQuery = supabase
                .from("employees")
                .select("*", { count: "exact" })
                .is("deleted_at", null)
                .order("employee_number", { ascending: true })
                .range(from, to);

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

            const { data: empData, count: totalCount } = await employeeQuery;
            totalPages = Math.max(1, Math.ceil((totalCount || 0) / PAGE_SIZE));

            const now = new Date();
            const employeeIds = (empData || []).map((emp) => emp.id);
            const qualificationCounts = new Map<string, { total: number; expiring: number }>();

            if (employeeIds.length > 0) {
                const { data: qualData } = await supabase
                    .from("employee_qualifications")
                    .select("employee_id, expiry_date")
                    .in("employee_id", employeeIds);

                for (const qualification of qualData || []) {
                    if (!qualification.employee_id) continue;

                    const current = qualificationCounts.get(qualification.employee_id) || {
                        total: 0,
                        expiring: 0,
                    };
                    current.total += 1;

                    if (qualification.expiry_date) {
                        const diff = new Date(qualification.expiry_date).getTime() - now.getTime();
                        if (diff < 30 * 24 * 60 * 60 * 1000) {
                            current.expiring += 1;
                        }
                    }

                    qualificationCounts.set(qualification.employee_id, current);
                }
            }

            employees = (empData || []).map((emp) => {
                const counts = qualificationCounts.get(emp.id);
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
            currentPage={page}
            totalPages={totalPages}
        />
    );
}
