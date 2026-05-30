import { Skeleton } from "@/components/ui/skeleton";

export default function TodayLoading() {
    return (
        <div className="space-y-5">
            <section className="rounded-xl border bg-card p-5 md:p-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-8 w-72" />
                    <Skeleton className="h-4 w-52" />
                </div>
            </section>
            <div className="grid gap-4 lg:grid-cols-2">
                <Skeleton className="h-56 rounded-xl" />
                <Skeleton className="h-56 rounded-xl" />
            </div>
            <Skeleton className="h-64 rounded-xl" />
        </div>
    );
}
