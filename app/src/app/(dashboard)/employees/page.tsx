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
            { data: qualData },
            { data: masters },
        ] = await Promise.all([
            supabase
                .from("employees")
                .select("*", { count: "exact" })
                .order("employee_number", { ascending: true })
                .range(from, to),
            supabase.from("employee_qualifications").select("employee_id, expiry_date"),
            supabase.from("qualification_master").select("*").order("category"),
        ]);

        mastersData = masters || [];
        totalPages = Math.ceil((totalCount || 0) / PAGE_SIZE);

        const now = new Date();
        employees = (empData || []).map(emp => {
            const empQuals = qualData?.filter(q => q.employee_id === emp.id) || [];
            const expiringCount = empQuals.filter(q => {
                if (!q.expiry_date) return false;
                const diff = new Date(q.expiry_date).getTime() - now.getTime();
                return diff < 30 * 24 * 60 * 60 * 1000;
            }).length;
            return {
                ...emp,
                qualification_count: empQuals.length,
                expiring_count: expiringCount,
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
