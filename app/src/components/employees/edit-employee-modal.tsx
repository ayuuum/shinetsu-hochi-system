"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { UnsavedChangesDialog } from "@/components/shared/unsaved-changes-dialog";
import { updateEmployeeAction } from "@/app/actions/admin-record-actions";
import {
    employeeUpdateSchema,
    toEmployeeUpdateFormValues,
    type EmployeeUpdateValues,
} from "@/lib/validation/employee";
import { supabase } from "@/lib/supabase";

interface EditEmployeeModalProps {
    employee: Tables<"employees">;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function EditEmployeeModal({ employee, open, onOpenChange, onSuccess }: EditEmployeeModalProps) {
    const [discardOpen, setDiscardOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    const form = useForm<EmployeeUpdateValues>({
        resolver: zodResolver(employeeUpdateSchema),
        defaultValues: toEmployeeUpdateFormValues(employee),
    });
    const { isDirty } = form.formState;

    useEffect(() => {
        if (open) {
            form.reset(toEmployeeUpdateFormValues(employee));
        }
    }, [open, employee, form]);

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            onOpenChange(true);
            return;
        }

        if (isSubmitting) return;

        if (isDirty) {
            setDiscardOpen(true);
            return;
        }

        form.reset(toEmployeeUpdateFormValues(employee));
        onOpenChange(false);
    };

    const handleDiscard = () => {
        form.reset(toEmployeeUpdateFormValues(employee));
        setPhotoFile(null);
        setDiscardOpen(false);
        onOpenChange(false);
    };

    async function onSubmit(values: EmployeeUpdateValues) {
        setIsSubmitting(true);
        let uploadedPhotoPath: string | null = null;

        if (photoFile) {
            const ext = photoFile.name.split(".").pop();
            const filePath = `employee-photos/${crypto.randomUUID()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from("certificates")
                .upload(filePath, photoFile);

            if (uploadError) {
                setIsSubmitting(false);
                toast.error(`顔写真のアップロードに失敗しました: ${uploadError.message}`);
                return;
            }

            uploadedPhotoPath = filePath;
            values.photo_url = filePath;
        }

        const result = await updateEmployeeAction(employee.id, values);
        setIsSubmitting(false);

        if (!result.success) {
            if (uploadedPhotoPath) {
                await supabase.storage.from("certificates").remove([uploadedPhotoPath]);
            }
            if (result.fieldErrors) {
                for (const [field, message] of Object.entries(result.fieldErrors)) {
                    if (!message) continue;
                    form.setError(field as keyof EmployeeUpdateValues, { type: "server", message });
                }
            }
            toast.error(result.error);
            return;
        }

        toast.success("社員情報を更新しました");
        if (uploadedPhotoPath && employee.photo_url && employee.photo_url !== uploadedPhotoPath) {
            await supabase.storage.from("certificates").remove([employee.photo_url]);
        }
        form.reset(values);
        setPhotoFile(null);
        onOpenChange(false);
        onSuccess?.();
    }

    return (
        <>
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>社員情報の編集</DialogTitle>
                    <DialogDescription>{employee.name}（{employee.employee_number}）</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="employee_number" render={({ field }) => (
                            <FormItem>
                                <FormLabel>社員番号 *</FormLabel>
                                <FormControl><Input autoComplete="off" spellCheck={false} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>氏名 *</FormLabel>
                                    <FormControl><Input autoComplete="name" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="name_kana" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>フリガナ *</FormLabel>
                                    <FormControl><Input autoComplete="off" spellCheck={false} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="birth_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>生年月日 *</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="gender" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>性別</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="男性">男性</SelectItem>
                                            <SelectItem value="女性">女性</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="phone_number" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>電話番号</FormLabel>
                                    <FormControl><Input type="tel" inputMode="tel" autoComplete="tel" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>メール</FormLabel>
                                    <FormControl><Input type="email" autoComplete="email" spellCheck={false} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem>
                                <FormLabel>住所</FormLabel>
                                <FormControl><Input autoComplete="street-address" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormItem>
                            <FormLabel>顔写真</FormLabel>
                            <FormControl>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
                                />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                                新しい画像を選ぶと差し替え保存します。
                            </p>
                        </FormItem>

                        <div className="grid grid-cols-3 gap-4">
                            <FormField control={form.control} name="hire_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>入社日</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="termination_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>退職日</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="branch" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>拠点</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="本社">本社</SelectItem>
                                            <SelectItem value="塩尻">塩尻営業所</SelectItem>
                                            <SelectItem value="白馬">白馬営業所</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="employment_type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>雇用形態</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="正社員">正社員</SelectItem>
                                            <SelectItem value="契約社員">契約社員</SelectItem>
                                            <SelectItem value="パート">パート</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="job_title" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>職種</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="position" render={({ field }) => (
                            <FormItem>
                                <FormLabel>役職</FormLabel>
                                <FormControl><Input placeholder="主任、課長 等" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-3 gap-4">
                            <FormField control={form.control} name="emp_insurance_no" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>雇用保険番号</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="health_insurance_no" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>健康保険番号</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="pension_no" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>年金番号</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>キャンセル</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                保存する
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
        <UnsavedChangesDialog open={discardOpen} onOpenChange={setDiscardOpen} onDiscard={handleDiscard} />
        </>
    );
}
