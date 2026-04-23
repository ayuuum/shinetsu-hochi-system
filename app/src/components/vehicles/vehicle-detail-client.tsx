"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tables } from "@/types/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Car, Wrench, AlertTriangle, Trash2, Layers } from "lucide-react";
import { differenceInDays } from "date-fns";
import { formatDisplayDate } from "@/lib/date";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import {
    deleteVehicleTireAction,
    deleteVehicleRepairAction,
    deleteVehicleAccidentAction,
} from "@/app/actions/admin-record-actions";
import { AddVehicleTireModal } from "@/components/vehicles/add-vehicle-tire-modal";
import { AddVehicleRepairModal } from "@/components/vehicles/add-vehicle-repair-modal";
import { AddVehicleAccidentModal } from "@/components/vehicles/add-vehicle-accident-modal";

type VehicleDetail = Tables<"vehicles"> & {
    employees: { id: string; name: string } | null;
    vehicle_tires: Tables<"vehicle_tires">[];
    vehicle_repairs: (Tables<"vehicle_repairs"> & { repaired_by_employee: { name: string } | null })[];
    vehicle_accidents: (Tables<"vehicle_accidents"> & { driver: { name: string } | null })[];
};

function getExpiryBadge(date: string | null) {
    if (!date) return null;
    const days = differenceInDays(new Date(date), new Date());
    if (days < 0) return <Badge variant="destructive">{Math.abs(days)}日超過</Badge>;
    if (days <= 30) return <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">残{days}日</Badge>;
    return <Badge variant="outline" className="text-green-700 border-green-200">有効</Badge>;
}

function DetailItem({ label, value }: { label: string; value: string | null | number }) {
    return (
        <div className="grid grid-cols-3 border-b border-border/50 py-3 last:border-0">
            <span className="text-muted-foreground text-sm">{label}</span>
            <span className="col-span-2 font-medium text-sm">{value || "-"}</span>
        </div>
    );
}

