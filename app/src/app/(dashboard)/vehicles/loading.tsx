import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function VehiclesLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-10 w-28" />
            </div>
            <TableSkeleton columns={5} rows={6} />
        </div>
    );
}
