"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Tables } from "@/types/supabase";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, AlertCircle, ShieldCheck, Clock, ShieldAlert, Pencil, FileImage, Tags, ScrollText, Download, Loader2, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { differenceInDays } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { alertStyles, getAlertLevel, type AlertLevel } from "@/lib/alert-utils";
import { EditQualificationModal } from "@/components/qualifications/edit-qualification-modal";
import { TableCellLink } from "@/components/shared/table-cell-link";
import { ActiveFilters } from "@/components/shared/active-filters";
import { MobileFiltersSheet } from "@/components/shared/mobile-filters-sheet";
import { formatDisplayDate } from "@/lib/date";
import { RecordActionsMenu } from "@/components/shared/record-actions-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { AddQualificationFromListModal } from "./add-qualification-from-list-modal";
import { BulkUpdateQualificationModal } from "./bulk-update-qualification-modal";
import { PageHeader } from "@/components/shared/page-header";
import { getQualificationLevelLabel } from "@/lib/display-labels";
import { useIntentPrefetch } from "@/hooks/use-intent-prefetch";
import { type LicenseGroupInfo } from "@/lib/license-groups";

export type QualificationRow = Tables<"employee_qualifications"> & {
    employees: { id: string; name: string; branch: string | null } | null;
    qualification_master: { name: string; category: string | null } | null;
};

const levelConfig = alertStyles;

type Employee = { id: string; name: string; branch: string | null };

interface QualificationsClientProps {
    initialQualifications: QualificationRow[];
    categories: string[];
    counts: Record<AlertLevel, number>;
    currentSearch: string;
    currentCategory: string;
    currentLevel: string;
    currentPage: number;
    hasNextPage: boolean;
    employees?: Employee[];
    qualificationMasters?: { id: string; name: string; category: string | null }[];
    licenseGroups?: Record<string, LicenseGroupInfo>;
}

function LicenseGroupBadge({ info }: { info?: LicenseGroupInfo }) {
    if (!info) return null;
    return info.isLatest ? (
        <Badge className="border-transparent bg-emerald-100 text-emerald-700">最新免状</Badge>
    ) : (
        <Badge variant="outline" className="text-muted-foreground">同一免状</Badge>
    );
}

