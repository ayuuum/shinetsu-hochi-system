import { Suspense } from "react";
import {
    DashboardFocusCardsSection,
    DashboardHeroSection,
    DashboardMonthScheduleSection,
    DashboardQuickLinksSection,
    DashboardTaskListSection,
} from "@/components/dashboard/dashboard-content";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminDashboardPage() {
    return (
        <div className="space-y-5">
            <DashboardHeroSection />
            <Suspense fallback={<DashboardFocusSkeleton />}>
                <DashboardFocusCardsSection />
            </Suspense>
            <Suspense fallback={<DashboardScheduleSkeleton />}>
                <DashboardMonthScheduleSection />
            </Suspense>
            <Suspense fallback={<DashboardTaskSkeleton />}>
                <DashboardTaskListSection />
            </Suspense>
            <DashboardQuickLinksSection />
        </div>
    );
}

function DashboardFocusSkeleton() {
    return (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-border/60">
                <CardHeader className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-72" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-32 w-full rounded-xl" />
                </CardContent>
            </Card>
            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="border-border/60">
                        <CardContent className="space-y-3 p-4">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-8 w-8 rounded-lg" />
                            </div>
                            <Skeleton className="h-9 w-20" />
                            <Skeleton className="h-4 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="border-border/60">
                        <CardHeader>
                            <Skeleton className="h-5 w-28" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Skeleton className="h-9 w-16" />
                            <Skeleton className="h-4 w-32" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function DashboardScheduleSkeleton() {
    return (
        <Card className="border-border/60">
            <CardHeader className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-80" />
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="rounded-xl border border-border/50 p-3.5">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="mt-2 h-4 w-32" />
                        <Skeleton className="mt-2 h-3 w-full" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

function DashboardTaskSkeleton() {
    return (
        <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
            <Card className="border-border/60">
                <CardHeader className="space-y-2">
                    <Skeleton className="h-6 w-44" />
                    <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="rounded-xl border border-border/50 p-4">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="mt-2 h-4 w-72" />
                            <Skeleton className="mt-2 h-3 w-32" />
                        </div>
                    ))}
                </CardContent>
            </Card>
            <Card className="border-border/60">
                <CardHeader className="space-y-2">
                    <Skeleton className="h-6 w-44" />
                    <Skeleton className="h-4 w-72" />
                </CardHeader>
                <CardContent className="space-y-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="rounded-xl border border-border/50 p-4">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="mt-2 h-4 w-20" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
