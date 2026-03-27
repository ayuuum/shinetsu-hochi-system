import { createSupabaseServer } from "@/lib/supabase-server";
import { AlcoholClient, type AlcoholCheckRow } from "@/components/alcohol/alcohol-client";

export default async function AlcoholChecksPage() {
    let checksData: AlcoholCheckRow[] = [];
    let empData: { id: string; name: string }[] = [];

    try {
        const supabase = await createSupabaseServer();
        const [checksResult, empResult] = await Promise.all([
            supabase
                .from("alcohol_checks")
                .select("*, employee:employees!alcohol_checks_employee_id_fkey(name), checker:employees!alcohol_checks_checker_id_fkey(name)")
                .order("check_datetime", { ascending: false })
                .limit(200),
            supabase
                .from("employees")
                .select("id, name")
                .order("name"),
        ]);
        checksData = (checksResult.data as AlcoholCheckRow[]) || [];
        empData = empResult.data || [];
    } catch (e) {
        console.error("Failed to load alcohol checks:", e);
    }

    return (
        <AlcoholClient
            initialChecks={checksData}
            employees={empData}
        />
    );
}
