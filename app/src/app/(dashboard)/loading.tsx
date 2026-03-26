import { TableSkeleton } from "@/components/shared/table-skeleton";

export default function DashboardLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <div className="h-8 w-48 bg-muted animate-pulse rounded" />
                <div className="h-4 w-96 bg-muted/60 animate-pulse rounded" />
            </div>
            <TableSkeleton columns={6} rows={8} />
        </div>
    );
}
