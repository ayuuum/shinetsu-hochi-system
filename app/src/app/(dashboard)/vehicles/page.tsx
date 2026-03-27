import { createSupabaseServer } from "@/lib/supabase-server";
import { VehiclesClient, type VehicleWithUser } from "@/components/vehicles/vehicles-client";

export default async function VehiclesPage() {
    let vehicleData: VehicleWithUser[] = [];
    let empData: { id: string; name: string }[] = [];

    try {
        const supabase = await createSupabaseServer();
        const [vehicleResult, empResult] = await Promise.all([
            supabase
                .from("vehicles")
                .select("*, employees(name)")
                .order("plate_number", { ascending: true }),
            supabase
                .from("employees")
                .select("id, name")
                .order("name"),
        ]);
        vehicleData = (vehicleResult.data as VehicleWithUser[]) || [];
        empData = empResult.data || [];
    } catch (e) {
        console.error("Failed to load vehicles:", e);
    }

    return (
        <VehiclesClient
            initialVehicles={vehicleData}
            employees={empData}
        />
    );
}
