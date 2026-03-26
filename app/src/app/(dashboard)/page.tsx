import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Calendar, Users, Truck, Bell, ShieldAlert, ClipboardCheck, Wine } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase-server";
import { addDays, isBefore, isAfter } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getAlertLevel, getDaysRemaining, alertStyles, type AlertLevel } from "@/lib/alert-utils";

type AlertItem = {
    level: Exclude<AlertLevel, "ok">;
    employeeName: string;
    employeeBranch: string | null;
    employeeId: string;
    qualificationName: string;
    expiryDate: string;
    daysRemaining: number;
};

function classifyAlerts(qualifications: any[]): AlertItem[] {
    const now = new Date();
    const alerts: AlertItem[] = [];

    for (const q of qualifications) {
        if (!q.expiry_date) continue;
        const level = getAlertLevel(q.expiry_date, now);
        if (level === "ok") continue;

        alerts.push({
            level,
            employeeName: q.employees?.name || "不明",
            employeeBranch: q.employees?.branch || null,
            employeeId: q.employee_id,
            qualificationName: q.qualification_master?.name || "不明な資格",
            expiryDate: q.expiry_date,
            daysRemaining: getDaysRemaining(q.expiry_date, now),
        });
    }

    return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

export default async function Home() {
    const supabase = await createSupabaseServer();

    const [
        { data: employees },
        { data: qualifications },
        { data: vehicles },
        { data: inspections },
        { data: alcoholChecks },
    ] = await Promise.all([
        supabase.from("employees").select("id, name, hire_date, branch"),
        supabase.from("employee_qualifications").select(`
            *,
            employees(id, name, branch),
            qualification_master(name, category)
        `).not("expiry_date", "is", null).order("expiry_date", { ascending: true }),
        supabase.from("vehicles").select("*"),
        supabase.from("inspection_schedules").select("id, scheduled_date, status")
            .gte("scheduled_date", new Date().toISOString().slice(0, 10))
            .lte("scheduled_date", addDays(new Date(), 30).toISOString().slice(0, 10)),
        supabase.from("alcohol_checks").select("id, is_abnormal, check_datetime")
            .gte("check_datetime", new Date().toISOString().slice(0, 10)),
    ]);

    const totalEmployees = employees?.length || 0;

    // 今月の新入社員数（hire_dateベース）
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newEmployeesCount = employees?.filter(e =>
        e.hire_date && isAfter(new Date(e.hire_date), firstDayOfMonth)
    ).length || 0;

    // アラート分類（資格期限ベース）
    const alerts = classifyAlerts(qualifications || []);
    const expiredCount = alerts.filter(a => a.level === "danger").length;
    const within30Count = alerts.filter(a => a.level === "warning" || a.level === "urgent").length;

    // 車両アラート
    const vehicleAlerts = vehicles?.filter(v => {
        if (!v.inspection_expiry) return false;
        const expiry = new Date(v.inspection_expiry);
        return isBefore(expiry, addDays(now, 30));
    }) || [];

    // 点検スケジュール統計
    const upcomingInspections = inspections?.filter(i => i.status === "未実施") || [];
    const todayAlcoholChecks = alcoholChecks || [];
    const abnormalAlcohol = todayAlcoholChecks.filter(c => c.is_abnormal).length;

    // 60日以内のスケジュール（上位8件）
    const upcomingSchedule = alerts.slice(0, 8);

    return (
        <div className="space-y-8 animate-in fade-in duration-1000">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
                <p className="text-muted-foreground mt-2">
                    {expiredCount > 0
                        ? `至急対応が必要なアラートが${expiredCount}件あります。`
                        : "現在、システムは正常に稼働しています。"}
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">登録従業員数</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalEmployees}名</div>
                        <p className="text-xs text-muted-foreground">
                            {newEmployeesCount > 0 ? `+${newEmployeesCount} (今月入社)` : ""}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">期限切れ（要対応）</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{expiredCount}件</div>
                        <p className="text-xs text-muted-foreground">
                            {alerts.find(a => a.level === "danger")?.employeeName || "なし"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">期限間近（30日以内）</CardTitle>
                        <Calendar className="h-4 w-4 text-orange-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{within30Count}件</div>
                        <p className="text-xs text-muted-foreground">資格更新・講習</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">車両車検・保険</CardTitle>
                        <Truck className="h-4 w-4 text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{vehicleAlerts.length}件</div>
                        <p className="text-xs text-muted-foreground">
                            {vehicleAlerts[0]?.plate_number || "対応不要"}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">今月の点検予定</CardTitle>
                        <ClipboardCheck className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{upcomingInspections.length}件</div>
                        <p className="text-xs text-muted-foreground">30日以内の未実施</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">本日のアルコール</CardTitle>
                        <Wine className="h-4 w-4 text-purple-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{todayAlcoholChecks.length}件</div>
                        <p className="text-xs text-muted-foreground">
                            {abnormalAlcohol > 0 ? <span className="text-destructive font-bold">不適正{abnormalAlcohol}件</span> : "全て適正"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* アラート一覧 */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-5 w-5" />
                            要対応アラート
                        </CardTitle>
                        <CardDescription>今後60日以内に更新が必要な資格・講習一覧</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {upcomingSchedule.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-8 text-center">対応が必要なアラートはありません。</p>
                        ) : (
                            <div className="space-y-3">
                                {upcomingSchedule.map((alert, i) => {
                                    const style = alertStyles[alert.level];
                                    return (
                                        <Link
                                            key={i}
                                            href={`/employees/${alert.employeeId}`}
                                            className={`flex items-center justify-between p-3 rounded-lg border ${style.bg} hover:opacity-80 transition-opacity`}
                                        >
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold leading-none">
                                                    {alert.employeeName}
                                                    {alert.employeeBranch && (
                                                        <span className="text-xs font-normal text-muted-foreground ml-2">({alert.employeeBranch})</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{alert.qualificationName}</p>
                                            </div>
                                            <div className="text-right flex items-center gap-2">
                                                <span className="text-sm">{alert.expiryDate}</span>
                                                <Badge variant="secondary" className={`${style.badge} text-[10px]`}>
                                                    {alert.daysRemaining < 0
                                                        ? `${Math.abs(alert.daysRemaining)}日超過`
                                                        : `残${alert.daysRemaining}日`}
                                                </Badge>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* システム通知 */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>システム情報</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex gap-4 p-4 rounded-xl bg-primary/5">
                                <Bell className="w-5 h-5 text-primary shrink-0" />
                                <div className="text-sm">
                                    <p className="font-bold">アラートサマリー</p>
                                    <div className="text-xs text-muted-foreground mt-2 space-y-1">
                                        <p>期限切れ: <span className="font-bold text-red-600">{expiredCount}件</span></p>
                                        <p>14日以内: <span className="font-bold text-orange-600">{alerts.filter(a => a.level === "urgent").length}件</span></p>
                                        <p>30日以内: <span className="font-bold text-yellow-600">{alerts.filter(a => a.level === "warning").length}件</span></p>
                                        <p>60日以内: <span className="font-bold text-blue-600">{alerts.filter(a => a.level === "info").length}件</span></p>
                                    </div>
                                </div>
                            </div>
                            {vehicleAlerts.length > 0 && (
                                <div className="flex gap-4 p-4 rounded-xl bg-orange-50">
                                    <Truck className="w-5 h-5 text-orange-500 shrink-0" />
                                    <div className="text-sm">
                                        <p className="font-bold">車両アラート</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {vehicleAlerts.map(v => v.plate_number).join("、")} — 車検・保険期限が30日以内
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-4 p-4 rounded-xl bg-primary/5">
                                <Bell className="w-5 h-5 text-primary shrink-0" />
                                <div className="text-sm">
                                    <p className="font-bold">登録状況</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        従業員 {totalEmployees}名 / 車両 {vehicles?.length || 0}台 / 資格 {qualifications?.length || 0}件
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
