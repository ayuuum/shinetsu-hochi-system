"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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
import { Pencil, Trash2, Download } from "lucide-react";
import { AddAlcoholCheckModal } from "./add-alcohol-check-modal";
import { EditAlcoholCheckModal } from "./edit-alcohol-check-modal";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { TableCellLink } from "@/components/shared/table-cell-link";
import { ActiveFilters } from "@/components/shared/active-filters";
import { MobileFiltersSheet } from "@/components/shared/mobile-filters-sheet";
import { getTodayInTokyo } from "@/lib/date";
import { deleteAlcoholCheckAction } from "@/app/actions/admin-record-actions";
import { RecordActionsMenu } from "@/components/shared/record-actions-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export type AlcoholCheckRow = {
    id: string;
    employee_id: string | null;
    check_type: string | null;
    check_datetime: string | null;
    checker_id: string | null;
    measured_value: number | null;
    is_abnormal: boolean | null;
    location: string | null;
    notes: string | null;
    created_at: string | null;
    employee?: { id: string; name: string } | null;
    checker?: { id: string; name: string } | null;
};

type Employee = { id: string; name: string };

function buildAlcoholChecksHref(pathname: string, {
    date,
    location,
    status,
    employee,
    page,
}: {
    date: string;
    location: string;
    status: string;
    employee: string;
    page: number;
}) {
    const params = new URLSearchParams();

    if (date) {
        params.set("date", date);
    }
    if (location) {
        params.set("location", location);
    }
    if (status) {
        params.set("status", status);
    }
    if (employee) {
        params.set("employee", employee);
    }
    if (page > 1) {
        params.set("page", String(page));
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
}

export function AlcoholClient({
    initialChecks,
    employees,
    currentDate,
    currentLocation,
    currentStatus,
    currentEmployee,
    currentPage,
    totalPages,
}: {
    initialChecks: AlcoholCheckRow[];
    employees: Employee[];
    currentDate: string;
    currentLocation: string;
    currentStatus: string;
    currentEmployee: string;
    currentPage: number;
    totalPages: number;
}) {
    const [editingItem, setEditingItem] = useState<AlcoholCheckRow | null>(null);
    const [deletingItem, setDeletingItem] = useState<AlcoholCheckRow | null>(null);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [mobileLocation, setMobileLocation] = useState(currentLocation);
    const [mobileStatus, setMobileStatus] = useState(currentStatus);
    const [mobileEmployee, setMobileEmployee] = useState(currentEmployee);
    const router = useRouter();
    const pathname = usePathname();
    const { isAdminOrHr, role, linkedEmployeeId } = useAuth();
    const showActions = isAdminOrHr;
    const canRecordAlcohol = isAdminOrHr || (role === "technician" && !!linkedEmployeeId);
    const columnCount = showActions ? 9 : 8;
    const employeeOptions = employees.map((employee) => ({
        value: employee.id,
        label: employee.name,
    }));
    const employeeLabelMap = new Map(employees.map((employee) => [employee.id, employee.name]));
    const todayInTokyo = getTodayInTokyo();
    const activeFilters = [
        currentDate && currentDate !== todayInTokyo
            ? {
                key: "date",
                label: `日付: ${currentDate}`,
                onRemove: () => updateFilters({ date: todayInTokyo, page: 1 }),
            }
            : null,
        currentLocation
            ? {
                key: "location",
                label: `拠点: ${currentLocation === "塩尻" ? "塩尻営業所" : currentLocation === "白馬" ? "白馬営業所" : currentLocation}`,
                onRemove: () => updateFilters({ location: "", page: 1 }),
            }
            : null,
        currentStatus
            ? {
                key: "status",
                label: `判定: ${currentStatus === "abnormal" ? "不適正" : "適正"}`,
                onRemove: () => updateFilters({ status: "", page: 1 }),
            }
            : null,
        currentEmployee
            ? {
                key: "employee",
                label: `社員: ${employeeLabelMap.get(currentEmployee) || currentEmployee}`,
                onRemove: () => updateFilters({ employee: "", page: 1 }),
            }
            : null,
    ].filter((item): item is NonNullable<typeof item> => item !== null);

    const abnormalCount = initialChecks.filter((check) => check.is_abnormal).length;

    const syncMobileFilters = () => {
        setMobileLocation(currentLocation);
        setMobileStatus(currentStatus);
        setMobileEmployee(currentEmployee);
    };

    const updateFilters = (updates: Partial<{ date: string; location: string; status: string; employee: string; page: number }>) => {
        router.replace(buildAlcoholChecksHref(pathname, {
            date: updates.date ?? currentDate,
            location: updates.location ?? currentLocation,
            status: updates.status ?? currentStatus,
            employee: updates.employee ?? currentEmployee,
            page: updates.page ?? 1,
        }), { scroll: false });
    };

    const handleDelete = async () => {
        if (!isAdminOrHr || !deletingItem) return;
        const result = await deleteAlcoholCheckAction(deletingItem.id);
        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("記録を削除しました");
            router.refresh();
        }
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (currentDate) params.set("from", currentDate);
        if (currentDate) params.set("to", currentDate);
        window.open(`/api/export/alcohol-checks?${params.toString()}`, "_blank");
    };

    const clearFilters = () => {
        router.replace(buildAlcoholChecksHref(pathname, {
            date: todayInTokyo,
            location: "",
            status: "",
            employee: "",
            page: 1,
        }), { scroll: false });
    };

    const handleMobileFiltersOpenChange = (open: boolean) => {
        if (open) {
            syncMobileFilters();
        }
        setIsMobileFiltersOpen(open);
    };

    const applyMobileFilters = () => {
        setIsMobileFiltersOpen(false);
        updateFilters({
            location: mobileLocation,
            status: mobileStatus,
            employee: mobileEmployee,
            page: 1,
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">アルコールチェック</h1>
                    <p className="text-muted-foreground mt-2">法令に基づく飲酒検査記録を管理します。</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        CSV出力
                    </Button>
                    {canRecordAlcohol && (
                        <AddAlcoholCheckModal
                            employees={employees}
                            initialEmployeeId={currentEmployee}
                            initialDate={currentDate}
                            initialLocation={currentLocation}
                        />
                    )}
                </div>
            </div>

            {abnormalCount > 0 && (
                <div className="p-4 rounded-[16px] bg-destructive/10 border border-destructive/20">
                    <p className="text-sm font-bold text-destructive">
                        不適正記録が {abnormalCount} 件あります。安全運転管理者の対応が必要です。
                    </p>
                </div>
            )}

            <div className="space-y-3 md:hidden">
                <Input
                    aria-label="対象日"
                    type="date"
                    value={currentDate}
                    onChange={(e) => updateFilters({ date: e.target.value, page: 1 })}
                    className="h-11 w-full"
                />
                <div className="flex items-center gap-3">
                    <MobileFiltersSheet
                        title="アルコール記録を絞り込む"
                        description="拠点、判定、社員で記録を絞り込みます。"
                        summary="拠点・判定・社員"
                        activeCount={activeFilters.length}
                        onClearAll={() => {
                            clearFilters();
                            setIsMobileFiltersOpen(false);
                            syncMobileFilters();
                        }}
                        className="flex-1"
                        open={isMobileFiltersOpen}
                        onOpenChange={handleMobileFiltersOpenChange}
                        footer={(
                            <Button type="button" className="w-full" onClick={applyMobileFilters}>
                                条件を適用
                            </Button>
                        )}
                    >
                        <div className="space-y-2">
                            <p className="text-sm font-medium">拠点</p>
                            <Select
                                value={mobileLocation || undefined}
                                onValueChange={(value) => setMobileLocation(value && value !== "all" ? value : "")}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="全拠点" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全拠点</SelectItem>
                                    <SelectItem value="本社">本社</SelectItem>
                                    <SelectItem value="塩尻">塩尻営業所</SelectItem>
                                    <SelectItem value="白馬">白馬営業所</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">判定</p>
                            <Select
                                value={mobileStatus || undefined}
                                onValueChange={(value) => setMobileStatus(value && value !== "all" ? value : "")}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="全判定" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全判定</SelectItem>
                                    <SelectItem value="abnormal">不適正</SelectItem>
                                    <SelectItem value="normal">適正</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">社員</p>
                            <Select
                                items={employeeOptions}
                                value={mobileEmployee || undefined}
                                onValueChange={(value) => setMobileEmployee(value && value !== "all" ? value : "")}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="全社員" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全社員</SelectItem>
                                    {employees.map((employee) => (
                                        <SelectItem key={employee.id} value={employee.id}>{employee.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </MobileFiltersSheet>
                    <span className="shrink-0 text-sm text-muted-foreground">{initialChecks.length}件</span>
                </div>
            </div>

            <div className="hidden md:flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Input
                    aria-label="対象日"
                    type="date"
                    value={currentDate}
                    onChange={(e) => updateFilters({ date: e.target.value, page: 1 })}
                    className="w-[180px]"
                />
                <Select
                    value={currentLocation || undefined}
                    onValueChange={(value) => updateFilters({ location: value && value !== "all" ? value : "", page: 1 })}
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="全拠点" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全拠点</SelectItem>
                        <SelectItem value="本社">本社</SelectItem>
                        <SelectItem value="塩尻">塩尻営業所</SelectItem>
                        <SelectItem value="白馬">白馬営業所</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={currentStatus || undefined}
                    onValueChange={(value) => updateFilters({ status: value && value !== "all" ? value : "", page: 1 })}
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="全判定" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全判定</SelectItem>
                        <SelectItem value="abnormal">不適正</SelectItem>
                        <SelectItem value="normal">適正</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    items={employeeOptions}
                    value={currentEmployee || undefined}
                    onValueChange={(value) => updateFilters({ employee: value && value !== "all" ? value : "", page: 1 })}
                >
                    <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="全社員" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全社員</SelectItem>
                        {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id}>{employee.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">{initialChecks.length} 件</span>
            </div>

            <ActiveFilters items={activeFilters} onClearAll={clearFilters} />

            <div className="space-y-3 md:hidden">
                {initialChecks.length === 0 ? (
                    <Card size="sm" className="border-border/60">
                        <CardContent className="py-8 text-center text-sm text-muted-foreground">
                            該当する記録がありません。
                        </CardContent>
                    </Card>
                ) : (
                    initialChecks.map((check) => (
                        <Card
                            key={check.id}
                            size="sm"
                            className={check.is_abnormal ? "border-destructive/20 bg-destructive/5" : "border-border/60"}
                        >
                            <CardContent className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        {check.employee?.id ? (
                                            <TableCellLink href={`/employees/${check.employee.id}`} className="truncate text-base font-semibold hover:underline">
                                                {check.employee.name}
                                            </TableCellLink>
                                        ) : (
                                            <p className="truncate text-base font-semibold">{check.employee?.name || "-"}</p>
                                        )}
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                            <span>{check.location || "拠点未設定"}</span>
                                            <span>·</span>
                                            <span>{check.check_datetime ? format(new Date(check.check_datetime), "HH:mm") : "-"}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {check.is_abnormal
                                            ? <Badge variant="destructive">不適正</Badge>
                                            : <Badge variant="secondary" className="bg-chart-2/10 text-chart-2 hover:bg-chart-2/20">適正</Badge>}
                                        {showActions ? (
                                            <RecordActionsMenu label={check.employee?.name || "記録"}>
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
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">種別</p>
                                        <p className="font-medium">{check.check_type || "-"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">検知値</p>
                                        <p className="font-medium">{check.measured_value != null ? `${check.measured_value} mg/L` : "-"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">確認者</p>
                                        {check.checker?.id ? (
                                            <TableCellLink href={`/employees/${check.checker.id}`} className="font-medium hover:underline">
                                                {check.checker.name}
                                            </TableCellLink>
                                        ) : (
                                            <p className="font-medium">{check.checker?.name || "-"}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">判定</p>
                                        <p className="font-medium">{check.is_abnormal ? "不適正" : "適正"}</p>
                                    </div>
                                </div>
                                {check.notes ? (
                                    <div className="rounded-[16px] bg-background/80 px-3 py-2 text-sm text-muted-foreground">
                                        {check.notes}
                                    </div>
                                ) : null}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <div className="hidden overflow-x-auto rounded-xl border bg-card md:block">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="sticky left-0 z-20 min-w-[100px] bg-muted/50 shadow-[inset_-1px_0_0_hsl(var(--border))]">社員名</TableHead>
                            <TableHead className="min-w-[80px]">種別</TableHead>
                            <TableHead className="min-w-[140px]">検査日時</TableHead>
                            <TableHead className="min-w-[100px]">確認者</TableHead>
                            <TableHead className="min-w-[80px]">検知値</TableHead>
                            <TableHead className="min-w-[80px]">判定</TableHead>
                            <TableHead className="min-w-[80px]">拠点</TableHead>
                            <TableHead>備考</TableHead>
                            {showActions && <TableHead className="min-w-[80px]">操作</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialChecks.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                                    該当する記録がありません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            initialChecks.map((check) => (
                                <TableRow key={check.id} className={check.is_abnormal ? "bg-destructive/5 hover:bg-destructive/10" : "hover:bg-transparent"}>
                                    <TableCell className={`sticky left-0 z-10 font-medium shadow-[inset_-1px_0_0_hsl(var(--border))] ${check.is_abnormal ? "bg-background" : "bg-card"}`}>
                                        {check.employee?.id ? (
                                            <TableCellLink href={`/employees/${check.employee.id}`} className="font-medium hover:underline">
                                                {check.employee.name}
                                            </TableCellLink>
                                        ) : (
                                            check.employee?.name || "-"
                                        )}
                                    </TableCell>
                                    <TableCell>{check.check_type || "-"}</TableCell>
                                    <TableCell className="text-sm">
                                        {check.check_datetime
                                            ? format(new Date(check.check_datetime), "HH:mm")
                                            : "-"}
                                    </TableCell>
                                    <TableCell>
                                        {check.checker?.id ? (
                                            <TableCellLink href={`/employees/${check.checker.id}`} className="hover:underline">
                                                {check.checker.name}
                                            </TableCellLink>
                                        ) : (
                                            check.checker?.name || "-"
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {check.measured_value != null ? `${check.measured_value} mg/L` : "-"}
                                    </TableCell>
                                    <TableCell>
                                        {check.is_abnormal
                                            ? <Badge variant="destructive">不適正</Badge>
                                            : <Badge variant="secondary" className="bg-chart-2/10 text-chart-2 hover:bg-chart-2/20">適正</Badge>
                                        }
                                    </TableCell>
                                    <TableCell>{check.location || "-"}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{check.notes || ""}</TableCell>
                                    {showActions && (
                                        <TableCell>
                                            <RecordActionsMenu label={check.employee?.name || "記録"}>
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
                        render={<Link href={buildAlcoholChecksHref(pathname, {
                            date: currentDate,
                            location: currentLocation,
                            status: currentStatus,
                            employee: currentEmployee,
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
                        render={<Link href={buildAlcoholChecksHref(pathname, {
                            date: currentDate,
                            location: currentLocation,
                            status: currentStatus,
                            employee: currentEmployee,
                            page: currentPage + 1,
                        })} />}
                    >
                        次へ
                    </Button>
                </div>
            )}

            {isAdminOrHr && editingItem && (
                <EditAlcoholCheckModal
                    check={editingItem}
                    employees={employees}
                    open={!!editingItem}
                    onOpenChange={(open) => !open && setEditingItem(null)}
                />
            )}

            {isAdminOrHr && (
                <DeleteConfirmDialog
                    open={!!deletingItem}
                    onOpenChange={(open) => !open && setDeletingItem(null)}
                    title="記録の削除"
                    description={`${deletingItem?.employee?.name || "不明"} の記録を一覧から非表示にします。監査履歴は保持され、後から確認できます。`}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    );
}
