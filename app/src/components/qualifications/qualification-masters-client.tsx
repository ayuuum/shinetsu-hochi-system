"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/types/supabase";
import {
    qualificationMasterCreateSchema,
    qualificationMasterUpdateSchema,
    type QualificationMasterCreateValues,
    type QualificationMasterUpdateValues,
} from "@/lib/validation/qualification-master";
import {
    createQualificationMasterAction,
    updateQualificationMasterAction,
    deleteQualificationMasterAction,
} from "@/app/actions/qualification-master-actions";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";

type MasterRow = Tables<"qualification_master">;

const createDefaults: QualificationMasterCreateValues = {
    name: "",
    category: "",
    renewal_rule: "",
    has_expiry: true,
};

function AddMasterModal() {
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();
    const form = useForm<QualificationMasterCreateValues>({
        resolver: zodResolver(qualificationMasterCreateSchema),
        defaultValues: createDefaults,
    });

    async function onSubmit(values: QualificationMasterCreateValues) {
        setSubmitting(true);
        const result = await createQualificationMasterAction(values);
        setSubmitting(false);

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        toast.success("資格マスタを追加しました");
        setOpen(false);
        form.reset(createDefaults);
        router.refresh();
    }

    return (
        <>
            <Button type="button" onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                マスタを追加
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>資格マスタを追加</DialogTitle>
                    <DialogDescription>
                        社員に紐づけられる資格の種類を登録します。名前は一意です。
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>資格名</FormLabel>
                                    <FormControl>
                                        <Input placeholder="例：第一種電気工事士" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>カテゴリ（任意）</FormLabel>
                                    <FormControl>
                                        <Input placeholder="例：電気" {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="renewal_rule"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>更新ルール（任意）</FormLabel>
                                    <FormControl>
                                        <Input placeholder="例：3年ごと講習" {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="has_expiry"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-lg border p-3">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(v) => field.onChange(v === true)}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>有効期限を管理する</FormLabel>
                                        <p className="text-xs text-muted-foreground">
                                            オフにすると期限アラートの対象外になります。
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                キャンセル
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                登録
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
            </Dialog>
        </>
    );
}

function EditMasterModal({ row }: { row: MasterRow }) {
    const [open, setOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();
    const form = useForm<QualificationMasterUpdateValues>({
        resolver: zodResolver(qualificationMasterUpdateSchema),
        defaultValues: {
            id: row.id,
            name: row.name,
            category: row.category ?? "",
            renewal_rule: row.renewal_rule ?? "",
            has_expiry: row.has_expiry ?? true,
        },
    });

    useEffect(() => {
        if (!open) return;
        form.reset({
            id: row.id,
            name: row.name,
            category: row.category ?? "",
            renewal_rule: row.renewal_rule ?? "",
            has_expiry: row.has_expiry ?? true,
        });
    }, [open, row, form]);

    async function onSubmit(values: QualificationMasterUpdateValues) {
        setSubmitting(true);
        const result = await updateQualificationMasterAction(values);
        setSubmitting(false);

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        toast.success("資格マスタを更新しました");
        setOpen(false);
        router.refresh();
    }

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label={`${row.name}を編集`}
                onClick={() => setOpen(true)}
            >
                <Pencil className="h-4 w-4" />
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>資格マスタを編集</DialogTitle>
                    <DialogDescription>{row.name}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>資格名</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>カテゴリ（任意）</FormLabel>
                                    <FormControl>
                                        <Input {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="renewal_rule"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>更新ルール（任意）</FormLabel>
                                    <FormControl>
                                        <Input {...field} value={field.value ?? ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="has_expiry"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-lg border p-3">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(v) => field.onChange(v === true)}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>有効期限を管理する</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                キャンセル
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                保存
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
            </Dialog>
        </>
    );
}

export function QualificationMastersClient({ masters }: { masters: MasterRow[] }) {
    const router = useRouter();
    const [deleteTarget, setDeleteTarget] = useState<MasterRow | null>(null);

    async function confirmDelete() {
        if (!deleteTarget) return;
        const result = await deleteQualificationMasterAction(deleteTarget.id);

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        toast.success("資格マスタを削除しました");
        setDeleteTarget(null);
        router.refresh();
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="資格マスタ"
                description="資格の種類、カテゴリ、更新ルールを管理します。"
                actions={(
                    <>
                        <Button render={<Link href="/qualifications" />} variant="ghost" className="w-fit -ml-2">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            資格・講習一覧へ
                        </Button>
                        <AddMasterModal />
                    </>
                )}
            />

            <div className="rounded-xl border border-border/60 bg-card/80 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead>資格名</TableHead>
                            <TableHead className="hidden sm:table-cell">カテゴリ</TableHead>
                            <TableHead className="hidden md:table-cell">更新ルール</TableHead>
                            <TableHead className="w-[100px]">期限</TableHead>
                            <TableHead className="w-[100px] text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {masters.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                                    マスタがまだありません。「マスタを追加」から登録してください。
                                </TableCell>
                            </TableRow>
                        ) : (
                            masters.map((m) => (
                                <TableRow key={m.id}>
                                    <TableCell className="font-medium">{m.name}</TableCell>
                                    <TableCell className="hidden sm:table-cell text-muted-foreground">
                                        {m.category || "—"}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground max-w-[280px] truncate">
                                        {m.renewal_rule || "—"}
                                    </TableCell>
                                    <TableCell>
                                        {m.has_expiry ? (
                                            <Badge variant="secondary">あり</Badge>
                                        ) : (
                                            <Badge variant="outline">なし</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="inline-flex items-center gap-0.5">
                                            <EditMasterModal row={m} />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                aria-label={`${m.name}を削除`}
                                                onClick={() => setDeleteTarget(m)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <DeleteConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="資格マスタを削除"
                description={
                    deleteTarget
                        ? `「${deleteTarget.name}」を削除します。社員に紐づいている場合は削除できません。`
                        : ""
                }
                onConfirm={confirmDelete}
            />
        </div>
    );
}
