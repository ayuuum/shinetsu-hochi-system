"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Truck, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { isBefore, addDays } from "date-fns";
import { AddVehicleModal } from "./add-vehicle-modal";
import { EditVehicleModal } from "./edit-vehicle-modal";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export type VehicleWithUser = Tables<"vehicles"> & {
    employees?: { name: string } | null;
};

function getStatusBadge(expiry: string | null) {
    if (!expiry) return <Badge variant="outline">未設定</Badge>;
    const date = new Date(expiry);
    const now = new Date();
    const soon = addDays(now, 30);

    if (isBefore(date, now)) {
        return <Badge variant="destructive">期限切れ</Badge>;
    }
    if (isBefore(date, soon)) {
        return (
            <Badge variant="secondary" className="bg-orange-100 text-orange-600 hover:bg-orange-100">
                <AlertTriangle className="mr-1 h-3 w-3" />
                30日以内
            </Badge>
        );
    }
    return <Badge variant="secondary" className="bg-green-100 text-green-600 hover:bg-green-100">正常</Badge>;
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
}: {
    initialVehicles: VehicleWithUser[];
    employees: { id: string; name: string }[];
}) {
    const [search, setSearch] = useState("");
    const [editingVehicle, setEditingVehicle] = useState<VehicleWithUser | null>(null);
    const [deletingVehicle, setDeletingVehicle] = useState<VehicleWithUser | null>(null);
    const router = useRouter();

    const filtered = initialVehicles.filter(v => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            v.plate_number.toLowerCase().includes(q) ||
            v.vehicle_name?.toLowerCase().includes(q) ||
            v.employees?.name?.toLowerCase().includes(q)
        );
    });

    const handleDelete = async () => {
        if (!deletingVehicle) return;
        const { error } = await supabase.from("vehicles").delete().eq("id", deletingVehicle.id);
        if (error) {
            toast.error("削除に失敗しました: " + error.message);
        } else {
            toast.success("車両を削除しました");
            router.refresh();
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">車両・備品</h1>
                    <p className="text-muted-foreground mt-2">社用車の車検・保険および重要備品を管理します。</p>
                </div>
                <AddVehicleModal employees={employees} />
            </div>

            <div className="flex items-center gap-4">
                <Input
                    placeholder="ナンバー・車両名・使用者で検索..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="border rounded-xl bg-card overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="min-w-[160px]">ナンバー</TableHead>
                            <TableHead className="min-w-[120px]">車両名</TableHead>
                            <TableHead className="min-w-[100px]">主使用者</TableHead>
                            <TableHead className="min-w-[120px]">車検満了日</TableHead>
                            <TableHead className="min-w-[120px]">自賠責満期</TableHead>
                            <TableHead className="min-w-[120px]">任意保険満期</TableHead>
                            <TableHead className="min-w-[80px]">ステータス</TableHead>
                            <TableHead className="min-w-[100px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    {search ? "該当する車両がありません。" : "車両データがありません。"}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((vehicle) => (
                                <TableRow key={vehicle.id} className="hover:bg-muted/30 transition-colors">
                                    <TableCell className="font-bold">
                                        <div className="flex items-center gap-2">
                                            <Truck className="h-4 w-4 text-muted-foreground shrink-0" />
                                            {vehicle.plate_number}
                                        </div>
                                    </TableCell>
                                    <TableCell>{vehicle.vehicle_name || "-"}</TableCell>
                                    <TableCell>{vehicle.employees?.name || "-"}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{vehicle.inspection_expiry || "-"}</span>
                                            {vehicle.inspection_expiry && getStatusBadge(vehicle.inspection_expiry)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{vehicle.liability_insurance_expiry || "-"}</span>
                                            {vehicle.liability_insurance_expiry && getStatusBadge(vehicle.liability_insurance_expiry)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{vehicle.voluntary_insurance_expiry || "-"}</span>
                                            {vehicle.voluntary_insurance_expiry && getStatusBadge(vehicle.voluntary_insurance_expiry)}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getWorstStatus(vehicle) === 1
                                            ? <Badge variant="destructive">要対応</Badge>
                                            : getWorstStatus(vehicle) === 2
                                                ? <Badge variant="secondary" className="bg-orange-100 text-orange-600">注意</Badge>
                                                : <Badge variant="secondary" className="bg-green-100 text-green-600">正常</Badge>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => setEditingVehicle(vehicle)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeletingVehicle(vehicle)}>
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

            {editingVehicle && (
                <EditVehicleModal
                    vehicle={editingVehicle}
                    employees={employees}
                    open={!!editingVehicle}
                    onOpenChange={(open) => !open && setEditingVehicle(null)}
                />
            )}

            <DeleteConfirmDialog
                open={!!deletingVehicle}
                onOpenChange={(open) => !open && setDeletingVehicle(null)}
                title="車両の削除"
                description={`${deletingVehicle?.plate_number} を削除します。この操作は取り消せません。`}
                onConfirm={handleDelete}
            />
        </div>
    );
}
