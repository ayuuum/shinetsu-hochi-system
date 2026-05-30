import { Skeleton } from "@/components/ui/skeleton";

export default function ImportLoading() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-9 w-48" />
                <Skeleton className="h-4 w-full max-w-2xl" />
            </div>
            <div className="rounded-xl border bg-card p-6">
                <div className="space-y-4">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-28 w-full rounded-xl" />
                    <div className="flex flex-wrap gap-2">
                        <Skeleton className="h-9 w-36 rounded-lg" />
                        <Skeleton className="h-9 w-32 rounded-lg" />
                    </div>
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-24 rounded-xl" />
            </div>
        </div>
    );
}
