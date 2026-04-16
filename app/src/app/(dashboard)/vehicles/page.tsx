import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAuthSnapshot } from "@/lib/auth-server";
import { VehiclesClient, type VehicleWithUser } from "@/components/vehicles/vehicles-client";
import { VehiclesEquipmentShell } from "@/components/vehicles/vehicles-equipment-shell";
import { EquipmentClient, type EquipmentRow } from "@/components/equipment/equipment-client";
import { TableSkeleton } from "@/components/shared/table-skeleton";

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
    searchParams: Promise<{ page?: string; q?: string; eq?: string; eqPage?: string }>;
}) {
    const auth = await getAuthSnapshot();
    if (auth.role === "technician") {
        redirect("/me");
    }

    const params = await searchParams;
    const currentPage = parsePageParam(params.page);
    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const currentSearch = (params.q || "").trim();

    const eqPage = parsePageParam(params.eqPage);
    const eqFrom = (eqPage - 1) * PAGE_SIZE;
    const eqTo = eqFrom + PAGE_SIZE - 1;
    const eqSearch = (params.eq || "").trim();

    let vehicleData: VehicleWithUser[] = [];
    let empData: { id: string; name: string }[] = [];
    let totalPages = 1;

    let equipmentData: EquipmentRow[] = [];
    let equipmentTotalPages = 1;

    try {
        const supabase = await createSupabaseServer();
        const searchPattern = currentSearch ? `%${currentSearch.replace(/,/g, " ").trim()}%` : null;
        const eqPattern = eqSearch ? `%${eqSearch.replace(/,/g, " ").trim()}%` : null;

        const [employeeSearchResult, empResult] = await Promise.all([
            currentSearch
                ? supabase
                      .from("employees")
                      .select("id")
                      .is("deleted_at", null)
                      .ilike("name", searchPattern!)
                      .limit(100)
                : Promise.resolve({ data: [] as { id: string }[], error: null }),
            supabase.from("employees").select("id, name").is("deleted_at", null).order("name"),
        ]);

        let vehicleQuery = supabase
            .from("vehicles")
            .select("*, employees(id, name)", { count: "exact" })
            .is("deleted_at", null)
            .order("plate_number", { ascending: true })
            .range(from, to);

        if (currentSearch && searchPattern) {
            const primaryUserCondition = buildInCondition(
                "primary_user_id",
                (employeeSearchResult.data || []).map((item) => item.id),
            );
            vehicleQuery = vehicleQuery.or(
                [`plate_number.ilike.${searchPattern}`, `vehicle_name.ilike.${searchPattern}`, primaryUserCondition]
                    .filter(Boolean)
                    .join(","),
            );
        }

        let equipmentQuery = supabase
            .from("equipment_items")
            .select("*", { count: "exact" })
            .is("deleted_at", null)
            .order("management_number", { ascending: true })
            .range(eqFrom, eqTo);

        if (eqPattern) {
            equipmentQuery = equipmentQuery.or(
                [
                    `management_number.ilike.${eqPattern}`,
                    `name.ilike.${eqPattern}`,
                    `category.ilike.${eqPattern}`,
                    `branch.ilike.${eqPattern}`,
                    `notes.ilike.${eqPattern}`,
                ].join(","),
            );
        }

        const [vehicleResult, equipmentResult] = await Promise.all([vehicleQuery, equipmentQuery]);

        vehicleData = (vehicleResult.data as VehicleWithUser[]) || [];
        totalPages = Math.max(1, Math.ceil((vehicleResult.count || 0) / PAGE_SIZE));
        empData = empResult.data || [];

        equipmentData = (equipmentResult.data as EquipmentRow[]) || [];
        equipmentTotalPages = Math.max(1, Math.ceil((equipmentResult.count || 0) / PAGE_SIZE));
    } catch (e) {
        console.error("Failed to load vehicles/equipment:", e);
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">車両・備品</h1>
                <p className="mt-2 text-muted-foreground">
                    社用車の車検・保険と、備品台帳（管理番号・購入日・金額・所属部署）をまとめて管理します。
                </p>
            </div>

            <VehiclesEquipmentShell
                vehiclesTab={
                    <VehiclesClient
                        hidePageHeading
                        initialVehicles={vehicleData}
                        employees={empData}
                        currentSearch={currentSearch}
                        currentPage={currentPage}
                        totalPages={totalPages}
                    />
                }
                equipmentTab={
                    <Suspense fallback={<TableSkeleton columns={7} />}>
                        <EquipmentClient
                            initialItems={equipmentData}
                            currentSearch={eqSearch}
                            currentPage={eqPage}
                            totalPages={equipmentTotalPages}
                        />
                    </Suspense>
                }
            />
        </div>
    );
}
