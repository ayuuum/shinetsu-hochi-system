import { createSupabaseServer } from "@/lib/supabase-server";
import { EmployeesClient, type EmployeeWithQualCount } from "@/components/employees/employees-client";
import { Tables } from "@/types/supabase";

const PAGE_SIZE = 50;

export default async function EmployeesPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>;
}) {
    const params = await searchParams;
    const page = Math.max(1, parseInt(params.page || "1"));
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let employees: EmployeeWithQualCount[] = [];
    let mastersData: Tables<"qualification_master">[] = [];
    let totalPages = 1;

    try {
        const supabase = await createSupabaseServer();

        const [
            { data: empData, count: totalCount },
            { data: masters },
        ] = await Promise.all([
            supabase
                .from("employees")
                .select("*", { count: "exact" })
                .order("employee_number", { ascending: true })
                .range(from, to),
            supabase.from("qualification_master").select("*").order("category"),
        ]);

        mastersData = masters || [];
        totalPages = Math.ceil((totalCount || 0) / PAGE_SIZE);

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
    } catch (e) {
        console.error("Failed to load employees:", e);
    }

    return (
        <EmployeesClient
            initialEmployees={employees}
            qualMasters={mastersData}
            currentPage={page}
            totalPages={totalPages}
        />
    );
}
