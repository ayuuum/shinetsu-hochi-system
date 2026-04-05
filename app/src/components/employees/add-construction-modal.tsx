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
import { Plus, HardHat, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createProjectAction } from "@/app/actions/admin-record-actions";
import { projectSchema, type ProjectValues } from "@/lib/validation/project";

interface AddConstructionModalProps {
    employeeId: string;
    onSuccess?: () => void;
}

export function AddConstructionModal({ employeeId, onSuccess }: AddConstructionModalProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<ProjectValues>({
        resolver: zodResolver(projectSchema),
        defaultValues: {
            construction_name: "",
            category: "消防設備工事",
            construction_date: "",
            employee_id: employeeId,
            role: "",
            location: "",
            notes: "",
        },
    });

    async function onSubmit(values: ProjectValues) {
        setIsSubmitting(true);
        const result = await createProjectAction({
            ...values,
            employee_id: employeeId,
        });
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

        toast.success("施工実績を登録しました");
        setOpen(false);
        form.reset({
            construction_name: "",
            category: "消防設備工事",
            construction_date: "",
            employee_id: employeeId,
            role: "",
            location: "",
            notes: "",
        });
        onSuccess?.();
        router.refresh();
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={<Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" />実績追加</Button>}
            />
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <HardHat className="h-5 w-5 text-primary" />
                        施工実績の追加
                    </DialogTitle>
                    <DialogDescription>施工・点検の実績情報を入力してください。</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="construction_name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>物件名 *</FormLabel>
                                <FormControl><Input placeholder="○○小学校、△△病院 等" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="construction_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>施工日 *</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="category" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>設備種別</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="消防設備工事">消防設備工事</SelectItem>
                                            <SelectItem value="電気設備工事">電気設備工事</SelectItem>
                                            <SelectItem value="空調設備工事">空調設備工事</SelectItem>
                                            <SelectItem value="その他">その他</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="role" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>担当役割</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="現場責任者">現場責任者</SelectItem>
                                            <SelectItem value="作業員">作業員</SelectItem>
                                            <SelectItem value="監督">監督</SelectItem>
                                            <SelectItem value="点検員">点検員</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="location" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>所在地</FormLabel>
                                    <FormControl><Input placeholder="長野県松本市..." {...field} /></FormControl>
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
