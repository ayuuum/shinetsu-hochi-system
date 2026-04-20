"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Loader2, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Tables } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    createEmployeeFamilyAction,
    deleteEmployeeFamilyAction,
    updateEmployeeFamilyAction,
} from "@/app/actions/admin-record-actions";
import {
    employeeFamilySchema,
    toEmployeeFamilyFormValues,
    type EmployeeFamilyValues,
} from "@/lib/validation/employee-family";

interface AddFamilyModalProps {
    employeeId: string;
    existingRecord?: Tables<"employee_family">;
    onSuccess?: () => void;
}

function applyFieldErrors(
    form: ReturnType<typeof useForm<EmployeeFamilyValues>>,
    fieldErrors: Partial<Record<keyof EmployeeFamilyValues, string>>
) {
    for (const [field, message] of Object.entries(fieldErrors) as [keyof EmployeeFamilyValues, string | undefined][]) {
        if (message) {
            form.setError(field, { message });
        }
    }
}

export function AddFamilyModal({ employeeId, existingRecord, onSuccess }: AddFamilyModalProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const isEdit = !!existingRecord;

    const form = useForm<EmployeeFamilyValues>({
        resolver: zodResolver(employeeFamilySchema),
        defaultValues: existingRecord
            ? toEmployeeFamilyFormValues(existingRecord)
            : {
                employee_id: employeeId,
                name: "",
                relationship: "",
                birth_date: "",
                is_dependent: false,
                has_disability: false,
                is_emergency_contact: false,
                address: "",
                phone_number: "",
                blood_type: "",
            },
    });

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) {
            form.reset(existingRecord ? toEmployeeFamilyFormValues(existingRecord) : {
                employee_id: employeeId,
                name: "",
                relationship: "",
                birth_date: "",
                is_dependent: false,
                has_disability: false,
                is_emergency_contact: false,
                address: "",
                phone_number: "",
                blood_type: "",
            });
        }
    };

    const submit = async (values: EmployeeFamilyValues) => {
        setIsSubmitting(true);
        const result = isEdit
            ? await updateEmployeeFamilyAction(existingRecord.id, values)
            : await createEmployeeFamilyAction(values);
        setIsSubmitting(false);

        if (!result.success) {
            if (result.fieldErrors) {
                applyFieldErrors(form, result.fieldErrors);
            }
            toast.error(result.error);
            return;
        }

        toast.success(isEdit ? "家族情報を更新しました" : "家族情報を追加しました");
        setOpen(false);
        onSuccess?.();
    };

    const handleDelete = async () => {
        if (!existingRecord) return;
        setIsDeleting(true);
        const result = await deleteEmployeeFamilyAction(existingRecord.id);
        setIsDeleting(false);

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        toast.success("家族情報を削除しました");
        setOpen(false);
        onSuccess?.();
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger render={
                isEdit ? (
                    <Button variant="outline" size="sm" className="h-10 px-3">
                        <Edit className="mr-2 h-4 w-4" />
                        編集
                    </Button>
                ) : (
                    <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        家族情報を追加
                    </Button>
                )
            } />
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        {isEdit ? "家族情報の編集" : "家族情報の追加"}
                    </DialogTitle>
                    <DialogDescription>家族情報と緊急連絡先を管理します。</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>氏名 *</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="relationship" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>続柄</FormLabel>
                                    <FormControl><Input placeholder="配偶者、子 など" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="birth_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>生年月日</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="blood_type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>血液型</FormLabel>
                                    <FormControl><Input placeholder="A型" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="phone_number" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>電話番号</FormLabel>
                                    <FormControl><Input type="tel" inputMode="tel" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="address" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>住所</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid gap-3 rounded-xl border border-border/50 bg-muted/20 p-4 sm:grid-cols-3">
                            <FormField control={form.control} name="is_emergency_contact" render={({ field }) => (
                                <FormItem className="flex items-center gap-3 space-y-0">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} /></FormControl>
                                    <FormLabel>緊急連絡先</FormLabel>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="is_dependent" render={({ field }) => (
                                <FormItem className="flex items-center gap-3 space-y-0">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} /></FormControl>
                                    <FormLabel>扶養対象</FormLabel>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="has_disability" render={({ field }) => (
                                <FormItem className="flex items-center gap-3 space-y-0">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} /></FormControl>
                                    <FormLabel>障がいあり</FormLabel>
                                </FormItem>
                            )} />
                        </div>

                        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between gap-2">
                            {isEdit ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="sm:mr-auto text-destructive"
                                    onClick={handleDelete}
                                    disabled={isSubmitting || isDeleting}
                                >
                                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                    削除
                                </Button>
                            ) : <div />}
                            <div className="flex flex-col-reverse sm:flex-row gap-2">
                                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting || isDeleting}>
                                    キャンセル
                                </Button>
                                <Button type="submit" disabled={isSubmitting || isDeleting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isEdit ? "更新する" : "追加する"}
                                </Button>
                            </div>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
