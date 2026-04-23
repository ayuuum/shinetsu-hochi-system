import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function ScheduleLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-2">
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-4 w-80" />
            </div>
            <Card className="border shadow-none">
                <CardHeader className="pb-3 border-b border-border/40">
                    <div className="flex gap-2">
                        <Skeleton className="h-9 w-[160px]" />
                        <Skeleton className="h-9 w-24 rounded-lg" />
                    </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 py-2">
                            <Skeleton className="h-4 w-24 shrink-0" />
                            <Skeleton className="h-5 w-20 rounded-full shrink-0" />
                            <Skeleton className="h-4 flex-1" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
