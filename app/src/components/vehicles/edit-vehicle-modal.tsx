"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { toast } from "sonner";
import { Tables } from "@/types/supabase";
import { updateVehicleAction } from "@/app/actions/admin-record-actions";
import { toVehicleFormValues, vehicleSchema, type VehicleValues } from "@/lib/validation/vehicle";

interface EditVehicleModalProps {
    vehicle: Tables<"vehicles">;
    employees: { id: string; name: string }[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditVehicleModal({ vehicle, employees, open, onOpenChange }: EditVehicleModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<VehicleValues>({
        resolver: zodResolver(vehicleSchema),
        defaultValues: toVehicleFormValues(vehicle),
    });
    const employeeOptions = employees.map((employee) => ({
        value: employee.id,
        label: employee.name,
    }));

    useEffect(() => {
        if (open) {
            form.reset(toVehicleFormValues(vehicle));
        }
    }, [open, vehicle, form]);

    async function onSubmit(values: VehicleValues) {
        setIsSubmitting(true);
        const result = await updateVehicleAction(vehicle.id, values);
        setIsSubmitting(false);

        if (!result.success) {
            if (result.fieldErrors) {
                for (const [field, message] of Object.entries(result.fieldErrors)) {
                    if (!message) continue;
                    form.setError(field as keyof VehicleValues, { type: "server", message });
                }
            }
            toast.error(result.error);
            return;
        }

        toast.success("車両情報を更新しました");
        onOpenChange(false);
        router.refresh();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>車両情報の編集</DialogTitle>
                    <DialogDescription>{vehicle.plate_number}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="plate_number" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ナンバー *</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="vehicle_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>車両名・型式</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="primary_user_id" render={({ field }) => (
                            <FormItem>
                                <FormLabel>主使用者</FormLabel>
                                <Select items={employeeOptions} onValueChange={field.onChange} value={field.value}>
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
