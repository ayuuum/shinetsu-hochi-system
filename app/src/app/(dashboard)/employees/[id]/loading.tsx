import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeeDetailLoading() {
    return (
        <div className="space-y-6 pb-10">
            <Skeleton className="h-8 w-20" />

            <div className="flex items-end justify-between gap-4">
                <div className="flex items-end gap-4">
                    <Skeleton className="h-20 w-20 rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-4 w-56" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-20" />
                    <Skeleton className="h-9 w-16" />
                </div>
            </div>

            <Skeleton className="h-12 w-full rounded-xl" />

            <div className="rounded-xl border bg-card p-6 space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex justify-between border-b pb-4 last:border-0 last:pb-0">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                ))}
            </div>
        </div>
    );
}
