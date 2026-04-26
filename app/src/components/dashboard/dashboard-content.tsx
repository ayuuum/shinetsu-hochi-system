import { cache } from "react";
import { addDays, isAfter, isBefore } from "date-fns";
import Link from "next/link";
import {
    AlertCircle,
    ArrowRight,
    Calendar,
    HeartPulse,
    ScrollText,
    ShieldAlert,
    ShieldCheck,
    Truck,
    Users,
    Wine,
    type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServer } from "@/lib/supabase-server";
import { alertStyles, getAlertLevel, getDaysRemaining, type AlertLevel } from "@/lib/alert-utils";
import { getTodayInTokyo, getTokyoCalendarMonthBounds, isYmdInInclusiveRange } from "@/lib/date";
import {
    getCachedDashboardEmployees,
    getCachedDashboardQualifications,
    getCachedDashboardVehicles,
    getCachedMonthlyHealthChecks,
    type DashboardEmployee,
    type DashboardHealthCheck,
    type DashboardQualification,
    type DashboardVehicle,
} from "@/lib/cached-queries";
import { Tables } from "@/types/supabase";

type AlertItem = {
    level: Exclude<AlertLevel, "ok">;
    qualificationId: string;
    employeeName: string;
    employeeBranch: string | null;
    employeeId: string;
    qualificationName: string;
    expiryDate: string;
    daysRemaining: number;
};

type MonthScheduleItem = {
    id: string;
    date: string;
    category: string;
    categoryPriority: number;
    title: string;
    subtitle: string;
    href: string;
    icon: LucideIcon;
};

type DashboardAlcoholRow = Pick<Tables<"alcohol_checks">, "id" | "employee_id" | "is_abnormal" | "check_datetime" | "location"> & {
    employee: Pick<Tables<"employees">, "name" | "branch"> | null;
};

type DashboardTask = {
    id: string;
    title: string;
    subtitle: string;
    href: string;
    meta: string;
    badgeLabel: string;
    badgeClassName: string;
    surfaceClassName: string;
    iconClassName: string;
    strongClassName: string;
    icon: LucideIcon;
    priority: number;
    employeeId?: string;
};

type FocusCard = {
    title: string;
    value: number;
    href: string;
    description: string;
    eyebrow: string;
    icon: LucideIcon;
    iconClassName: string;
    valueClassName: string;
};

type PrioritySnapshot = {
    today: string;
    totalEmployees: number;
    newEmployeesCount: number;
    qualificationCount: number;
    vehicleCount: number;
    expiredCount: number;
    urgentCount: number;
    warningCount: number;
    infoCount: number;
    urgentAlertCount: number;
    abnormalAlcohol: number;
    pendingAlcoholCount: number;
    missingAlcoholCount: number;
    totalTaskCount: number;
    vehicleTasks: Array<DashboardVehicle & { daysRemaining: number }>;
    dashboardTasks: DashboardTask[];
    focusCards: FocusCard[];
    topTask: DashboardTask | null;
    qualificationSummaryTone: typeof alertStyles.danger | typeof alertStyles.urgent | null;
    vehicleTone: typeof alertStyles.danger | typeof alertStyles.urgent | typeof alertStyles.warning | null;
    alcoholTone: typeof alertStyles.danger | typeof alertStyles.urgent | typeof alertStyles.ok | null;
};

const countFormatter = new Intl.NumberFormat("ja-JP");
const neutralSurfaceClassName = "border border-border/30 bg-white/80";
const neutralIconClassName = "bg-muted/60 text-muted-foreground";

const monthScheduleCategoryPriority: Record<string, number> = {
    健診: 0,
    車検: 1,
    自賠責: 2,
    任意保険: 3,
    資格: 4,
};

function buildAlcoholChecksHref({
    date,
    employee,
    location,
    status,
}: {
    date: string;
    employee?: string;
    location?: string | null;
    status?: string;
}) {
    const params = new URLSearchParams();
    params.set("date", date);
    if (employee) params.set("employee", employee);
    if (location) params.set("location", location);
    if (status) params.set("status", status);
    return `/alcohol-checks?${params.toString()}`;
}

function getTaskPriority(base: number, offset: number) {
    return base * 1000 + offset;
}

