import { Suspense } from "react";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import DashboardLoading from "./loading";

export default function Home() {
    return (
        <Suspense fallback={<DashboardLoading />}>
            <DashboardContent />
        </Suspense>
    );
}
