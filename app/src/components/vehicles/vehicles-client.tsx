"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
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
import { Truck, AlertTriangle, Pencil, Search, Trash2, ArrowUpDown } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { isBefore, addDays } from "date-fns";
import { AddVehicleModal } from "./add-vehicle-modal";
import { EditVehicleModal } from "./edit-vehicle-modal";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { alertStyles } from "@/lib/alert-utils";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { TableCellLink } from "@/components/shared/table-cell-link";
import { ActiveFilters } from "@/components/shared/active-filters";
import { deleteVehicleAction } from "@/app/actions/admin-record-actions";
import { formatDisplayDate } from "@/lib/date";
import { RecordActionsMenu } from "@/components/shared/record-actions-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export type VehicleWithUser = Tables<"vehicles"> & {
    employees?: { id: string; name: string } | null;
};

function buildVehiclesHref(pathname: string, {
    search,
    sort,
    expiry,
    page,
}: {
    search: string;
    sort: string;
    expiry: string;
    page: number;
}) {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (sort && sort !== "plate") params.set("sort", sort);
    if (expiry) params.set("expiry", expiry);
    if (page > 1) params.set("page", String(page));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
}

function getStatusBadge(expiry: string | null) {
    if (!expiry) return <Badge variant="outline">未設定</Badge>;
    const date = new Date(expiry);
    const now = new Date();
    const soon = addDays(now, 30);

    if (isBefore(date, now)) {
        return <Badge variant="secondary" className={alertStyles.danger.badge}>期限切れ</Badge>;
    }
    if (isBefore(date, soon)) {
        return (
            <Badge variant="secondary" className={alertStyles.warning.badge}>
                <AlertTriangle className="mr-1 h-3 w-3" />
                30日以内
            </Badge>
        );
    }
    return <Badge variant="secondary" className={alertStyles.ok.badge}>正常</Badge>;
}

function getWorstStatus(vehicle: VehicleWithUser): number {
    const now = new Date();
    const dates = [vehicle.inspection_expiry, vehicle.liability_insurance_expiry, vehicle.voluntary_insurance_expiry];
    let worst = 3;
    for (const d of dates) {
        if (!d) continue;
        const date = new Date(d);
        if (isBefore(date, now)) return 1;
        if (isBefore(date, addDays(now, 30))) worst = Math.min(worst, 2);
    }
    return worst;
}

