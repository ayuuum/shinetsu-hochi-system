import { Skeleton } from "@/components/ui/skeleton";

export default function VehicleDetailLoading() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-9 w-32 rounded-lg" />
            <div className="space-y-2">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-4 w-48" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <Skeleton className="h-72 rounded-xl" />
                <Skeleton className="h-72 rounded-xl" />
            </div>
            <Skeleton className="h-56 rounded-xl" />
        </div>
    );
}
