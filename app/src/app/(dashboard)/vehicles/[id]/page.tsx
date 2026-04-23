import { notFound, redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getAuthSnapshot } from "@/lib/auth-server";
import { VehicleDetailClient } from "@/components/vehicles/vehicle-detail-client";
import { Tables } from "@/types/supabase";

type VehicleDetail = Tables<"vehicles"> & {
    employees: { id: string; name: string } | null;
    vehicle_tires: Tables<"vehicle_tires">[];
    vehicle_repairs: (Tables<"vehicle_repairs"> & { repaired_by_employee: { name: string } | null })[];
    vehicle_accidents: (Tables<"vehicle_accidents"> & { driver: { name: string } | null })[];
};

export default async function VehicleDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const auth = await getAuthSnapshot();
    if (auth.role === "technician") {
        redirect("/me");
    }

    const supabase = await createSupabaseServer();

    const [vehicleResult, tiresResult, repairsResult, accidentsResult] = await Promise.all([
        supabase
            .from("vehicles")
            .select("*, employees(id, name)")
            .eq("id", id)
            .is("deleted_at", null)
            .maybeSingle(),
        supabase
            .from("vehicle_tires")
            .select("*")
            .eq("vehicle_id", id)
            .order("created_at", { ascending: false }),
        supabase
            .from("vehicle_repairs")
            .select("*, repaired_by_employee:employees!vehicle_repairs_repaired_by_fkey(name)")
            .eq("vehicle_id", id)
            .order("repair_date", { ascending: false }),
        supabase
            .from("vehicle_accidents")
            .select("*, driver:employees!vehicle_accidents_driver_id_fkey(name)")
            .eq("vehicle_id", id)
            .order("accident_date", { ascending: false }),
    ]);

    if (vehicleResult.error || !vehicleResult.data) {
        notFound();
    }

    const vehicle: VehicleDetail = {
        ...(vehicleResult.data as Tables<"vehicles"> & { employees: { id: string; name: string } | null }),
        vehicle_tires: tiresResult.data || [],
        vehicle_repairs: (repairsResult.data as VehicleDetail["vehicle_repairs"]) || [],
        vehicle_accidents: (accidentsResult.data as VehicleDetail["vehicle_accidents"]) || [],
    };

    return <VehicleDetailClient vehicle={vehicle} isAdminOrHr={auth.role === "admin" || auth.role === "hr"} />;
}
