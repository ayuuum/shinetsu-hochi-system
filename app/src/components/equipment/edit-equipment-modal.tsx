"use client";

import { useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateEquipmentAction } from "@/app/actions/admin-record-actions";
import {
    equipmentSchema,
    toEquipmentFormValues,
    type EquipmentValues,
} from "@/lib/validation/equipment";
import { Tables } from "@/types/supabase";

export function EditEquipmentModal({
    item,
    open,
    onOpenChange,
}: {
    item: Tables<"equipment_items">;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const router = useRouter();
    const form = useForm<EquipmentValues>({
        resolver: zodResolver(equipmentSchema),
        defaultValues: toEquipmentFormValues(item),
    });

    useEffect(() => {
        if (open) {
            form.reset(toEquipmentFormValues(item));
        }
    }, [open, item, form]);

    async function onSubmit(values: EquipmentValues) {
        const result = await updateEquipmentAction(item.id, values);

        if (!result.success) {
            if (result.fieldErrors) {
                for (const [field, message] of Object.entries(result.fieldErrors)) {
                    if (!message) continue;
                    form.setError(field as keyof EquipmentValues, { type: "server", message });
                }
            }
            toast.error(result.error);
            return;
        }

        toast.success("備品情報を更新しました");
        onOpenChange(false);
        router.refresh();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>備品を編集</DialogTitle>
                    <DialogDescription>{item.management_number} / {item.name}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="management_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>管理番号</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>品名</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>カテゴリ（任意）</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="purchase_date"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>購入日</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="purchase_amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>購入金額（円）</FormLabel>
                                        <FormControl>
                                            <Input inputMode="decimal" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="branch"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>所属部署・拠点</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
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
                                    <FormLabel>備考</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                キャンセル
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                保存する
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
