"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
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
import { DatePickerField } from "@/components/shared/date-picker-field";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { calculateFireDefenseExpiry } from "@/lib/qualification-logic";
import { addTrainingHistoryAction } from "@/app/actions/admin-record-actions";

const formSchema = z.object({
    training_date: z.string().min(1, "受講日は必須です"),
    training_type: z.string().min(1, "種別を選択してください"),
    provider: z.string().optional(),
    certificate_number: z.string().optional(),
    next_due_date: z.string().optional(),
    notes: z.string().optional(),
    photo_url: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddTrainingModalProps {
    employeeQualificationId: string;
    qualificationName?: string;
}

function suggestNextDueDate(qualificationName: string | undefined, trainingDate: string, trainingType: string) {
    if (!qualificationName?.includes("消防設備士") || !trainingDate) {
        return "";
    }
    const isInitial = trainingType === "初回";
    return format(calculateFireDefenseExpiry(trainingDate, isInitial), "yyyy-MM-dd");
}

export function AddTrainingModal({ employeeQualificationId, qualificationName }: AddTrainingModalProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            training_date: "",
            training_type: "初回",
            provider: "",
            certificate_number: "",
            next_due_date: "",
            notes: "",
            photo_url: "",
        },
    });

    const applySuggestedNextDueDate = (trainingDate: string, trainingType: string) => {
        const suggested = suggestNextDueDate(qualificationName, trainingDate, trainingType);
        if (suggested) {
            form.setValue("next_due_date", suggested);
        }
    };

    const resetForm = () => {
        form.reset({
            training_date: "",
            training_type: "初回",
            provider: "",
            certificate_number: "",
            next_due_date: "",
            notes: "",
            photo_url: "",
        });
    };

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) {
            resetForm();
        }
    };

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);

        const result = await addTrainingHistoryAction({
            employeeQualificationId,
            trainingDate: values.training_date,
            trainingType: values.training_type,
            provider: values.provider,
            certificateNumber: values.certificate_number,
            nextDueDate: values.next_due_date,
            notes: values.notes,
            photoUrl: values.photo_url,
        });

        setIsSubmitting(false);

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        toast.success(
            result.expiryUpdated
                ? "講習履歴を登録し、資格の有効期限を自動更新しました"
                : "講習履歴を登録しました",
        );
        setOpen(false);
        resetForm();
        router.refresh();
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={<Button><Plus className="mr-2 h-4 w-4" />講習履歴を追加</Button>}
            />
            <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>講習履歴の登録</DialogTitle>
                    <DialogDescription>
                        受講した講習の日時・内容を入力してください。次回期限を入力すると、資格の有効期限も自動更新されます。
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="training_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>受講日 *</FormLabel>
                                    <FormControl>
                                        <DatePickerField
                                            value={field.value}
                                            onChange={(value) => {
                                                field.onChange(value);
                                                applySuggestedNextDueDate(value, form.getValues("training_type"));
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="training_type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>種別 *</FormLabel>
                                    <Select
                                        onValueChange={(value) => {
                                            const nextType = value || "初回";
                                            field.onChange(nextType);
                                            applySuggestedNextDueDate(form.getValues("training_date"), nextType);
                                        }}
                                        value={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="初回">初回</SelectItem>
                                            <SelectItem value="再講習">再講習</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="provider" render={({ field }) => (
                            <FormItem>
                                <FormLabel>実施機関</FormLabel>
                                <FormControl><Input placeholder="例: 長野県消防設備協会" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="certificate_number" render={({ field }) => (
                            <FormItem>
                                <FormLabel>修了証番号</FormLabel>
                                <FormControl><Input placeholder="例: 第12345号" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="next_due_date" render={({ field }) => (
                            <FormItem>
                                <FormLabel>次回期限</FormLabel>
                                <FormControl><DatePickerField value={field.value} onChange={field.onChange} /></FormControl>
                                <p className="text-xs text-muted-foreground">
                                    入力すると、この資格の有効期限が自動で同じ日付に更新されます。
                                </p>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem>
                                <FormLabel>備考</FormLabel>
                                <FormControl><Input placeholder="特記事項" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <FormField control={form.control} name="photo_url" render={({ field }) => (
                            <FormItem>
                                <FormLabel>写真URL</FormLabel>
                                <FormControl><Input placeholder="https://..." {...field} /></FormControl>
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
