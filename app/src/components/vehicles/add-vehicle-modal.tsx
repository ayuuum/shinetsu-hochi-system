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
    plate_number: z.string().min(1, "ナンバーは必須です"),
    vehicle_name: z.string().optional(),
    primary_user_id: z.string().optional(),
    inspection_expiry: z.string().optional(),
    liability_insurance_expiry: z.string().optional(),
    voluntary_insurance_expiry: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type Employee = { id: string; name: string };

export function AddVehicleModal({ employees }: { employees: Employee[] }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            plate_number: "",
            vehicle_name: "",
            primary_user_id: "",
            inspection_expiry: "",
            liability_insurance_expiry: "",
            voluntary_insurance_expiry: "",
        },
    });

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);
        const { error } = await supabase.from("vehicles").insert([{
            plate_number: values.plate_number,
            vehicle_name: values.vehicle_name || null,
            primary_user_id: values.primary_user_id || null,
            inspection_expiry: values.inspection_expiry || null,
            liability_insurance_expiry: values.liability_insurance_expiry || null,
            voluntary_insurance_expiry: values.voluntary_insurance_expiry || null,
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
                render={<Button><Plus className="mr-2 h-4 w-4" />車両追加</Button>}
            />
            <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>新規車両登録</DialogTitle>
                    <DialogDescription>車両情報と期限を入力してください。</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="plate_number" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ナンバー *</FormLabel>
                                    <FormControl><Input placeholder="松本 500 あ 1234" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="vehicle_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>車両名・型式</FormLabel>
                                    <FormControl><Input placeholder="ハイエース バン" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="primary_user_id" render={({ field }) => (
                            <FormItem>
                                <FormLabel>主使用者</FormLabel>
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

                        <div className="grid grid-cols-1 gap-4">
                            <FormField control={form.control} name="inspection_expiry" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>車検満了日</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="liability_insurance_expiry" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>自賠責保険満期日</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="voluntary_insurance_expiry" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>任意保険満期日</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

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
