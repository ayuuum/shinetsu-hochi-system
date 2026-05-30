import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminUsersLoading() {
    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <Skeleton className="h-10 w-28 rounded-lg" />
            </div>
            <TableSkeleton columns={5} rows={6} />
        </div>
    );
}
