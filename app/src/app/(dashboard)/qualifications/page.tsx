import { createSupabaseServer } from "@/lib/supabase-server";
import { QualificationsClient, type QualificationRow } from "@/components/qualifications/qualifications-client";

export default async function QualificationsPage() {
    const supabase = await createSupabaseServer();

    const { data } = await supabase
        .from("employee_qualifications")
        .select(`
            *,
            employees(id, name, branch),
            qualification_master(name, category)
        `)
        .order("expiry_date", { ascending: true });

    const qualifications = (data || []) as QualificationRow[];
    const categories = [...new Set(
        qualifications.map(q => q.qualification_master?.category).filter(Boolean)
    )] as string[];

    return (
        <QualificationsClient
            initialQualifications={qualifications}
            categories={categories}
        />
    );
}
