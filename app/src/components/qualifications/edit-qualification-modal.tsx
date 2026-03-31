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
import type { QualificationRow } from "@/components/qualifications/qualifications-client";

const formSchema = z.object({
    acquired_date: z.string().optional(),
    expiry_date: z.string().optional(),
    certificate_number: z.string().optional(),
    issuing_authority: z.string().optional(),
    status: z.string(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditQualificationModalProps {
    qualification: QualificationRow;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditQualificationModal({ qualification, open, onOpenChange }: EditQualificationModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            acquired_date: qualification.acquired_date || "",
            expiry_date: qualification.expiry_date || "",
            certificate_number: qualification.certificate_number || "",
            issuing_authority: qualification.issuing_authority || "",
            status: qualification.status || "未着手",
            notes: qualification.notes || "",
        },
    });

    // Reset form when modal opens or qualification changes
    useEffect(() => {
        if (open) {
            form.reset({
                acquired_date: qualification.acquired_date || "",
                expiry_date: qualification.expiry_date || "",
                certificate_number: qualification.certificate_number || "",
                issuing_authority: qualification.issuing_authority || "",
                status: qualification.status || "未着手",
                notes: qualification.notes || "",
            });
        }
    }, [open, qualification, form]);

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);
        const { error } = await supabase
            .from("employee_qualifications")
            .update({
                acquired_date: values.acquired_date || null,
                expiry_date: values.expiry_date || null,
                certificate_number: values.certificate_number || null,
                issuing_authority: values.issuing_authority || null,
                status: values.status,
                notes: values.notes || null,
            })
            .eq("id", qualification.id);

        setIsSubmitting(false);

        if (error) {
            toast.error("更新に失敗しました: " + error.message);
        } else {
            toast.success("資格情報を更新しました");
            onOpenChange(false);
            router.refresh();
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>資格情報の編集</DialogTitle>
                    <DialogDescription>
                        {qualification.employees?.name} - {qualification.qualification_master?.name}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="acquired_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>取得日</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="expiry_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>有効期限</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="certificate_number" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>証明書番号</FormLabel>
                                    <FormControl><Input placeholder="例: 第12345号" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="issuing_authority" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>交付機関</FormLabel>
                                    <FormControl><Input placeholder="例: 長野県知事" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="status" render={({ field }) => (
                            <FormItem>
                                <FormLabel>申込状況</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="未着手">未着手</SelectItem>
                                        <SelectItem value="申込中">申込中</SelectItem>
                                        <SelectItem value="受講予定">受講予定</SelectItem>
                                        <SelectItem value="更新済み">更新済み</SelectItem>
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
