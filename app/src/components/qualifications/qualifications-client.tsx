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
import { Search, AlertCircle, ShieldCheck, Clock, ShieldAlert, Pencil } from "lucide-react";
import { differenceInDays } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { alertStyles, getAlertLevel, type AlertLevel } from "@/lib/alert-utils";
import { EditQualificationModal } from "@/components/qualifications/edit-qualification-modal";
import { TableCellLink } from "@/components/shared/table-cell-link";
import { ActiveFilters } from "@/components/shared/active-filters";
import { MobileFiltersSheet } from "@/components/shared/mobile-filters-sheet";

export type QualificationRow = Tables<"employee_qualifications"> & {
    employees: { id: string; name: string; branch: string | null } | null;
    qualification_master: { name: string; category: string | null } | null;
};

const levelConfig = alertStyles;

interface QualificationsClientProps {
    initialQualifications: QualificationRow[];
    categories: string[];
    counts: Record<AlertLevel, number>;
    currentSearch: string;
    currentCategory: string;
    currentLevel: string;
    currentPage: number;
    totalPages: number;
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
}: QualificationsClientProps) {
    const [search, setSearch] = useState(currentSearch);
    const [editingItem, setEditingItem] = useState<QualificationRow | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const pathname = usePathname();
    const { isAdminOrHr } = useAuth();
    const showActions = isAdminOrHr;
    const columnCount = showActions ? 9 : 8;
    const levelLabels: Record<string, string> = {
        danger: "期限切れ",
        urgent: "14日以内",
        warning: "30日以内",
        info: "60日以内",
        ok: "正常",
    };
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
                label: `状態: ${levelLabels[currentLevel] || currentLevel}`,
                onRemove: () => updateFilters({ level: "", page: 1 }),
            }
            : null,
    ].filter((item): item is NonNullable<typeof item> => item !== null);

    useEffect(() => {
        setSearch(currentSearch);
    }, [currentSearch]);

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

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">資格・講習管理</h1>
                <p className="text-muted-foreground mt-2">全従業員の資格・免状の期限と更新予定を一元管理します。</p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
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
                                <p className="text-xs text-muted-foreground">期限切れ</p>
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
                                <p className="text-xs text-muted-foreground">14日以内</p>
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
                                <p className="text-xs text-muted-foreground">30日以内</p>
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
                                <p className="text-xs text-muted-foreground">正常</p>
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
                        placeholder="社員名・資格名で検索..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <MobileFiltersSheet
                    title="資格を絞り込む"
                    description="カテゴリや期限状態で表示内容を絞り込みます。"
                    activeCount={activeFilters.length}
                    onClearAll={clearFilters}
                >
                    <div className="space-y-2">
                        <p className="text-sm font-medium">カテゴリ</p>
                        <Select
                            value={currentCategory || undefined}
                            onValueChange={(value) => updateFilters({ category: value && value !== "all" ? value : "", page: 1 })}
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
                            value={currentLevel || undefined}
                            onValueChange={(value) => updateFilters({ level: value && value !== "all" ? value : "", page: 1 })}
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
                        placeholder="社員名・資格名で検索..."
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
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                aria-label={`${q.qualification_master?.name || "資格"}を編集`}
                                                onClick={() => setEditingItem(q)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        ) : null}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">カテゴリ</p>
                                            <p>{q.qualification_master?.category || "-"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">取得日</p>
                                            <p>{q.acquired_date || "-"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">有効期限</p>
                                            <p className={`font-medium ${config.color}`}>{q.expiry_date || "期限なし"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-xs text-muted-foreground">申込状況</p>
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
                                    <TableRow key={q.id} className="hover:bg-transparent">
                                        <TableCell className="sticky left-0 z-10 bg-card font-bold shadow-[inset_-1px_0_0_hsl(var(--border))]">
                                            {q.employees?.id ? (
                                                <TableCellLink href={`/employees/${q.employees.id}`} className="font-bold hover:underline">
                                                    {q.employees.name}
                                                </TableCellLink>
                                            ) : (
                                                q.employees?.name || "-"
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm">{q.employees?.branch || "-"}</TableCell>
                                        <TableCell className="text-sm font-medium">
                                            <TableCellLink href={`/qualifications/${q.id}`} className="text-sm font-medium hover:underline">
                                                {q.qualification_master?.name || "-"}
                                            </TableCellLink>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{q.qualification_master?.category || "-"}</TableCell>
                                        <TableCell className="text-sm">{q.acquired_date || "-"}</TableCell>
                                        <TableCell className={`text-sm font-medium ${config.color}`}>
                                            {q.expiry_date || "期限なし"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={config.badge}>
                                                {days !== null
                                                    ? days < 0 ? `${Math.abs(days)}日超過` : days === 0 ? "本日" : `残${days}日`
                                                    : "−"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{q.status || "未着手"}</TableCell>
                                        {showActions && (
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    aria-label={`${q.qualification_master?.name || "資格"}を編集`}
                                                    onClick={() => setEditingItem(q)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
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
