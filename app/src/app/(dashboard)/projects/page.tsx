import { createSupabaseServer } from "@/lib/supabase-server";
import { ProjectsClient, type ConstructionWithEmployee } from "@/components/projects/projects-client";

const PAGE_SIZE = 50;

function parsePageParam(value?: string) {
    const parsed = Number.parseInt(value || "1", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildInCondition(column: string, ids: string[]) {
    return ids.length > 0 ? `${column}.in.(${ids.join(",")})` : null;
}

export default async function ProjectsPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; q?: string; category?: string }>;
}) {
    const params = await searchParams;
    const currentPage = parsePageParam(params.page);
    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const currentSearch = (params.q || "").trim();
    const currentCategory = (params.category || "").trim();

    let recordsData: ConstructionWithEmployee[] = [];
    let empData: { id: string; name: string; branch: string | null }[] = [];
    let totalPages = 1;

    try {
        const supabase = await createSupabaseServer();
        const searchPattern = currentSearch ? `%${currentSearch.replace(/,/g, " ").trim()}%` : null;

        const [employeeSearchResult, empResult] = await Promise.all([
            currentSearch
                ? supabase
                    .from("employees")
                    .select("id")
                    .is("deleted_at", null)
                    .ilike("name", searchPattern!)
                    .limit(100)
                : Promise.resolve({ data: [] as { id: string }[], error: null }),
            supabase
                .from("employees")
                .select("id, name, branch")
                .is("deleted_at", null)
                .order("name"),
        ]);

        let recordsQuery = supabase
            .from("construction_records")
            .select("*, employees!inner(id, name, branch)", { count: "exact" })
            .is("deleted_at", null)
            .is("employees.deleted_at", null)
            .order("construction_date", { ascending: false })
            .range(from, to);

        if (currentCategory) {
            recordsQuery = recordsQuery.eq("category", currentCategory);
        }

        if (currentSearch) {
            const employeeCondition = buildInCondition("employee_id", (employeeSearchResult.data || []).map((item) => item.id));
            recordsQuery = recordsQuery.or([
                `construction_name.ilike.${searchPattern}`,
                `location.ilike.${searchPattern}`,
                employeeCondition,
            ].filter(Boolean).join(","));
        }

        const recordsResult = await recordsQuery;

        recordsData = (recordsResult.data as ConstructionWithEmployee[]) || [];
        totalPages = Math.max(1, Math.ceil((recordsResult.count || 0) / PAGE_SIZE));
        empData = empResult.data || [];
    } catch (e) {
        console.error("Failed to load construction records:", e);
    }

    return (
        <ProjectsClient
            initialRecords={recordsData}
            employees={empData}
            currentSearch={currentSearch}
            currentCategory={currentCategory}
            currentPage={currentPage}
            totalPages={totalPages}
        />
    );
}
