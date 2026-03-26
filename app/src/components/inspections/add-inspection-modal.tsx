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
    client_name: z.string().min(1, "顧客名は必須です"),
    building_name: z.string().min(1, "物件名は必須です"),
    address: z.string().optional(),
    inspection_type: z.string().min(1, "点検種別を選択してください"),
    scheduled_date: z.string().min(1, "予定日は必須です"),
    assigned_employee_id: z.string().optional(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type Employee = { id: string; name: string };

export function AddInspectionModal({ employees }: { employees: Employee[] }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            client_name: "",
            building_name: "",
            address: "",
            inspection_type: "総合点検",
            scheduled_date: "",
            assigned_employee_id: "",
            notes: "",
        },
    });

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);
        const { error } = await supabase.from("inspection_schedules").insert([{
            client_name: values.client_name,
            building_name: values.building_name,
            address: values.address || null,
            inspection_type: values.inspection_type,
            scheduled_date: values.scheduled_date,
            assigned_employee_id: values.assigned_employee_id || null,
            notes: values.notes || null,
        }]);
        setIsSubmitting(false);

        if (error) {
            console.error(error);
            toast.error("登録に失敗しました: " + error.message);
        } else {
            setOpen(false);
            form.reset();
            router.refresh();
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={<Button><Plus className="mr-2 h-4 w-4" />点検予定追加</Button>}
            />
            <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>点検スケジュール登録</DialogTitle>
                    <DialogDescription>顧客物件の点検予定を登録します。</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="client_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>顧客名 *</FormLabel>
                                    <FormControl><Input placeholder="松本市役所" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="building_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>物件名 *</FormLabel>
                                    <FormControl><Input placeholder="本庁舎" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem>
                                <FormLabel>所在地</FormLabel>
                                <FormControl><Input placeholder="長野県松本市..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="inspection_type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>点検種別 *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="総合点検">総合点検</SelectItem>
                                            <SelectItem value="機器点検">機器点検</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="scheduled_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>予定日 *</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="assigned_employee_id" render={({ field }) => (
                            <FormItem>
                                <FormLabel>担当技術者</FormLabel>
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
