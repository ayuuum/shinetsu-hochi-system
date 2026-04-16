"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { QualificationRow } from "@/components/qualifications/qualifications-client";

const formSchema = z.object({
    acquired_date: z.string().optional(),
    expiry_date: z.string().optional(),
    certificate_number: z.string().optional(),
    issuing_authority: z.string().optional(),
    status: z.string(),
    notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditQualificationModalProps {
    qualification: QualificationRow;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditQualificationModal({ qualification, open, onOpenChange }: EditQualificationModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [certificateFile, setCertificateFile] = useState<File | null>(null);
    const [removeCertificate, setRemoveCertificate] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const employeeId = qualification.employees?.id;

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            acquired_date: qualification.acquired_date || "",
            expiry_date: qualification.expiry_date || "",
            certificate_number: qualification.certificate_number || "",
            issuing_authority: qualification.issuing_authority || "",
            status: qualification.status || "未着手",
            notes: qualification.notes || "",
        },
    });

    // Reset form when modal opens or qualification changes
    useEffect(() => {
        if (open) {
            form.reset({
                acquired_date: qualification.acquired_date || "",
                expiry_date: qualification.expiry_date || "",
                certificate_number: qualification.certificate_number || "",
                issuing_authority: qualification.issuing_authority || "",
                status: qualification.status || "未着手",
                notes: qualification.notes || "",
            });
        }
    }, [open, qualification, form]);

    useEffect(() => {
        if (!open) {
            setCertificateFile(null);
            setRemoveCertificate(false);
        }
    }, [open]);

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);

        const previousPath = qualification.certificate_url;
        let uploadedPath: string | null = null;

        try {
            let nextCertificateUrl: string | null | undefined = undefined;

            if (certificateFile) {
                if (!employeeId) {
                    toast.error("社員情報が取得できないため証書をアップロードできません。");
                    return;
                }
                const ext = certificateFile.name.split(".").pop();
                const filePath = `${employeeId}/${crypto.randomUUID()}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from("certificates")
                    .upload(filePath, certificateFile);

                if (uploadError) {
                    toast.error("証書画像のアップロードに失敗しました: " + uploadError.message);
                    return;
                }
                uploadedPath = filePath;
                nextCertificateUrl = filePath;
            } else if (removeCertificate) {
                nextCertificateUrl = null;
            }

            const updatePayload: Record<string, unknown> = {
                acquired_date: values.acquired_date || null,
                expiry_date: values.expiry_date || null,
                certificate_number: values.certificate_number || null,
                issuing_authority: values.issuing_authority || null,
                status: values.status,
                notes: values.notes || null,
            };

            if (nextCertificateUrl !== undefined) {
                updatePayload.certificate_url = nextCertificateUrl;
            }

            const { error } = await supabase
                .from("employee_qualifications")
                .update(updatePayload)
                .eq("id", qualification.id);

            if (error) {
                if (uploadedPath) {
                    await supabase.storage.from("certificates").remove([uploadedPath]);
                }
                toast.error("更新に失敗しました: " + error.message);
                return;
            }

            if (nextCertificateUrl !== undefined && previousPath && previousPath !== nextCertificateUrl) {
                await supabase.storage.from("certificates").remove([previousPath]);
            }

            toast.success("資格情報を更新しました");
            onOpenChange(false);
            router.refresh();
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>資格情報の編集</DialogTitle>
                    <DialogDescription>
                        {qualification.employees?.name} - {qualification.qualification_master?.name}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="acquired_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>取得日</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="expiry_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>有効期限</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="certificate_number" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>証明書番号</FormLabel>
                                    <FormControl><Input placeholder="例: 第12345号" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="issuing_authority" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>交付機関</FormLabel>
                                    <FormControl><Input placeholder="例: 長野県知事" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="status" render={({ field }) => (
                            <FormItem>
                                <FormLabel>申込状況</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="未着手">未着手</SelectItem>
                                        <SelectItem value="申込中">申込中</SelectItem>
                                        <SelectItem value="受講予定">受講予定</SelectItem>
                                        <SelectItem value="更新済み">更新済み</SelectItem>
                                    </SelectContent>
                                </Select>
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

                        <div className="space-y-3 rounded-lg border border-border/60 p-4">
                            <p className="text-sm font-medium">証書画像（任意）</p>
                            <p className="text-xs text-muted-foreground">
                                スキャンした免状・証書を保存できます。差し替える場合は新しい画像を選択してください。
                            </p>
                            {qualification.certificate_url && !removeCertificate && !certificateFile ? (
                                <p className="text-xs text-muted-foreground">現在、証書画像が登録されています。</p>
                            ) : null}
                            {certificateFile ? (
                                <p className="text-xs text-foreground">選択中: {certificateFile.name}</p>
                            ) : null}
                            <div className="flex flex-wrap items-center gap-3">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        setCertificateFile(f ?? null);
                                        if (f) setRemoveCertificate(false);
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    {qualification.certificate_url ? "画像を差し替え" : "画像をアップロード"}
                                </Button>
                                {certificateFile ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setCertificateFile(null);
                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                        }}
                                    >
                                        選択をクリア
                                    </Button>
                                ) : qualification.certificate_url && !removeCertificate ? (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setRemoveCertificate(true)}
                                    >
                                        登録画像を削除
                                    </Button>
                                ) : null}
                            </div>
                            {qualification.certificate_url ? (
                                <label className="flex cursor-pointer items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={removeCertificate}
                                        onCheckedChange={(c) => {
                                            const on = c === true;
                                            setRemoveCertificate(on);
                                            if (on) {
                                                setCertificateFile(null);
                                                if (fileInputRef.current) fileInputRef.current.value = "";
                                            }
                                        }}
                                    />
                                    <span>登録済みの証書画像を削除する</span>
                                </label>
                            ) : null}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>キャンセル</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                保存する
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
