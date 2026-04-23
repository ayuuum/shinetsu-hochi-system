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
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createExamHistoryAction } from "@/app/actions/admin-record-actions";

const formSchema = z.object({
    qualification_name: z.string().min(1, "資格名は必須です"),
    exam_date: z.string().min(1, "受験日は必須です"),
    result: z.enum(["合格", "不合格"]),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddExamHistoryModalProps {
    employeeId: string;
    onSuccess?: () => void;
}

export function AddExamHistoryModal({ employeeId, onSuccess }: AddExamHistoryModalProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            qualification_name: "",
            exam_date: "",
            result: "合格",
            notes: "",
        },
    });

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) form.reset();
    };

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);
        const result = await createExamHistoryAction({
            employee_id: employeeId,
            qualification_name: values.qualification_name,
            exam_date: values.exam_date,
            result: values.result,
            notes: values.notes || null,
        });
        setIsSubmitting(false);

        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("受験履歴を登録しました");
            setOpen(false);
            form.reset();
            onSuccess?.();
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={<Button size="sm"><Plus className="mr-2 h-4 w-4" />受験履歴を追加</Button>}
            />
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>受験履歴の登録</DialogTitle>
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
                                    <FormControl><Input type="date" {...field} /></FormControl>
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
                                登録する
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
