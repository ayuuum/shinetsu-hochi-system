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
    construction_name: z.string().min(1, "工事名は必須です"),
    category: z.string().min(1, "カテゴリを選択してください"),
    construction_date: z.string().min(1, "施工日は必須です"),
    employee_id: z.string().min(1, "担当者を選択してください"),
    role: z.string().optional(),
    location: z.string().optional(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type Employee = { id: string; name: string; branch: string | null };

export function AddProjectModal({ employees }: { employees: Employee[] }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            construction_name: "",
            category: "",
            construction_date: "",
            employee_id: "",
            role: "",
            location: "",
            notes: "",
        },
    });

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);
        const { error } = await supabase.from("construction_records").insert([{
            construction_name: values.construction_name,
            category: values.category,
            construction_date: values.construction_date,
            employee_id: values.employee_id,
            role: values.role || null,
            location: values.location || null,
            notes: values.notes || null,
        }]);
        setIsSubmitting(false);

        if (error) {
            console.error(error);
            toast.error("登録に失敗しました: " + error.message);
        } else {
            toast.success("工事記録を登録しました");
            setOpen(false);
            form.reset();
            router.refresh();
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={<Button><Plus className="mr-2 h-4 w-4" />工事記録追加</Button>}
            />
            <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>工事記録の登録</DialogTitle>
                    <DialogDescription>新しい工事・施工記録を登録します。</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="construction_name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>工事名 *</FormLabel>
                                <FormControl><Input placeholder="○○ビル消防設備工事" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="category" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>カテゴリ *</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="消防設備工事">消防設備工事</SelectItem>
                                            <SelectItem value="電気設備工事">電気設備工事</SelectItem>
                                            <SelectItem value="空調設備工事">空調設備工事</SelectItem>
                                            <SelectItem value="その他">その他</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="construction_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>施工日 *</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="employee_id" render={({ field }) => (
                            <FormItem>
                                <FormLabel>担当者 *</FormLabel>
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
                            <FormField control={form.control} name="role" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>役割</FormLabel>
                                    <FormControl><Input placeholder="主任技術者" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="location" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>場所</FormLabel>
                                    <FormControl><Input placeholder="長野県松本市..." {...field} /></FormControl>
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
