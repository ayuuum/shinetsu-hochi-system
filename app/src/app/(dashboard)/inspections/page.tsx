import { createSupabaseServer } from "@/lib/supabase-server";
import { InspectionsClient, type InspectionWithEmployee } from "@/components/inspections/inspections-client";

export default async function InspectionsPage() {
    let scheduleData: InspectionWithEmployee[] = [];
    let empData: { id: string; name: string }[] = [];

    try {
        const supabase = await createSupabaseServer();
        const [scheduleResult, empResult] = await Promise.all([
            supabase
                .from("inspection_schedules")
                .select("*, employees(name)")
                .order("scheduled_date", { ascending: true }),
            supabase
                .from("employees")
                .select("id, name")
                .order("name"),
        ]);
        scheduleData = (scheduleResult.data as InspectionWithEmployee[]) || [];
        empData = empResult.data || [];
    } catch (e) {
        console.error("Failed to load inspections:", e);
    }

    return (
        <InspectionsClient
            initialSchedules={scheduleData}
            employees={empData}
        />
    );
}
