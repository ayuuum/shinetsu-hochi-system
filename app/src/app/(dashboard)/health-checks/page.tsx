import { createSupabaseServer } from "@/lib/supabase-server";
import { HealthChecksClient, type HealthCheckWithEmployee } from "@/components/health-checks/health-checks-client";

export default async function HealthChecksPage() {
    let checkData: HealthCheckWithEmployee[] = [];
    let empData: { id: string; name: string }[] = [];

    try {
        const supabase = await createSupabaseServer();
        const [checkResult, empResult] = await Promise.all([
            supabase
                .from("health_checks")
                .select("*, employees(id, name, branch)")
                .order("check_date", { ascending: false }),
            supabase
                .from("employees")
                .select("id, name")
                .order("name"),
        ]);
        checkData = (checkResult.data as HealthCheckWithEmployee[]) || [];
        empData = empResult.data || [];
    } catch (e) {
        console.error("Failed to load health checks:", e);
    }

    return (
        <HealthChecksClient
            initialChecks={checkData}
            employees={empData}
        />
    );
}
