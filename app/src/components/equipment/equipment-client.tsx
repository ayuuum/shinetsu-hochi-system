"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Pencil, Search, Trash2 } from "lucide-react";
import { AddEquipmentModal } from "@/components/equipment/add-equipment-modal";
import { EditEquipmentModal } from "@/components/equipment/edit-equipment-modal";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { deleteEquipmentAction } from "@/app/actions/admin-record-actions";
import { ActiveFilters } from "@/components/shared/active-filters";

export type EquipmentRow = Tables<"equipment_items">;

const moneyFormatter = new Intl.NumberFormat("ja-JP");

function buildEquipmentHref(pathname: string, base: URLSearchParams, { search, page }: { search: string; page: number }) {
    const next = new URLSearchParams(base.toString());
    if (search.trim()) next.set("eq", search.trim());
    else next.delete("eq");
    if (page > 1) next.set("eqPage", String(page));
    else next.delete("eqPage");
    const q = next.toString();
    return q ? `${pathname}?${q}` : pathname;
}

export function EquipmentClient({
    initialItems,
    currentSearch,
    currentPage,
    totalPages,
}: {
    initialItems: EquipmentRow[];
    currentSearch: string;
    currentPage: number;
    totalPages: number;
}) {
    const [search, setSearch] = useState(currentSearch);
    const [isPending, startTransition] = useTransition();
    const [editing, setEditing] = useState<EquipmentRow | null>(null);
    const [deleting, setDeleting] = useState<EquipmentRow | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const urlSearch = useSearchParams();
    const { isAdminOrHr } = useAuth();
    const showActions = isAdminOrHr;
    const columnCount = showActions ? 8 : 7;

    useEffect(() => {
        setSearch(currentSearch);
    }, [currentSearch]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (search === currentSearch) return;
            startTransition(() => {
                router.replace(buildEquipmentHref(pathname, new URLSearchParams(urlSearch.toString()), { search, page: 1 }), {
                    scroll: false,
                });
            });
        }, 300);
        return () => window.clearTimeout(timer);
    }, [search, currentSearch, pathname, router, urlSearch]);

    const clearFilters = () => {
        setSearch("");
        startTransition(() => {
            router.replace(buildEquipmentHref(pathname, new URLSearchParams(urlSearch.toString()), { search: "", page: 1 }), {
                scroll: false,
            });
        });
    };

    const activeFilters = currentSearch
        ? [
              {
                  key: "eq",
                  label: `検索: ${currentSearch}`,
                  onRemove: clearFilters,
              },
          ]
        : [];

    const handleDelete = async () => {
        if (!deleting) return;
        const result = await deleteEquipmentAction(deleting.id);
        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("備品を削除しました");
            setDeleting(null);
            router.refresh();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">備品台帳</h2>
                    <p className="mt-2 text-muted-foreground">
                        管理番号・購入日・金額・所属部署を一元管理します（Excel 台帳の代替）。
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" render={<Link href="/api/export/equipment" />}>
                        CSVエクスポート
                    </Button>
                    {isAdminOrHr && <AddEquipmentModal />}
                </div>
            </div>

            <div className="relative max-w-xl">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    aria-label="管理番号・品名・カテゴリ・拠点で検索"
                    placeholder="管理番号・品名・カテゴリ・拠点で検索..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-11 pl-9"
                />
            </div>

            <ActiveFilters items={activeFilters} onClearAll={clearFilters} />

            <div className="space-y-3 md:hidden" aria-busy={isPending}>
                {initialItems.length === 0 ? (
                    <Card size="sm" className="border-border/60">
                        <CardContent className="py-8 text-center text-sm text-muted-foreground">
                            {currentSearch ? "該当する備品がありません。" : "備品データがありません。"}
                        </CardContent>
                    </Card>
                ) : (
                    initialItems.map((row) => (
                        <Card key={row.id} size="sm" className="border-border/60">
                            <CardContent className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
                                            <p className="truncate font-semibold">{row.management_number}</p>
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">{row.name}</p>
                                    </div>
                                    {showActions ? (
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon-sm" aria-label="編集" onClick={() => setEditing(row)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                aria-label="削除"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => setDeleting(row)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : null}
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground">カテゴリ</p>
                                        <p>{row.category || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">購入日</p>
                                        <p>{row.purchase_date || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">金額</p>
                                        <p>
                                            {row.purchase_amount != null ? `¥${moneyFormatter.format(row.purchase_amount)}` : "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">所属</p>
                                        <p>{row.branch || "—"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <div
                className="hidden overflow-x-auto rounded-[24px] border border-border/60 bg-card shadow-[0_1px_2px_rgba(38,42,46,0.04),0_12px_28px_rgba(38,42,46,0.05)] md:block"
                aria-busy={isPending}
            >
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>管理番号</TableHead>
                            <TableHead>品名</TableHead>
                            <TableHead>カテゴリ</TableHead>
                            <TableHead>購入日</TableHead>
                            <TableHead className="text-right">金額</TableHead>
                            <TableHead>所属</TableHead>
                            <TableHead>備考</TableHead>
                            {showActions && <TableHead className="w-[88px]">操作</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialItems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                                    {currentSearch ? "該当する備品がありません。" : "備品データがありません。"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialItems.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">{row.management_number}</TableCell>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{row.category || "—"}</TableCell>
                                    <TableCell>{row.purchase_date || "—"}</TableCell>
                                    <TableCell className="text-right tabular-nums">
                                        {row.purchase_amount != null ? `¥${moneyFormatter.format(row.purchase_amount)}` : "—"}
                                    </TableCell>
                                    <TableCell>{row.branch || "—"}</TableCell>
                                    <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                                        {row.notes || "—"}
                                    </TableCell>
                                    {showActions && (
                                        <TableCell>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon-sm" aria-label="編集" onClick={() => setEditing(row)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    aria-label="削除"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => setDeleting(row)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
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
                        render={
                            <Link
                                href={buildEquipmentHref(pathname, new URLSearchParams(urlSearch.toString()), {
                                    search: currentSearch,
                                    page: currentPage - 1,
                                })}
                            />
                        }
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
                        render={
                            <Link
                                href={buildEquipmentHref(pathname, new URLSearchParams(urlSearch.toString()), {
                                    search: currentSearch,
                                    page: currentPage + 1,
                                })}
                            />
                        }
                    >
                        次へ
                    </Button>
                </div>
            )}

            {editing && (
                <EditEquipmentModal item={editing} open={!!editing} onOpenChange={(o) => !o && setEditing(null)} />
            )}

            <DeleteConfirmDialog
                open={!!deleting}
                onOpenChange={(o) => !o && setDeleting(null)}
                title="備品を削除しますか？"
                description={deleting ? `${deleting.management_number}（${deleting.name}）を削除します。` : ""}
                onConfirm={handleDelete}
            />
        </div>
    );
}
