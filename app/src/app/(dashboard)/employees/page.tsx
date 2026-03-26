import { createSupabaseServer } from "@/lib/supabase-server";
import { EmployeesClient, type EmployeeWithQualCount } from "@/components/employees/employees-client";

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

    const supabase = await createSupabaseServer();

    const [
        { data: empData, count: totalCount },
        { data: qualData },
        { data: mastersData },
    ] = await Promise.all([
        supabase
            .from("employees")
            .select("*", { count: "exact" })
            .order("employee_number", { ascending: true })
            .range(from, to),
        supabase.from("employee_qualifications").select("employee_id, expiry_date"),
        supabase.from("qualification_master").select("*").order("category"),
    ]);

    const now = new Date();
    const employees: EmployeeWithQualCount[] = (empData || []).map(emp => {
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

    const totalPages = Math.ceil((totalCount || 0) / PAGE_SIZE);

    return (
        <EmployeesClient
            initialEmployees={employees}
            qualMasters={mastersData || []}
            currentPage={page}
            totalPages={totalPages}
        />
    );
}
