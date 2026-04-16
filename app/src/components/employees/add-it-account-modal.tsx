"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Loader2, Plus } from "lucide-react";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createItAccountAction, updateItAccountAction } from "@/app/actions/admin-record-actions";
import { employeeItAccountSchema, type EmployeeItAccountValues } from "@/lib/validation/employee-it-account";
import { Tables } from "@/types/supabase";

interface AddItAccountModalProps {
    employeeId: string;
    existingRecord?: Tables<"employee_it_accounts">;
    onSuccess?: () => void;
}

export function AddItAccountModal({ employeeId, existingRecord, onSuccess }: AddItAccountModalProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isEdit = !!existingRecord;

    const form = useForm<EmployeeItAccountValues>({
        resolver: zodResolver(employeeItAccountSchema),
        defaultValues: {
            employee_id: employeeId,
            service_name: existingRecord?.service_name ?? "",
            login_id: existingRecord?.login_id ?? "",
            notes: existingRecord?.notes ?? "",
            sort_order: existingRecord?.sort_order ?? 0,
        },
    });

    async function onSubmit(data: EmployeeItAccountValues) {
        setIsSubmitting(true);
        try {
            const result = isEdit
                ? await updateItAccountAction(existingRecord!.id, data)
                : await createItAccountAction(data);

            if (result.success) {
                toast.success(isEdit ? "IT利用情報を更新しました。" : "IT利用情報を登録しました。");
                onSuccess?.();
                setOpen(false);
                if (!isEdit) {
                    form.reset({
                        employee_id: employeeId,
                        service_name: "",
                        login_id: "",
                        notes: "",
                        sort_order: 0,
                    });
                }
            } else {
                if ("fieldErrors" in result && result.fieldErrors) {
                    Object.entries(result.fieldErrors).forEach(([field, message]) => {
                        form.setError(field as keyof EmployeeItAccountValues, { message: message as string });
                    });
                } else {
                    toast.error(result.error);
                }
            }
        } catch (error) {
            console.error("IT account submit error:", error);
            toast.error("処理中にエラーが発生しました。");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    isEdit ? (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary">
                            <Edit className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button variant="outline" className="rounded-full shadow-sm">
                            <Plus className="mr-2 h-4 w-4" />
                            利用情報を追加
                        </Button>
                    )
                }
            />
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "IT利用情報を編集" : "IT利用情報を追加"}</DialogTitle>
                    <DialogDescription>
                        Microsoft 365、Canon ImageWARE など、PC入替時に必要なログインIDや契約メモを登録します。パスワードは社内のパスワードマネージャで管理し、ここには書かない運用を推奨します。
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="service_name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>サービス名</FormLabel>
                                    <FormControl>
                                        <Input placeholder="例: Microsoft 365、Canon ImageWARE" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="login_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>ログインID / メール</FormLabel>
                                    <FormControl>
                                        <Input placeholder="サイト用IDや会社メールなど" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="sort_order"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>表示順（小さいほど上）</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={9999}
                                            value={field.value}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                if (v === "") {
                                                    field.onChange(0);
                                                    return;
                                                }
                                                const n = Number.parseInt(v, 10);
                                                field.onChange(Number.isNaN(n) ? 0 : Math.min(9999, Math.max(0, n)));
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>メモ</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="契約番号、ライセンス種別、パスワード保管場所の案内など"
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                キャンセル
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        保存中...
                                    </>
                                ) : (
                                    "保存"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
