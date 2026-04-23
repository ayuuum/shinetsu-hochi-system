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
import { createVehicleRepairAction } from "@/app/actions/admin-record-actions";

const formSchema = z.object({
    repair_date: z.string().min(1, "修理日は必須です"),
    description: z.string().min(1, "内容は必須です"),
    cost: z.string().optional(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddVehicleRepairModalProps {
    vehicleId: string;
    onSuccess?: () => void;
}

export function AddVehicleRepairModal({ vehicleId, onSuccess }: AddVehicleRepairModalProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { repair_date: "", description: "", cost: "", notes: "" },
    });

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) form.reset();
    };

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);
        const result = await createVehicleRepairAction({
            vehicle_id: vehicleId,
            repair_date: values.repair_date,
            description: values.description,
            cost: values.cost ? parseFloat(values.cost) : null,
            notes: values.notes || null,
        });
        setIsSubmitting(false);

        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("修理履歴を登録しました");
            setOpen(false);
            form.reset();
            onSuccess?.();
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={<Button size="sm"><Plus className="mr-2 h-4 w-4" />修理履歴を追加</Button>}
            />
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>修理履歴の登録</DialogTitle>
                    <DialogDescription>修理の日付・内容・金額を記録します。</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="repair_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>修理日 *</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="cost" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>費用（円）</FormLabel>
                                    <FormControl><Input type="number" placeholder="例: 50000" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>修理内容 *</FormLabel>
                                <FormControl><Input placeholder="例: エンジンオイル交換" {...field} /></FormControl>
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
