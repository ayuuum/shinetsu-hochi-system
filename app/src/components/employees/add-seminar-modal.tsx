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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createSeminarRecordAction } from "@/app/actions/admin-record-actions";

const formSchema = z.object({
    seminar_name: z.string().min(1, "セミナー名は必須です"),
    held_date: z.string().min(1, "開催日は必須です"),
    hours: z.string().optional(),
    organizer: z.string().optional(),
    notes: z.string().optional(),
    photo_url: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddSeminarModalProps {
    employeeId: string;
    onSuccess?: () => void;
}

export function AddSeminarModal({ employeeId, onSuccess }: AddSeminarModalProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            seminar_name: "",
            held_date: "",
            hours: "",
            organizer: "",
            notes: "",
            photo_url: "",
        },
    });

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) form.reset();
    };

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);
        const result = await createSeminarRecordAction({
            employee_id: employeeId,
            seminar_name: values.seminar_name,
            held_date: values.held_date,
            hours: values.hours ? parseFloat(values.hours) : null,
            organizer: values.organizer || null,
            notes: values.notes || null,
            photo_url: values.photo_url || null,
        });
        setIsSubmitting(false);

        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("セミナー受講履歴を登録しました");
            setOpen(false);
            form.reset();
            onSuccess?.();
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={<Button size="sm"><Plus className="mr-2 h-4 w-4" />セミナーを追加</Button>}
            />
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>セミナー受講履歴の登録</DialogTitle>
                    <DialogDescription>受講したセミナーの情報を入力してください。</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="seminar_name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>セミナー名 *</FormLabel>
                                <FormControl><Input placeholder="例: 安全衛生管理研修" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="held_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>開催日 *</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="hours" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>時間数</FormLabel>
                                    <FormControl><Input type="number" step="0.5" placeholder="例: 3.5" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="organizer" render={({ field }) => (
                            <FormItem>
                                <FormLabel>主催者・機関</FormLabel>
                                <FormControl><Input placeholder="例: 長野県消防設備協会" {...field} /></FormControl>
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

                        <FormField control={form.control} name="photo_url" render={({ field }) => (
                            <FormItem>
                                <FormLabel>写真URL</FormLabel>
                                <FormControl><Input placeholder="https://..." {...field} /></FormControl>
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
