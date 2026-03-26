"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { AlcoholCheckRow } from "./alcohol-client";

const formSchema = z.object({
    employee_id: z.string().min(1, "社員を選択してください"),
    check_type: z.string().min(1, "検査種別を選択してください"),
    check_datetime: z.string().min(1, "検査日時は必須です"),
    checker_id: z.string().min(1, "確認者を選択してください"),
    measured_value: z.string().optional(),
    is_abnormal: z.string().min(1, "判定結果を選択してください"),
    location: z.string().optional(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditAlcoholCheckModalProps {
    check: AlcoholCheckRow;
    employees: { id: string; name: string }[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditAlcoholCheckModal({ check, employees, open, onOpenChange }: EditAlcoholCheckModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employee_id: check.employee_id || "",
            check_type: check.check_type || "出勤時",
            check_datetime: check.check_datetime?.slice(0, 16) || "",
            checker_id: check.checker_id || "",
            measured_value: check.measured_value != null ? String(check.measured_value) : "",
            is_abnormal: check.is_abnormal ? "不適正" : "適正",
            location: check.location || "",
            notes: check.notes || "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                employee_id: check.employee_id || "",
                check_type: check.check_type || "出勤時",
                check_datetime: check.check_datetime?.slice(0, 16) || "",
                checker_id: check.checker_id || "",
                measured_value: check.measured_value != null ? String(check.measured_value) : "",
                is_abnormal: check.is_abnormal ? "不適正" : "適正",
                location: check.location || "",
                notes: check.notes || "",
            });
        }
    }, [open, check, form]);

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);
        const { error } = await supabase
            .from("alcohol_checks")
            .update({
                employee_id: values.employee_id,
                check_type: values.check_type,
                check_datetime: values.check_datetime,
                checker_id: values.checker_id,
                measured_value: values.measured_value ? parseFloat(values.measured_value) : null,
                is_abnormal: values.is_abnormal === "不適正",
                location: values.location || null,
                notes: values.notes || null,
            })
            .eq("id", check.id);

        setIsSubmitting(false);

        if (error) {
            toast.error("更新に失敗しました: " + error.message);
        } else {
            toast.success("記録を更新しました");
            onOpenChange(false);
            router.refresh();
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>アルコールチェック記録の編集</DialogTitle>
                    <DialogDescription>{check.employee?.name} - {check.check_datetime?.slice(0, 10)}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="employee_id" render={({ field }) => (
                            <FormItem>
                                <FormLabel>対象社員 *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
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
                                <Select onValueChange={field.onChange} value={field.value}>
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
