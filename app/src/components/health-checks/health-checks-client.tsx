"use client";

import { useState } from "react";
import { Tables } from "@/types/supabase";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { Pencil, Trash2 } from "lucide-react";
import { AddHealthCheckModal } from "./add-health-check-modal";
import { EditHealthCheckModal } from "./edit-health-check-modal";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type HealthCheckWithEmployee = Tables<"health_checks"> & {
    employees: { id: string; name: string; branch: string | null } | null;
};

type Employee = { id: string; name: string };

export function HealthChecksClient({
    initialChecks,
    employees,
}: {
    initialChecks: HealthCheckWithEmployee[];
    employees: Employee[];
}) {
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<string | null>(null);
    const [resultFilter, setResultFilter] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<HealthCheckWithEmployee | null>(null);
    const [deletingItem, setDeletingItem] = useState<HealthCheckWithEmployee | null>(null);
    const router = useRouter();

    const filtered = initialChecks.filter((c) => {
        // Filter by check_type
        if (typeFilter && typeFilter !== "all" && c.check_type !== typeFilter) return false;
        // Filter by result (is_normal)
        if (resultFilter && resultFilter !== "all") {
            if (resultFilter === "normal" && c.is_normal !== true) return false;
            if (resultFilter === "abnormal" && c.is_normal !== false) return false;
        }
        // Search by employee name or hospital name
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            c.employees?.name?.toLowerCase().includes(q) ||
            c.hospital_name?.toLowerCase().includes(q) ||
            false
        );
    });

    const handleDelete = async () => {
        if (!deletingItem) return;
        const { error } = await supabase.from("health_checks").delete().eq("id", deletingItem.id);
        if (error) {
            toast.error("削除に失敗しました: " + error.message);
        } else {
            toast.success("健康診断記録を削除しました");
            router.refresh();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">健康診断管理</h1>
                    <p className="text-muted-foreground mt-2">全従業員の健康診断記録を管理します。</p>
                </div>
                <AddHealthCheckModal employees={employees} />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Input
                    placeholder="社員名・医療機関で検索..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={typeFilter ?? undefined} onValueChange={(val: string | null) => setTypeFilter(val)}>
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
                <Select value={resultFilter ?? undefined} onValueChange={(val: string | null) => setResultFilter(val)}>
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

            <div className="border rounded-xl bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="min-w-[100px]">社員名</TableHead>
                            <TableHead className="min-w-[80px]">拠点</TableHead>
                            <TableHead className="min-w-[110px]">受診日</TableHead>
                            <TableHead className="min-w-[120px]">種別</TableHead>
                            <TableHead className="min-w-[120px]">医療機関</TableHead>
                            <TableHead className="min-w-[80px]">結果</TableHead>
                            <TableHead className="min-w-[120px]">身長/体重</TableHead>
                            <TableHead className="min-w-[100px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    健康診断記録がありません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((check) => (
                                <TableRow key={check.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium">{check.employees?.name || "-"}</TableCell>
                                    <TableCell>{check.employees?.branch || "-"}</TableCell>
                                    <TableCell>{check.check_date}</TableCell>
                                    <TableCell>{check.check_type || "-"}</TableCell>
                                    <TableCell>{check.hospital_name || "-"}</TableCell>
                                    <TableCell>
                                        {check.is_normal === true ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-600">異常なし</Badge>
                                        ) : check.is_normal === false ? (
                                            <Badge variant="destructive">要再検査</Badge>
                                        ) : (
                                            "-"
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {check.height != null || check.weight != null
                                            ? `${check.height != null ? `${check.height}cm` : "-"} / ${check.weight != null ? `${check.weight}kg` : "-"}`
                                            : "-"}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => setEditingItem(check)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeletingItem(check)}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {editingItem && (
                <EditHealthCheckModal
                    healthCheck={editingItem}
                    employees={employees}
                    open={!!editingItem}
                    onOpenChange={(open) => !open && setEditingItem(null)}
                />
            )}

            <DeleteConfirmDialog
                open={!!deletingItem}
                onOpenChange={(open) => !open && setDeletingItem(null)}
                title="健康診断記録の削除"
                description={`${deletingItem?.employees?.name || ""} の ${deletingItem?.check_date || ""} の健康診断記録を削除します。`}
                onConfirm={handleDelete}
            />
        </div>
    );
}
