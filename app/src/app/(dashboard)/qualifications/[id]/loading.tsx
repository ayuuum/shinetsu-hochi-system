import { Skeleton } from "@/components/ui/skeleton";

export default function QualificationDetailLoading() {
    return (
        <div className="space-y-5">
            <Skeleton className="h-9 w-36 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-10 w-full max-w-xl" />
                <Skeleton className="h-4 w-64" />
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
                <Skeleton className="h-80 rounded-xl" />
                <Skeleton className="h-80 rounded-xl" />
            </div>
        </div>
    );
}
