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
import { Tables } from "@/types/supabase";

const formSchema = z.object({
    employee_id: z.string().min(1, "対象社員を選択してください"),
    check_date: z.string().min(1, "受診日は必須です"),
    check_type: z.string().min(1, "種別を選択してください"),
    hospital_name: z.string().optional(),
    is_normal: z.string().min(1, "結果を選択してください"),
    height: z.string().optional(),
    weight: z.string().optional(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditHealthCheckModalProps {
    healthCheck: Tables<"health_checks">;
    employees: { id: string; name: string }[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditHealthCheckModal({ healthCheck, employees, open, onOpenChange }: EditHealthCheckModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employee_id: healthCheck.employee_id || "",
            check_date: healthCheck.check_date,
            check_type: healthCheck.check_type || "定期健康診断",
            hospital_name: healthCheck.hospital_name || "",
            is_normal: healthCheck.is_normal === false ? "false" : "true",
            height: healthCheck.height != null ? String(healthCheck.height) : "",
            weight: healthCheck.weight != null ? String(healthCheck.weight) : "",
            notes: healthCheck.notes || "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                employee_id: healthCheck.employee_id || "",
                check_date: healthCheck.check_date,
                check_type: healthCheck.check_type || "定期健康診断",
                hospital_name: healthCheck.hospital_name || "",
                is_normal: healthCheck.is_normal === false ? "false" : "true",
                height: healthCheck.height != null ? String(healthCheck.height) : "",
                weight: healthCheck.weight != null ? String(healthCheck.weight) : "",
                notes: healthCheck.notes || "",
            });
        }
    }, [open, healthCheck, form]);

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);
        const { error } = await supabase
            .from("health_checks")
            .update({
                employee_id: values.employee_id,
                check_date: values.check_date,
                check_type: values.check_type,
                hospital_name: values.hospital_name || null,
                is_normal: values.is_normal === "true",
                height: values.height ? parseFloat(values.height) : null,
                weight: values.weight ? parseFloat(values.weight) : null,
                notes: values.notes || null,
            })
            .eq("id", healthCheck.id);

        setIsSubmitting(false);

        if (error) {
            toast.error("更新に失敗しました: " + error.message);
        } else {
            toast.success("健康診断記録を更新しました");
            onOpenChange(false);
            router.refresh();
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>健康診断記録の編集</DialogTitle>
                    <DialogDescription>{healthCheck.check_date} の健康診断記録を編集します。</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="employee_id" render={({ field }) => (
                            <FormItem>
                                <FormLabel>対象社員 *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
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
                            <FormField control={form.control} name="check_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>受診日 *</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="check_type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>種別 *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="定期健康診断">定期健康診断</SelectItem>
                                            <SelectItem value="雇入時健康診断">雇入時健康診断</SelectItem>
                                            <SelectItem value="特殊健康診断">特殊健康診断</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="hospital_name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>医療機関</FormLabel>
                                <FormControl><Input placeholder="○○病院" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="is_normal" render={({ field }) => (
                            <FormItem>
                                <FormLabel>結果 *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="true">異常なし</SelectItem>
                                        <SelectItem value="false">要再検査</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="height" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>身長(cm)</FormLabel>
                                    <FormControl><Input type="number" step="0.1" placeholder="170.0" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="weight" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>体重(kg)</FormLabel>
                                    <FormControl><Input type="number" step="0.1" placeholder="65.0" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem>
                                <FormLabel>備考</FormLabel>
                                <FormControl><Input placeholder="特記事項" {...field} /></FormControl>
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
