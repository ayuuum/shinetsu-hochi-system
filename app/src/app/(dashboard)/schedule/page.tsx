import { createSupabaseServer } from "@/lib/supabase-server";
import { getAuthSnapshot } from "@/lib/auth-server";
import { ScheduleClient } from "@/components/schedule/schedule-client";

export default async function SchedulePage({
    searchParams,
}: {
    searchParams: Promise<{ year?: string }>;
}) {
    const auth = await getAuthSnapshot();
    const { year } = await searchParams;

    const currentFiscalYear = (() => {
        const now = new Date();
        return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    })();

    const fiscalYear = year ? parseInt(year) : currentFiscalYear;

    const supabase = await createSupabaseServer();
    const { data: schedules, error } = await supabase
        .from("annual_schedules")
        .select("*")
        .eq("fiscal_year", fiscalYear)
        .order("scheduled_date", { ascending: true, nullsFirst: false })
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Failed to load annual schedules:", error);
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">年間スケジュール・目標</h1>
                <p className="mt-2 text-muted-foreground">
                    会社の年間行事・スケジュールと今期目標を管理します。
                </p>
            </div>
            <ScheduleClient
                schedules={schedules || []}
                fiscalYear={fiscalYear}
                currentFiscalYear={currentFiscalYear}
                isAdmin={auth.role === "admin"}
            />
        </div>
    );
}
