import { createSupabaseServer } from "@/lib/supabase-server";
import { InspectionsClient, type InspectionWithEmployee } from "@/components/inspections/inspections-client";

export default async function InspectionsPage() {
    const supabase = await createSupabaseServer();

    const [{ data: scheduleData }, { data: empData }] = await Promise.all([
        supabase
            .from("inspection_schedules")
            .select("*, employees(name)")
            .order("scheduled_date", { ascending: true }),
        supabase
            .from("employees")
            .select("id, name")
            .order("name"),
    ]);

    return (
        <InspectionsClient
            initialSchedules={(scheduleData as InspectionWithEmployee[]) || []}
            employees={empData || []}
        />
    );
}
