"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
    employee_number: z.string().min(1, "社員番号は必須です"),
    name: z.string().min(1, "氏名は必須です"),
    name_kana: z.string().min(1, "フリガナは必須です"),
    birth_date: z.string().min(1, "生年月日は必須です"),
    gender: z.string().optional(),
    phone_number: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
    hire_date: z.string().optional(),
    termination_date: z.string().optional(),
    branch: z.string().optional(),
    employment_type: z.string().optional(),
    job_title: z.string().optional(),
    position: z.string().optional(),
    emp_insurance_no: z.string().optional(),
    health_insurance_no: z.string().optional(),
    pension_no: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditEmployeeModalProps {
    employee: Tables<"employees">;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function EditEmployeeModal({ employee, open, onOpenChange, onSuccess }: EditEmployeeModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employee_number: employee.employee_number,
            name: employee.name,
            name_kana: employee.name_kana,
            birth_date: employee.birth_date || "",
            gender: employee.gender || "",
            phone_number: employee.phone_number || "",
            email: employee.email || "",
            address: employee.address || "",
            hire_date: employee.hire_date || "",
            termination_date: employee.termination_date || "",
            branch: employee.branch || "",
            employment_type: employee.employment_type || "",
            job_title: employee.job_title || "",
            position: employee.position || "",
            emp_insurance_no: employee.emp_insurance_no || "",
            health_insurance_no: employee.health_insurance_no || "",
            pension_no: employee.pension_no || "",
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                employee_number: employee.employee_number,
                name: employee.name,
                name_kana: employee.name_kana,
                birth_date: employee.birth_date || "",
                gender: employee.gender || "",
                phone_number: employee.phone_number || "",
                email: employee.email || "",
                address: employee.address || "",
                hire_date: employee.hire_date || "",
                termination_date: employee.termination_date || "",
                branch: employee.branch || "",
                employment_type: employee.employment_type || "",
                job_title: employee.job_title || "",
                position: employee.position || "",
                emp_insurance_no: employee.emp_insurance_no || "",
                health_insurance_no: employee.health_insurance_no || "",
                pension_no: employee.pension_no || "",
            });
        }
    }, [open, employee, form]);

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);
        const { error } = await supabase
            .from("employees")
            .update({
                employee_number: values.employee_number,
                name: values.name,
                name_kana: values.name_kana,
                birth_date: values.birth_date,
                gender: values.gender || null,
                phone_number: values.phone_number || null,
                email: values.email || null,
                address: values.address || null,
                hire_date: values.hire_date || null,
                termination_date: values.termination_date || null,
                branch: values.branch || null,
                employment_type: values.employment_type || null,
                job_title: values.job_title || null,
                position: values.position || null,
                emp_insurance_no: values.emp_insurance_no || null,
                health_insurance_no: values.health_insurance_no || null,
                pension_no: values.pension_no || null,
            })
            .eq("id", employee.id);

        setIsSubmitting(false);

        if (error) {
            toast.error("更新に失敗しました: " + error.message);
        } else {
            onOpenChange(false);
            onSuccess?.();
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>社員情報の編集</DialogTitle>
                    <DialogDescription>{employee.name}（{employee.employee_number}）</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="employee_number" render={({ field }) => (
                            <FormItem>
                                <FormLabel>社員番号 *</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>氏名 *</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="name_kana" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>フリガナ *</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="birth_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>生年月日 *</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="gender" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>性別</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="男性">男性</SelectItem>
                                            <SelectItem value="女性">女性</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="phone_number" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>電話番号</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>メール</FormLabel>
                                    <FormControl><Input type="email" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem>
                                <FormLabel>住所</FormLabel>
                                <FormControl><Input {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-3 gap-4">
                            <FormField control={form.control} name="hire_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>入社日</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="termination_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>退職日</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="branch" render={({ field }) => (
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="employment_type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>雇用形態</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="正社員">正社員</SelectItem>
                                            <SelectItem value="契約社員">契約社員</SelectItem>
                                            <SelectItem value="パート">パート</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="job_title" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>職種</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="position" render={({ field }) => (
                            <FormItem>
                                <FormLabel>役職</FormLabel>
                                <FormControl><Input placeholder="主任、課長 等" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-3 gap-4">
                            <FormField control={form.control} name="emp_insurance_no" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>雇用保険番号</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="health_insurance_no" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>健康保険番号</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="pension_no" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>年金番号</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

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
