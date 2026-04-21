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
import { Search, AlertCircle, ShieldCheck, Clock, ShieldAlert, Pencil, FileImage, Tags } from "lucide-react";
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
import { PageHeader } from "@/components/shared/page-header";
import { getQualificationLevelLabel } from "@/lib/display-labels";

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
    totalPages: number;
    employees?: Employee[];
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
    totalPages,
    employees = [],
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
    const showActions = isAdminOrHr;
    const columnCount = showActions ? 7 : 6;
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
            />

            {/* Summary KPI Strip */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {(
                    [
                        { level: "danger", label: "期限切れ", icon: AlertCircle },
                        { level: "urgent", label: "14日以内", icon: ShieldAlert },
                        { level: "warning", label: "30日以内", icon: Clock },
                        { level: "ok", label: "正常", icon: ShieldCheck },
                    ] as const
                ).map(({ level, label, icon: Icon }) => {
                    const isActive = currentLevel === level;
                    const style = alertStyles[level];
                    return (
                        <button
                            key={level}
                            type="button"
                            aria-pressed={isActive}
                            onClick={() => toggleLevelFilter(level)}
                            className={`group relative rounded-2xl border text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 ${
                                isActive
                                    ? `${style.icon} border-current/20 shadow-sm`
                                    : "border-border/60 bg-card hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(38,42,46,0.08)]"
                            }`}
                        >
                            <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-opacity duration-200 ${style.icon} ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`} />
                            <div className="px-5 py-4">
                                <div className={`mb-2 inline-flex rounded-lg p-1.5 ${isActive ? "bg-white/30" : style.icon}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <p className={`text-3xl font-bold tabular-nums tracking-tight ${isActive ? "text-current" : style.strong}`}>
                                    {counts[level] || 0}
                                </p>
                                <p className={`mt-0.5 whitespace-nowrap text-xs font-medium ${isActive ? "text-current/80" : "text-muted-foreground"}`}>{label}</p>
                            </div>
                        </button>
                    );
                })}
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
                        <CardContent className="py-8 text-center text-sm text-muted-foreground">
                            該当する資格データがありません。
                        </CardContent>
                    </Card>
                ) : (
                    initialQualifications.map((q) => {
                        const level = getAlertLevel(q.expiry_date);
                        const config = levelConfig[level];
                        const days = q.expiry_date ? differenceInDays(new Date(q.expiry_date), new Date()) : null;

                        return (
                            <Card key={q.id} size="sm" className="border-border/60">
                                <CardContent className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 space-y-1">
                                            <TableCellLink href={`/qualifications/${q.id}`} className="line-clamp-2 text-base font-semibold hover:underline">
                                                {q.qualification_master?.name || "-"}
                                            </TableCellLink>
                                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                                {q.employees?.id ? (
                                                    <TableCellLink href={`/employees/${q.employees.id}`} className="font-medium hover:underline">
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
                            <TableHead className="sticky left-0 z-20 bg-muted/50 shadow-[inset_-1px_0_0_hsl(var(--border))] min-w-[140px]">社員名</TableHead>
                            <TableHead className="min-w-[180px]">資格名</TableHead>
                            <TableHead className="min-w-[100px]">取得日</TableHead>
                            <TableHead className="min-w-[100px]">有効期限</TableHead>
                            <TableHead className="min-w-[110px]">ステータス</TableHead>
                            <TableHead className="w-[52px] text-center">証書</TableHead>
                            {showActions && <TableHead className="w-[80px]">操作</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialQualifications.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                                    該当する資格データがありません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialQualifications.map((q) => {
                                const level = getAlertLevel(q.expiry_date);
                                const config = levelConfig[level];
                                const days = q.expiry_date ? differenceInDays(new Date(q.expiry_date), new Date()) : null;
                                return (
                                    <TableRow key={q.id} className="hover:bg-muted/20 transition-colors">
                                        <TableCell className="sticky left-0 z-10 bg-card shadow-[inset_-1px_0_0_hsl(var(--border))] group-hover:bg-muted/20">
                                            {q.employees?.id ? (
                                                <TableCellLink href={`/employees/${q.employees.id}`} className="font-semibold hover:underline">
                                                    {q.employees.name}
                                                </TableCellLink>
                                            ) : (
                                                <span className="font-semibold">{q.employees?.name || "-"}</span>
                                            )}
                                            {q.employees?.branch && (
                                                <p className="text-xs text-muted-foreground mt-0.5">{q.employees.branch}</p>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <TableCellLink href={`/qualifications/${q.id}`} className="font-medium hover:underline">
                                                {q.qualification_master?.name || "-"}
                                            </TableCellLink>
                                            {q.qualification_master?.category && (
                                                <p className="text-xs text-muted-foreground mt-0.5">{q.qualification_master.category}</p>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm tabular-nums text-muted-foreground">{formatDisplayDate(q.acquired_date)}</TableCell>
                                        <TableCell className={`text-sm font-medium tabular-nums ${config.color}`}>
                                            {formatDisplayDate(q.expiry_date, "期限なし")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={`${config.badge} text-xs`}>
                                                {days !== null
                                                    ? days < 0 ? `${Math.abs(days)}日超過` : days === 0 ? "本日" : `残${days}日`
                                                    : "−"}
                                            </Badge>
                                            {q.status && q.status !== "未着手" && (
                                                <p className="text-xs text-muted-foreground mt-1">{q.status}</p>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {q.certificate_url ? (
                                                <span className="inline-flex text-primary" title="証書画像あり">
                                                    <FileImage className="h-4 w-4" aria-label="証書画像あり" />
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground/40">—</span>
                                            )}
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

            {totalPages > 1 && (
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
                        {currentPage} / {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
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
