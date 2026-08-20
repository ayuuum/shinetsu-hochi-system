"use client";

import { useState } from "react";
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
import { DatePickerField } from "@/components/shared/date-picker-field";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Tables } from "@/types/supabase";
import { createExamHistoryAction, updateExamHistoryAction } from "@/app/actions/admin-record-actions";

const formSchema = z.object({
    qualification_name: z.string().min(1, "資格名は必須です"),
    exam_date: z.string().min(1, "受験日は必須です"),
    result: z.enum(["合格", "不合格"]),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddExamHistoryModalProps {
    employeeId: string;
    existingRecord?: Tables<"qualification_exam_history">;
    onSuccess?: () => void;
}

function toFormValues(record?: Tables<"qualification_exam_history">): FormValues {
    return {
        qualification_name: record?.qualification_name || "",
        exam_date: record?.exam_date || "",
        result: record?.result === "不合格" ? "不合格" : "合格",
        notes: record?.notes || "",
    };
}

export function AddExamHistoryModal({ employeeId, existingRecord, onSuccess }: AddExamHistoryModalProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEdit = !!existingRecord;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: toFormValues(existingRecord),
    });

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        form.reset(toFormValues(existingRecord));
    };

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);
        const payload = {
            employee_id: employeeId,
            qualification_name: values.qualification_name,
            exam_date: values.exam_date,
            result: values.result,
            notes: values.notes || null,
        };
        const result = isEdit
            ? await updateExamHistoryAction(existingRecord.id, payload)
            : await createExamHistoryAction(payload);
        setIsSubmitting(false);

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        toast.success(isEdit ? "受験履歴を更新しました" : "受験履歴を登録しました");
        setOpen(false);
        form.reset(toFormValues(existingRecord));
        onSuccess?.();
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={
                    isEdit ? (
                        <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label="受験履歴を編集">
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                    ) : (
                        <Button size="sm"><Plus className="mr-2 h-4 w-4" />受験履歴を追加</Button>
                    )
                }
            />
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "受験履歴の編集" : "受験履歴の登録"}</DialogTitle>
                    <DialogDescription>資格の受験日と合否を記録します。</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="qualification_name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>資格名 *</FormLabel>
                                <FormControl><Input placeholder="例: 消防設備士乙種6類" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="exam_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>受験日 *</FormLabel>
                                    <FormControl><DatePickerField value={field.value} onChange={field.onChange} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="result" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>結果 *</FormLabel>
                                    <Select onValueChange={(val: string | null) => field.onChange(val ?? "合格")} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="合格">合格</SelectItem>
                                            <SelectItem value="不合格">不合格</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                {isEdit ? "保存する" : "登録する"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