function classifyAlerts(qualifications: DashboardQualification[]): AlertItem[] {
    const now = new Date();
    const alerts: AlertItem[] = [];

    for (const qualification of qualifications) {
        if (!qualification.id || !qualification.expiry_date || !qualification.employee_id) continue;
        const level = getAlertLevel(qualification.expiry_date, now);
        if (level === "ok") continue;

        alerts.push({
            level,
            qualificationId: qualification.id,
            employeeName: qualification.employees?.name || "不明",
            employeeBranch: qualification.employees?.branch || null,
            employeeId: qualification.employee_id,
            qualificationName: qualification.qualification_master?.name || "不明な資格",
            expiryDate: qualification.expiry_date,
            daysRemaining: getDaysRemaining(qualification.expiry_date, now),
        });
    }

    return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
}

function buildMonthScheduleItems({
    todayYmd,
    qualifications,
    vehicles,
    healthRows,
}: {
    todayYmd: string;
    qualifications: DashboardQualification[];
    vehicles: DashboardVehicle[];
    healthRows: DashboardHealthCheck[];
}) {
    const { start: monthStart, end: monthEnd } = getTokyoCalendarMonthBounds(todayYmd);
    const items: MonthScheduleItem[] = [];

    for (const vehicle of vehicles) {
        const href = `/vehicles?q=${encodeURIComponent(vehicle.plate_number)}`;
        const namePart = vehicle.vehicle_name || "車両";

        if (isYmdInInclusiveRange(vehicle.inspection_expiry, monthStart, monthEnd)) {
            items.push({
                id: `vehicle-inspection-${vehicle.id}`,
                date: vehicle.inspection_expiry!,
                category: "車検",
                categoryPriority: monthScheduleCategoryPriority.車検,
                title: vehicle.plate_number,
                subtitle: `${namePart}・車検満了`,
                href,
                icon: Truck,
            });
        }
        if (isYmdInInclusiveRange(vehicle.liability_insurance_expiry, monthStart, monthEnd)) {
            items.push({
                id: `vehicle-liability-${vehicle.id}`,
                date: vehicle.liability_insurance_expiry!,
                category: "自賠責",
                categoryPriority: monthScheduleCategoryPriority.自賠責,
                title: vehicle.plate_number,
                subtitle: `${namePart}・自賠責満期`,
                href,
                icon: Truck,
            });
        }
        if (isYmdInInclusiveRange(vehicle.voluntary_insurance_expiry, monthStart, monthEnd)) {
            items.push({
                id: `vehicle-voluntary-${vehicle.id}`,
                date: vehicle.voluntary_insurance_expiry!,
                category: "任意保険",
                categoryPriority: monthScheduleCategoryPriority.任意保険,
                title: vehicle.plate_number,
                subtitle: `${namePart}・任意保険満期`,
                href,
                icon: Truck,
            });
        }
    }

    for (const qualification of qualifications) {
        if (!qualification.expiry_date || !qualification.id) continue;
        if (!isYmdInInclusiveRange(qualification.expiry_date, monthStart, monthEnd)) continue;
        const employeeName = qualification.employees?.name || "社員";
        const branch = qualification.employees?.branch;
        items.push({
            id: `qualification-${qualification.id}`,
            date: qualification.expiry_date,
            category: "資格",
            categoryPriority: monthScheduleCategoryPriority.資格,
            title: qualification.qualification_master?.name || "資格",
            subtitle: branch ? `${employeeName}（${branch}）` : employeeName,
            href: `/qualifications/${qualification.id}`,
            icon: ScrollText,
        });
    }

    for (const healthRow of healthRows) {
        if (!healthRow.check_date) continue;
        const employeeName = healthRow.employees?.name || "社員";
        const branch = healthRow.employees?.branch;
        const typeLabel = healthRow.check_type?.trim() || "健康診断";
        items.push({
            id: `health-${healthRow.id}`,
            date: healthRow.check_date,
            category: "健診",
            categoryPriority: monthScheduleCategoryPriority.健診,
            title: typeLabel,
            subtitle: [employeeName, branch, healthRow.hospital_name].filter(Boolean).join(" / "),
            href: "/health-checks",
            icon: HeartPulse,
        });
    }

    items.sort((a, b) => {
        const byDate = a.date.localeCompare(b.date);
        if (byDate !== 0) return byDate;
        const byCategory = a.categoryPriority - b.categoryPriority;
        if (byCategory !== 0) return byCategory;
        return a.title.localeCompare(b.title, "ja");
    });

    return items.slice(0, 40);
}

