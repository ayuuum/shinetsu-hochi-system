"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Pencil, Trash2, Download } from "lucide-react";
import { AddAlcoholCheckModal } from "./add-alcohol-check-modal";
import { EditAlcoholCheckModal } from "./edit-alcohol-check-modal";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
    employee?: { name: string } | null;
    checker?: { name: string } | null;
};

type Employee = { id: string; name: string };

export function AlcoholClient({
    initialChecks,
    employees,
}: {
    initialChecks: AlcoholCheckRow[];
    employees: Employee[];
}) {
    const [dateFilter, setDateFilter] = useState(format(new Date(), "yyyy-MM-dd"));
    const [locationFilter, setLocationFilter] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<AlcoholCheckRow | null>(null);
    const [deletingItem, setDeletingItem] = useState<AlcoholCheckRow | null>(null);
    const router = useRouter();

    const filtered = initialChecks.filter(c => {
        if (dateFilter && c.check_datetime) {
            const checkDate = c.check_datetime.slice(0, 10);
            if (checkDate !== dateFilter) return false;
        }
        if (locationFilter && locationFilter !== "all" && c.location !== locationFilter) return false;
        return true;
    });

    const abnormalCount = filtered.filter(c => c.is_abnormal).length;

    const handleDelete = async () => {
        if (!deletingItem) return;
        const { error } = await supabase.from("alcohol_checks").delete().eq("id", deletingItem.id);
        if (error) {
            toast.error("削除に失敗しました: " + error.message);
        } else {
            toast.success("記録を削除しました");
            router.refresh();
        }
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (dateFilter) params.set("from", dateFilter);
        if (dateFilter) params.set("to", dateFilter);
        window.open(`/api/export/alcohol-checks?${params.toString()}`, "_blank");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">アルコールチェック</h1>
                    <p className="text-muted-foreground mt-2">法令に基づく飲酒検査記録を管理します。</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        CSV出力
                    </Button>
                    <AddAlcoholCheckModal employees={employees} />
                </div>
            </div>

            {abnormalCount > 0 && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-sm font-bold text-red-700">
                        不適正記録が {abnormalCount} 件あります。安全運転管理者の対応が必要です。
                    </p>
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-[180px]"
                />
                <Select value={locationFilter ?? undefined} onValueChange={(val: string | null) => setLocationFilter(val)}>
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
                <span className="text-sm text-muted-foreground">{filtered.length} 件</span>
            </div>

            <div className="border rounded-xl bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="min-w-[100px]">社員名</TableHead>
                            <TableHead className="min-w-[80px]">種別</TableHead>
                            <TableHead className="min-w-[140px]">検査日時</TableHead>
                            <TableHead className="min-w-[100px]">確認者</TableHead>
                            <TableHead className="min-w-[80px]">検知値</TableHead>
                            <TableHead className="min-w-[80px]">判定</TableHead>
                            <TableHead className="min-w-[80px]">拠点</TableHead>
                            <TableHead>備考</TableHead>
                            <TableHead className="min-w-[80px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                    該当する記録がありません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((check) => (
                                <TableRow key={check.id} className={check.is_abnormal ? "bg-red-50" : ""}>
                                    <TableCell className="font-medium">{check.employee?.name || "-"}</TableCell>
                                    <TableCell>{check.check_type || "-"}</TableCell>
                                    <TableCell className="text-sm">
                                        {check.check_datetime
                                            ? format(new Date(check.check_datetime), "HH:mm")
                                            : "-"}
                                    </TableCell>
                                    <TableCell>{check.checker?.name || "-"}</TableCell>
                                    <TableCell>
                                        {check.measured_value != null ? `${check.measured_value} mg/L` : "-"}
                                    </TableCell>
                                    <TableCell>
                                        {check.is_abnormal
                                            ? <Badge variant="destructive">不適正</Badge>
                                            : <Badge variant="secondary" className="bg-green-100 text-green-600">適正</Badge>
                                        }
                                    </TableCell>
                                    <TableCell>{check.location || "-"}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{check.notes || ""}</TableCell>
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
                <EditAlcoholCheckModal
                    check={editingItem}
                    employees={employees}
                    open={!!editingItem}
                    onOpenChange={(open) => !open && setEditingItem(null)}
                />
            )}

            <DeleteConfirmDialog
                open={!!deletingItem}
                onOpenChange={(open) => !open && setDeletingItem(null)}
                title="記録の削除"
                description={`${deletingItem?.employee?.name || "不明"} の記録を削除します。この操作は取り消せません。`}
                onConfirm={handleDelete}
            />
        </div>
    );
}
