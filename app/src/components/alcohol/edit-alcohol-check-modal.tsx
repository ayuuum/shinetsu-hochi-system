"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AlcoholCheckRow } from "./alcohol-client";
import { updateAlcoholCheckAction } from "@/app/actions/admin-record-actions";
import { alcoholCheckSchema, toAlcoholCheckFormValues, type AlcoholCheckValues } from "@/lib/validation/alcohol-check";
import { formatDisplayDate } from "@/lib/date";

interface EditAlcoholCheckModalProps {
    check: AlcoholCheckRow;
    employees: { id: string; name: string }[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditAlcoholCheckModal({ check, employees, open, onOpenChange }: EditAlcoholCheckModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const employeeOptions = employees.map((employee) => ({
        value: employee.id,
        label: employee.name,
    }));

    const form = useForm<AlcoholCheckValues>({
        resolver: zodResolver(alcoholCheckSchema),
        defaultValues: toAlcoholCheckFormValues(check),
    });

    useEffect(() => {
        if (open) {
            form.reset(toAlcoholCheckFormValues(check));
        }
    }, [open, check, form]);

    async function onSubmit(values: AlcoholCheckValues) {
        // Fix: show confirmation dialog when marking as abnormal, matching add modal behavior
        if (values.is_abnormal === "不適正") {
            const confirmed = window.confirm("不適正（陽性）として記録を更新します。よろしいですか？");
            if (!confirmed) return;
        }

        setIsSubmitting(true);
        const result = await updateAlcoholCheckAction(check.id, values);
        setIsSubmitting(false);

        if (!result.success) {
            if (result.fieldErrors) {
                for (const [field, message] of Object.entries(result.fieldErrors)) {
                    if (!message) continue;
                    form.setError(field as keyof AlcoholCheckValues, { type: "server", message });
                }
            }
            toast.error(result.error);
            return;
        }

        toast.success("記録を更新しました");
        onOpenChange(false);
        router.refresh();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>アルコールチェック記録の編集</DialogTitle>
                    <DialogDescription>{check.employee?.name} - {formatDisplayDate(check.check_datetime)}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="employee_id" render={({ field }) => (
                            <FormItem>
                                <FormLabel>対象社員 *</FormLabel>
                                <Select items={employeeOptions} onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="社員を選択" /></SelectTrigger>
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="check_type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>検査種別 *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="出勤時">出勤時</SelectItem>
                                            <SelectItem value="退勤時">退勤時</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="check_datetime" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>検査日時 *</FormLabel>
                                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="checker_id" render={({ field }) => (
                            <FormItem>
                                <FormLabel>確認者 *</FormLabel>
                                <Select items={employeeOptions} onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="確認者を選択" /></SelectTrigger>
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="measured_value" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>検知器の値 (mg/L)</FormLabel>
                                    <FormControl><Input type="number" step="0.001" placeholder="0.000" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="is_abnormal" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>判定結果 *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="適正">適正</SelectItem>
                                            <SelectItem value="不適正">不適正</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="location" render={({ field }) => (
                            <FormItem>
                                <FormLabel>拠点</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="本社">本社</SelectItem>
                                        <SelectItem value="塩尻">塩尻営業所</SelectItem>
                                        <SelectItem value="白馬">白馬営業所</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem>
                                <FormLabel>備考</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                保存する
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
