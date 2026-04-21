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
import { getAlertLevel, getDaysRemaining, alertStyles, type AlertLevel } from "@/lib/alert-utils";
import { getTodayInTokyo, getTokyoCalendarMonthBounds, isYmdInInclusiveRange } from "@/lib/date";
import { createSupabaseServer } from "@/lib/supabase-server";
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

type QualificationAlertRow = Pick<Tables<"employee_qualifications">, "id" | "employee_id" | "expiry_date"> & {
    employees: Pick<Tables<"employees">, "name" | "branch"> | null;
    qualification_master: Pick<Tables<"qualification_master">, "name" | "category"> | null;
};

type DashboardEmployeeRow = Pick<Tables<"employees">, "id" | "name" | "hire_date" | "branch" | "termination_date">;

type DashboardVehicleRow = Pick<Tables<"vehicles">, "plate_number" | "vehicle_name" | "inspection_expiry">;

type DashboardVehicleMonthRow = Pick<
    Tables<"vehicles">,
    "id" | "plate_number" | "vehicle_name" | "inspection_expiry" | "liability_insurance_expiry" | "voluntary_insurance_expiry"
>;

type DashboardHealthMonthRow = Pick<Tables<"health_checks">, "id" | "check_date" | "check_type" | "hospital_name"> & {
    employees: Pick<Tables<"employees">, "name" | "branch"> | null;
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

const countFormatter = new Intl.NumberFormat("ja-JP");

function classifyAlerts(qualifications: QualificationAlertRow[]): AlertItem[] {
    const now = new Date();
    const alerts: AlertItem[] = [];

    for (const q of qualifications) {
        if (!q.id || !q.expiry_date || !q.employee_id) continue;
        const level = getAlertLevel(q.expiry_date, now);
        if (level === "ok") continue;

        alerts.push({
            level,
            qualificationId: q.id,
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
    if (employee) {
        params.set("employee", employee);
    }
    if (location) {
        params.set("location", location);
    }
    if (status) {
        params.set("status", status);
    }

    return `/alcohol-checks?${params.toString()}`;
}

function getTaskPriority(base: number, offset: number) {
    return base * 1000 + offset;
}

const monthScheduleCategoryPriority: Record<string, number> = {
    健診: 0,
    車検: 1,
    自賠責: 2,
    任意保険: 3,
    資格: 4,
};

function buildMonthScheduleItems({
    todayYmd,
    qualifications,
    vehicles,
    healthRows,
}: {
    todayYmd: string;
    qualifications: QualificationAlertRow[];
    vehicles: DashboardVehicleMonthRow[];
    healthRows: DashboardHealthMonthRow[];
}): MonthScheduleItem[] {
    const { start: monthStart, end: monthEnd } = getTokyoCalendarMonthBounds(todayYmd);
    const items: MonthScheduleItem[] = [];

    for (const v of vehicles) {
        const href = `/vehicles?q=${encodeURIComponent(v.plate_number)}`;
        const namePart = v.vehicle_name || "車両";

        if (isYmdInInclusiveRange(v.inspection_expiry, monthStart, monthEnd)) {
            items.push({
                id: `vehicle-inspection-${v.id}`,
                date: v.inspection_expiry!,
                category: "車検",
                categoryPriority: monthScheduleCategoryPriority.車検,
                title: v.plate_number,
                subtitle: `${namePart}・車検満了`,
                href,
                icon: Truck,
            });
        }
        if (isYmdInInclusiveRange(v.liability_insurance_expiry, monthStart, monthEnd)) {
            items.push({
                id: `vehicle-liability-${v.id}`,
                date: v.liability_insurance_expiry!,
                category: "自賠責",
                categoryPriority: monthScheduleCategoryPriority.自賠責,
                title: v.plate_number,
                subtitle: `${namePart}・自賠責満期`,
                href,
                icon: Truck,
            });
        }
        if (isYmdInInclusiveRange(v.voluntary_insurance_expiry, monthStart, monthEnd)) {
            items.push({
                id: `vehicle-voluntary-${v.id}`,
                date: v.voluntary_insurance_expiry!,
                category: "任意保険",
                categoryPriority: monthScheduleCategoryPriority.任意保険,
                title: v.plate_number,
                subtitle: `${namePart}・任意保険満期`,
                href,
                icon: Truck,
            });
        }
    }

    for (const q of qualifications) {
        if (!q.expiry_date || !q.id) continue;
        if (!isYmdInInclusiveRange(q.expiry_date, monthStart, monthEnd)) continue;
        const empName = q.employees?.name || "社員";
        const branch = q.employees?.branch;
        items.push({
            id: `qualification-${q.id}`,
            date: q.expiry_date,
            category: "資格",
            categoryPriority: monthScheduleCategoryPriority.資格,
            title: q.qualification_master?.name || "資格",
            subtitle: branch ? `${empName}（${branch}）` : empName,
            href: `/qualifications/${q.id}`,
            icon: ScrollText,
        });
    }

    for (const h of healthRows) {
        if (!h.check_date) continue;
        const empName = h.employees?.name || "社員";
        const branch = h.employees?.branch;
        const typeLabel = h.check_type?.trim() || "健康診断";
        items.push({
            id: `health-${h.id}`,
            date: h.check_date,
            category: "健診",
            categoryPriority: monthScheduleCategoryPriority.健診,
            title: typeLabel,
            subtitle: [empName, branch, h.hospital_name].filter(Boolean).join(" / "),
            href: "/health-checks",
            icon: HeartPulse,
        });
    }

    items.sort((a, b) => {
        const byDate = a.date.localeCompare(b.date);
        if (byDate !== 0) return byDate;
        const byCat = a.categoryPriority - b.categoryPriority;
        if (byCat !== 0) return byCat;
        return a.title.localeCompare(b.title, "ja");
    });

    return items.slice(0, 40);
}

export default async function Home() {
    const supabase = await createSupabaseServer();
    const today = getTodayInTokyo();
    const { start: monthStart, end: monthEnd } = getTokyoCalendarMonthBounds(today);

    const [
        { data: employees },
        { data: qualifications },
        { data: vehicles },
        { data: alcoholChecks },
        { data: healthThisMonth },
    ] = await Promise.all([
        supabase.from("employees").select("id, name, hire_date, branch, termination_date").is("deleted_at", null),
        supabase.from("employee_qualifications").select(`
            id,
            employee_id,
            expiry_date,
            employees!inner(id, name, branch),
            qualification_master(name, category)
        `).is("employees.deleted_at", null).not("expiry_date", "is", null).order("expiry_date", { ascending: true }),
        supabase
            .from("vehicles")
            .select("id, plate_number, vehicle_name, inspection_expiry, liability_insurance_expiry, voluntary_insurance_expiry")
            .is("deleted_at", null)
            .order("inspection_expiry", { ascending: true }),
        supabase.from("alcohol_checks").select(`
            id,
            employee_id,
            is_abnormal,
            check_datetime,
            location,
            employee:employees!alcohol_checks_employee_id_fkey(name, branch)
        `).is("deleted_at", null).gte("check_datetime", `${today}T00:00:00`).lte("check_datetime", `${today}T23:59:59`),
        supabase
            .from("health_checks")
            .select(`
                id,
                check_date,
                check_type,
                hospital_name,
                employees(name, branch)
            `)
            .is("deleted_at", null)
            .gte("check_date", monthStart)
            .lte("check_date", monthEnd)
            .order("check_date", { ascending: true })
            .limit(100),
    ]);

    const employeeRows = (employees || []) as DashboardEmployeeRow[];
    const totalEmployees = employeeRows.length;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newEmployeesCount = employeeRows.filter((employee) =>
        employee.hire_date && isAfter(new Date(employee.hire_date), firstDayOfMonth)
    ).length;

    const alerts = classifyAlerts((qualifications || []) as QualificationAlertRow[]);
    const expiredCount = alerts.filter((alert) => alert.level === "danger").length;
    const urgentCount = alerts.filter((alert) => alert.level === "urgent").length;
    const warningCount = alerts.filter((alert) => alert.level === "warning").length;
    const infoCount = alerts.filter((alert) => alert.level === "info").length;
    const urgentAlertCount = expiredCount + urgentCount;

    const monthScheduleItems = buildMonthScheduleItems({
        todayYmd: today,
        qualifications: (qualifications || []) as QualificationAlertRow[],
        vehicles: (vehicles || []) as DashboardVehicleMonthRow[],
        healthRows: (healthThisMonth || []) as DashboardHealthMonthRow[],
    });

    const vehicleTasks = ((vehicles || []) as DashboardVehicleRow[])
        .filter((vehicle) => !!vehicle.inspection_expiry && isBefore(new Date(vehicle.inspection_expiry), addDays(now, 30)))
        .map((vehicle) => ({
            ...vehicle,
            daysRemaining: getDaysRemaining(vehicle.inspection_expiry!, now),
        }))
        .sort((a, b) => a.daysRemaining - b.daysRemaining);

    const todayAlcoholChecks = (alcoholChecks || []) as DashboardAlcoholRow[];
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
    const neutralSurfaceClassName = "border border-border/60 bg-white/72";
    const neutralIconClassName = "bg-muted/80 text-muted-foreground";

    const focusCards = [
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
            href: buildAlcoholChecksHref({
                date: today,
                employee: employee.id,
            }),
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

    const quickLinks = [
        {
            title: "社員台帳",
            description: "社員情報と保有資格を確認",
            href: "/employees",
        },
        {
            title: "資格・講習",
            description: "期限切れと講習履歴を確認",
            href: "/qualifications?level=urgent",
        },
        {
            title: "車両・備品",
            description: "車検期限の近い車両を確認",
            href: "/vehicles",
        },
        {
            title: "アルコールチェック",
            description: "本日のチェック記録と未対応を確認",
            href: buildAlcoholChecksHref({ date: today }),
        },
    ];

    return (
        <div className="space-y-5 animate-in fade-in duration-200">
            <section className="rounded-[22px] border border-border/60 bg-card p-5 shadow-[0_1px_2px_rgba(38,42,46,0.035),0_8px_18px_rgba(38,42,46,0.04)] md:p-6">
                <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1.22fr)_minmax(320px,0.88fr)]">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                                本日の優先対応
                            </h2>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            <Button className="w-full sm:w-auto" render={<Link href="/qualifications?level=urgent" />}>
                                資格タスクを見る
                            </Button>
                            <Button className="w-full sm:w-auto" variant="outline" render={<Link href="/vehicles" />}>
                                車両期限を確認
                            </Button>
                            <Button className="w-full sm:w-auto" variant="outline" render={<Link href={buildAlcoholChecksHref({ date: today })} />}>
                                本日のアルコールチェックを見る
                            </Button>
                        </div>
                        {dashboardTasks[0] ? (
                            <Link
                                href={dashboardTasks[0].href}
                                className={`group block rounded-[18px] p-4 transition-[border-color,background-color] duration-200 ${dashboardTasks[0].surfaceClassName}`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${dashboardTasks[0].strongClassName}`}>
                                            最優先タスク
                                        </p>
                                        <p className="text-base font-semibold">
                                            {dashboardTasks[0].title}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {dashboardTasks[0].subtitle}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary" className={`${dashboardTasks[0].badgeClassName} text-xs`}>
                                            {dashboardTasks[0].badgeLabel}
                                        </Badge>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                                    </div>
                                </div>
                            </Link>
                        ) : (
                            <div className={`rounded-[18px] p-4 ${alertStyles.ok.subtle}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`flex size-10 items-center justify-center rounded-[18px] ${alertStyles.ok.icon}`}>
                                        <ShieldCheck className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">未対応タスクはありません</p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            本日時点で優先対応が必要な項目は見つかっていません。通常の点検と入力確認だけ進めれば十分です。
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                        {focusCards.map((card) => {
                            const Icon = card.icon;

                            return (
                                <Link
                                    key={card.title}
                                    href={card.href}
                                className="group rounded-[20px] border border-border/60 bg-background/55 p-4 transition-[border-color,background-color] duration-200 hover:border-primary/15 hover:bg-background/80"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                                                {card.eyebrow}
                                            </p>
                                            <p className={`mt-2.5 text-[1.9rem] font-semibold tabular-nums ${card.valueClassName}`}>
                                                {countFormatter.format(card.value)}
                                            </p>
                                            <p className="mt-1.5 text-sm font-medium">{card.title}</p>
                                        </div>
                                        <div className={`flex size-8 shrink-0 items-center justify-center rounded-[14px] ${card.iconClassName}`}>
                                            <Icon className="h-[18px] w-[18px]" />
                                        </div>
                                    </div>
                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                        {card.description}
                                    </p>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section className="rounded-[20px] border border-border/60 bg-card p-5 shadow-[0_1px_2px_rgba(38,42,46,0.035),0_8px_18px_rgba(38,42,46,0.04)] md:p-6">
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            今月の予定・期限
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            健診の受診日・車両の期限・資格の有効期限が今月中のものです（最大40件）。
                        </p>
                    </div>
                </div>
                <div className="mt-4">
                    {monthScheduleItems.length === 0 ? (
                        <div className="rounded-[18px] border border-dashed border-border/70 bg-muted/25 px-4 py-10 text-center text-sm text-muted-foreground">
                            今月中に該当する予定・期限はありません。
                        </div>
                    ) : (
                        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {monthScheduleItems.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <li key={item.id}>
                                        <Link
                                            href={item.href}
                                            className="group flex gap-3 rounded-[16px] border border-border/60 bg-background/60 p-3.5 transition-[border-color,background-color,box-shadow] duration-200 hover:border-primary/15 hover:bg-background/90 hover:shadow-[0_1px_2px_rgba(38,42,46,0.04),0_8px_18px_rgba(38,42,46,0.05)]"
                                        >
                                            <div className="flex size-9 shrink-0 items-center justify-center rounded-[14px] bg-muted/80 text-muted-foreground">
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                                                        {item.date}
                                                    </span>
                                                    <Badge variant="outline" className="text-[10px] font-normal">
                                                        {item.category}
                                                    </Badge>
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

            <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
                <Card className="border-border/60">
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
                        {dashboardTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-[20px] bg-muted/40 px-4 py-10 text-center">
                                <div className={`mb-3 flex size-12 items-center justify-center rounded-full ${alertStyles.ok.icon}`}>
                                    <ShieldCheck className="h-6 w-6" />
                                </div>
                                <p className="text-sm font-medium">今日の未対応タスクはありません</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    重要度の高い更新や未記録は見つかっていません。
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {dashboardTasks.map((task) => {
                                    const Icon = task.icon;

                                    return (
                                        <Link
                                            key={task.id}
                                            href={task.href}
                                            className={`group flex flex-col items-start gap-3 rounded-[20px] p-4 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(38,42,46,0.04),0_10px_22px_rgba(38,42,46,0.05)] sm:flex-row sm:items-center sm:justify-between ${task.surfaceClassName}`}
                                        >
                                            <div className="flex min-w-0 items-center gap-3">
                                                <div className={`flex size-10 shrink-0 items-center justify-center rounded-[18px] ${task.iconClassName}`}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0 space-y-1">
                                                    <p className="truncate text-sm font-semibold">
                                                        {task.title}
                                                    </p>
                                                    <p className="truncate text-sm text-muted-foreground">
                                                        {task.subtitle}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {task.meta}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex w-full items-center justify-between sm:ml-4 sm:w-auto sm:justify-start sm:gap-2">
                                                <Badge variant="secondary" className={`${task.badgeClassName} text-sm`}>
                                                    {task.badgeLabel}
                                                </Badge>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="grid gap-4">
                    <Card className="border-border/60">
                        <CardHeader>
                            <CardTitle>主要画面へのショートカット</CardTitle>
                            <CardDescription>
                                朝の確認でよく使う画面にすぐ移動できます。
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                            {quickLinks.map((link) => (
                                <Link
                                    key={link.title}
                                    href={link.href}
                                    className="group rounded-[20px] border border-border/60 bg-background/70 p-4 transition-[transform,border-color,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-primary/15 hover:bg-white hover:shadow-[0_1px_2px_rgba(38,42,46,0.04),0_10px_22px_rgba(38,42,46,0.05)]"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium">{link.title}</p>
                                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                                {link.description}
                                            </p>
                                        </div>
                                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
                                    </div>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-border/60">
                        <CardHeader>
                            <CardTitle>本日の安全・運用サマリー</CardTitle>
                            <CardDescription>
                                日次確認で見落としやすい項目をまとめています。
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className={`flex flex-col gap-3 rounded-[20px] px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${qualificationSummaryTone?.subtle || neutralSurfaceClassName}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`flex size-9 items-center justify-center rounded-[18px] ${qualificationSummaryTone?.icon || neutralIconClassName}`}>
                                        <AlertCircle className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">資格アラート</p>
                                        <p className="text-sm text-muted-foreground">期限切れ / 14日以内 / 30日以内</p>
                                    </div>
                                </div>
                                <div className="text-right tabular-nums">
                                    <p className={`text-lg font-semibold ${qualificationSummaryTone?.strong || "text-foreground"}`}>{countFormatter.format(urgentAlertCount)}</p>
                                    <p className="text-sm text-muted-foreground">緊急 {countFormatter.format(expiredCount)}件</p>
                                </div>
                            </div>
                            <div className={`flex flex-col gap-3 rounded-[20px] px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${vehicleTone?.subtle || neutralSurfaceClassName}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`flex size-9 items-center justify-center rounded-[18px] ${vehicleTone?.icon || neutralIconClassName}`}>
                                        <Truck className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">車検期限</p>
                                        <p className="text-sm text-muted-foreground">30日以内の対象件数</p>
                                    </div>
                                </div>
                                <div className="text-right tabular-nums">
                                    <p className={`text-lg font-semibold ${vehicleTone?.strong || "text-foreground"}`}>{countFormatter.format(vehicleTasks.length)}</p>
                                    <p className="text-sm text-muted-foreground">{vehicleTasks[0]?.inspection_expiry ? `最短 ${vehicleTasks[0].inspection_expiry}` : "直近予定なし"}</p>
                                </div>
                            </div>
                            <div className={`flex flex-col gap-3 rounded-[20px] px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${alcoholTone?.subtle || neutralSurfaceClassName}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`flex size-9 items-center justify-center rounded-[18px] ${alcoholTone?.icon || neutralIconClassName}`}>
                                        <Wine className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">アルコールチェック</p>
                                        <p className="text-sm text-muted-foreground">不適正と未記録の件数</p>
                                    </div>
                                </div>
                                <div className="text-right tabular-nums">
                                    <p className={`text-lg font-semibold ${alcoholTone?.strong || "text-foreground"}`}>{countFormatter.format(pendingAlcoholCount)}</p>
                                    <p className="text-sm text-muted-foreground">不適正 {countFormatter.format(abnormalAlcohol)}件 / 未記録 {countFormatter.format(missingAlcoholEmployees.length)}名</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-border/60">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            登録従業員数
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold tabular-nums">{countFormatter.format(totalEmployees)}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            現在の登録従業員数です。
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-border/60">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            今月の新規入社
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold tabular-nums">{countFormatter.format(newEmployeesCount)}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            当月に入社日を迎えた社員数です。
                        </p>
                    </CardContent>
                </Card>
                <Card className="border-border/60">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                            登録データ総数
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-semibold tabular-nums">{countFormatter.format((qualifications?.length || 0) + (vehicles?.length || 0))}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            資格 {countFormatter.format(qualifications?.length || 0)}件 / 車両 {countFormatter.format(vehicles?.length || 0)}件
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-[20px] border border-border/60 bg-card px-4 py-3">
                <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-1">
                    <span className="mr-1">資格アラート内訳</span>
                    <span className={`font-medium tabular-nums ${alertStyles.danger.strong}`}>期限切れ {countFormatter.format(expiredCount)}</span>
                    <span className={`font-medium tabular-nums ${alertStyles.urgent.strong}`}>14日以内 {countFormatter.format(urgentCount)}</span>
                    <span className={`font-medium tabular-nums ${alertStyles.warning.strong}`}>30日以内 {countFormatter.format(warningCount)}</span>
                    <span className={`font-medium tabular-nums ${alertStyles.info.strong}`}>60日以内 {countFormatter.format(infoCount)}</span>
                    <span className={`font-medium tabular-nums ${alcoholTone?.strong || "text-foreground"}`}>アルコールチェック未記録 {countFormatter.format(missingAlcoholEmployees.length)}</span>
                </div>
            </div>
        </div>
    );
}
