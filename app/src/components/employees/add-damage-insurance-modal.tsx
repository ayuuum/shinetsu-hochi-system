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
import { createDamageInsuranceAction, updateDamageInsuranceAction } from "@/app/actions/admin-record-actions";
import { damageInsuranceSchema, type DamageInsuranceValues } from "@/lib/validation/insurance";
import { Tables } from "@/types/supabase";

interface AddDamageInsuranceModalProps {
    employeeId: string;
    existingRecord?: Tables<"employee_damage_insurances">;
    onSuccess?: () => void;
}

function applyDamageInsuranceFieldErrors(
    form: ReturnType<typeof useForm<DamageInsuranceValues>>,
    fieldErrors: Partial<Record<keyof DamageInsuranceValues, string>>
) {
    for (const [field, message] of Object.entries(fieldErrors) as [keyof DamageInsuranceValues, string | undefined][]) {
        if (message) {
            form.setError(field, { message });
        }
    }
}

export function AddDamageInsuranceModal({ employeeId, existingRecord, onSuccess }: AddDamageInsuranceModalProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEdit = !!existingRecord;

    const form = useForm<DamageInsuranceValues>({
        resolver: zodResolver(damageInsuranceSchema),
        defaultValues: {
            employee_id: employeeId,
            insurance_type: existingRecord?.insurance_type || "",
            insurance_name: existingRecord?.insurance_name || "",
            insurance_company: existingRecord?.insurance_company || "",
            agency: existingRecord?.agency || "",
            renewal_date: existingRecord?.renewal_date || "",
            coverage_details: existingRecord?.coverage_details || "",
            notes: existingRecord?.notes || "",
        },
    });

    async function submitData(data: DamageInsuranceValues, continuous: boolean) {
        setIsSubmitting(true);
        try {
            const result = isEdit 
                ? await updateDamageInsuranceAction(existingRecord!.id, data)
                : await createDamageInsuranceAction(data);
                
            if (result.success) {
                toast.success(isEdit ? "損害保険情報を更新しました。" : "損害保険情報を登録しました。");
                if (onSuccess) onSuccess();
                
                if (continuous && !isEdit) {
                    form.reset({
                        employee_id: employeeId,
                        insurance_type: data.insurance_type, // keep type
                        insurance_name: "",
                        insurance_company: data.insurance_company, // keep company
                        agency: data.agency, // keep agency
                        renewal_date: "",
                        coverage_details: "",
                        notes: "",
                    });
                } else {
                    setOpen(false);
                    if (!isEdit) form.reset();
                }
            } else {
                if ('fieldErrors' in result && result.fieldErrors) {
                    applyDamageInsuranceFieldErrors(form, result.fieldErrors);
                } else {
                    toast.error(result.error);
                }
            }
        } catch (error) {
            console.error("Error submitting damage insurance:", error);
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
                        損害保険を追加
                    </Button>
                )
            } />
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "損害保険情報の編集" : "法人損害保険の追加"}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? "損害保険記録を編集します。" : "業務災害補償など、法人契約の損害保険を登録します。"}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="insurance_type"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>保険種類 <span className="text-destructive">*</span></FormLabel>
                                        <FormControl><Input placeholder="例: 業務災害総合保険" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="insurance_name"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>保険名（プラン名） <span className="text-destructive">*</span></FormLabel>
                                        <FormControl><Input placeholder="例: 超Tプロテクション" {...field} /></FormControl>
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
                                        <FormControl><Input placeholder="例: 東京海上日動" {...field} /></FormControl>
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
                                        <FormControl><Input placeholder="例: DEFエージェンシー" {...field} value={field.value || ""} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="renewal_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>更改日（更新日） <span className="text-destructive">*</span></FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="coverage_details"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>条件・補償内容</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="死亡・後遺障害金額、入院日額、休業補償など" {...field} value={field.value || ""} />
                                        </FormControl>
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
                                            <Textarea placeholder="その他特約や注意点" {...field} value={field.value || ""} />
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