const getDashboardTodayAlcoholChecks = cache(async (today: string): Promise<DashboardAlcoholRow[]> => {
    const supabase = await createSupabaseServer();
    const { data } = await supabase
        .from("alcohol_checks")
        .select(`
            id,
            employee_id,
            is_abnormal,
            check_datetime,
            location,
            employee:employees!alcohol_checks_employee_id_fkey(name, branch)
        `)
        .is("deleted_at", null)
        .gte("check_datetime", `${today}T00:00:00`)
        .lte("check_datetime", `${today}T23:59:59`);

    return ((data || []) as unknown as DashboardAlcoholRow[]);
});

const getDashboardPrioritySnapshot = cache(async (today: string): Promise<PrioritySnapshot> => {
    const [employeeRows, qualifications, vehicles, todayAlcoholChecks] = await Promise.all([
        getCachedDashboardEmployees(),
        getCachedDashboardQualifications(),
        getCachedDashboardVehicles(),
        getDashboardTodayAlcoholChecks(today),
    ]);

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const totalEmployees = employeeRows.length;
    const newEmployeesCount = employeeRows.filter((employee: DashboardEmployee) =>
        employee.hire_date && isAfter(new Date(employee.hire_date), firstDayOfMonth)
    ).length;

    const alerts = classifyAlerts(qualifications);
    const expiredCount = alerts.filter((item) => item.level === "danger").length;
    const urgentCount = alerts.filter((item) => item.level === "urgent").length;
    const warningCount = alerts.filter((item) => item.level === "warning").length;
    const infoCount = alerts.filter((item) => item.level === "info").length;
    const urgentAlertCount = expiredCount + urgentCount;

    const vehicleTasks = vehicles
        .filter((vehicle) => !!vehicle.inspection_expiry && isBefore(new Date(vehicle.inspection_expiry), addDays(now, 30)))
        .map((vehicle) => ({
            ...vehicle,
            daysRemaining: getDaysRemaining(vehicle.inspection_expiry!, now),
        }))
        .sort((a, b) => a.daysRemaining - b.daysRemaining);

    const abnormalAlcoholTasks = todayAlcoholChecks
        .filter((check) => check.is_abnormal)
        .sort((a, b) => (a.check_datetime || "").localeCompare(b.check_datetime || ""));

    const activeEmployees = employeeRows.filter((employee) => {
        const hired = !employee.hire_date || employee.hire_date <= today;
        const active = !employee.termination_date || employee.termination_date >= today;
        return hired && active;
    });

    const recordedEmployeeIds = new Set(
        todayAlcoholChecks
            .map((check) => check.employee_id)
            .filter((employeeId): employeeId is string => !!employeeId)
    );

    const missingAlcoholEmployees = activeEmployees
        .filter((employee) => !recordedEmployeeIds.has(employee.id))
        .sort((a, b) => a.name.localeCompare(b.name, "ja"));

    const abnormalAlcohol = abnormalAlcoholTasks.length;
    const pendingAlcoholCount = abnormalAlcohol + missingAlcoholEmployees.length;
    const qualificationTone = expiredCount > 0 ? alertStyles.danger : urgentCount > 0 ? alertStyles.urgent : null;
    const vehicleTone = vehicleTasks.length > 0
        ? (vehicleTasks[0].daysRemaining < 0 ? alertStyles.danger : vehicleTasks[0].daysRemaining <= 7 ? alertStyles.urgent : alertStyles.warning)
        : null;
    const alcoholTone = abnormalAlcohol > 0 ? alertStyles.danger : missingAlcoholEmployees.length > 0 ? alertStyles.urgent : todayAlcoholChecks.length > 0 ? alertStyles.ok : null;
    const qualificationSummaryTone = urgentAlertCount > 0
        ? (expiredCount > 0 ? alertStyles.danger : alertStyles.urgent)
        : null;

    const focusCards: FocusCard[] = [
        {
            title: "資格・講習",
            value: urgentAlertCount,
            href: "/qualifications?level=urgent",
            description: expiredCount > 0
                ? `期限切れ ${expiredCount}件 / 14日以内 ${urgentCount}件`
                : urgentCount > 0
                    ? `14日以内に ${urgentCount}件の更新が必要`
                    : "緊急対応はありません",
            icon: ShieldAlert,
            iconClassName: qualificationTone?.icon || neutralIconClassName,
            valueClassName: qualificationTone?.strong || "text-foreground",
            eyebrow: "要確認",
        },
        {
            title: "本日のアルコールチェック",
            value: pendingAlcoholCount,
            href: buildAlcoholChecksHref({ date: today, status: abnormalAlcohol > 0 ? "abnormal" : undefined }),
            description: abnormalAlcohol > 0
                ? `不適正 ${abnormalAlcohol}件 / 未記録 ${missingAlcoholEmployees.length}名`
                : missingAlcoholEmployees.length > 0
                    ? `未記録 ${missingAlcoholEmployees.length}名を確認`
                    : todayAlcoholChecks.length > 0
                        ? `本日の記録 ${todayAlcoholChecks.length}件`
                        : "本日の記録は��だありません",
            icon: Wine,
            iconClassName: alcoholTone?.icon || neutralIconClassName,
            valueClassName: alcoholTone?.strong || "text-foreground",
            eyebrow: "日次確認",
        },
        {
            title: "車検期限",
            value: vehicleTasks.length,
            href: vehicleTasks[0]?.plate_number ? `/vehicles?q=${encodeURIComponent(vehicleTasks[0].plate_number)}` : "/vehicles",
            description: vehicleTasks.length > 0
                ? `${vehicleTasks[0]?.plate_number || "車両"} など ${vehicleTasks.length}件が30日以内`
                : "30日以内の車検期限はありません",
            icon: Truck,
            iconClassName: vehicleTone?.icon || neutralIconClassName,
            valueClassName: vehicleTone?.strong || "text-foreground",
            eyebrow: "資産管理",
        },
    ];

    const dashboardTasksAll: DashboardTask[] = [
        ...alerts.map((alert) => {
            const style = alertStyles[alert.level];
            const categoryBase = alert.level === "danger" ? 0 : alert.level === "urgent" ? 3 : alert.level === "warning" ? 6 : 8;
            return {
                id: `qualification-${alert.qualificationId}`,
                title: `${alert.employeeName}${alert.employeeBranch ? ` / ${alert.employeeBranch}` : ""}`,
                subtitle: alert.qualificationName,
                href: `/qualifications/${alert.qualificationId}`,
                meta: `${alert.expiryDate} まで`,
                badgeLabel: alert.level === "danger" ? "期限切れ" : alert.level === "urgent" ? "14日以内" : alert.level === "warning" ? "30日以内" : "60日以内",
                badgeClassName: style.badge,
                surfaceClassName: style.subtle,
                iconClassName: style.icon,
                strongClassName: style.strong,
                icon: ShieldAlert,
                priority: getTaskPriority(categoryBase, Math.max(alert.daysRemaining, -365)),
                employeeId: alert.employeeId,
            };
        }),
        ...vehicleTasks.map((vehicle) => {
            const style = vehicle.daysRemaining < 0 ? alertStyles.danger : vehicle.daysRemaining <= 7 ? alertStyles.urgent : alertStyles.warning;
            const categoryBase = vehicle.daysRemaining < 0 ? 2 : vehicle.daysRemaining <= 7 ? 5 : 7;
            return {
                id: `vehicle-${vehicle.plate_number}`,
                title: vehicle.plate_number,
                subtitle: vehicle.vehicle_name || "車検満了の確認が必要です",
                href: `/vehicles?q=${encodeURIComponent(vehicle.plate_number)}`,
                meta: vehicle.inspection_expiry ? `${vehicle.inspection_expiry} が満了日` : "満了日未設定",
                badgeLabel: vehicle.daysRemaining < 0 ? "期限切れ" : vehicle.daysRemaining <= 7 ? "7日以内" : "30日以内",
                badgeClassName: style.badge,
                surfaceClassName: style.subtle,
                iconClassName: style.icon,
                strongClassName: style.strong,
                icon: Truck,
                priority: getTaskPriority(categoryBase, Math.max(vehicle.daysRemaining, -365)),
            };
        }),
        ...abnormalAlcoholTasks.map((check, index) => ({
            id: `alcohol-abnormal-${check.id}`,
            title: check.employee?.name || "対象者未設定",
            subtitle: `${check.location || "拠点未設定"} / 不適正記録を確認`,
            href: buildAlcoholChecksHref({
                date: today,
                employee: check.employee_id || undefined,
                location: check.location,
                status: "abnormal",
            }),
            meta: check.check_datetime ? `${check.check_datetime.slice(11, 16)} の記録` : "本日の記録",
            badgeLabel: "不適正",
            badgeClassName: alertStyles.danger.badge,
            surfaceClassName: alertStyles.danger.subtle,
            iconClassName: alertStyles.danger.icon,
            strongClassName: alertStyles.danger.strong,
            icon: Wine,
            priority: getTaskPriority(1, index),
        })),
        ...missingAlcoholEmployees.map((employee, index) => ({
            id: `alcohol-missing-${employee.id}`,
            title: employee.name,
            subtitle: `${employee.branch || "拠点未設定"} / 本日のアルコールチェックが未入力`,
            href: buildAlcoholChecksHref({ date: today, employee: employee.id }),
            meta: `${today} の記録を追加`,
            badgeLabel: "未記録",
            badgeClassName: alertStyles.urgent.badge,
            surfaceClassName: alertStyles.urgent.subtle,
            iconClassName: alertStyles.urgent.icon,
            strongClassName: alertStyles.urgent.strong,
            icon: Wine,
            priority: getTaskPriority(4, index),
        })),
    ]
        .sort((a, b) => a.priority - b.priority);

    const totalTaskCount = dashboardTasksAll.length;
    const dashboardTasks = dashboardTasksAll.slice(0, 10);

    return {
        today,
        totalEmployees,
        newEmployeesCount,
        qualificationCount: qualifications.length,
        vehicleCount: vehicles.length,
        expiredCount,
        urgentCount,
        warningCount,
        infoCount,
        urgentAlertCount,
        abnormalAlcohol,
        pendingAlcoholCount,
        missingAlcoholCount: missingAlcoholEmployees.length,
        totalTaskCount,
        vehicleTasks,
        dashboardTasks,
        focusCards,
        topTask: dashboardTasks[0] || null,
        qualificationSummaryTone,
        vehicleTone,
        alcoholTone,
    };
});

