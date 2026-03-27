import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeeDetailLoading() {
    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-start justify-between gap-4">
                <div className="space-y-3">
                    <Skeleton className="h-9 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="rounded-xl border bg-card p-5 space-y-3">
                        <Skeleton className="h-5 w-28" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-4 w-3/5" />
                    </div>
                ))}
            </div>
        </div>
    );
}
