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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Pencil, Search, Trash2 } from "lucide-react";
import { AddHealthCheckModal } from "./add-health-check-modal";
import { EditHealthCheckModal } from "./edit-health-check-modal";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { TableCellLink } from "@/components/shared/table-cell-link";
import { ActiveFilters } from "@/components/shared/active-filters";
import { MobileFiltersSheet } from "@/components/shared/mobile-filters-sheet";
import { deleteHealthCheckAction } from "@/app/actions/admin-record-actions";
import { formatDisplayDate } from "@/lib/date";
import { RecordActionsMenu } from "@/components/shared/record-actions-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { getHealthCheckResultLabel } from "@/lib/display-labels";

export type HealthCheckWithEmployee = Tables<"health_checks"> & {
    employees: { id: string; name: string; branch: string | null } | null;
};

type Employee = { id: string; name: string };

function buildHealthChecksHref(pathname: string, {
    search,
    type,
    result,
    page,
}: {
    search: string;
    type: string;
    result: string;
    page: number;
}) {
    const params = new URLSearchParams();

    if (search.trim()) {
        params.set("q", search.trim());
    }
    if (type) {
        params.set("type", type);
    }
    if (result) {
        params.set("result", result);
    }
    if (page > 1) {
        params.set("page", String(page));
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
}

export function HealthChecksClient({
    initialChecks,
    employees,
    currentSearch,
    currentType,
    currentResult,
    currentPage,
    totalPages,
}: {
    initialChecks: HealthCheckWithEmployee[];
    employees: Employee[];
    currentSearch: string;
    currentType: string;
    currentResult: string;
    currentPage: number;
    totalPages: number;
}) {
    const [search, setSearch] = useState(currentSearch);
    const [editingItem, setEditingItem] = useState<HealthCheckWithEmployee | null>(null);
    const [deletingItem, setDeletingItem] = useState<HealthCheckWithEmployee | null>(null);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [mobileType, setMobileType] = useState(currentType);
    const [mobileResult, setMobileResult] = useState(currentResult);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const pathname = usePathname();
    const { isAdminOrHr } = useAuth();
    const showActions = isAdminOrHr;
    const columnCount = showActions ? 8 : 7;
    const activeFilters = [
        currentSearch
            ? {
                key: "search",
                label: `検索: ${currentSearch}`,
                onRemove: () => {
                    setSearch("");
                    startTransition(() => {
                        router.replace(buildHealthChecksHref(pathname, { search: "", type: currentType, result: currentResult, page: 1 }), { scroll: false });
                    });
                },
            }
            : null,
        currentType
            ? {
                key: "type",
                label: `種別: ${currentType}`,
                onRemove: () => updateFilters({ type: "", page: 1 }),
            }
            : null,
        currentResult
            ? {
                key: "result",
                label: `結果: ${currentResult === "normal" ? "異常なし" : currentResult === "abnormal" ? "要再検査" : "結果を選択"}`,
                onRemove: () => updateFilters({ result: "", page: 1 }),
            }
            : null,
    ].filter((item): item is NonNullable<typeof item> => item !== null);

    useEffect(() => {
        setSearch(currentSearch);
    }, [currentSearch]);

    useEffect(() => {
        if (isMobileFiltersOpen) return;
        setMobileType(currentType);
        setMobileResult(currentResult);
    }, [currentResult, currentType, isMobileFiltersOpen]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (search === currentSearch) return;

            startTransition(() => {
                router.replace(buildHealthChecksHref(pathname, {
                    search,
                    type: currentType,
                    result: currentResult,
                    page: 1,
                }), { scroll: false });
            });
        }, 250);

        return () => window.clearTimeout(timer);
    }, [currentResult, currentSearch, currentType, pathname, router, search]);

    const updateFilters = (updates: Partial<{ type: string; result: string; page: number }>) => {
        startTransition(() => {
            router.replace(buildHealthChecksHref(pathname, {
                search,
                type: updates.type ?? currentType,
                result: updates.result ?? currentResult,
                page: updates.page ?? 1,
            }), { scroll: false });
        });
    };

    const handleDelete = async () => {
        if (!isAdminOrHr || !deletingItem) return;
        const result = await deleteHealthCheckAction(deletingItem.id);
        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("健康診断記録を削除しました");
            router.refresh();
        }
    };

    const clearFilters = () => {
        setSearch("");
        startTransition(() => {
            router.replace(buildHealthChecksHref(pathname, { search: "", type: "", result: "", page: 1 }), { scroll: false });
        });
    };

    const handleMobileFiltersOpenChange = (open: boolean) => {
        if (open) {
            setMobileType(currentType);
            setMobileResult(currentResult);
        }
        setIsMobileFiltersOpen(open);
    };

    const applyMobileFilters = () => {
        setIsMobileFiltersOpen(false);
        startTransition(() => {
            router.replace(buildHealthChecksHref(pathname, {
                search,
                type: mobileType,
                result: mobileResult,
                page: 1,
            }), { scroll: false });
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">健康診断管理</h1>
                    <p className="text-muted-foreground mt-2">全従業員の健康診断記録を管理します。</p>
                </div>
                {isAdminOrHr && <AddHealthCheckModal employees={employees} />}
            </div>

            <div className="space-y-3 md:hidden">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        aria-label="社員名・医療機関で検索"
                        placeholder="社員名・医療機関で検索…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-11 pl-9"
                    />
                </div>
                <MobileFiltersSheet
                    title="健康診断を絞り込む"
                    description="種別や結果で記録を絞り込みます。"
                    summary="種別・結果"
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
                        <p className="text-sm font-medium">種別</p>
                        <Select
                            value={mobileType || undefined}
                            onValueChange={(value) => setMobileType(value && value !== "all" ? value : "")}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="全ての種別" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全て</SelectItem>
                                <SelectItem value="定期健康診断">定期健康診断</SelectItem>
                                <SelectItem value="雇入時健康診断">雇入時健康診断</SelectItem>
                                <SelectItem value="特殊健康診断">特殊健康診断</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium">結果</p>
                        <Select
                            value={mobileResult || undefined}
                            onValueChange={(value) => setMobileResult(value && value !== "all" ? value : "")}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="全ての結果" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全て</SelectItem>
                                <SelectItem value="normal">異常なし</SelectItem>
                                <SelectItem value="abnormal">要再検査</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </MobileFiltersSheet>
            </div>

            <div className="hidden md:flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        aria-label="社員名・医療機関で検索"
                        placeholder="社員名・医療機関で検索…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select
                    value={currentType || undefined}
                    onValueChange={(value) => updateFilters({ type: value && value !== "all" ? value : "", page: 1 })}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="全ての種別" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全て</SelectItem>
                        <SelectItem value="定期健康診断">定期健康診断</SelectItem>
                        <SelectItem value="雇入時健康診断">雇入時健康診断</SelectItem>
                        <SelectItem value="特殊健康診断">特殊健康診断</SelectItem>
                    </SelectContent>
                </Select>
                    <Select
                        value={currentResult || undefined}
                        onValueChange={(value) => updateFilters({ result: value && value !== "all" ? value : "", page: 1 })}
                    >
                        <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="全ての結果" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全て</SelectItem>
                        <SelectItem value="normal">異常なし</SelectItem>
                        <SelectItem value="abnormal">要再検査</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <ActiveFilters items={activeFilters} onClearAll={clearFilters} />

            <div className="space-y-3 md:hidden" aria-busy={isPending}>
                {initialChecks.length === 0 ? (
                    <Card size="sm" className="border-border/60">
                        <CardContent className="py-8 text-center text-sm text-muted-foreground">
                            健康診断記録がありません。
                        </CardContent>
                    </Card>
                ) : (
                    initialChecks.map((check) => (
                        <Card key={check.id} size="sm" className="border-border/60">
                            <CardContent className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        {check.employees?.id ? (
                                            <TableCellLink href={`/employees/${check.employees.id}`} className="truncate text-base font-semibold hover:underline">
                                                {check.employees.name}
                                            </TableCellLink>
                                        ) : (
                                            <p className="truncate text-base font-semibold">{check.employees?.name || "-"}</p>
                                        )}
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                            <span>{check.employees?.branch || "拠点未設定"}</span>
                                            <span>·</span>
                                            <span className="tabular-nums">{formatDisplayDate(check.check_date)}</span>
                                        </div>
                                    </div>
                                    {showActions ? (
                                        <RecordActionsMenu label={check.employees?.name || "健康診断記録"}>
                                            <DropdownMenuItem onClick={() => setEditingItem(check)}>
                                                <Pencil className="h-4 w-4" />
                                                編集
                                            </DropdownMenuItem>
                                            <DropdownMenuItem variant="destructive" onClick={() => setDeletingItem(check)}>
                                                <Trash2 className="h-4 w-4" />
                                                削除
                                            </DropdownMenuItem>
                                        </RecordActionsMenu>
                                    ) : null}
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">種別</p>
                                        <p className="font-medium">{check.check_type || "-"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">医療機関</p>
                                        <p className="font-medium">{check.hospital_name || "-"}</p>
                                    </div>
                                    <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">結果</p>
                                        <div>
                                            {check.is_normal === true ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-600">異常なし</Badge>
                                            ) : check.is_normal === false ? (
                                                <Badge variant="destructive">要再検査</Badge>
                                            ) : (
                                                getHealthCheckResultLabel(check.is_normal)
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">身長 / 体重</p>
                                        <p className="font-medium">
                                            {check.height != null || check.weight != null
                                                ? `${check.height != null ? `${check.height}cm` : "-"} / ${check.weight != null ? `${check.weight}kg` : "-"}`
                                                : "-"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <div className="hidden overflow-x-auto rounded-xl border bg-card md:block" aria-busy={isPending}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="sticky left-0 z-20 min-w-[100px] bg-muted/50 shadow-[inset_-1px_0_0_hsl(var(--border))]">社員名</TableHead>
                            <TableHead className="min-w-[80px]">拠点</TableHead>
                            <TableHead className="min-w-[110px]">受診日</TableHead>
                            <TableHead className="min-w-[120px]">種別</TableHead>
                            <TableHead className="min-w-[120px]">医療機関</TableHead>
                            <TableHead className="min-w-[80px]">結果</TableHead>
                            <TableHead className="min-w-[120px]">身長/体重</TableHead>
                            {showActions && <TableHead className="min-w-[100px]">操作</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialChecks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                                    健康診断記録がありません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialChecks.map((check) => (
                                <TableRow key={check.id} className="hover:bg-transparent">
                                    <TableCell className="sticky left-0 z-10 bg-card font-medium shadow-[inset_-1px_0_0_hsl(var(--border))]">
                                        {check.employees?.id ? (
                                            <TableCellLink href={`/employees/${check.employees.id}`} className="font-medium hover:underline">
                                                {check.employees.name}
                                            </TableCellLink>
                                        ) : (
                                            check.employees?.name || "-"
                                        )}
                                    </TableCell>
                                    <TableCell>{check.employees?.branch || "-"}</TableCell>
                                    <TableCell className="tabular-nums">{formatDisplayDate(check.check_date)}</TableCell>
                                    <TableCell>{check.check_type || "-"}</TableCell>
                                    <TableCell>{check.hospital_name || "-"}</TableCell>
                                    <TableCell>
                                        {check.is_normal === true ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-600">異常なし</Badge>
                                        ) : check.is_normal === false ? (
                                            <Badge variant="destructive">要再検査</Badge>
                                        ) : (
                                            getHealthCheckResultLabel(check.is_normal)
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {check.height != null || check.weight != null
                                            ? `${check.height != null ? `${check.height}cm` : "-"} / ${check.weight != null ? `${check.weight}kg` : "-"}`
                                            : "-"}
                                    </TableCell>
                                    {showActions && (
                                        <TableCell>
                                            <RecordActionsMenu label={check.employees?.name || "健康診断記録"}>
                                                <DropdownMenuItem onClick={() => setEditingItem(check)}>
                                                    <Pencil className="h-4 w-4" />
                                                    編集
                                                </DropdownMenuItem>
                                                <DropdownMenuItem variant="destructive" onClick={() => setDeletingItem(check)}>
                                                    <Trash2 className="h-4 w-4" />
                                                    削除
                                                </DropdownMenuItem>
                                            </RecordActionsMenu>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
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
                        render={<Link href={buildHealthChecksHref(pathname, {
                            search: currentSearch,
                            type: currentType,
                            result: currentResult,
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
                        render={<Link href={buildHealthChecksHref(pathname, {
                            search: currentSearch,
                            type: currentType,
                            result: currentResult,
                            page: currentPage + 1,
                        })} />}
                    >
                        次へ
                    </Button>
                </div>
            )}

            {isAdminOrHr && editingItem && (
                <EditHealthCheckModal
                    healthCheck={editingItem}
                    employees={employees}
                    open={!!editingItem}
                    onOpenChange={(open) => !open && setEditingItem(null)}
                />
            )}

            {isAdminOrHr && (
                <DeleteConfirmDialog
                    open={!!deletingItem}
                    onOpenChange={(open) => !open && setDeletingItem(null)}
                    title="健康診断記録の削除"
                    description={`${deletingItem?.employees?.name || ""} の ${formatDisplayDate(deletingItem?.check_date)} の健康診断記録を一覧から非表示にします。監査履歴は保持されます。`}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    );
}
