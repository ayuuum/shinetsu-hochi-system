import { redirect } from "next/navigation";
import { AdminDashboardPage } from "@/components/dashboard/admin-dashboard-page";
import { getFastAuthSnapshot } from "@/lib/auth-server";

export default async function DashboardPage() {
    const auth = await getFastAuthSnapshot();

    if (!auth.user) {
        redirect("/login");
    }

    if (auth.role === "technician") {
        redirect("/today");
    }

    return <AdminDashboardPage />;
}
