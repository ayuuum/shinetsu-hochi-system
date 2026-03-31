import { createSupabaseServer } from "@/lib/supabase-server";
import { ProjectsClient, type ConstructionWithEmployee } from "@/components/projects/projects-client";

export default async function ProjectsPage() {
    let recordsData: ConstructionWithEmployee[] = [];
    let empData: { id: string; name: string; branch: string | null }[] = [];

    try {
        const supabase = await createSupabaseServer();
        const [recordsResult, empResult] = await Promise.all([
            supabase
                .from("construction_records")
                .select("*, employees(id, name, branch)")
                .order("construction_date", { ascending: false }),
            supabase
                .from("employees")
                .select("id, name, branch")
                .order("name"),
        ]);
        recordsData = (recordsResult.data as ConstructionWithEmployee[]) || [];
        empData = empResult.data || [];
    } catch (e) {
        console.error("Failed to load construction records:", e);
    }

    return (
        <ProjectsClient
            initialRecords={recordsData}
            employees={empData}
        />
    );
}
