import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function OperationsLogLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-4 w-80" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <TableSkeleton columns={4} rows={5} />
                <TableSkeleton columns={4} rows={5} />
            </div>
        </div>
    );
}
