import { createSupabaseServer } from "@/lib/supabase-server";
import { QualificationsClient, type QualificationRow } from "@/components/qualifications/qualifications-client";

export default async function QualificationsPage() {
    let qualifications: QualificationRow[] = [];
    let categories: string[] = [];

    try {
        const supabase = await createSupabaseServer();
        const { data } = await supabase
            .from("employee_qualifications")
            .select(`
                *,
                employees(id, name, branch),
                qualification_master(name, category)
            `)
            .order("expiry_date", { ascending: true });

        qualifications = (data || []) as QualificationRow[];
        categories = [...new Set(
            qualifications.map(q => q.qualification_master?.category).filter(Boolean)
        )] as string[];
    } catch (e) {
        console.error("Failed to load qualifications:", e);
    }

    return (
        <QualificationsClient
            initialQualifications={qualifications}
            categories={categories}
        />
    );
}
