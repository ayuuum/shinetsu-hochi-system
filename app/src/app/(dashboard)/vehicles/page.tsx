import { createSupabaseServer } from "@/lib/supabase-server";
import { VehiclesClient, type VehicleWithUser } from "@/components/vehicles/vehicles-client";

const PAGE_SIZE = 50;

function parsePageParam(value?: string) {
    const parsed = Number.parseInt(value || "1", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildInCondition(column: string, ids: string[]) {
    return ids.length > 0 ? `${column}.in.(${ids.join(",")})` : null;
}

export default async function VehiclesPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; q?: string }>;
}) {
    const params = await searchParams;
    const currentPage = parsePageParam(params.page);
    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const currentSearch = (params.q || "").trim();

    let vehicleData: VehicleWithUser[] = [];
    let empData: { id: string; name: string }[] = [];
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
                .select("id, name")
                .is("deleted_at", null)
                .order("name"),
        ]);

        let vehicleQuery = supabase
            .from("vehicles")
            .select("*, employees(id, name)", { count: "exact" })
            .is("deleted_at", null)
            .order("plate_number", { ascending: true })
            .range(from, to);

        if (currentSearch) {
            const primaryUserCondition = buildInCondition("primary_user_id", (employeeSearchResult.data || []).map((item) => item.id));
            vehicleQuery = vehicleQuery.or([
                `plate_number.ilike.${searchPattern}`,
                `vehicle_name.ilike.${searchPattern}`,
                primaryUserCondition,
            ].filter(Boolean).join(","));
        }

        const vehicleResult = await vehicleQuery;

        vehicleData = (vehicleResult.data as VehicleWithUser[]) || [];
        totalPages = Math.max(1, Math.ceil((vehicleResult.count || 0) / PAGE_SIZE));
        empData = empResult.data || [];
    } catch (e) {
        console.error("Failed to load vehicles:", e);
    }

    return (
        <VehiclesClient
            initialVehicles={vehicleData}
            employees={empData}
            currentSearch={currentSearch}
            currentPage={currentPage}
            totalPages={totalPages}
        />
    );
}