export function VehicleDetailClient({
    vehicle,
    isAdminOrHr,
}: {
    vehicle: VehicleDetail;
    isAdminOrHr: boolean;
}) {
    const router = useRouter();
    const [deletingTireId, setDeletingTireId] = useState<string | null>(null);
    const [deletingRepairId, setDeletingRepairId] = useState<string | null>(null);
    const [deletingAccidentId, setDeletingAccidentId] = useState<string | null>(null);

    const handleDeleteTire = async (id: string) => {
        const result = await deleteVehicleTireAction(id);
        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("タイヤ情報を削除しました");
            router.refresh();
        }
        setDeletingTireId(null);
    };

    const handleDeleteRepair = async (id: string) => {
        const result = await deleteVehicleRepairAction(id);
        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("修理履歴を削除しました");
            router.refresh();
        }
        setDeletingRepairId(null);
    };

    const handleDeleteAccident = async (id: string) => {
        const result = await deleteVehicleAccidentAction(id);
        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("事故記録を削除しました");
            router.refresh();
        }
        setDeletingAccidentId(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-200 pb-10">
            <div className="flex flex-col gap-4">
                <Button variant="ghost" onClick={() => router.back()} className="w-fit -ml-2 text-muted-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    一覧へ戻る
                </Button>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                            <Car className="h-8 w-8" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold tracking-tight">{vehicle.plate_number}</h1>
                                {vehicle.vehicle_name && <Badge variant="outline">{vehicle.vehicle_name}</Badge>}
                            </div>
                            <p className="text-muted-foreground text-sm mt-1">
                                {vehicle.employees ? `担当: ${vehicle.employees.name}` : "担当者未設定"}
                            </p>
                        </div>
                    </div>
                    {isAdminOrHr && (
                        <Button variant="outline" render={<Link href="/vehicles" />}>
                            車両一覧へ
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="basic" className="w-full">
                <TabsList className="inline-flex h-auto bg-muted/30 p-1.5 rounded-xl">
                    <TabsTrigger value="basic" className="rounded-lg px-4 py-3 text-sm"><Car className="mr-1 h-3.5 w-3.5 hidden md:inline" />基本情報</TabsTrigger>
                    <TabsTrigger value="tires" className="rounded-lg px-4 py-3 text-sm"><Layers className="mr-1 h-3.5 w-3.5 hidden md:inline" />タイヤ</TabsTrigger>
                    <TabsTrigger value="repairs" className="rounded-lg px-4 py-3 text-sm"><Wrench className="mr-1 h-3.5 w-3.5 hidden md:inline" />修理履歴</TabsTrigger>
                    <TabsTrigger value="accidents" className="rounded-lg px-4 py-3 text-sm"><AlertTriangle className="mr-1 h-3.5 w-3.5 hidden md:inline" />事故記録</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="shadow-sm border-border/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">車両情報</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-0">
                                <DetailItem label="ナンバー" value={vehicle.plate_number} />
                                <DetailItem label="車両名" value={vehicle.vehicle_name} />
                                <DetailItem label="担当者" value={vehicle.employees?.name ?? null} />
                            </CardContent>
                        </Card>

                        <Card className="shadow-sm border-border/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">有効期限</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-0">
                                <div className="grid grid-cols-3 border-b border-border/50 py-3">
                                    <span className="text-muted-foreground text-sm">車検</span>
                                    <div className="col-span-2 flex items-center gap-2">
                                        <span className="font-medium text-sm tabular-nums">{formatDisplayDate(vehicle.inspection_expiry)}</span>
                                        {getExpiryBadge(vehicle.inspection_expiry)}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 border-b border-border/50 py-3">
                                    <span className="text-muted-foreground text-sm">自賠責</span>
                                    <div className="col-span-2 flex items-center gap-2">
                                        <span className="font-medium text-sm tabular-nums">{formatDisplayDate(vehicle.liability_insurance_expiry)}</span>
                                        {getExpiryBadge(vehicle.liability_insurance_expiry)}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 py-3">
                                    <span className="text-muted-foreground text-sm">任意保険</span>
                                    <div className="col-span-2 flex items-center gap-2">
                                        <span className="font-medium text-sm tabular-nums">{formatDisplayDate(vehicle.voluntary_insurance_expiry)}</span>
                                        {getExpiryBadge(vehicle.voluntary_insurance_expiry)}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="tires" className="mt-6">
                    <Card className="shadow-sm border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">タイヤ情報</CardTitle>
                            {isAdminOrHr && <AddVehicleTireModal vehicleId={vehicle.id} onSuccess={() => router.refresh()} />}
                        </CardHeader>
                        <CardContent>
                            {vehicle.vehicle_tires.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground text-sm">タイヤ情報が登録されていません。</p>
                            ) : (
                                <div className="space-y-3">
                                    {vehicle.vehicle_tires.map((tire) => (
                                        <div key={tire.id} className="flex items-start justify-between py-2 border-b last:border-0">
                                            <div>
                                                <p className="text-sm font-medium">
                                                    購入日: {formatDisplayDate(tire.purchase_date, "未登録")}
                                                    {tire.manufacture_year ? ` | 製造年: ${tire.manufacture_year}年` : ""}
                                                </p>
                                                {tire.notes && <p className="text-xs text-muted-foreground mt-1">{tire.notes}</p>}
                                            </div>
                                            {isAdminOrHr && (
                                                <Button variant="ghost" size="sm" onClick={() => setDeletingTireId(tire.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="repairs" className="mt-6">
                    <Card className="shadow-sm border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">修理履歴</CardTitle>
                            {isAdminOrHr && <AddVehicleRepairModal vehicleId={vehicle.id} onSuccess={() => router.refresh()} />}
                        </CardHeader>
                        <CardContent>
                            {vehicle.vehicle_repairs.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground text-sm">修理履歴が登録されていません。</p>
                            ) : (
                                <div className="space-y-3">
                                    {vehicle.vehicle_repairs.map((repair) => (
                                        <div key={repair.id} className="flex items-start justify-between py-3 border-b last:border-0">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground tabular-nums">{formatDisplayDate(repair.repair_date)}</span>
                                                    {repair.cost != null && <Badge variant="outline" className="text-xs">{Number(repair.cost).toLocaleString()}円</Badge>}
                                                </div>
                                                <p className="font-medium text-sm mt-1">{repair.description}</p>
                                                {repair.repaired_by_employee && (
                                                    <p className="text-xs text-muted-foreground mt-0.5">担当: {repair.repaired_by_employee.name}</p>
                                                )}
                                                {repair.notes && <p className="text-xs text-muted-foreground mt-0.5">{repair.notes}</p>}
                                            </div>
                                            {isAdminOrHr && (
                                                <Button variant="ghost" size="sm" onClick={() => setDeletingRepairId(repair.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="accidents" className="mt-6">
                    <Card className="shadow-sm border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">事故記録</CardTitle>
                            {isAdminOrHr && <AddVehicleAccidentModal vehicleId={vehicle.id} onSuccess={() => router.refresh()} />}
                        </CardHeader>
                        <CardContent>
                            {vehicle.vehicle_accidents.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground text-sm">事故記録が登録されていません。</p>
                            ) : (
                                <div className="space-y-3">
                                    {vehicle.vehicle_accidents.map((accident) => (
                                        <div key={accident.id} className="flex items-start justify-between py-3 border-b last:border-0">
                                            <div>
                                                <span className="text-xs text-muted-foreground tabular-nums">{formatDisplayDate(accident.accident_date)}</span>
                                                {accident.driver && (
                                                    <span className="ml-2 text-xs text-muted-foreground">運転者: {accident.driver.name}</span>
                                                )}
                                                <p className="font-medium text-sm mt-1">{accident.description}</p>
                                                {accident.notes && <p className="text-xs text-muted-foreground mt-0.5">{accident.notes}</p>}
                                            </div>
                                            {isAdminOrHr && (
                                                <Button variant="ghost" size="sm" onClick={() => setDeletingAccidentId(accident.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <DeleteConfirmDialog
                open={!!deletingTireId}
                onOpenChange={(open) => !open && setDeletingTireId(null)}
                title="タイヤ情報の削除"
                description="このタイヤ情報を完全に削除します。復元はできません。"
                onConfirm={() => handleDeleteTire(deletingTireId!)}
            />
            <DeleteConfirmDialog
                open={!!deletingRepairId}
                onOpenChange={(open) => !open && setDeletingRepairId(null)}
                title="修理履歴の削除"
                description="この修理履歴を完全に削除します。復元はできません。"
                onConfirm={() => handleDeleteRepair(deletingRepairId!)}
            />
            <DeleteConfirmDialog
                open={!!deletingAccidentId}
                onOpenChange={(open) => !open && setDeletingAccidentId(null)}
                title="事故記録の削除"
                description="この事故記録を完全に削除します。復元はできません。"
                onConfirm={() => handleDeleteAccident(deletingAccidentId!)}
            />
        </div>
    );
}
