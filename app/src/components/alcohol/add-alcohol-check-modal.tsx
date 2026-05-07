"use client";

import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResponsiveModal } from "@/components/shared/responsive-modal";
import { useHaptics } from "@/hooks/use-haptics";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Beer, ShieldCheck, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { createAlcoholCheckAction } from "@/app/actions/admin-record-actions";
import { alcoholCheckSchema, type AlcoholCheckValues } from "@/lib/validation/alcohol-check";
import { useAuth } from "@/hooks/use-auth";

type Employee = { id: string; name: string };

function buildLocalDatetime(date?: string) {
    const now = new Date();
    const baseDate = date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    return `${baseDate}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function getDefaultValues(initialEmployeeId?: string, initialDate?: string, initialLocation?: string): AlcoholCheckValues {
    return {
        employee_id: initialEmployeeId || "",
        check_type: "出勤時",
        check_datetime: buildLocalDatetime(initialDate),
        checker_id: "",
        measured_value: "0.00",
        is_abnormal: "適正",
        location: initialLocation || "",
        notes: "",
    };
}

export function AddAlcoholCheckModal({
    employees,
    initialEmployeeId,
    initialDate,
    initialLocation,
}: {
    employees: Employee[];
    initialEmployeeId?: string;
    initialDate?: string;
    initialLocation?: string;
}) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingValues, setPendingValues] = useState<AlcoholCheckValues | null>(null);
    const router = useRouter();
    const { role } = useAuth();
    const { triggerHaptic } = useHaptics();

    const form = useForm<AlcoholCheckValues>({
        resolver: zodResolver(alcoholCheckSchema),
        defaultValues: getDefaultValues(initialEmployeeId, initialDate, initialLocation),
    });

    const isAbnormal = useWatch({
        control: form.control,
        name: "is_abnormal",
    }) === "不適正";

    useEffect(() => {
        if (!open || role !== "technician" || employees.length !== 1) return;
        const onlyId = employees[0].id;
        form.setValue("employee_id", onlyId);
        form.setValue("checker_id", onlyId);
    }, [open, role, employees, form]);

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (nextOpen) {
            form.reset(getDefaultValues(initialEmployeeId, initialDate, initialLocation));
        }
    };

    async function submitRecord(values: AlcoholCheckValues) {
        setIsSubmitting(true);
        const result = await createAlcoholCheckAction(values);
        setIsSubmitting(false);

        if (!result.success) {
            triggerHaptic("error");
            if (result.fieldErrors) {
                for (const [field, message] of Object.entries(result.fieldErrors)) {
                    if (!message) continue;
                    form.setError(field as keyof AlcoholCheckValues, { type: "server", message });
                }
            }
            toast.error(result.error);
            return;
        }

        if (values.is_abnormal === "不適正") {
            triggerHaptic("error");
            toast.error("不適正（陽性）として記録しました。直ちに安全運転管理者へ報告してください。", { duration: 8000 });
        } else {
            triggerHaptic("success");
            toast.success("アルコールチェックを記録しました");
        }

        setOpen(false);
        router.refresh();
    }

    async function onSubmit(values: AlcoholCheckValues) {
        if (values.is_abnormal === "不適正") {
            setPendingValues(values);
            setConfirmOpen(true);
            return;
        }
        await submitRecord(values);
    }

    const handleAbnormalConfirm = async () => {
        setConfirmOpen(false);
        if (pendingValues) {
            await submitRecord(pendingValues);
            setPendingValues(null);
        }
    };

    return (
        <>
            <Button onClick={() => {
                triggerHaptic("light");
                setOpen(true);
            }} className="rounded-full shadow-sm"><Plus className="mr-2 h-4 w-4" />体調・アルコール記録</Button>
            <ResponsiveModal
                open={open}
                onOpenChange={handleOpenChange}
                title={
                    <span className="text-xl md:text-2xl font-bold flex items-center justify-center gap-2">
                        <Beer className="h-6 w-6 text-primary" />
                        アルコールチェック
                    </span>
                }
                description="入力はスマートフォンからのワンタップを想定しています。"
                className="bg-slate-50 dark:bg-slate-950 sm:max-w-[480px]"
            >
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        {/* Section: Who & When */}
                        <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm border space-y-4">
                            <FormField control={form.control} name="employee_id" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-muted-foreground font-semibold">👤 対象社員</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-12 text-base md:text-lg">
                                            <span className="flex-1 text-left">
                                                {employees.find(e => e.id === field.value)?.name ?? <span className="text-muted-foreground">タップして社員を選択</span>}
                                            </span>
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {employees.map(emp => (
                                                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="check_type" render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel className="text-muted-foreground font-semibold">⏱️ 検査タイミング</FormLabel>
                                    <FormControl>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                type="button"
                                                variant={field.value === "出勤時" ? "default" : "outline"}
                                                className={`h-14 text-base rounded-xl font-bold transition-all ${field.value === "出勤時" ? "shadow-md ring-2 ring-primary/20 ring-offset-1" : ""}`}
                                                onClick={() => field.onChange("出勤時")}
                                            >出勤時</Button>
                                            <Button
                                                type="button"
                                                variant={field.value === "退勤時" ? "default" : "outline"}
                                                className={`h-14 text-base rounded-xl font-bold transition-all ${field.value === "退勤時" ? "shadow-md ring-2 ring-primary/20 ring-offset-1" : ""}`}
                                                onClick={() => field.onChange("退勤時")}
                                            >退勤時</Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="check_datetime" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-muted-foreground font-semibold">📅 検査日時</FormLabel>
                                    <FormControl><Input type="datetime-local" className="h-12 text-base" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* Section: Result */}
                        <div className="bg-white dark:bg-card rounded-2xl p-4 shadow-sm border space-y-4">
                            <FormField control={form.control} name="is_abnormal" render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel className="text-muted-foreground font-semibold">🔍 判定結果</FormLabel>
                                    <FormControl>
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                type="button"
                                                className={`h-20 text-xl md:text-2xl font-extrabold rounded-2xl transition-all ${field.value === "適正" ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-500 ring-offset-2 scale-[1.02]" : "bg-card text-muted-foreground hover:bg-muted border-2 border-border"}`}
                                                onClick={() => field.onChange("適正")}
                                            >
                                                <ShieldCheck className="mr-2 h-6 w-6" /> 適正
                                            </Button>
                                            <Button
                                                type="button"
                                                className={`h-20 text-xl font-extrabold rounded-2xl transition-all ${field.value === "不適正" ? "bg-destructive hover:bg-destructive/90 text-white shadow-lg ring-2 ring-destructive ring-offset-2 scale-[1.02]" : "bg-card text-muted-foreground hover:bg-muted border-2 border-border"}`}
                                                onClick={() => field.onChange("不適正")}
                                            >
                                                <AlertTriangle className="mr-2 h-6 w-6" /> 不適正
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            {isAbnormal && (
                                <div className="p-3 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 rounded-xl text-sm font-semibold border border-blue-200 dark:border-blue-900 flex items-start gap-2">
                                    <AlertTriangle className="h-5 w-5 shrink-0" />
                                    <p>不適正として記録されます。作業員は絶対に運転を開始しないでください。</p>
                                </div>
                            )}

                            <FormField control={form.control} name="checker_id" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-muted-foreground font-semibold">👮 安全運転管理者</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="h-12 text-base">
                                            <span className="flex-1 text-left">
                                                {employees.find(e => e.id === field.value)?.name ?? <span className="text-muted-foreground">タップして確認者を選択</span>}
                                            </span>
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {employees.map(emp => (
                                                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="measured_value" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-muted-foreground font-semibold">メーター値（任意）</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" className="h-12 text-base" placeholder="0.00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="pt-2 pb-4 mt-6">
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full h-16 text-lg md:text-xl font-bold rounded-2xl shadow-md ${isAbnormal ? 'bg-destructive hover:bg-destructive/90 text-white' : ''}`}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                ) : (
                                    <Beer className="mr-2 h-6 w-6" />
                                )}
                                {isAbnormal ? "不適正として記録" : "記録を保存する"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </ResponsiveModal>

            <Dialog open={confirmOpen} onOpenChange={(o) => !isSubmitting && setConfirmOpen(o)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            不適正として記録しますか？
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-sm leading-relaxed">
                            アルコール検知が確認されました。<br />
                            記録後は直ちに安全運転管理者へ報告し、当該社員の運転を禁止してください。
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isSubmitting}>
                            キャンセル
                        </Button>
                        <Button variant="destructive" onClick={handleAbnormalConfirm} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            不適正として記録する
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
