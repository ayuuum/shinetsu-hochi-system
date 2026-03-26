import { createSupabaseServer } from "@/lib/supabase-server";
import { AlcoholClient, type AlcoholCheckRow } from "@/components/alcohol/alcohol-client";

export default async function AlcoholChecksPage() {
    const supabase = await createSupabaseServer();

    const [{ data: checksData }, { data: empData }] = await Promise.all([
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

    return (
        <AlcoholClient
            initialChecks={(checksData as AlcoholCheckRow[]) || []}
            employees={empData || []}
        />
    );
}
