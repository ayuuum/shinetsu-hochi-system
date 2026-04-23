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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Pencil, Search, Trash2, Download, Building2, MapPin, Tag } from "lucide-react";
import { AddProjectModal } from "./add-project-modal";
import { EditProjectModal } from "./edit-project-modal";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { TableCellLink } from "@/components/shared/table-cell-link";
import { ActiveFilters } from "@/components/shared/active-filters";
import { MobileFiltersSheet } from "@/components/shared/mobile-filters-sheet";
import { deleteProjectAction } from "@/app/actions/admin-record-actions";
import { EQUIPMENT_OPTIONS } from "@/lib/validation/project";
import { formatDisplayDate } from "@/lib/date";
import { RecordActionsMenu } from "@/components/shared/record-actions-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/page-header";

export type ConstructionWithEmployee = Tables<"construction_records"> & {
    employees: { id: string; name: string; branch: string | null } | null;
};

type Employee = { id: string; name: string; branch: string | null };

function buildProjectsHref(pathname: string, {
    search,
    category,
    page,
}: {
    search: string;
    category: string;
    page: number;
}) {
    const params = new URLSearchParams();

    if (search.trim()) {
        params.set("q", search.trim());
    }
    if (category) {
        params.set("category", category);
    }
    if (page > 1) {
        params.set("page", String(page));
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
}

export function ProjectsClient({
    initialRecords,
    employees,
    currentSearch,
    currentCategory,
    currentPage,
    hasNextPage,
}: {
    initialRecords: ConstructionWithEmployee[];
    employees: Employee[];
    currentSearch: string;
    currentCategory: string;
    currentPage: number;
    hasNextPage: boolean;
}) {
    const [search, setSearch] = useState(currentSearch);
    const [editingItem, setEditingItem] = useState<ConstructionWithEmployee | null>(null);
    const [deletingItem, setDeletingItem] = useState<ConstructionWithEmployee | null>(null);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [mobileCategory, setMobileCategory] = useState(currentCategory);
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
                        router.replace(buildProjectsHref(pathname, { search: "", category: currentCategory, page: 1 }), { scroll: false });
                    });
                },
            }
            : null,
        currentCategory
            ? {
                key: "category",
                label: `設備種別: ${currentCategory}`,
                onRemove: () => updateFilters({ category: "", page: 1 }),
            }
            : null,
    ].filter((item): item is NonNullable<typeof item> => item !== null);

    useEffect(() => {
        setSearch(currentSearch);
    }, [currentSearch]);

    useEffect(() => {
        if (isMobileFiltersOpen) return;
        setMobileCategory(currentCategory);
    }, [currentCategory, isMobileFiltersOpen]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (search === currentSearch) return;

            startTransition(() => {
                router.replace(buildProjectsHref(pathname, {
                    search,
                    category: currentCategory,
                    page: 1,
                }), { scroll: false });
            });
        }, 250);

        return () => window.clearTimeout(timer);
    }, [currentCategory, currentSearch, pathname, router, search]);

    const updateFilters = (updates: Partial<{ category: string; page: number }>) => {
        startTransition(() => {
            router.replace(buildProjectsHref(pathname, {
                search,
                category: updates.category ?? currentCategory,
                page: updates.page ?? 1,
            }), { scroll: false });
        });
    };

    const handleDelete = async () => {
        if (!isAdminOrHr || !deletingItem) return;
        const result = await deleteProjectAction(deletingItem.id);
        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("工事記録を削除しました");
            router.refresh();
        }
    };

    const handleExport = () => {
        window.open("/api/export/career-history?format=excel", "_blank");
    };

    const clearFilters = () => {
        setSearch("");
        startTransition(() => {
            router.replace(buildProjectsHref(pathname, { search: "", category: "", page: 1 }), { scroll: false });
        });
    };

    const handleMobileFiltersOpenChange = (open: boolean) => {
        if (open) {
            setMobileCategory(currentCategory);
        }
        setIsMobileFiltersOpen(open);
    };

    const applyMobileFilters = () => {
        setIsMobileFiltersOpen(false);
        startTransition(() => {
            router.replace(buildProjectsHref(pathname, {
                search,
                category: mobileCategory,
                page: 1,
            }), { scroll: false });
        });
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="施工実績ログ"
                description="現場ごとの担当者、設備情報、契約金額から完工状態まで一元管理します。"
                actions={(
                    <>
                        <Button variant="outline" onClick={handleExport} className="rounded-full shadow-sm">
                            <Download className="mr-2 h-4 w-4" />Excel出力
                        </Button>
                        {isAdminOrHr && <AddProjectModal employees={employees} />}
                    </>
                )}
                actionsClassName="items-stretch sm:items-center"
            />

            <div className="space-y-3 md:hidden">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        aria-label="工事名・発注者・担当者で検索"
                        placeholder="物件名・発注者・場所で検索…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-11 pl-9 rounded-2xl"
                    />
                </div>
                <MobileFiltersSheet
                    title="工事記録を絞り込む"
                    description="項目で施工実績を絞り込みます。"
                    summary="設備種別"
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
                        <p className="text-sm font-medium">設備種別</p>
                        <Select
                            value={mobileCategory || undefined}
                            onValueChange={(value) => setMobileCategory(value && value !== "all" ? value : "")}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="全ての種別" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">全て</SelectItem>
                                {EQUIPMENT_OPTIONS.map((cat) => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </MobileFiltersSheet>
            </div>

            <div className="hidden md:flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="relative max-w-sm flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        aria-label="工事名・場所・担当者で検索"
                        placeholder="物件名・発注者・場所で検索…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 rounded-full shadow-sm"
                    />
                </div>
                <Select
                    value={currentCategory || undefined}
                    onValueChange={(value) => updateFilters({ category: value && value !== "all" ? value : "", page: 1 })}
                >
                    <SelectTrigger className="w-[180px] rounded-full shadow-sm">
                        <SelectValue placeholder="全ての設備種別" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全て</SelectItem>
                        {Array.from(EQUIPMENT_OPTIONS).map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <ActiveFilters items={activeFilters} onClearAll={clearFilters} />

            <div className="space-y-3 md:hidden" aria-busy={isPending}>
                {initialRecords.length === 0 ? (
                    <Card className="border-border/60 shadow-sm rounded-3xl">
                        <CardContent className="py-8 text-center text-sm text-muted-foreground">
                            施工記録がありません。
                        </CardContent>
                    </Card>
                ) : (
                    initialRecords.map((record) => (
                        <Card key={record.id} className="border-border/60 shadow-sm rounded-3xl overflow-hidden">
                            <div className="flex flex-col gap-3 p-5">
                                <div className="flex items-start justify-between min-w-0">
                                    <div className="space-y-1 min-w-0">
                                        <p className="line-clamp-2 text-lg font-bold text-foreground">{record.construction_name}</p>
                                        <div className="flex items-center text-sm font-medium text-muted-foreground gap-1.5">
                                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">{record.client_name || "発注者未設定"}</span>
                                        </div>
                                    </div>
                                    {showActions ? (
                                        <RecordActionsMenu label={record.construction_name}>
                                            <DropdownMenuItem onClick={() => setEditingItem(record)}>
                                                <Pencil className="h-4 w-4" />
                                                編集
                                            </DropdownMenuItem>
                                            <DropdownMenuItem variant="destructive" onClick={() => setDeletingItem(record)}>
                                                <Trash2 className="h-4 w-4" />
                                                削除
                                            </DropdownMenuItem>
                                        </RecordActionsMenu>
                                    ) : null}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    <span className="inline-flex items-center rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                        {record.work_type || "種別未設定"}
                                    </span>
                                    {record.equipment_types?.map(eq => (
                                        <span key={eq} className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-border">
                                            {eq}
                                        </span>
                                    ))}
                                </div>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-3 text-sm mt-2 rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 border">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">工期</p>
                                        <p className="font-semibold tabular-nums">{formatDisplayDate(record.construction_date)} 〜 {record.end_date ? formatDisplayDate(record.end_date) : <span className="text-primary font-bold">施工中</span>}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">契約金額</p>
                                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                                            {record.contract_amount ? `¥${record.contract_amount.toLocaleString()}` : "-"}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">担当技術者</p>
                                        {record.employees?.id ? (
                                            <TableCellLink href={`/employees/${record.employees.id}`} className="font-semibold text-primary hover:underline">
                                                {record.employees.name}
                                                {record.role && <span className="text-muted-foreground ml-1 font-normal text-xs">({record.role})</span>}
                                            </TableCellLink>
                                        ) : (
                                            <p className="font-semibold">{record.employees?.name || "-"}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">施工場所</p>
                                        <p className="font-semibold line-clamp-1 flex items-center gap-1">
                                            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                            {record.location || "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <div className="hidden overflow-x-auto rounded-[32px] border border-border/80 bg-white dark:bg-card shadow-sm md:block" aria-busy={isPending}>
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-border/80">
                            <TableHead className="sticky left-0 z-20 min-w-[220px] bg-slate-50/50 dark:bg-slate-900/50 py-4 font-bold text-slate-700 dark:text-slate-300 shadow-[inset_-1px_0_0_hsl(var(--border))]">物件名 / 発注者</TableHead>
                            <TableHead className="min-w-[180px] font-bold text-slate-700 dark:text-slate-300">施工内容 / 設備</TableHead>
                            <TableHead className="min-w-[150px] font-bold text-slate-700 dark:text-slate-300">工期</TableHead>
                            <TableHead className="min-w-[160px] font-bold text-slate-700 dark:text-slate-300">担当者 / 役割</TableHead>
                            <TableHead className="min-w-[120px] font-bold text-slate-700 dark:text-slate-300 text-right">契約金額</TableHead>
                            {showActions && <TableHead className="min-w-[110px] text-center font-bold text-slate-700 dark:text-slate-300">操作</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialRecords.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columnCount} className="h-32 text-center text-muted-foreground">
                                    施工記録がありません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialRecords.map((record) => (
                                <TableRow key={record.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                                    <TableCell className="sticky left-0 z-10 bg-white dark:bg-card shadow-[inset_-1px_0_0_hsl(var(--border))] py-4">
                                        <p className="font-bold text-foreground text-base">{record.construction_name}</p>
                                        <p className="font-medium text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                                            <Building2 className="h-3.5 w-3.5" />
                                            {record.client_name || "-"}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1.5 items-start">
                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                                {record.work_type || "-"}
                                            </span>
                                            <div className="flex flex-wrap gap-1">
                                                {record.equipment_types?.map(eq => (
                                                    <span key={eq} className="relative inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-border">
                                                        <Tag className="mr-1 h-3 w-3 text-muted-foreground hidden lg:block" /> {eq}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1 text-sm font-medium">
                                            <p className="text-muted-foreground">着工: <span className="text-foreground tabular-nums">{formatDisplayDate(record.construction_date)}</span></p>
                                            <p className="text-muted-foreground">完工: {record.end_date ? <span className="text-foreground tabular-nums">{formatDisplayDate(record.end_date)}</span> : <span className="text-emerald-600 dark:text-emerald-400 font-bold">施工中</span>}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-0.5">
                                            {record.employees?.id ? (
                                                <TableCellLink href={`/employees/${record.employees.id}`} className="font-semibold text-primary hover:underline text-sm truncate">
                                                    {record.employees.name}
                                                </TableCellLink>
                                            ) : (
                                                <span className="font-medium text-foreground text-sm">{record.employees?.name || "-"}</span>
                                            )}
                                            <span className="text-xs font-medium text-muted-foreground">{record.role || "担当者"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                                        {record.contract_amount ? `¥${record.contract_amount.toLocaleString()}` : "-"}
                                    </TableCell>
                                    {showActions && (
                                        <TableCell>
                                            <RecordActionsMenu label={record.construction_name}>
                                                <DropdownMenuItem onClick={() => setEditingItem(record)}>
                                                    <Pencil className="h-4 w-4" />
                                                    編集
                                                </DropdownMenuItem>
                                                <DropdownMenuItem variant="destructive" onClick={() => setDeletingItem(record)}>
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

            {(currentPage > 1 || hasNextPage) && (
                <div className="flex items-center justify-center gap-2 mt-8">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        className="rounded-full px-4 font-semibold"
                        render={<Link href={buildProjectsHref(pathname, {
                            search: currentSearch,
                            category: currentCategory,
                            page: currentPage - 1,
                        })} />}
                    >
                        前へ
                    </Button>
                    <span className="text-sm font-bold text-muted-foreground px-2">
                        {currentPage}ページ
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!hasNextPage}
                        className="rounded-full px-4 font-semibold"
                        render={<Link href={buildProjectsHref(pathname, {
                            search: currentSearch,
                            category: currentCategory,
                            page: currentPage + 1,
                        })} />}
                    >
                        次へ
                    </Button>
                </div>
            )}

            {isAdminOrHr && editingItem && (
                <EditProjectModal
                    record={editingItem}
                    employees={employees}
                    open={!!editingItem}
                    onOpenChange={(open) => !open && setEditingItem(null)}
                />
            )}

            {isAdminOrHr && (
                <DeleteConfirmDialog
                    open={!!deletingItem}
                    onOpenChange={(open) => !open && setDeletingItem(null)}
                    title="施工記録の削除"
                    description={`${deletingItem?.construction_name} の施工記録を一覧から非表示にします。監査履歴は保持され、後から確認できます。`}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    );
}
