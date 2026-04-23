"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Tables } from "@/types/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2, Pencil, Trash2, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { formatDisplayDate } from "@/lib/date";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import {
    createAnnualScheduleAction,
    updateAnnualScheduleAction,
    deleteAnnualScheduleAction,
} from "@/app/actions/admin-record-actions";

const formSchema = z.object({
    title: z.string().min(1, "タイトルは必須です"),
    scheduled_date: z.string().optional(),
    description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ScheduleClientProps {
    schedules: Tables<"annual_schedules">[];
    fiscalYear: number;
    currentFiscalYear: number;
    isAdmin: boolean;
}

function ScheduleForm({
    defaultValues,
    fiscalYear,
    onSubmit,
    isSubmitting,
}: {
    defaultValues: FormValues;
    fiscalYear: number;
    onSubmit: (values: FormValues) => Promise<void>;
    isSubmitting: boolean;
}) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                        <FormLabel>タイトル *</FormLabel>
                        <FormControl><Input placeholder="例: 安全衛生委員会" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="scheduled_date" render={({ field }) => (
                    <FormItem>
                        <FormLabel>日付</FormLabel>
                        <FormControl><Input type="date" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                        <FormLabel>詳細・メモ</FormLabel>
                        <FormControl><Textarea placeholder="詳細を入力..." rows={3} {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <DialogFooter>
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        保存する
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    );
}

export function ScheduleClient({ schedules, fiscalYear, currentFiscalYear, isAdmin }: ScheduleClientProps) {
    const router = useRouter();
    const [addOpen, setAddOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<Tables<"annual_schedules"> | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const navigateYear = (delta: number) => {
        const params = new URLSearchParams();
        params.set("year", String(fiscalYear + delta));
        router.push(`/schedule?${params.toString()}`);
    };

    const handleCreate = async (values: FormValues) => {
        setIsSubmitting(true);
        const result = await createAnnualScheduleAction({
            fiscal_year: fiscalYear,
            title: values.title,
            scheduled_date: values.scheduled_date || null,
            description: values.description || null,
        });
        setIsSubmitting(false);

        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("スケジュールを登録しました");
            setAddOpen(false);
            router.refresh();
        }
    };

    const handleUpdate = async (values: FormValues) => {
        if (!editingRecord) return;
        setIsSubmitting(true);
        const result = await updateAnnualScheduleAction(editingRecord.id, {
            title: values.title,
            scheduled_date: values.scheduled_date || null,
            description: values.description || null,
        });
        setIsSubmitting(false);

        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("スケジュールを更新しました");
            setEditingRecord(null);
            router.refresh();
        }
    };

    const handleDelete = async (id: string) => {
        const result = await deleteAnnualScheduleAction(id);
        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("スケジュールを削除しました");
            router.refresh();
        }
        setDeletingId(null);
    };

    return (
        <div className="space-y-6">
            {/* Year navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => navigateYear(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span className="text-xl font-bold">{fiscalYear}年度</span>
                        {fiscalYear === currentFiscalYear && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary">今期</Badge>
                        )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigateYear(1)}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                {isAdmin && (
                    <Dialog open={addOpen} onOpenChange={setAddOpen}>
                        <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" />スケジュールを追加</Button>} />
                        <DialogContent className="sm:max-w-[480px]">
                            <DialogHeader>
                                <DialogTitle>スケジュールの追加</DialogTitle>
                                <DialogDescription>{fiscalYear}年度のスケジュールを追加します。</DialogDescription>
                            </DialogHeader>
                            <ScheduleForm
                                defaultValues={{ title: "", scheduled_date: "", description: "" }}
                                fiscalYear={fiscalYear}
                                onSubmit={handleCreate}
                                isSubmitting={isSubmitting}
                            />
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Schedule list */}
            {schedules.length === 0 ? (
                <Card className="bg-muted/10 border-dashed">
                    <CardContent className="py-16 text-center text-muted-foreground text-sm">
                        <p>{fiscalYear}年度のスケジュールが登録されていません。</p>
                        {isAdmin && (
                            <Button variant="outline" size="sm" className="mt-4" onClick={() => setAddOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                最初のスケジュールを追加
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {schedules.map((record) => (
                        <Card key={record.id} className="shadow-sm border-border/50">
                            <CardContent className="py-4 flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="min-w-[90px] text-center">
                                        {record.scheduled_date ? (
                                            <div className="text-sm font-bold text-primary tabular-nums">
                                                {formatDisplayDate(record.scheduled_date)}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">日程未定</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold">{record.title}</p>
                                        {record.description && (
                                            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{record.description}</p>
                                        )}
                                    </div>
                                </div>
                                {isAdmin && (
                                    <div className="flex items-center gap-1 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingRecord(record)}
                                            className="h-8 w-8 p-0"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDeletingId(record.id)}
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit dialog */}
            {editingRecord && (
                <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>スケジュールの編集</DialogTitle>
                        </DialogHeader>
                        <ScheduleForm
                            defaultValues={{
                                title: editingRecord.title,
                                scheduled_date: editingRecord.scheduled_date || "",
                                description: editingRecord.description || "",
                            }}
                            fiscalYear={fiscalYear}
                            onSubmit={handleUpdate}
                            isSubmitting={isSubmitting}
                        />
                    </DialogContent>
                </Dialog>
            )}

            <DeleteConfirmDialog
                open={!!deletingId}
                onOpenChange={(open) => !open && setDeletingId(null)}
                title="スケジュールの削除"
                description="このスケジュールを完全に削除します。復元はできません。"
                onConfirm={() => handleDelete(deletingId!)}
            />
        </div>
    );
}
