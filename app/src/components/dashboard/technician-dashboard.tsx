import Link from "next/link";
import { differenceInDays } from "date-fns";
import { Award, Beer, CheckCircle2, AlertTriangle, ShieldAlert, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServer } from "@/lib/supabase-server";
import { alertStyles, getAlertLevel } from "@/lib/alert-utils";
import { getTodayInTokyo } from "@/lib/date";
import { formatDisplayDate } from "@/lib/date";

type OwnQualification = {
    id: string;
    name: string;
    category: string | null;
    expiryDate: string | null;
    acquiredDate: string | null;
    daysRemaining: number | null;
    level: ReturnType<typeof getAlertLevel>;
};

type TodayAlcohol = {
    id: string;
    checkType: string;
    isAbnormal: boolean;
    checkDatetime: string;
} | null;

async function getTechnicianData(employeeId: string) {
    const supabase = await createSupabaseServer();
    const today = getTodayInTokyo();

    const [qualResult, alcoholResult] = await Promise.all([
        supabase
            .from("employee_qualifications")
            .select("id, expiry_date, acquired_date, qualification_master(name, category)")
            .eq("employee_id", employeeId)
            .order("expiry_date", { ascending: true, nullsFirst: false }),
        supabase
            .from("alcohol_checks")
            .select("id, check_type, is_abnormal, check_datetime")
            .eq("employee_id", employeeId)
            .gte("check_datetime", `${today}T00:00:00`)
            .lte("check_datetime", `${today}T23:59:59`)
            .order("check_datetime", { ascending: false }),
    ]);

    const qualifications: OwnQualification[] = (qualResult.data || []).map((q) => {
        const master = q.qualification_master as { name: string; category: string | null } | null;
        const days = q.expiry_date ? differenceInDays(new Date(q.expiry_date), new Date()) : null;
        return {
            id: q.id,
            name: master?.name || "不明",
            category: master?.category || null,
            expiryDate: q.expiry_date,
            acquiredDate: q.acquired_date,
            daysRemaining: days,
            level: getAlertLevel(q.expiry_date),
        };
    });

    const todayChecks = (alcoholResult.data || []).map((c) => ({
        id: c.id,
        checkType: c.check_type,
        isAbnormal: c.is_abnormal === true,
        checkDatetime: c.check_datetime,
    }));

    return { qualifications, todayChecks, today };
}

export async function TechnicianDashboard({ employeeId, employeeName }: { employeeId: string; employeeName?: string }) {
    const { qualifications, todayChecks, today } = await getTechnicianData(employeeId);

    const alertQuals = qualifications.filter((q) => q.level !== "ok");
    const hasArrival = todayChecks.some((c) => c.checkType === "出勤時");
    const hasDeparture = todayChecks.some((c) => c.checkType === "退勤時");
    const hasAbnormal = todayChecks.some((c) => c.isAbnormal);

    return (
        <div className="space-y-5">
            <section className="rounded-xl border border-border/50 bg-card p-5 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                            My Dashboard
                        </p>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {employeeName ? `${employeeName}さん、お疲れ様です` : "お疲れ様です"}
                        </h1>
                        <p className="text-sm text-muted-foreground">{today} の状況を確認しましょう。</p>
                    </div>
                    <Button render={<Link href={`/employees/${employeeId}?tab=qualifications`} />}>
                        マイプロフィールを見る
                    </Button>
                </div>
            </section>

            {/* Today's alcohol check status */}
            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Beer className="h-5 w-5 text-muted-foreground" />
                        本日のアルコールチェック
                    </CardTitle>
                    <CardDescription>{today} の記録状況</CardDescription>
                </CardHeader>
                <CardContent>
                    {hasAbnormal && (
                        <div className="mb-4 flex items-start gap-2 rounded-xl border border-blue-600/20 bg-blue-600/10 px-4 py-3 text-sm font-semibold text-blue-700">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            不適正の記録があります。安全運転管理者に報告してください。
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <div className={`rounded-xl border p-4 ${hasArrival ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-border bg-muted/30"}`}>
                            <div className="flex items-center gap-2">
                                {hasArrival
                                    ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                    : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40" />
                                }
                                <span className="text-sm font-semibold">出勤時</span>
                            </div>
                            <p className="mt-1.5 text-xs text-muted-foreground">
                                {hasArrival ? "記録済み" : "未記録"}
                            </p>
                        </div>
                        <div className={`rounded-xl border p-4 ${hasDeparture ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-border bg-muted/30"}`}>
                            <div className="flex items-center gap-2">
                                {hasDeparture
                                    ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                    : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40" />
                                }
                                <span className="text-sm font-semibold">退勤時</span>
                            </div>
                            <p className="mt-1.5 text-xs text-muted-foreground">
                                {hasDeparture ? "記録済み" : "未記録"}
                            </p>
                        </div>
                    </div>
                    <div className="mt-3">
                        <Button variant="outline" size="sm" className="w-full" render={<Link href={`/alcohol-checks?date=${today}&employee=${employeeId}`} />}>
                            アルコールチェック記録へ
                            <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Own qualification alerts */}
            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <ShieldAlert className={`h-5 w-5 ${alertQuals.length > 0 ? alertStyles.danger.strong : "text-muted-foreground"}`} />
                        保有資格の期限状況
                    </CardTitle>
                    <CardDescription>
                        {alertQuals.length > 0
                            ? `${alertQuals.length}件の資格が期限切れ・期限間近です`
                            : "期限切れ・期限間近の資格はありません"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {qualifications.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">資格が登録されていません。</p>
                    ) : alertQuals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl bg-muted/40 px-4 py-8 text-center">
                            <CheckCircle2 className="mb-2 h-8 w-8 text-chart-2" />
                            <p className="text-sm font-medium">全ての資格が有効期限内です</p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                登録資格 {qualifications.length}件
                            </p>
                        </div>
                    ) : (
                        <div className="-mx-6">
                            {alertQuals.map((q) => {
                                const style = alertStyles[q.level];
                                return (
                                    <div key={q.id} className="border-b border-border/40 px-6 py-3 last:border-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-sm font-semibold">{q.name}</p>
                                                    <Badge variant="secondary" className={`${style.badge} text-xs`}>
                                                        {q.daysRemaining !== null && q.daysRemaining < 0
                                                            ? `${Math.abs(q.daysRemaining)}日超過`
                                                            : style.label}
                                                    </Badge>
                                                </div>
                                                <p className="mt-0.5 text-xs text-muted-foreground">
                                                    {q.expiryDate ? `有効期限: ${formatDisplayDate(q.expiryDate)}` : "有効期限なし"}
                                                </p>
                                            </div>
                                            <Award className={`mt-0.5 h-4 w-4 shrink-0 ${style.color}`} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <div className="mt-3">
                        <Button variant="outline" size="sm" className="w-full" render={<Link href={`/employees/${employeeId}?tab=qualifications`} />}>
                            全ての資格を見る（{qualifications.length}件）
                            <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
