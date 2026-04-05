"use client";

import { useState } from "react";
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
import { createVehicleAction } from "@/app/actions/admin-record-actions";
import { vehicleSchema, type VehicleValues } from "@/lib/validation/vehicle";

type Employee = { id: string; name: string };

export function AddVehicleModal({ employees }: { employees: Employee[] }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<VehicleValues>({
        resolver: zodResolver(vehicleSchema),
        defaultValues: {
            plate_number: "",
            vehicle_name: "",
            primary_user_id: "",
            inspection_expiry: "",
            liability_insurance_expiry: "",
            voluntary_insurance_expiry: "",
        },
    });
    const employeeOptions = employees.map((employee) => ({
        value: employee.id,
        label: employee.name,
    }));

    async function submitData(values: VehicleValues, continuous: boolean) {
        setIsSubmitting(true);
        const result = await createVehicleAction(values);
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

        toast.success("車両を登録しました");
        if (continuous) {
            form.reset({
                plate_number: "",
                vehicle_name: "",
                primary_user_id: values.primary_user_id, // 組織の同担当者の連続登録などを考慮し残す可能性もあるがデフォで戻す
                inspection_expiry: "",
                liability_insurance_expiry: "",
                voluntary_insurance_expiry: "",
            });
        } else {
            setOpen(false);
            form.reset();
        }
        router.refresh();
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
                    <form onSubmit={form.handleSubmit((v) => submitData(v, false))} className="space-y-4">
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

                        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={form.handleSubmit((v) => submitData(v, true))} 
                                disabled={isSubmitting} 
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                保存して続けて追加
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                保存して閉じる
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
