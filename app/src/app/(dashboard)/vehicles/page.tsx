import { createSupabaseServer } from "@/lib/supabase-server";
import { VehiclesClient, type VehicleWithUser } from "@/components/vehicles/vehicles-client";

export default async function VehiclesPage() {
    const supabase = await createSupabaseServer();

    const [{ data: vehicleData }, { data: empData }] = await Promise.all([
        supabase
            .from("vehicles")
            .select("*, employees(name)")
            .order("plate_number", { ascending: true }),
        supabase
            .from("employees")
            .select("id, name")
            .order("name"),
    ]);

    return (
        <VehiclesClient
            initialVehicles={(vehicleData as VehicleWithUser[]) || []}
            employees={empData || []}
        />
    );
}
