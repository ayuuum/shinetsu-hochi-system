import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function AlcoholChecksLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-10 w-28" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-48" />
            </div>
            <TableSkeleton columns={6} rows={6} />
        </div>
    );
}
