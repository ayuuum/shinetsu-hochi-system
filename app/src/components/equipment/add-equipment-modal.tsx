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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createEquipmentAction } from "@/app/actions/admin-record-actions";
import { equipmentSchema, type EquipmentValues } from "@/lib/validation/equipment";

const defaultValues: EquipmentValues = {
    management_number: "",
    name: "",
    category: "",
    purchase_date: "",
    purchase_amount: "",
    branch: "",
    notes: "",
};

export function AddEquipmentModal() {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<EquipmentValues>({
        resolver: zodResolver(equipmentSchema),
        defaultValues,
    });

    async function onSubmit(values: EquipmentValues) {
        setIsSubmitting(true);
        const result = await createEquipmentAction(values);
        setIsSubmitting(false);

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

        toast.success("備品を登録しました");
        setOpen(false);
        form.reset(defaultValues);
        router.refresh();
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" />備品を追加</Button>} />
            <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>備品を追加</DialogTitle>
                    <DialogDescription>管理番号・品名・購入情報を登録します。</DialogDescription>
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
                                            <Input placeholder="例: EQ-2024-001" {...field} />
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
                                            <Input placeholder="例: ノートPC" {...field} />
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
                                        <Input placeholder="例: PC / 工具 / 測定器" {...field} />
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
                                            <Input inputMode="decimal" placeholder="例: 98000" {...field} />
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
                                        <Input placeholder="例: 本社 / 塩尻営業所" {...field} />
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
                                        <Input placeholder="特記事項" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                キャンセル
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
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
