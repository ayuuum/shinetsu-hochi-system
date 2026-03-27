import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeesLoading() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="h-10 w-28" />
            </div>
            <div className="flex gap-2">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
            </div>
            <TableSkeleton columns={6} rows={8} />
        </div>
    );
}
