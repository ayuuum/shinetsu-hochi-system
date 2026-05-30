import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function QualificationMastersLoading() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-9 w-40" />
                    <Skeleton className="h-4 w-80" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-36 rounded-lg" />
                    <Skeleton className="h-9 w-32 rounded-lg" />
                </div>
            </div>
            <TableSkeleton columns={5} rows={8} />
        </div>
    );
}
