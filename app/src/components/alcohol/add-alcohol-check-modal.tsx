"use client";

import { useState } from "react";
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
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

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
type Employee = { id: string; name: string };

export function AddAlcoholCheckModal({ employees }: { employees: Employee[] }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const now = new Date();
    const localDatetime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employee_id: "",
            check_type: "出勤時",
            check_datetime: localDatetime,
            checker_id: "",
            measured_value: "",
            is_abnormal: "適正",
            location: "",
            notes: "",
        },
    });

    async function onSubmit(values: FormValues) {
        if (values.is_abnormal === "不適正") {
            const confirmed = window.confirm("不適正として記録します。よろしいですか？");
            if (!confirmed) return;
        }

        setIsSubmitting(true);
        const { error } = await supabase.from("alcohol_checks").insert([{
            employee_id: values.employee_id,
            check_type: values.check_type,
            check_datetime: values.check_datetime,
            checker_id: values.checker_id,
            measured_value: values.measured_value ? parseFloat(values.measured_value) : null,
            is_abnormal: values.is_abnormal === "不適正",
            location: values.location || null,
            notes: values.notes || null,
        }]);
        setIsSubmitting(false);

        if (error) {
            console.error(error);
            toast.error("記録に失敗しました: " + error.message);
        } else {
            if (values.is_abnormal === "不適正") {
                toast.error("不適正として記録しました。安全運転管理者の指示を仰いでください。");
            } else {
                toast.success("記録しました");
            }
            setOpen(false);
            form.reset({
                employee_id: "",
                check_type: "出勤時",
                check_datetime: localDatetime,
                checker_id: "",
                measured_value: "",
                is_abnormal: "適正",
                location: "",
                notes: "",
            });
            router.refresh();
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={<Button><Plus className="mr-2 h-4 w-4" />記録追加</Button>}
            />
            <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>アルコールチェック記録</DialogTitle>
                    <DialogDescription>検査結果を入力してください。</DialogDescription>
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
                                <FormLabel>確認者（安全運転管理者） *</FormLabel>
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
                                <FormControl><Input placeholder="特記事項" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting} className="w-full">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                記録する
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
