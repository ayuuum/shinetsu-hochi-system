"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Beer, CheckCircle2, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { AddAlcoholCheckModal } from "./add-alcohol-check-modal";
import { EditAlcoholCheckModal } from "./edit-alcohol-check-modal";
import { deleteAlcoholCheckAction } from "@/app/actions/admin-record-actions";
import { toast } from "sonner";
import type { AlcoholCheckRow } from "./alcohol-client";

type Employee = { id: string; name: string };

interface TechnicianAlcoholClientProps {
    initialChecks: AlcoholCheckRow[];
    employee: Employee;
    currentDate: string;
}

export function TechnicianAlcoholClient({ initialChecks, employee, currentDate }: TechnicianAlcoholClientProps) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<AlcoholCheckRow | null>(null);

    const hasArrival = initialChecks.some((c) => c.check_type === "出勤時");
    const hasDeparture = initialChecks.some((c) => c.check_type === "退勤時");
    const hasAbnormal = initialChecks.some((c) => c.is_abnormal);

    const handleDelete = async (id: string) => {
        const result = await deleteAlcoholCheckAction(id);
        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("記録を削除しました");
            router.refresh();
        }
        setDeletingId(null);
    };

    const displayDate = (() => {
        try {
            return format(new Date(currentDate), "M月d日(E)", { locale: ja });
        } catch {
            return currentDate;
        }
    })();

    return (
        <div className="space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">アルコールチェック</h1>
                    <p className="text-muted-foreground mt-1 text-sm">{displayDate} の記録</p>
                </div>
                <AddAlcoholCheckModal
                    employees={[employee]}
                    initialEmployeeId={employee.id}
                    initialDate={currentDate}
                />
            </div>

            {hasAbnormal && (
                <div className="flex items-start gap-2 rounded-xl border border-blue-600/20 bg-blue-600/10 px-4 py-3 text-sm font-semibold text-blue-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    不適正の記録があります。安全運転管理者に報告してください。
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl border p-4 ${hasArrival ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-border bg-muted/30"}`}>
                    <div className="flex items-center gap-2">
                        {hasArrival
                            ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40" />
                        }
                        <span className="text-sm font-semibold">出勤時</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{hasArrival ? "記録済み" : "未記録"}</p>
                </div>
                <div className={`rounded-xl border p-4 ${hasDeparture ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30" : "border-border bg-muted/30"}`}>
                    <div className="flex items-center gap-2">
                        {hasDeparture
                            ? <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            : <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/40" />
                        }
                        <span className="text-sm font-semibold">退勤時</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{hasDeparture ? "記録済み" : "未記録"}</p>
                </div>
            </div>

            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Beer className="h-5 w-5 text-muted-foreground" />
                        本日の記録
                    </CardTitle>
                    <CardDescription>{initialChecks.length}件の記録</CardDescription>
                </CardHeader>
                <CardContent>
                    {initialChecks.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">本日の記録はまだありません。</p>
                    ) : (
                        <div className="-mx-6">
                            {initialChecks.map((check) => (
                                <div key={check.id} className="flex items-start justify-between border-b border-border/40 px-6 py-3 last:border-0">
                                    <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-sm font-semibold">{check.check_type}</span>
                                            <Badge
                                                variant="secondary"
                                                className={check.is_abnormal
                                                    ? "border-blue-700/50 bg-blue-700/10 text-blue-700 text-xs font-semibold"
                                                    : "border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold dark:border-emerald-900 dark:bg-emerald-950/30"
                                                }
                                            >
                                                {check.is_abnormal ? "不適正" : "適正"}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {check.check_datetime ? format(new Date(check.check_datetime), "HH:mm") : "—"}
                                            {check.measured_value != null && ` | ${Number(check.measured_value).toFixed(2)} mg/L`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                                            onClick={() => setEditingItem(check)}
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => setDeletingId(check.id)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {editingItem && (
                <EditAlcoholCheckModal
                    check={editingItem}
                    employees={[employee]}
                    open={!!editingItem}
                    onOpenChange={(open) => { if (!open) { setEditingItem(null); router.refresh(); } }}
                />
            )}
            <DeleteConfirmDialog
                open={!!deletingId}
                onOpenChange={(open) => !open && setDeletingId(null)}
                title="記録の削除"
                description="このアルコールチェック記録を完全に削除します。復元はできません。"
                onConfirm={() => handleDelete(deletingId!)}
            />
        </div>
    );
}