function buildQualificationsHref(pathname: string, {
    search,
    category,
    level,
    page,
}: {
    search: string;
    category: string;
    level: string;
    page: number;
}) {
    const params = new URLSearchParams();

    if (search.trim()) {
        params.set("q", search.trim());
    }
    if (category) {
        params.set("category", category);
    }
    if (level) {
        params.set("level", level);
    }
    if (page > 1) {
        params.set("page", String(page));
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
}

export function QualificationsClient({
    initialQualifications,
    categories,
    counts,
    currentSearch,
    currentCategory,
    currentLevel,
    currentPage,
    hasNextPage,
    employees = [],
    qualificationMasters = [],
    licenseGroups = {},
}: QualificationsClientProps) {
    const [search, setSearch] = useState(currentSearch);
    const [editingItem, setEditingItem] = useState<QualificationRow | null>(null);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [mobileCategory, setMobileCategory] = useState(currentCategory);
    const [mobileLevel, setMobileLevel] = useState(currentLevel);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const pathname = usePathname();
    const { isAdminOrHr } = useAuth();
    const { getIntentPrefetchProps } = useIntentPrefetch();
    const showActions = isAdminOrHr;
    const columnCount = showActions ? 11 : 10;
    const activeFilters = [
        currentSearch
            ? {
                key: "search",
                label: `検索: ${currentSearch}`,
                onRemove: () => {
                    setSearch("");
                    startTransition(() => {
                        router.replace(buildQualificationsHref(pathname, { search: "", category: currentCategory, level: currentLevel, page: 1 }), { scroll: false });
                    });
                },
            }
            : null,
        currentCategory
            ? {
                key: "category",
                label: `カテゴリ: ${currentCategory}`,
                onRemove: () => updateFilters({ category: "", page: 1 }),
            }
            : null,
        currentLevel
            ? {
                key: "level",
                label: `状態: ${getQualificationLevelLabel(currentLevel)}`,
                onRemove: () => updateFilters({ level: "", page: 1 }),
            }
            : null,
    ].filter((item): item is NonNullable<typeof item> => item !== null);

    useEffect(() => {
        setSearch(currentSearch);
    }, [currentSearch]);

    useEffect(() => {
        if (isMobileFiltersOpen) return;
        setMobileCategory(currentCategory);
        setMobileLevel(currentLevel);
    }, [currentCategory, currentLevel, isMobileFiltersOpen]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (search === currentSearch) return;

            startTransition(() => {
                router.replace(buildQualificationsHref(pathname, {
                    search,
                    category: currentCategory,
                    level: currentLevel,
                    page: 1,
                }), { scroll: false });
            });
        }, 250);

        return () => window.clearTimeout(timer);
    }, [currentCategory, currentLevel, currentSearch, pathname, router, search]);

    const updateFilters = (updates: Partial<{ search: string; category: string; level: string; page: number }>) => {
        startTransition(() => {
            router.replace(buildQualificationsHref(pathname, {
                search,
                category: updates.category ?? currentCategory,
                level: updates.level ?? currentLevel,
                page: updates.page ?? 1,
            }), { scroll: false });
        });
    };

    const toggleLevelFilter = (nextValue: string) => {
        updateFilters({
            level: currentLevel === nextValue ? "" : nextValue,
            page: 1,
        });
    };

    const clearFilters = () => {
        setSearch("");
        startTransition(() => {
            router.replace(buildQualificationsHref(pathname, { search: "", category: "", level: "", page: 1 }), { scroll: false });
        });
    };

    const handleMobileFiltersOpenChange = (open: boolean) => {
        if (open) {
            setMobileCategory(currentCategory);
            setMobileLevel(currentLevel);
        }
        setIsMobileFiltersOpen(open);
    };

    const applyMobileFilters = () => {
        setIsMobileFiltersOpen(false);
        startTransition(() => {
            router.replace(buildQualificationsHref(pathname, {
                search,
                category: mobileCategory,
                level: mobileLevel,
                page: 1,
            }), { scroll: false });
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            <PageHeader
                title="資格・講習管理"
                description="全従業員の資格・免状の期限と更新予定を一元管理します。"
                actions={isAdminOrHr ? (
                    <>
                        <AddQualificationFromListModal employees={employees} onSuccess={() => router.refresh()} />
                        <BulkUpdateQualificationModal qualificationMasters={qualificationMasters} employees={employees} />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const params = new URLSearchParams();
                                if (search.trim()) params.set("q", search.trim());
                                if (currentCategory) params.set("category", currentCategory);
                                if (currentLevel) params.set("level", currentLevel);
                                const qs = params.toString();
                                window.open(qs ? `/api/export/qualifications?${qs}` : "/api/export/qualifications", "_blank");
                            }}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            CSV出力
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            render={<Link href="/qualifications/masters" />}
                        >
                            <Tags className="mr-2 h-4 w-4" />
                            資格マスタ
                        </Button>
                    </>
                ) : undefined}
                actionsClassName="flex-wrap"
            />

            {isPending ? (
                <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    表示条件を更新しています...
                </div>
            ) : null}

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card className="transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[0_1px_2px_rgba(38,42,46,0.04),0_12px_24px_rgba(38,42,46,0.06)]">
                    <button
                        type="button"
                        aria-pressed={currentLevel === "danger"}
                        onClick={() => toggleLevelFilter("danger")}
                        className="w-full rounded-[20px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${alertStyles.danger.icon}`}><AlertCircle className="h-5 w-5" /></div>
                            <div>
                                <p className={`text-2xl font-bold ${alertStyles.danger.strong}`}>{counts.danger || 0}</p>
                                <p className="whitespace-nowrap text-sm text-muted-foreground">期限切れ</p>
                            </div>
                        </CardContent>
                    </button>
                </Card>
                <Card className="transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[0_1px_2px_rgba(38,42,46,0.04),0_12px_24px_rgba(38,42,46,0.06)]">
                    <button
                        type="button"
                        aria-pressed={currentLevel === "urgent"}
                        onClick={() => toggleLevelFilter("urgent")}
                        className="w-full rounded-[20px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${alertStyles.urgent.icon}`}><ShieldAlert className="h-5 w-5" /></div>
                            <div>
                                <p className={`text-2xl font-bold ${alertStyles.urgent.strong}`}>{counts.urgent || 0}</p>
                                <p className="whitespace-nowrap text-sm text-muted-foreground">14日以内</p>
                            </div>
                        </CardContent>
                    </button>
                </Card>
                <Card className="transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[0_1px_2px_rgba(38,42,46,0.04),0_12px_24px_rgba(38,42,46,0.06)]">
                    <button
                        type="button"
                        aria-pressed={currentLevel === "warning"}
                        onClick={() => toggleLevelFilter("warning")}
                        className="w-full rounded-[20px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${alertStyles.warning.icon}`}><Clock className="h-5 w-5" /></div>
                            <div>
                                <p className={`text-2xl font-bold ${alertStyles.warning.strong}`}>{counts.warning || 0}</p>
                                <p className="whitespace-nowrap text-sm text-muted-foreground">30日以内</p>
                            </div>
                        </CardContent>
                    </button>
                </Card>
                <Card className="transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[0_1px_2px_rgba(38,42,46,0.04),0_12px_24px_rgba(38,42,46,0.06)]">
                    <button
                        type="button"
                        aria-pressed={currentLevel === "ok"}
                        onClick={() => toggleLevelFilter("ok")}
                        className="w-full rounded-[20px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    >
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${alertStyles.ok.icon}`}><ShieldCheck className="h-5 w-5" /></div>
                            <div>
                                <p className={`text-2xl font-bold ${alertStyles.ok.strong}`}>{counts.ok || 0}</p>
                                <p className="whitespace-nowrap text-sm text-muted-foreground">正常</p>
                            </div>
                        </CardContent>
                    </button>
                </Card>
            </div>

            {/* Filters */}
            <div className="space-y-3 md:hidden">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        aria-label="社員名・資格名で検索"
                        placeholder="社員名・資格名で検索…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <MobileFiltersSheet
                    title="資格を絞り込む"
                    description="カテゴリや期限状態で表示内容を絞り込みます。"
                    summary="カテゴリ・期限状態"
                    activeCount={activeFilters.length}
                    onClearAll={() => {
                        clearFilters();
                        setIsMobileFiltersOpen(false);
                    }}
                    open={isMobileFiltersOpen}
                    onOpenChange={handleMobileFiltersOpenChange}
                    footer={(
                        <Button type="button" className="w-full" onClick={applyMobileFilters}>
                            条件を適用
                        </Button>
                    )}
                >
                    <div className="space-y-2">
                        <p className="text-sm font-medium">カテゴリ</p>
                        <Select
                            value={mobileCategory || undefined}
                            onValueChange={(value) => setMobileCategory(value && value !== "all" ? value : "")}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="すべてのカテゴリ" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">すべてのカテゴリ</SelectItem>
                                {categories.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">期限状態</p>
                        <Select
                            value={mobileLevel || undefined}
                            onValueChange={(value) => setMobileLevel(value && value !== "all" ? value : "")}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="すべてのステータス" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">すべて</SelectItem>
                                <SelectItem value="danger">期限切れ</SelectItem>
                                <SelectItem value="urgent">14日以内</SelectItem>
                                <SelectItem value="warning">30日以内</SelectItem>
                                <SelectItem value="info">60日以内</SelectItem>
                                <SelectItem value="ok">正常</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </MobileFiltersSheet>
            </div>

            <div className="hidden md:flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        aria-label="社員名・資格名で検索"
                        placeholder="社員名・資格名で検索…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select
                    value={currentCategory || undefined}
                    onValueChange={(value) => updateFilters({ category: value && value !== "all" ? value : "", page: 1 })}
                >
                    <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="すべてのカテゴリ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">すべてのカテゴリ</SelectItem>
                        {categories.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select
                    value={currentLevel || undefined}
                    onValueChange={(value) => updateFilters({ level: value && value !== "all" ? value : "", page: 1 })}
                >
                    <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="すべてのステータス" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">すべて</SelectItem>
                        <SelectItem value="danger">期限切れ</SelectItem>
                        <SelectItem value="urgent">14日以内</SelectItem>
                        <SelectItem value="warning">30日以内</SelectItem>
                        <SelectItem value="info">60日以内</SelectItem>
                        <SelectItem value="ok">正常</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <ActiveFilters items={activeFilters} onClearAll={clearFilters} />

            <div className="space-y-3 md:hidden" aria-busy={isPending}>
                {initialQualifications.length === 0 ? (
                    <Card size="sm" className="border-border/60">
                        <CardContent className="p-0">
                            <EmptyState
                                icon={ScrollText}
                                title={activeFilters.length > 0 ? "条件に一致する資格がありません" : "資格データがまだ登録されていません"}
                                description={activeFilters.length > 0 ? "検索条件または期限フィルタを変更してください" : isAdminOrHr ? "「資格を追加」から登録できます" : "登録・更新は管理者または人事権限が必要です"}
                                action={activeFilters.length > 0 ? { label: "条件を解除", onClick: clearFilters, variant: "outline" } : undefined}
                            />
                        </CardContent>
                    </Card>
                ) : (
                    initialQualifications.map((q) => {
                        const level = getAlertLevel(q.expiry_date);
                        const config = levelConfig[level];
                        const days = q.expiry_date ? differenceInDays(new Date(q.expiry_date), new Date()) : null;
                        const qualificationHref = `/qualifications/${q.id}`;
                        const qualificationPrefetchProps = getIntentPrefetchProps(qualificationHref);
                        const employeeHref = q.employees?.id ? `/employees/${q.employees.id}?tab=basic` : "";
                        const employeePrefetchProps = employeeHref ? getIntentPrefetchProps(employeeHref) : {};

                        return (
                            <Card key={q.id} size="sm" className="border-border/60">
                                <CardContent className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 space-y-1">
                                            <TableCellLink href={qualificationHref} className="line-clamp-2 text-base font-semibold hover:underline" {...qualificationPrefetchProps}>
                                                {q.qualification_master?.name || "-"}
                                            </TableCellLink>
                                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                                {q.employees?.id ? (
                                                    <TableCellLink href={employeeHref} className="font-medium hover:underline" {...employeePrefetchProps}>
                                                        {q.employees.name}
                                                    </TableCellLink>
                                                ) : (
                                                    <span className="font-medium">{q.employees?.name || "-"}</span>
                                                )}
                                                <span className="text-muted-foreground">·</span>
                                                <span className="text-muted-foreground">{q.employees?.branch || "拠点未設定"}</span>
                                            </div>
                                        </div>
                                        {showActions ? (
                                            <RecordActionsMenu label={q.qualification_master?.name || "資格"}>
                                                <DropdownMenuItem onClick={() => setEditingItem(q)}>
                                                    <Pencil className="h-4 w-4" />
                                                    編集
                                                </DropdownMenuItem>
                                            </RecordActionsMenu>
                                        ) : null}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">カテゴリ</p>
                                            <p>{q.qualification_master?.category || "-"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">取得日</p>
                                            <p className="tabular-nums">{formatDisplayDate(q.acquired_date)}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">有効期限</p>
                                            <p className={`font-medium tabular-nums ${config.color}`}>{formatDisplayDate(q.expiry_date, "期限なし")}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">申込状況</p>
                                            <p>{q.status || "未着手"}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Badge variant="secondary" className={config.badge}>
                                            {days !== null
                                                ? days < 0 ? `${Math.abs(days)}日超過` : days === 0 ? "本日" : `残${days}日`
                                                : "−"}
                                        </Badge>
                                        {q.qualification_master?.category ? (
                                            <Badge variant="outline">{q.qualification_master.category}</Badge>
                                        ) : null}
                                        {q.certificate_url ? (
                                            <Badge variant="outline" className="gap-1">
                                                <FileImage className="h-3 w-3" aria-hidden />
                                                証書あり
                                            </Badge>
                                        ) : null}
                                        <LicenseGroupBadge info={licenseGroups[q.id]} />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            <div className="hidden overflow-x-auto rounded-[24px] border border-border/60 bg-card shadow-[0_1px_2px_rgba(38,42,46,0.04),0_12px_28px_rgba(38,42,46,0.05)] md:block" aria-busy={isPending}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="sticky left-0 z-20 bg-muted/50 shadow-[inset_-1px_0_0_hsl(var(--border))]">社員名</TableHead>
                            <TableHead>拠点</TableHead>
                            <TableHead>資格名</TableHead>
                            <TableHead>カテゴリ</TableHead>
                            <TableHead>取得日</TableHead>
                            <TableHead>有効期限</TableHead>
                            <TableHead>ステータス</TableHead>
                            <TableHead>申込状況</TableHead>
                            <TableHead className="w-[52px] text-center">証書</TableHead>
                            <TableHead className="w-[88px] text-right">詳細</TableHead>
                            {showActions && <TableHead className="w-[80px]">操作</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialQualifications.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columnCount}>
                                    <EmptyState
                                        icon={ScrollText}
                                        title={activeFilters.length > 0 ? "条件に一致する資格がありません" : "資格データがまだ登録されていません"}
                                        description={activeFilters.length > 0 ? "検索条件または期限フィルタを変更してください" : isAdminOrHr ? "「資格を追加」から登録できます" : "登録・更新は管理者または人事権限が必要です"}
                                        action={activeFilters.length > 0 ? { label: "条件を解除", onClick: clearFilters, variant: "outline" } : undefined}
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialQualifications.map((q) => {
                                const level = getAlertLevel(q.expiry_date);
                                const config = levelConfig[level];
                                const days = q.expiry_date ? differenceInDays(new Date(q.expiry_date), new Date()) : null;
                                const qualificationHref = `/qualifications/${q.id}`;
                                const qualificationPrefetchProps = getIntentPrefetchProps(qualificationHref);
                                const employeeHref = q.employees?.id ? `/employees/${q.employees.id}?tab=basic` : "";
                                const employeePrefetchProps = employeeHref ? getIntentPrefetchProps(employeeHref) : {};
                                return (
                                    <TableRow key={q.id} className="hover:bg-muted/30">
                                        <TableCell className="sticky left-0 z-10 bg-card py-4 font-bold shadow-[inset_-1px_0_0_hsl(var(--border))]">
                                            {q.employees?.id ? (
                                                <TableCellLink href={employeeHref} className="font-bold hover:underline" {...employeePrefetchProps}>
                                                    {q.employees.name}
                                                </TableCellLink>
                                            ) : (
                                                q.employees?.name || "-"
                                            )}
                                        </TableCell>
                                        <TableCell className="py-4 text-sm">{q.employees?.branch || "-"}</TableCell>
                                        <TableCell className="py-4 text-sm font-medium">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <TableCellLink href={qualificationHref} className="text-sm font-medium hover:underline" {...qualificationPrefetchProps}>
                                                    {q.qualification_master?.name || "-"}
                                                </TableCellLink>
                                                <LicenseGroupBadge info={licenseGroups[q.id]} />
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-sm text-muted-foreground">{q.qualification_master?.category || "-"}</TableCell>
                                        <TableCell className="py-4 text-sm tabular-nums">{formatDisplayDate(q.acquired_date)}</TableCell>
                                        <TableCell className={`py-4 text-sm font-semibold tabular-nums ${config.color}`}>
                                            {formatDisplayDate(q.expiry_date, "期限なし")}
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <Badge variant="secondary" className={`${config.badge} text-xs font-semibold px-2 py-0.5`}>
                                                {days !== null
                                                    ? days < 0 ? `${Math.abs(days)}日超過` : days === 0 ? "本日" : `残${days}日`
                                                    : "−"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-4 text-sm text-muted-foreground">{q.status || "未着手"}</TableCell>
                                        <TableCell className="text-center">
                                            {q.certificate_url ? (
                                                <span className="inline-flex text-primary" title="証書画像あり">
                                                    <FileImage className="h-4 w-4" aria-label="証書画像あり" />
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" render={<Link href={qualificationHref} {...qualificationPrefetchProps} />}>
                                                開く
                                                <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                        {showActions && (
                                            <TableCell>
                                                <RecordActionsMenu label={q.qualification_master?.name || "資格"}>
                                                    <DropdownMenuItem onClick={() => setEditingItem(q)}>
                                                        <Pencil className="h-4 w-4" />
                                                        編集
                                                    </DropdownMenuItem>
                                                </RecordActionsMenu>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {(currentPage > 1 || hasNextPage) && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        render={<Link href={buildQualificationsHref(pathname, {
                            search: currentSearch,
                            category: currentCategory,
                            level: currentLevel,
                            page: currentPage - 1,
                        })} />}
                    >
                        前へ
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        {currentPage}ページ
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!hasNextPage}
                        render={<Link href={buildQualificationsHref(pathname, {
                            search: currentSearch,
                            category: currentCategory,
                            level: currentLevel,
                            page: currentPage + 1,
                        })} />}
                    >
                        次へ
                    </Button>
                </div>
            )}

            {isAdminOrHr && editingItem && (
                <EditQualificationModal
                    qualification={editingItem}
                    open={!!editingItem}
                    onOpenChange={(open) => {
                        if (!open) setEditingItem(null);
                    }}
                />
            )}
        </div>
    );
}
