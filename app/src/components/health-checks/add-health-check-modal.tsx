"use client";

import { useState } from "react";
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
    DialogTrigger,
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
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createHealthCheckAction } from "@/app/actions/admin-record-actions";
import { healthCheckSchema, type HealthCheckValues } from "@/lib/validation/health-check";
import { getHealthCheckResultValueLabel, HEALTH_CHECK_RESULT_OPTIONS } from "@/lib/display-labels";
type Employee = { id: string; name: string };

export function AddHealthCheckModal({ employees }: { employees: Employee[] }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const employeeOptions = employees.map((employee) => ({
        value: employee.id,
        label: employee.name,
    }));

    const form = useForm<HealthCheckValues>({
        resolver: zodResolver(healthCheckSchema),
        defaultValues: {
            employee_id: "",
            check_date: "",
            check_type: "定期健康診断",
            hospital_name: "",
            is_normal: "true",
            height: "",
            weight: "",
            notes: "",
        },
    });

    async function onSubmit(values: HealthCheckValues) {
        setIsSubmitting(true);
        const result = await createHealthCheckAction(values);
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

        toast.success("健康診断記録を登録しました");
        setOpen(false);
        form.reset({
            employee_id: "",
            check_date: "",
            check_type: "定期健康診断",
            hospital_name: "",
            is_normal: "true",
            height: "",
            weight: "",
            notes: "",
        });
        router.refresh();
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={<Button><Plus className="mr-2 h-4 w-4" />健康診断追加</Button>}
            />
            <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>健康診断記録の登録</DialogTitle>
                    <DialogDescription>従業員の健康診断記録を登録します。</DialogDescription>
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
                                        <SelectTrigger>
                                            <SelectValue>{getHealthCheckResultValueLabel(field.value)}</SelectValue>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {HEALTH_CHECK_RESULT_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                        ))}
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
                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                登録する
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
