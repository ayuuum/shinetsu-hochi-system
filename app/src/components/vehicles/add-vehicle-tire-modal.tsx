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
import { createVehicleTireAction } from "@/app/actions/admin-record-actions";

const formSchema = z.object({
    purchase_date: z.string().optional(),
    manufacture_year: z.string().optional(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddVehicleTireModalProps {
    vehicleId: string;
    onSuccess?: () => void;
}

export function AddVehicleTireModal({ vehicleId, onSuccess }: AddVehicleTireModalProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: { purchase_date: "", manufacture_year: "", notes: "" },
    });

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) form.reset();
    };

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);
        const result = await createVehicleTireAction({
            vehicle_id: vehicleId,
            purchase_date: values.purchase_date || null,
            manufacture_year: values.manufacture_year ? parseInt(values.manufacture_year) : null,
            notes: values.notes || null,
        });
        setIsSubmitting(false);

        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("タイヤ情報を登録しました");
            setOpen(false);
            form.reset();
            onSuccess?.();
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={<Button size="sm"><Plus className="mr-2 h-4 w-4" />タイヤを追加</Button>}
            />
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle>タイヤ情報の登録</DialogTitle>
                    <DialogDescription>タイヤの購入日・製造年を登録します。</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="purchase_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>購入日</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="manufacture_year" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>製造年</FormLabel>
                                    <FormControl><Input type="number" placeholder="例: 2023" {...field} /></FormControl>
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
