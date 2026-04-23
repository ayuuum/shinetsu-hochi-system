import { getFastAuthSnapshot } from "@/lib/auth-server";
import { ScheduleClient } from "@/components/schedule/schedule-client";
import { getCachedSchedulesByFiscalYear } from "@/lib/cached-queries";

export default async function SchedulePage({
    searchParams,
}: {
    searchParams: Promise<{ year?: string }>;
}) {
    const auth = await getFastAuthSnapshot();
    const { year } = await searchParams;

    const currentFiscalYear = (() => {
        const now = new Date();
        return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    })();

    const fiscalYear = year ? parseInt(year) : currentFiscalYear;

    const schedules = await getCachedSchedulesByFiscalYear(fiscalYear);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">年間スケジュール・目標</h1>
                <p className="mt-2 text-muted-foreground">
                    会社の年間行事・スケジュールと今期目標を管理します。
                </p>
            </div>
            <ScheduleClient
                schedules={schedules as Parameters<typeof ScheduleClient>[0]["schedules"]}
                fiscalYear={fiscalYear}
                currentFiscalYear={currentFiscalYear}
                isAdmin={auth.role === "admin"}
            />
        </div>
    );
}
