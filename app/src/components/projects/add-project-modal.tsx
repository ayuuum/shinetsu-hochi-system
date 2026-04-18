"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResponsiveModal } from "@/components/shared/responsive-modal";
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
import { Plus, Loader2, Building } from "lucide-react";
import { toast } from "sonner";
import { createProjectAction } from "@/app/actions/admin-record-actions";
import { projectSchema, type ProjectValues, EQUIPMENT_OPTIONS, WORK_TYPE_OPTIONS } from "@/lib/validation/project";

type Employee = { id: string; name: string };

function getDefaultValues(employeeId: string = ""): ProjectValues {
    const today = new Date().toISOString().slice(0, 10);
    return {
        construction_name: "",
        client_name: "",
        category: "消防設備工事",
        equipment_types: [],
        work_type: "新設",
        contract_amount: "",
        construction_date: today,
        end_date: "",
        employee_id: employeeId,
        role: "",
        location: "",
        notes: "",
    };
}

export function AddProjectModal({ employees, initialEmployeeId }: { employees: Employee[], initialEmployeeId?: string }) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingMultiple, setIsCheckingMultiple] = useState(false);
    const router = useRouter();

    const form = useForm<ProjectValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: getDefaultValues(initialEmployeeId),
    });

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (nextOpen) {
            form.reset(getDefaultValues(initialEmployeeId));
            setIsCheckingMultiple(false);
        }
    };

    async function onSubmit(values: ProjectValues) {
        setIsSubmitting(true);
        const result = await createProjectAction(values);
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

        toast.success("施工記録を登録しました");
        if (isCheckingMultiple) {
            form.reset(getDefaultValues(initialEmployeeId));
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
            setOpen(false);
        }
        router.refresh();
    }

    return (
        <>
            <Button onClick={() => setOpen(true)} className="rounded-full shadow-sm"><Plus className="mr-2 h-4 w-4" />新規登録</Button>
            <ResponsiveModal 
                open={open} 
                onOpenChange={handleOpenChange}
                title={<span className="flex items-center gap-2"><Building className="h-5 w-5 text-primary" /> 施工記録の新規追加</span>}
                description="新しい施工実績（工事・点検）を記録します。"
            >

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
                                        <Select onValueChange={field.onChange} value={field.value} disabled={!!initialEmployeeId}>
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

                        <div className="flex-col sm:flex-row flex gap-3 pt-4 border-t mt-6">
                            <div className="flex items-center space-x-2 px-2 py-1 bg-muted/40 rounded-lg w-full sm:w-auto">
                                <Checkbox id="continue-add" checked={isCheckingMultiple} onCheckedChange={(c) => setIsCheckingMultiple(!!c)} />
                                <label htmlFor="continue-add" className="text-sm font-medium leading-none cursor-pointer">続けてもう1件登録する</label>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <Button type="button" variant="outline" className="w-full sm:w-auto font-bold rounded-full" onClick={() => setOpen(false)} disabled={isSubmitting}>
                                    キャンセル
                                </Button>
                                <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto font-bold rounded-full shadow-sm">
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {isCheckingMultiple ? "保存中..." : "登録中..."}
                                        </>
                                    ) : (
                                        <>
                                            <Building className="mr-2 h-4 w-4" />
                                            {isCheckingMultiple ? "保存して次へ" : "施工記録を登録"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </ResponsiveModal>
        </>
    );
}
