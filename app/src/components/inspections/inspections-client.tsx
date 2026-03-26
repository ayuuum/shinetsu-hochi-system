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
import { AddInspectionModal } from "./add-inspection-modal";
import { EditInspectionModal } from "./edit-inspection-modal";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { isBefore, addDays } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type InspectionWithEmployee = Tables<"inspection_schedules"> & {
    employees?: { name: string } | null;
};

type Employee = { id: string; name: string };

function getScheduleBadge(scheduledDate: string, status: string) {
    if (status === "実施済み") {
        return <Badge variant="secondary" className="bg-green-100 text-green-600">実施済み</Badge>;
    }
    if (status === "延期") {
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-600">延期</Badge>;
    }
    const date = new Date(scheduledDate);
    const now = new Date();
    if (isBefore(date, now)) {
        return <Badge variant="destructive">期日超過</Badge>;
    }
    if (isBefore(date, addDays(now, 14))) {
        return <Badge variant="secondary" className="bg-orange-100 text-orange-600">14日以内</Badge>;
    }
    return <Badge variant="outline">未実施</Badge>;
}

export function InspectionsClient({
    initialSchedules,
    employees,
}: {
    initialSchedules: InspectionWithEmployee[];
    employees: Employee[];
}) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<InspectionWithEmployee | null>(null);
    const [deletingItem, setDeletingItem] = useState<InspectionWithEmployee | null>(null);
    const router = useRouter();

    const filtered = initialSchedules.filter(s => {
        if (statusFilter && statusFilter !== "all" && s.status !== statusFilter) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            s.client_name.toLowerCase().includes(q) ||
            s.building_name.toLowerCase().includes(q) ||
            s.employees?.name?.toLowerCase().includes(q)
        );
    });

    const handleMarkComplete = async (id: string) => {
        const today = new Date().toISOString().split("T")[0];
        const { error } = await supabase
            .from("inspection_schedules")
            .update({ status: "実施済み", completed_date: today })
            .eq("id", id);
        if (error) {
            toast.error("更新に失敗しました");
        } else {
            toast.success("実施済みに更新しました");
            router.refresh();
        }
    };

    const handleDelete = async () => {
        if (!deletingItem) return;
        const { error } = await supabase.from("inspection_schedules").delete().eq("id", deletingItem.id);
        if (error) {
            toast.error("削除に失敗しました: " + error.message);
        } else {
            toast.success("点検予定を削除しました");
            router.refresh();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">点検スケジュール</h1>
                    <p className="text-muted-foreground mt-2">顧客物件の消防設備点検スケジュールを管理します。</p>
                </div>
                <AddInspectionModal employees={employees} />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Input
                    placeholder="顧客名・物件名・担当者で検索..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={statusFilter ?? undefined} onValueChange={(val: string | null) => setStatusFilter(val)}>
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="全てのステータス" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全て</SelectItem>
                        <SelectItem value="未実施">未実施</SelectItem>
                        <SelectItem value="実施済み">実施済み</SelectItem>
                        <SelectItem value="延期">延期</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-xl bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="min-w-[120px]">顧客名</TableHead>
                            <TableHead className="min-w-[120px]">物件名</TableHead>
                            <TableHead className="min-w-[80px]">種別</TableHead>
                            <TableHead className="min-w-[110px]">予定日</TableHead>
                            <TableHead className="min-w-[100px]">担当者</TableHead>
                            <TableHead className="min-w-[80px]">ステータス</TableHead>
                            <TableHead className="min-w-[120px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    点検スケジュールがありません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((schedule) => (
                                <TableRow key={schedule.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium">{schedule.client_name}</TableCell>
                                    <TableCell>{schedule.building_name}</TableCell>
                                    <TableCell>{schedule.inspection_type}</TableCell>
                                    <TableCell>{schedule.scheduled_date}</TableCell>
                                    <TableCell>{schedule.employees?.name || "-"}</TableCell>
                                    <TableCell>{getScheduleBadge(schedule.scheduled_date, schedule.status)}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            {schedule.status === "未実施" && (
                                                <button
                                                    onClick={() => handleMarkComplete(schedule.id)}
                                                    className="text-xs text-primary hover:underline mr-1"
                                                >
                                                    完了
                                                </button>
                                            )}
                                            <Button variant="ghost" size="sm" onClick={() => setEditingItem(schedule)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeletingItem(schedule)}>
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
                <EditInspectionModal
                    inspection={editingItem}
                    employees={employees}
                    open={!!editingItem}
                    onOpenChange={(open) => !open && setEditingItem(null)}
                />
            )}

            <DeleteConfirmDialog
                open={!!deletingItem}
                onOpenChange={(open) => !open && setDeletingItem(null)}
                title="点検予定の削除"
                description={`${deletingItem?.client_name} - ${deletingItem?.building_name} の点検予定を削除します。`}
                onConfirm={handleDelete}
            />
        </div>
    );
}
