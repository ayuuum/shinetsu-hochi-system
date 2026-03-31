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
import { Pencil, Trash2, Download } from "lucide-react";
import { AddProjectModal } from "./add-project-modal";
import { EditProjectModal } from "./edit-project-modal";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export type ConstructionWithEmployee = Tables<"construction_records"> & {
    employees: { id: string; name: string; branch: string | null } | null;
};

type Employee = { id: string; name: string; branch: string | null };

const CATEGORY_OPTIONS = ["消防設備工事", "電気設備工事", "空調設備工事", "その他"] as const;

function getCategoryBadge(category: string | null) {
    switch (category) {
        case "消防設備工事":
            return <Badge variant="secondary" className="bg-red-100 text-red-600">消防設備工事</Badge>;
        case "電気設備工事":
            return <Badge variant="secondary" className="bg-blue-100 text-blue-600">電気設備工事</Badge>;
        case "空調設備工事":
            return <Badge variant="secondary" className="bg-green-100 text-green-600">空調設備工事</Badge>;
        case "その他":
            return <Badge variant="outline">その他</Badge>;
        default:
            return <Badge variant="outline">-</Badge>;
    }
}

export function ProjectsClient({
    initialRecords,
    employees,
}: {
    initialRecords: ConstructionWithEmployee[];
    employees: Employee[];
}) {
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<ConstructionWithEmployee | null>(null);
    const [deletingItem, setDeletingItem] = useState<ConstructionWithEmployee | null>(null);
    const router = useRouter();

    const filtered = initialRecords.filter((r) => {
        if (categoryFilter && categoryFilter !== "all" && r.category !== categoryFilter) return false;
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            r.construction_name.toLowerCase().includes(q) ||
            (r.location?.toLowerCase().includes(q) ?? false) ||
            (r.employees?.name?.toLowerCase().includes(q) ?? false)
        );
    });

    const handleDelete = async () => {
        if (!deletingItem) return;
        const { error } = await supabase.from("construction_records").delete().eq("id", deletingItem.id);
        if (error) {
            toast.error("削除に失敗しました: " + error.message);
        } else {
            toast.success("工事記録を削除しました");
            router.refresh();
        }
    };

    const handleExport = () => {
        window.open("/api/export/career-history", "_blank");
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">工事経歴</h1>
                    <p className="text-muted-foreground mt-2">全社員の工事・施工記録を一覧管理します。</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />CSV出力
                    </Button>
                    <AddProjectModal employees={employees} />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Input
                    placeholder="工事名・場所・担当者で検索..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={categoryFilter ?? undefined} onValueChange={(val: string | null) => setCategoryFilter(val)}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="全てのカテゴリ" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">全て</SelectItem>
                        {CATEGORY_OPTIONS.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="border rounded-xl bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="min-w-[150px]">工事名</TableHead>
                            <TableHead className="min-w-[120px]">カテゴリ</TableHead>
                            <TableHead className="min-w-[110px]">施工日</TableHead>
                            <TableHead className="min-w-[100px]">担当者</TableHead>
                            <TableHead className="min-w-[80px]">拠点</TableHead>
                            <TableHead className="min-w-[100px]">役割</TableHead>
                            <TableHead className="min-w-[120px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    工事記録がありません。
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((record) => (
                                <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-medium">{record.construction_name}</TableCell>
                                    <TableCell>{getCategoryBadge(record.category)}</TableCell>
                                    <TableCell>{record.construction_date}</TableCell>
                                    <TableCell>{record.employees?.name || "-"}</TableCell>
                                    <TableCell>{record.employees?.branch || "-"}</TableCell>
                                    <TableCell>{record.role || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => setEditingItem(record)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeletingItem(record)}>
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
                <EditProjectModal
                    record={editingItem}
                    employees={employees}
                    open={!!editingItem}
                    onOpenChange={(open) => !open && setEditingItem(null)}
                />
            )}

            <DeleteConfirmDialog
                open={!!deletingItem}
                onOpenChange={(open) => !open && setDeletingItem(null)}
                title="工事記録の削除"
                description={`${deletingItem?.construction_name} の工事記録を削除します。`}
                onConfirm={handleDelete}
            />
        </div>
    );
}