export function VehiclesClient({
    initialVehicles,
    employees,
    currentSearch,
    currentSort = "plate",
    currentExpiry = "",
    currentPage,
    totalPages,
    hidePageHeading = false,
}: {
    initialVehicles: VehicleWithUser[];
    employees: { id: string; name: string }[];
    currentSearch: string;
    currentSort?: string;
    currentExpiry?: string;
    currentPage: number;
    totalPages: number;
    hidePageHeading?: boolean;
}) {
    const [search, setSearch] = useState(currentSearch);
    const [editingVehicle, setEditingVehicle] = useState<VehicleWithUser | null>(null);
    const [deletingVehicle, setDeletingVehicle] = useState<VehicleWithUser | null>(null);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const pathname = usePathname();
    const { isAdminOrHr } = useAuth();
    const showActions = isAdminOrHr;
    const columnCount = showActions ? 8 : 7;

    const updateFilters = (updates: Partial<{ search: string; sort: string; expiry: string; page: number }>) => {
        startTransition(() => {
            router.replace(buildVehiclesHref(pathname, {
                search: updates.search ?? search,
                sort: updates.sort ?? currentSort,
                expiry: updates.expiry ?? currentExpiry,
                page: updates.page ?? 1,
            }), { scroll: false });
        });
    };

    const activeFilters = [
        currentSearch ? {
            key: "search",
            label: `検索: ${currentSearch}`,
            onRemove: () => { setSearch(""); updateFilters({ search: "", page: 1 }); },
        } : null,
        currentExpiry === "expired" ? {
            key: "expiry",
            label: "期限切れのみ",
            onRemove: () => updateFilters({ expiry: "", page: 1 }),
        } : currentExpiry === "soon" ? {
            key: "expiry",
            label: "30日以内",
            onRemove: () => updateFilters({ expiry: "", page: 1 }),
        } : null,
        currentSort !== "plate" ? {
            key: "sort",
            label: `並び順: ${currentSort === "inspection" ? "車検満了日" : currentSort === "liability" ? "自賠責満期" : "任意保険満期"}`,
            onRemove: () => updateFilters({ sort: "plate", page: 1 }),
        } : null,
    ].filter((f): f is NonNullable<typeof f> => f !== null);

    useEffect(() => { setSearch(currentSearch); }, [currentSearch]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            if (search === currentSearch) return;
            updateFilters({ search, page: 1 });
        }, 250);
        return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const handleDelete = async () => {
        if (!isAdminOrHr || !deletingVehicle) return;
        const result = await deleteVehicleAction(deletingVehicle.id);
        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("車両を削除しました");
            router.refresh();
        }
    };

    const clearFilters = () => {
        setSearch("");
        startTransition(() => {
            router.replace(buildVehiclesHref(pathname, { search: "", sort: "plate", expiry: "", page: 1 }), { scroll: false });
        });
    };

    return (
        <div className="space-y-6">
            {hidePageHeading ? (
                isAdminOrHr ? (
                    <div className="flex justify-end">
                        <AddVehicleModal employees={employees} />
                    </div>
                ) : null
            ) : (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">車両</h2>
                        <p className="text-muted-foreground mt-2">社用車の車検・保険期限を管理します。</p>
                    </div>
                    {isAdminOrHr && <AddVehicleModal employees={employees} />}
                </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-xl">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        aria-label="ナンバー・車両名・使用者で検索"
                        placeholder="ナンバー・車両名・使用者で検索…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-11 pl-9"
                    />
                </div>
                <div className="flex gap-2 shrink-0">
                    <Select
                        value={currentExpiry || "all"}
                        onValueChange={(val: string | null) => updateFilters({ expiry: val === "all" ? "" : (val ?? ""), page: 1 })}
                    >
                        <SelectTrigger className="h-11 w-[130px]">
                            <span className="flex-1 text-left text-sm">
                                {currentExpiry === "expired" ? "期限切れ" : currentExpiry === "soon" ? "30日以内" : "すべて"}
                            </span>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">すべて</SelectItem>
                            <SelectItem value="expired">期限切れ</SelectItem>
                            <SelectItem value="soon">30日以内</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select
                        value={currentSort}
                        onValueChange={(val: string | null) => updateFilters({ sort: val ?? "plate", page: 1 })}
                    >
                        <SelectTrigger className="h-11 w-[150px]">
                            <ArrowUpDown className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="flex-1 text-left text-sm">
                                {currentSort === "inspection" ? "車検満了日順" : currentSort === "liability" ? "自賠責満期順" : currentSort === "voluntary" ? "任意保険満期順" : "ナンバー順"}
                            </span>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="plate">ナンバー順</SelectItem>
                            <SelectItem value="inspection">車検満了日順</SelectItem>
                            <SelectItem value="liability">自賠責満期順</SelectItem>
                            <SelectItem value="voluntary">任意保険満期順</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <ActiveFilters items={activeFilters} onClearAll={clearFilters} />

            <div className="space-y-3 md:hidden" aria-busy={isPending}>
                {initialVehicles.length === 0 ? (
                    <Card size="sm" className="border-border/60">
                        <CardContent className="py-8 text-center text-sm text-muted-foreground">
                            {search ? "該当する車両がありません。" : "車両データがありません。"}
                        </CardContent>
                    </Card>
                ) : (
                    initialVehicles.map((vehicle) => {
                        const status = getWorstStatus(vehicle);

                        return (
                            <Card key={vehicle.id} size="sm" className="border-border/60">
                                <CardContent className="space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Truck className="h-4 w-4 text-muted-foreground" />
                                                <p className="truncate text-base font-semibold">{vehicle.plate_number}</p>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">{vehicle.vehicle_name || "車両名未設定"}</p>
                                            <p className="mt-2 text-sm text-primary">
                                                {vehicle.employees?.id ? (
                                                    <TableCellLink href={`/employees/${vehicle.employees.id}`} className="font-medium underline-offset-4 hover:underline">
                                                        主使用者: {vehicle.employees.name}
                                                    </TableCellLink>
                                                ) : (
                                                    <span className="font-medium text-foreground">主使用者: {vehicle.employees?.name || "-"}</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {status === 1
                                                ? <Badge variant="secondary" className={alertStyles.danger.badge}>要対応</Badge>
                                                : status === 2
                                                    ? <Badge variant="secondary" className={alertStyles.warning.badge}>注意</Badge>
                                                    : <Badge variant="secondary" className={alertStyles.ok.badge}>正常</Badge>}
                                            {showActions ? (
                                                <RecordActionsMenu label={vehicle.plate_number}>
                                                    <DropdownMenuItem onClick={() => setEditingVehicle(vehicle)}>
                                                        <Pencil className="h-4 w-4" />
                                                        編集
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem variant="destructive" onClick={() => setDeletingVehicle(vehicle)}>
                                                        <Trash2 className="h-4 w-4" />
                                                        削除
                                                    </DropdownMenuItem>
                                                </RecordActionsMenu>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="grid gap-3 text-sm">
                                        <div className="rounded-[16px] bg-muted/30 px-3 py-2">
                                            <p className="text-sm text-muted-foreground">車検満了日</p>
                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                <span className="font-medium tabular-nums">{formatDisplayDate(vehicle.inspection_expiry)}</span>
                                                {vehicle.inspection_expiry ? getStatusBadge(vehicle.inspection_expiry) : null}
                                            </div>
                                        </div>
                                        <div className="rounded-[16px] bg-muted/30 px-3 py-2">
                                            <p className="text-sm text-muted-foreground">自賠責保険満期</p>
                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                <span className="font-medium tabular-nums">{formatDisplayDate(vehicle.liability_insurance_expiry)}</span>
                                                {vehicle.liability_insurance_expiry ? getStatusBadge(vehicle.liability_insurance_expiry) : null}
                                            </div>
                                        </div>
                                        <div className="rounded-[16px] bg-muted/30 px-3 py-2">
                                            <p className="text-sm text-muted-foreground">任意保険満期</p>
                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                <span className="font-medium tabular-nums">{formatDisplayDate(vehicle.voluntary_insurance_expiry)}</span>
                                                {vehicle.voluntary_insurance_expiry ? getStatusBadge(vehicle.voluntary_insurance_expiry) : null}
                                            </div>
                                        </div>
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
                            <TableHead className="sticky left-0 z-20 min-w-[160px] bg-muted/50 shadow-[inset_-1px_0_0_hsl(var(--border))]">ナンバー</TableHead>
                            <TableHead className="min-w-[120px]">車両名</TableHead>
                            <TableHead className="min-w-[100px]">主使用者</TableHead>
                            <TableHead className="min-w-[120px]">車検満了日</TableHead>
                            <TableHead className="min-w-[120px]">自賠責満期</TableHead>
                            <TableHead className="min-w-[120px]">任意保険満期</TableHead>
                            <TableHead className="min-w-[80px]">ステータス</TableHead>
                            {showActions && <TableHead className="min-w-[100px]">操作</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialVehicles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                                    {search ? "該当する車両がありません。" : "車両データがありません。"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialVehicles.map((vehicle) => (
                                <TableRow key={vehicle.id} className="group hover:bg-muted/30 transition-colors">
                                    <TableCell className="sticky left-0 z-10 bg-card font-bold shadow-[inset_-1px_0_0_hsl(var(--border))] group-hover:bg-muted/30">
                                        <div className="flex items-center gap-2">
                                            <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
                                            {vehicle.plate_number}
                                        </div>
                                    </TableCell>
                                    <TableCell>{vehicle.vehicle_name || "-"}</TableCell>
                                    <TableCell>
                                        {vehicle.employees?.id ? (
                                            <TableCellLink href={`/employees/${vehicle.employees.id}`} className="font-medium hover:underline">
                                                {vehicle.employees.name}
                                            </TableCellLink>
                                        ) : (
                                            vehicle.employees?.name || "-"
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm tabular-nums">{formatDisplayDate(vehicle.inspection_expiry)}</span>
                                            {vehicle.inspection_expiry && getStatusBadge(vehicle.inspection_expiry)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm tabular-nums">{formatDisplayDate(vehicle.liability_insurance_expiry)}</span>
                                            {vehicle.liability_insurance_expiry && getStatusBadge(vehicle.liability_insurance_expiry)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm tabular-nums">{formatDisplayDate(vehicle.voluntary_insurance_expiry)}</span>
                                            {vehicle.voluntary_insurance_expiry && getStatusBadge(vehicle.voluntary_insurance_expiry)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getWorstStatus(vehicle) === 1
                                            ? <Badge variant="secondary" className={alertStyles.danger.badge}>要対応</Badge>
                                            : getWorstStatus(vehicle) === 2
                                                ? <Badge variant="secondary" className={alertStyles.warning.badge}>注意</Badge>
                                                : <Badge variant="secondary" className={alertStyles.ok.badge}>正常</Badge>
                                        }
                                    </TableCell>
                                    {showActions && (
                                        <TableCell>
                                            <RecordActionsMenu label={vehicle.plate_number}>
                                                <DropdownMenuItem onClick={() => setEditingVehicle(vehicle)}>
                                                    <Pencil className="h-4 w-4" />
                                                    編集
                                                </DropdownMenuItem>
                                                <DropdownMenuItem variant="destructive" onClick={() => setDeletingVehicle(vehicle)}>
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
                        render={<Link href={buildVehiclesHref(pathname, {
                            search: currentSearch,
                            sort: currentSort,
                            expiry: currentExpiry,
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
                        render={<Link href={buildVehiclesHref(pathname, {
                            search: currentSearch,
                            sort: currentSort,
                            expiry: currentExpiry,
                            page: currentPage + 1,
                        })} />}
                    >
                        次へ
                    </Button>
                </div>
            )}

            {isAdminOrHr && editingVehicle && (
                <EditVehicleModal
                    vehicle={editingVehicle}
                    employees={employees}
                    open={!!editingVehicle}
                    onOpenChange={(open) => !open && setEditingVehicle(null)}
                />
            )}

            {isAdminOrHr && (
                <DeleteConfirmDialog
                    open={!!deletingVehicle}
                    onOpenChange={(open) => !open && setDeletingVehicle(null)}
                    title="車両の削除"
                    description={`${deletingVehicle?.plate_number} を一覧から非表示にします。監査履歴は保持され、後から確認できます。`}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    );
}