const getDashboardMonthSchedule = cache(async (today: string) => {
    const { start: monthStart, end: monthEnd } = getTokyoCalendarMonthBounds(today);
    const [qualifications, vehicles, healthRows] = await Promise.all([
        getCachedDashboardQualifications(),
        getCachedDashboardVehicles(),
        getCachedMonthlyHealthChecks(monthStart, monthEnd),
    ]);

    return buildMonthScheduleItems({
        todayYmd: today,
        qualifications,
        vehicles,
        healthRows,
    });
});

export function DashboardHeroSection() {
    const today = getTodayInTokyo();

    return (
        <section className="rounded-2xl bg-gradient-to-br from-primary/[0.03] to-transparent border border-border/30 p-6 md:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/70">
                        Daily Overview
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                        本日の業務状況
                    </h1>
                    <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                        資格・車両・アルコールチェックの状況をひと目で確認できます。
                    </p>
                </div>
                <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
                    <Button className="w-full sm:w-auto shadow-sm" render={<Link href="/qualifications?level=urgent" />}>
                        資格タスクを見る
                    </Button>
                    <Button className="w-full sm:w-auto" variant="outline" render={<Link href="/vehicles" />}>
                        車両期限を確認
                    </Button>
                    <Button className="w-full sm:w-auto" variant="outline" render={<Link href={buildAlcoholChecksHref({ date: today })} />}>
                        アルコールチェック
                    </Button>
                </div>
            </div>
        </section>
    );
}

