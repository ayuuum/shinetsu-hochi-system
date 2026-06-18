import { EmployeeDetailView } from "@/components/employees/employee-detail-view";

export default async function PartnerDetailPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tab?: string }>;
}) {
    const { id } = await params;
    const { tab } = await searchParams;

    return <EmployeeDetailView id={id} tab={tab} listContext="partners" />;
}
