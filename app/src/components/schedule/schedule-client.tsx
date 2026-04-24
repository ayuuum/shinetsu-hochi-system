"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Tables } from "@/types/supabase";
import { Calendar, CalendarDayButton } from "@/components/ui/calendar";
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
import { Plus, Loader2, Pencil, Trash2, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import {
    createAnnualScheduleAction,
    updateAnnualScheduleAction,
    deleteAnnualScheduleAction,
} from "@/app/actions/admin-record-actions";
import type { DayButton } from "react-day-picker";

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
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [viewMonth, setViewMonth] = useState<Date>(() => {
        const now = new Date();
        const fiscalStart = new Date(fiscalYear, 3, 1);
        const fiscalEnd = new Date(fiscalYear + 1, 2, 31);
        return now >= fiscalStart && now <= fiscalEnd ? new Date(now.getFullYear(), now.getMonth(), 1) : fiscalStart;
    });

    const schedulesByDate = useMemo(() => {
        const map = new Map<string, Tables<"annual_schedules">[]>();
        for (const s of schedules) {
            if (s.scheduled_date) {
                const existing = map.get(s.scheduled_date) ?? [];
                existing.push(s);
                map.set(s.scheduled_date, existing);
            }
        }
        return map;
    }, [schedules]);

    const eventDates = useMemo(() =>
        schedules
            .filter(s => s.scheduled_date)
            .map(s => new Date(s.scheduled_date + "T00:00:00")),
        [schedules]
    );

    const selectedDateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
    const scheduledItems = selectedDateStr
        ? (schedulesByDate.get(selectedDateStr) ?? [])
        : schedules.filter(s => s.scheduled_date).sort((a, b) => a.scheduled_date!.localeCompare(b.scheduled_date!));
    const unscheduledItems = selectedDateStr ? [] : schedules.filter(s => !s.scheduled_date);

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

    const totalItems = scheduledItems.length + unscheduledItems.length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => navigateYear(-1)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
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

            {/* Calendar + Events */}
            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
                {/* Calendar */}
                <Card className="border-border/50 self-start">
                    <CardContent className="p-3">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            month={viewMonth}
                            onMonthChange={setViewMonth}
                            locale={ja}
                            className="w-full [--cell-size:--spacing(9)]"
                            components={{
                                DayButton: ({ day, modifiers, locale: loc, children, ...rest }: React.ComponentProps<typeof DayButton> & { locale?: typeof ja }) => {
                                    const hasEvent = schedulesByDate.has(format(day.date, "yyyy-MM-dd"));
                                    return (
                                        <CalendarDayButton day={day} modifiers={modifiers} locale={loc} {...rest}>
                                            {children}
                                            {hasEvent && <span className="size-1.5 shrink-0 rounded-full bg-primary/70" />}
                                        </CalendarDayButton>
                                    );
                                },
                            }}
                        />
                    </CardContent>
                </Card>

                {/* Event list */}
                <Card className="border-border/50">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                                {selectedDate
                                    ? format(selectedDate, "M月d日（E）", { locale: ja })
                                    : `${fiscalYear}年度 全スケジュール`}
                            </CardTitle>
                            {selectedDate && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedDate(undefined)}
                                    className="text-xs text-muted-foreground h-7 px-2"
                                >
                                    すべて表示
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {totalItems === 0 ? (
                            <div className="py-12 text-center text-sm text-muted-foreground">
                                {selectedDate
                                    ? "この日のスケジュールはありません"
                                    : `${fiscalYear}年度のスケジュールが登録されていません`}
                                {!selectedDate && isAdmin && (
                                    <div>
                                        <Button variant="outline" size="sm" className="mt-4" onClick={() => setAddOpen(true)}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            最初のスケジュールを追加
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="-mx-6">
                                {scheduledItems.map((record) => (
                                    <ScheduleRow
                                        key={record.id}
                                        record={record}
                                        showDate={!selectedDate}
                                        isAdmin={isAdmin}
                                        onEdit={setEditingRecord}
                                        onDelete={setDeletingId}
                                    />
                                ))}
                                {unscheduledItems.length > 0 && (
                                    <>
                                        {scheduledItems.length > 0 && (
                                            <div className="px-6 py-2 border-b border-border/40">
                                                <span className="text-xs font-medium text-muted-foreground">日程未定</span>
                                            </div>
                                        )}
                                        {unscheduledItems.map((record) => (
                                            <ScheduleRow
                                                key={record.id}
                                                record={record}
                                                showDate={false}
                                                isAdmin={isAdmin}
                                                onEdit={setEditingRecord}
                                                onDelete={setDeletingId}
                                            />
                                        ))}
                                    </>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

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

function ScheduleRow({
    record,
    showDate,
    isAdmin,
    onEdit,
    onDelete,
}: {
    record: Tables<"annual_schedules">;
    showDate: boolean;
    isAdmin: boolean;
    onEdit: (r: Tables<"annual_schedules">) => void;
    onDelete: (id: string) => void;
}) {
    return (
        <div className="group flex items-start gap-3 border-b border-border/40 px-6 py-3 last:border-0 hover:bg-muted/40 transition-colors duration-150">
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    {showDate && record.scheduled_date && (
                        <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                            {format(new Date(record.scheduled_date + "T00:00:00"), "M/d（E）", { locale: ja })}
                        </span>
                    )}
                    <p className="text-sm font-semibold">{record.title}</p>
                </div>
                {record.description && (
                    <p className="mt-0.5 text-xs text-muted-foreground whitespace-pre-wrap">{record.description}</p>
                )}
            </div>
            {isAdmin && (
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(record)}
                        className="h-7 w-7 p-0"
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(record.id)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )}
        </div>
    );
}
