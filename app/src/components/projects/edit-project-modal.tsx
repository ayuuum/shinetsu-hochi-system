"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, Building } from "lucide-react";
import { toast } from "sonner";
import { updateProjectAction } from "@/app/actions/admin-record-actions";
import { projectSchema, type ProjectValues, toProjectFormValues, EQUIPMENT_OPTIONS, WORK_TYPE_OPTIONS } from "@/lib/validation/project";
import { Tables } from "@/types/supabase";

type Employee = { id: string; name: string };

export function EditProjectModal({
    record,
    employees,
    open,
    onOpenChange,
}: {
    record: Tables<"construction_records">;
    employees: Employee[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<ProjectValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: toProjectFormValues(record),
    });

    useEffect(() => {
        if (open) {
            form.reset(toProjectFormValues(record));
        }
    }, [open, record, form]);

    async function onSubmit(values: ProjectValues) {
        setIsSubmitting(true);
        const result = await updateProjectAction(record.id, values);
        setIsSubmitting(false);

        if (!result.success) {
            if (result.fieldErrors) {
                for (const [field, message] of Object.entries(result.fieldErrors)) {
                    if (!message) continue;
                    form.setError(field as keyof ProjectValues, { type: "server", message });
                }
            }
            toast.error(result.error);
            return;
        }

        toast.success("施工記録を更新しました");
        onOpenChange(false);
        router.refresh();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2"><Building className="h-5 w-5 text-primary" /> 施工記録の編集</DialogTitle>
                    <DialogDescription>
                        施工実績の内容を修正します。
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        <div className="space-y-4">
                            <FormField control={form.control} name="construction_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>物件名・工事名 <span className="text-red-500">*</span></FormLabel>
                                    <FormControl><Input placeholder="例：〇〇ビル消防設備更新工事" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
                            <FormField control={form.control} name="client_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>発注者 <span className="text-red-500">*</span></FormLabel>
                                    <FormControl><Input placeholder="例：株式会社△△" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="equipment_types" render={() => (
                                <FormItem>
                                    <FormLabel>設備種別 (複数選択可) <span className="text-red-500">*</span></FormLabel>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border rounded-xl p-3 bg-slate-50/50 dark:bg-slate-900/50">
                                        {EQUIPMENT_OPTIONS.map((item) => (
                                            <FormField key={item} control={form.control} name="equipment_types" render={({ field }) => {
                                                return (
                                                    <FormItem key={item} className="flex flex-row items-start space-x-2 space-y-0 p-2 border rounded-md bg-card shadow-sm hover:border-primary/50 transition-colors cursor-pointer">
                                                        <FormControl>
                                                            <Checkbox
                                                                checked={field.value?.includes(item)}
                                                                onCheckedChange={(checked) => {
                                                                    return checked
                                                                        ? field.onChange([...field.value, item])
                                                                        : field.onChange(field.value?.filter((value) => value !== item))
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormLabel className="font-medium text-sm cursor-pointer">{item}</FormLabel>
                                                    </FormItem>
                                                )
                                            }} />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="grid sm:grid-cols-2 gap-4">
                                <FormField control={form.control} name="work_type" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>施工内容 <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full text-left font-normal"><SelectValue placeholder="選択してください" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {WORK_TYPE_OPTIONS.map((cat) => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                
                                <FormField control={form.control} name="contract_amount" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>契約金額（税抜）</FormLabel>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">¥</span>
                                            <FormControl><Input type="number" step="1" className="pl-7" placeholder="例: 1500000" {...field} /></FormControl>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <FormField control={form.control} name="construction_date" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>着工日 <span className="text-red-500">*</span></FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="end_date" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>完工日</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-4">
                                <FormField control={form.control} name="employee_id" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>担当社員 <span className="text-red-500">*</span></FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full text-left font-normal">
                                                    <span className="truncate flex-1 text-left">
                                                        {field.value ? employees.find(e => e.id === field.value)?.name || field.value : <span className="text-muted-foreground">担当者を選択</span>}
                                                    </span>
                                                </SelectTrigger>
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
                                <FormField control={form.control} name="role" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>担当役割</FormLabel>
                                        <FormControl><Input placeholder="例：現場責任者" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <FormField control={form.control} name="location" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>物件所在地</FormLabel>
                                    <FormControl><Input placeholder="例：長野県松本市..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="notes" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>備考</FormLabel>
                                    <FormControl><Textarea placeholder="特記事項があれば入力してください" className="resize-none" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <DialogFooter className="pt-4 border-t gap-2">
                            <Button type="button" variant="outline" className="font-bold rounded-full" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                                キャンセル
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="font-bold rounded-full shadow-sm">
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                変更を保存
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
