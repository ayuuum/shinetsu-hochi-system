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
    vehicleTasks: Array<DashboardVehicle & { daysRemaining: number }>;
    dashboardTasks: DashboardTask[];
    focusCards: FocusCard[];
    topTask: DashboardTask | null;
    qualificationSummaryTone: typeof alertStyles.danger | typeof alertStyles.urgent | null;
    vehicleTone: typeof alertStyles.danger | typeof alertStyles.urgent | typeof alertStyles.warning | null;
    alcoholTone: typeof alertStyles.danger | typeof alertStyles.urgent | typeof alertStyles.ok | null;
};

const countFormatter = new Intl.NumberFormat("ja-JP");
const neutralSurfaceClassName = "border border-border/50 bg-white/72";
const neutralIconClassName = "bg-muted/80 text-muted-foreground";

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
                        : "本日の記録はまだありません",
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

    const dashboardTasks: DashboardTask[] = [
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
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 10);

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
        <section className="rounded-xl border border-border/50 bg-card p-5 md:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Daily Overview
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                        今日の業務状況を先に把握する
                    </h1>
                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                        資格、車両、アルコールチェック、今月の予定を分けて表示しています。重い集計は後から順に埋まるので、まず必要な画面に移れます。
                    </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Button className="w-full sm:w-auto" render={<Link href="/qualifications?level=urgent" />}>
                        資格タスクを見る
                    </Button>
                    <Button className="w-full sm:w-auto" variant="outline" render={<Link href="/vehicles" />}>
                        車両期限を確認
                    </Button>
                    <Button className="w-full sm:w-auto" variant="outline" render={<Link href={buildAlcoholChecksHref({ date: today })} />}>
                        本日のアルコールチェック
                    </Button>
                </div>
            </div>
        </section>
    );
}