export async function DashboardFocusCardsSection() {
    const snapshot = await getDashboardPrioritySnapshot(getTodayInTokyo());

    const statRows = [
        { label: "登録従業員数", value: snapshot.totalEmployees, detail: "現在の登録数" },
        { label: "今月の新規入社", value: snapshot.newEmployeesCount, detail: "当月入社" },
        { label: "登録データ総数", value: snapshot.qualificationCount + snapshot.vehicleCount, detail: `資格 ${countFormatter.format(snapshot.qualificationCount)}件 / 車両 ${countFormatter.format(snapshot.vehicleCount)}件` },
    ];

    return (
        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">最優先タスク</CardTitle>
                    <CardDescription>
                        いま最初に確認すべき対象を表示しています
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {snapshot.topTask ? (
                        <Link
                            href={snapshot.topTask.href}
                            className="group flex items-center gap-4 transition-all duration-200 hover:bg-muted/50 -mx-6 px-6 py-3 rounded-xl"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <p className="text-sm font-semibold text-foreground">{snapshot.topTask.title}</p>
                                    <Badge variant="secondary" className={`${snapshot.topTask.badgeClassName} text-[11px] font-medium`}>
                                        {snapshot.topTask.badgeLabel}
                                    </Badge>
                                </div>
                                <p className="truncate text-sm text-muted-foreground mt-1">{snapshot.topTask.subtitle}</p>
                                <p className="text-xs text-muted-foreground/70 mt-0.5">{snapshot.topTask.meta}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:text-foreground group-hover:translate-x-0.5" />
                        </Link>
                    ) : (
                        <p className="text-sm text-muted-foreground py-3">本日時点で優先対応が必要な項目は見つかっていません。</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">アラート状況</CardTitle>
                    <CardDescription>資格・アルコール・車検の要確認件数</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="-mx-6">
                        {snapshot.focusCards.map((card) => (
                            <Link
                                key={card.title}
                                href={card.href}
                                className="group flex items-center justify-between border-b border-border/30 px-6 py-3.5 last:border-0 transition-all duration-200 hover:bg-muted/50"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground">{card.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                                </div>
                                <p className={`text-2xl font-bold tabular-nums shrink-0 ml-4 ${card.valueClassName}`}>
                                    {countFormatter.format(card.value)}
                                </p>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="xl:col-span-2">
                <CardContent className="pt-6">
                    <div className="-mx-6 grid xl:grid-cols-3">
                        {statRows.map((stat, i) => (
                            <div key={stat.label} className={`flex items-center justify-between px-6 py-5 ${i < statRows.length - 1 ? "border-b border-border/30 xl:border-b-0 xl:border-r" : ""}`}>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{stat.label}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{stat.detail}</p>
                                </div>
                                <p className="text-3xl font-bold tabular-nums ml-4 text-foreground">{countFormatter.format(stat.value)}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}

export async function DashboardMonthScheduleSection() {
    const items = await getDashboardMonthSchedule(getTodayInTokyo());

    return (
        <section className="rounded-2xl border border-border/30 bg-card p-6 md:p-8">
            <div>
                <h2 className="flex items-center gap-2.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                        <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    今月の予定・期限
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    健診の受診日、車両の期限、資格の有効期限が今月中のものです。
                </p>
            </div>
            <div className="mt-5">
                {items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/50 bg-muted/20 px-4 py-12 text-center text-sm text-muted-foreground">
                        今月中に該当する予定・期限はありません。
                    </div>
                ) : (
                    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-4">
                        {items.map((item, i) => (
                            <li key={item.id}>
                                <Link
                                    href={item.href}
                                    className="group flex items-center gap-3 border-b border-border/30 py-3.5 transition-all duration-200 hover:bg-muted/40 last:border-0"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs tabular-nums font-medium text-muted-foreground">{item.date}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{item.category}</span>
                                        </div>
                                        <p className="mt-1 truncate text-sm font-semibold text-foreground">{item.title}</p>
                                        <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:text-foreground group-hover:translate-x-0.5" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}

export async function DashboardTaskListSection() {
    const snapshot = await getDashboardPrioritySnapshot(getTodayInTokyo());

    const summaryItems = [
        {
            label: "資格アラート",
            sublabel: "期限切れ / 14日以内 / 30日以内",
            value: snapshot.urgentAlertCount,
            detail: `緊急 ${countFormatter.format(snapshot.expiredCount)}件`,
            tone: snapshot.qualificationSummaryTone,
            href: "/qualifications?level=urgent",
        },
        {
            label: "車検期限",
            sublabel: "30日以内の対象件数",
            value: snapshot.vehicleTasks.length,
            detail: snapshot.vehicleTasks[0]?.inspection_expiry ? `最短 ${snapshot.vehicleTasks[0].inspection_expiry}` : "直近予定なし",
            tone: snapshot.vehicleTone,
            href: "/vehicles",
        },
        {
            label: "アルコールチェック",
            sublabel: "不適正と未記録の件数",
            value: snapshot.pendingAlcoholCount,
            detail: `不適正 ${countFormatter.format(snapshot.abnormalAlcohol)}件 / 未記録 ${countFormatter.format(snapshot.missingAlcoholCount)}名`,
            tone: snapshot.alcoholTone,
            href: buildAlcoholChecksHref({ date: snapshot.today }),
        },
    ];

    return (
        <section className="grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2.5 text-lg">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10">
                            <ShieldAlert className="h-4 w-4 text-destructive" />
                        </div>
                        本日の未対応タスク
                    </CardTitle>
                    <CardDescription>
                        資格、車両、アルコールチェックを横断して優先度順に表示
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {snapshot.dashboardTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl bg-muted/30 px-4 py-12 text-center">
                            <div className={`mb-4 flex size-14 items-center justify-center rounded-full ${alertStyles.ok.icon}`}>
                                <ShieldCheck className="h-7 w-7" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">今日の未対応タスクはありません</p>
                            <p className="mt-1.5 text-sm text-muted-foreground">
                                重要度の高い更新や未記録は見つかっていません。
                            </p>
                        </div>
                    ) : (
                        <div className="-mx-6">
                            {snapshot.dashboardTasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="group flex items-center gap-3 border-b border-border/30 px-6 py-3.5 last:border-0 transition-all duration-200 hover:bg-muted/40"
                                >
                                    <Link href={task.href} className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2.5">
                                            <p className="text-sm font-semibold text-foreground">{task.title}</p>
                                            <Badge variant="secondary" className={`${task.badgeClassName} text-[11px] font-medium`}>
                                                {task.badgeLabel}
                                            </Badge>
                                        </div>
                                        <p className="truncate text-sm text-muted-foreground mt-1">{task.subtitle}</p>
                                        <p className="text-xs text-muted-foreground/70 mt-0.5">{task.meta}</p>
                                    </Link>
                                    {task.employeeId ? (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="shrink-0 text-xs h-8 px-3 opacity-0 group-hover:opacity-100 transition-all"
                                            render={<Link href={`/employees/${task.employeeId}?tab=qualifications`} />}
                                        >
                                            資格タブ <ArrowRight className="ml-1.5 h-3 w-3" />
                                        </Button>
                                    ) : (
                                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:text-foreground group-hover:translate-x-0.5" />
                                    )}
                                </div>
                            ))}
                            {snapshot.totalTaskCount > 10 && (
                                <div className="border-t border-border/30 px-6 py-4">
                                    <Link href="/qualifications?level=urgent" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                                        他 {snapshot.totalTaskCount - 10} 件のアラートをすべて確認する
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">本日の安全・運用サマリー</CardTitle>
                    <CardDescription>
                        日次確認で見落としやすい項目をまとめています
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="-mx-6">
                        {summaryItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="group flex items-center justify-between border-b border-border/30 px-6 py-5 last:border-0 transition-all duration-200 hover:bg-muted/40"
                            >
                                <div>
                                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{item.sublabel}</p>
                                </div>
                                <div className="text-right tabular-nums">
                                    <p className={`text-3xl font-bold ${item.tone?.strong || "text-foreground"}`}>
                                        {countFormatter.format(item.value)}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}

export function DashboardQuickLinksSection() {
    const today = getTodayInTokyo();
    const quickLinks = [
        { title: "社員台帳", description: "社員情報と保有資格を確認", href: "/employees" },
        { title: "資格・講習", description: "期限切れと講習履歴を確認", href: "/qualifications?level=urgent" },
        { title: "車両・備品", description: "車検期限の近い車両を確認", href: "/vehicles" },
        { title: "アルコールチェック", description: "本日の記録と未対応を確認", href: buildAlcoholChecksHref({ date: today }) },
    ];

    return (
        <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">主要画面へのショートカット</CardTitle>
                    <CardDescription>
                        朝の確認でよく使う画面にすぐ移動できます
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="-mx-6">
                        {quickLinks.map((link) => (
                            <Link
                                key={link.title}
                                href={link.href}
                                className="group flex items-center gap-3 border-b border-border/30 px-6 py-3.5 last:border-0 transition-all duration-200 hover:bg-muted/40"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-foreground">{link.title}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{link.description}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:text-foreground group-hover:translate-x-0.5" />
                            </Link>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="rounded-2xl border border-border/30 bg-gradient-to-br from-muted/30 to-transparent px-6 py-5">
                <div className="flex h-full flex-col justify-center gap-3">
                    <p className="text-sm font-semibold text-foreground">表示について</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        このページはセクションごとに別々に読み込みます。重い一覧や日次データが遅くても、他のカードは先に使えます。
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                        各画面に直接移動したい場合は、上のショートカットをご利用ください。
                    </p>
                </div>
            </div>
        </section>
    );
}
