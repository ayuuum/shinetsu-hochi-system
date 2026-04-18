"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createLifeInsuranceAction, updateLifeInsuranceAction } from "@/app/actions/admin-record-actions";
import { lifeInsuranceSchema, type LifeInsuranceValues } from "@/lib/validation/insurance";
import { Tables } from "@/types/supabase";

interface AddLifeInsuranceModalProps {
    employeeId: string;
    existingRecord?: Tables<"employee_life_insurances">;
    onSuccess?: () => void;
}

function applyLifeInsuranceFieldErrors(
    form: ReturnType<typeof useForm<LifeInsuranceValues>>,
    fieldErrors: Partial<Record<keyof LifeInsuranceValues, string>>
) {
    for (const [field, message] of Object.entries(fieldErrors) as [keyof LifeInsuranceValues, string | undefined][]) {
        if (message) {
            form.setError(field, { message });
        }
    }
}

export function AddLifeInsuranceModal({ employeeId, existingRecord, onSuccess }: AddLifeInsuranceModalProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEdit = !!existingRecord;

    const form = useForm<LifeInsuranceValues>({
        resolver: zodResolver(lifeInsuranceSchema),
        defaultValues: {
            employee_id: employeeId,
            insurance_name: existingRecord?.insurance_name || "",
            insurance_company: existingRecord?.insurance_company || "",
            agency: existingRecord?.agency || "",
            start_date: existingRecord?.start_date || "",
            maturity_date: existingRecord?.maturity_date || "",
            peak_date: existingRecord?.peak_date || "",
            payout_ratio: existingRecord?.payout_ratio ? existingRecord.payout_ratio.toString() : "",
            notes: existingRecord?.notes || "",
        },
    });

    async function submitData(data: LifeInsuranceValues, continuous: boolean) {
        setIsSubmitting(true);
        try {
            const result = isEdit 
                ? await updateLifeInsuranceAction(existingRecord!.id, data)
                : await createLifeInsuranceAction(data);
                
            if (result.success) {
                toast.success(isEdit ? "生命保険情報を更新しました。" : "生命保険情報を登録しました。");
                if (onSuccess) onSuccess();
                
                if (continuous && !isEdit) {
                    form.reset({
                        employee_id: employeeId,
                        insurance_name: "",
                        insurance_company: data.insurance_company, // keep company
                        agency: data.agency, // keep agency
                        start_date: data.start_date, // keep start_date
                        maturity_date: "",
                        peak_date: "",
                        payout_ratio: "",
                        notes: "",
                    });
                } else {
                    setOpen(false);
                    if (!isEdit) form.reset();
                }
            } else {
                if ('fieldErrors' in result && result.fieldErrors) {
                    applyLifeInsuranceFieldErrors(form, result.fieldErrors);
                } else {
                    toast.error(result.error);
                }
            }
        } catch (error) {
            console.error("Error submitting life insurance:", error);
            toast.error("処理中にエラーが発生しました。");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={
                isEdit ? (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"><Edit className="h-4 w-4" /></Button>
                ) : (
                    <Button variant="outline" className="rounded-full shadow-sm">
                        <Plus className="mr-2 h-4 w-4" />
                        生命保険を追加
                    </Button>
                )
            } />
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "生命保険情報の編集" : "法人生命保険の追加"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "生命保険記録を編集します。" : "社員を被保険者とする法人契約の生命保険を登録します。"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="insurance_name"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>保険名（プラン名） <span className="text-destructive">*</span></FormLabel>
                                        <FormControl><Input placeholder="例: 長期平準定期保険" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="insurance_company"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>保険会社 <span className="text-destructive">*</span></FormLabel>
                                        <FormControl><Input placeholder="例: 日本生命" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="agency"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>代理店</FormLabel>
                                        <FormControl><Input placeholder="例: ABC保険代理店" {...field} value={field.value || ""} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="start_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>加入日 <span className="text-destructive">*</span></FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="maturity_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>満期日 <span className="text-destructive">*</span></FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="peak_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>返戻金ピーク日</FormLabel>
                                        <FormControl><Input type="date" {...field} value={field.value || ""} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="payout_ratio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>予想返戻率 (%)</FormLabel>
                                        <FormControl><Input type="number" step="0.1" placeholder="例: 85.5" {...field} value={field.value || ""} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>備考・特記事項</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="解約時の注意点や特約など" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2 mt-4 pt-4 border-t border-border/50">
                        {!isEdit && (
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="lg" 
                                className="w-full sm:w-auto"
                                disabled={isSubmitting}
                                onClick={form.handleSubmit((d) => submitData(d, true))}
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "保存して次を追加"}
                            </Button>
                        )}
                        <Button 
                            type="button"
                            onClick={form.handleSubmit((d) => submitData(d, false))}
                            size="lg" 
                            className="w-full sm:w-auto sm:ml-auto shadow-md hover:shadow-lg transition-shadow"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isEdit ? "更新を保存" : "保険を登録"}
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