export async function DashboardFocusCardsSection() {
    const snapshot = await getDashboardPrioritySnapshot(getTodayInTokyo());

    return (
        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-muted-foreground" />
                        最優先タスク
                    </CardTitle>
                    <CardDescription>
                        いま最初に確認すべき対象を 1 件だけ先頭に出しています。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {snapshot.topTask ? (
                        <Link
                            href={snapshot.topTask.href}
                            className={`group block rounded-xl p-4 transition-[border-color,background-color] duration-200 ${snapshot.topTask.surfaceClassName}`}
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="space-y-1">
                                    <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${snapshot.topTask.strongClassName}`}>
                                        最優先タスク
                                    </p>
                                    <p className="text-base font-semibold">{snapshot.topTask.title}</p>
                                    <p className="text-sm text-muted-foreground">{snapshot.topTask.subtitle}</p>
                                    <p className="text-sm text-muted-foreground">{snapshot.topTask.meta}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className={`${snapshot.topTask.badgeClassName} text-xs`}>
                                        {snapshot.topTask.badgeLabel}
                                    </Badge>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                                </div>
                            </div>
                        </Link>
                    ) : (
                        <div className={`rounded-xl p-4 ${alertStyles.ok.subtle}`}>
                            <div className="flex items-start gap-3">
                                <div className={`flex size-10 items-center justify-center rounded-xl ${alertStyles.ok.icon}`}>
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">未対応タスクはありません</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        本日時点で優先対応が必要な項目は見つかっていません。
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
                {snapshot.focusCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.title}
                            href={card.href}
                            className="group rounded-xl border border-border/50 bg-card p-4 transition-[border-color,background-color] duration-200 hover:border-primary/20 hover:bg-muted/60"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                        {card.eyebrow}
                                    </p>
                                    <p className={`mt-2.5 text-3xl font-semibold tabular-nums ${card.valueClassName}`}>
                                        {countFormatter.format(card.value)}
                                    </p>
                                    <p className="mt-1.5 text-sm font-medium">{card.title}</p>
                                </div>
                                <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${card.iconClassName}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                {card.description}
                            </p>
                        </Link>
                    );
                })}
            </div>

            <div className="grid gap-4 xl:col-span-2 xl:grid-cols-3">
                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            登録従業員数
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold tabular-nums">{countFormatter.format(snapshot.totalEmployees)}</p>
                        <p className="mt-2 text-sm text-muted-foreground">現在の登録従業員数です。</p>
                    </CardContent>
                </Card>
                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            今月の新規入社
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold tabular-nums">{countFormatter.format(snapshot.newEmployeesCount)}</p>
                        <p className="mt-2 text-sm text-muted-foreground">当月に入社日を迎えた社員数です。</p>
                    </CardContent>
                </Card>
                <Card className="border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                            登録データ総数
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold tabular-nums">
                            {countFormatter.format(snapshot.qualificationCount + snapshot.vehicleCount)}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            資格 {countFormatter.format(snapshot.qualificationCount)}件 / 車両 {countFormatter.format(snapshot.vehicleCount)}件
                        </p>
                    </CardContent>
                </Card>
            </div>
        </section>
    );
}

export async function DashboardMonthScheduleSection() {
    const items = await getDashboardMonthSchedule(getTodayInTokyo());

    return (
        <section className="rounded-xl border border-border/50 bg-card p-5 md:p-6">
            <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    今月の予定・期限
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    健診の受診日、車両の期限、資格の有効期限が今月中のものです。
                </p>
            </div>
            <div className="mt-4">
                {items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border/70 bg-muted/25 px-4 py-10 text-center text-sm text-muted-foreground">
                        今月中に該当する予定・期限はありません。
                    </div>
                ) : (
                    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map((item) => {
                            const Icon = item.icon;
                            return (
                                <li key={item.id}>
                                    <Link
                                        href={item.href}
                                        className="group flex gap-3 rounded-xl border border-border/50 bg-background/60 p-3.5 transition-[border-color,background-color] duration-200 hover:border-primary/20 hover:bg-muted/60"
                                    >
                                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/80 text-muted-foreground">
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-xs font-medium tabular-nums text-muted-foreground">{item.date}</span>
                                                <Badge variant="outline" className="text-[10px] font-normal">{item.category}</Badge>
                                            </div>
                                            <p className="mt-1 truncate text-sm font-semibold">{item.title}</p>
                                            <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                                        </div>
                                        <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                                    </Link>
                                </li>
                            );
                        })}
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
        <section className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldAlert className={`h-5 w-5 ${alertStyles.danger.strong}`} />
                        本日の未対応タスク
                    </CardTitle>
                    <CardDescription>
                        資格、車両、アルコールチェックを横断して、直接処理できる順で並べています。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {snapshot.dashboardTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl bg-muted/40 px-4 py-10 text-center">
                            <div className={`mb-3 flex size-12 items-center justify-center rounded-full ${alertStyles.ok.icon}`}>
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-medium">今日の未対応タスクはありません</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                重要度の高い更新や未記録は見つかっていません。
                            </p>
                        </div>
                    ) : (
                        <div className="-mx-6">
                            {snapshot.dashboardTasks.map((task) => (
                                <Link
                                    key={task.id}
                                    href={task.href}
                                    className="group flex items-center gap-3 border-b border-border/40 px-6 py-3 last:border-0 transition-colors duration-150 hover:bg-muted/40"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="text-sm font-semibold">{task.title}</p>
                                            <Badge variant="secondary" className={`${task.badgeClassName} text-xs`}>
                                                {task.badgeLabel}
                                            </Badge>
                                        </div>
                                        <p className="truncate text-xs text-muted-foreground mt-0.5">{task.subtitle}</p>
                                        <p className="text-xs text-muted-foreground">{task.meta}</p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                </Link>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle>本日の安全・運用サマリー</CardTitle>
                    <CardDescription>
                        日次確認で見落としやすい項目をまとめています。
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="-mx-6">
                        {summaryItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="group flex items-center justify-between border-b border-border/40 px-6 py-4 last:border-0 transition-colors duration-150 hover:bg-muted/40"
                            >
                                <div>
                                    <p className="text-sm font-medium">{item.label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{item.sublabel}</p>
                                </div>
                                <div className="text-right tabular-nums">
                                    <p className={`text-3xl font-bold ${item.tone?.strong || "text-foreground"}`}>
                                        {countFormatter.format(item.value)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{item.detail}</p>
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
        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle>主要画面へのショートカット</CardTitle>
                    <CardDescription>
                        朝の確認でよく使う画面にすぐ移動できます。
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                    {quickLinks.map((link) => (
                        <Link
                            key={link.title}
                            href={link.href}
                            className="group rounded-xl border border-border/50 bg-background/70 p-4 transition-[border-color,background-color] duration-200 hover:border-primary/20 hover:bg-muted/60"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium">{link.title}</p>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{link.description}</p>
                                </div>
                                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                            </div>
                        </Link>
                    ))}
                </CardContent>
            </Card>

            <div className="rounded-xl border border-border/50 bg-card px-4 py-3">
                <div className="flex h-full flex-col justify-center gap-2 text-sm text-muted-foreground">
                    <p className="text-sm font-medium text-foreground">表示方針</p>
                    <p>このページはセクションごとに別々に読み込みます。重い一覧や日次データが遅くても、他のカードは先に使えます。</p>
                    <p>資格、車両、アルコールチェック、今月の予定を個別に確認したいときは上のショートカットから直接開いてください。</p>
                </div>
            </div>
        </section>
    );
}
