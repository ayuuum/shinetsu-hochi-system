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
import { createVehicleAccidentAction } from "@/app/actions/admin-record-actions";

const formSchema = z.object({
    accident_date: z.string().min(1, "事故日は必須です"),
    description: z.string().min(1, "内容は必須です"),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddVehicleAccidentModalProps {
    vehicleId: string;
    onSuccess?: () => void;
}

export function AddVehicleAccidentModal({ vehicleId, onSuccess }: AddVehicleAccidentModalProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { accident_date: "", description: "", notes: "" },
    });

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) form.reset();
    };

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);
        const result = await createVehicleAccidentAction({
            vehicle_id: vehicleId,
            accident_date: values.accident_date,
            description: values.description,
            notes: values.notes || null,
        });
        setIsSubmitting(false);

        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("事故記録を登録しました");
            setOpen(false);
            form.reset();
            onSuccess?.();
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={<Button size="sm" variant="destructive"><Plus className="mr-2 h-4 w-4" />事故記録を追加</Button>}
            />
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>事故記録の登録</DialogTitle>
                    <DialogDescription>事故の日付・状況を記録します。</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="accident_date" render={({ field }) => (
                            <FormItem>
                                <FormLabel>事故日 *</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>事故内容 *</FormLabel>
                                <FormControl><Input placeholder="例: 駐車場にて接触事故" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem>
                                <FormLabel>備考</FormLabel>
                                <FormControl><Input placeholder="対応状況など" {...field} /></FormControl>
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
