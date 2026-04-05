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
import { Tables } from "@/types/supabase";
import { updateHealthCheckAction } from "@/app/actions/admin-record-actions";
import { healthCheckSchema, toHealthCheckFormValues, type HealthCheckValues } from "@/lib/validation/health-check";

interface EditHealthCheckModalProps {
    healthCheck: Tables<"health_checks">;
    employees: { id: string; name: string }[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditHealthCheckModal({ healthCheck, employees, open, onOpenChange }: EditHealthCheckModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const employeeOptions = employees.map((employee) => ({
        value: employee.id,
        label: employee.name,
    }));

    const form = useForm<HealthCheckValues>({
        resolver: zodResolver(healthCheckSchema),
        defaultValues: toHealthCheckFormValues(healthCheck),
    });

    useEffect(() => {
        if (open) {
            form.reset(toHealthCheckFormValues(healthCheck));
        }
    }, [open, healthCheck, form]);

    async function onSubmit(values: HealthCheckValues) {
        setIsSubmitting(true);
        const result = await updateHealthCheckAction(healthCheck.id, values);
        setIsSubmitting(false);

        if (!result.success) {
            if (result.fieldErrors) {
                for (const [field, message] of Object.entries(result.fieldErrors)) {
                    if (!message) continue;
                    form.setError(field as keyof HealthCheckValues, { type: "server", message });
                }
            }
            toast.error(result.error);
            return;
        }

        toast.success("健康診断記録を更新しました");
        onOpenChange(false);
        router.refresh();
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
                                <Select items={employeeOptions} onValueChange={field.onChange} value={field.value}>
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
