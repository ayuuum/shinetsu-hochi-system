"use client";

import { useState, useEffect } from "react";
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
import { DatePickerField } from "@/components/shared/date-picker-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { QualificationRow } from "@/components/qualifications/qualifications-client";
import { CertificateFilePicker } from "@/components/shared/certificate-file-picker";

const ACQUISITION_TYPES = ["試験", "講習", "実務経験"] as const;

const formSchema = z.object({
    acquired_date: z.string().optional(),
    expiry_date: z.string().optional(),
    certificate_number: z.string().optional(),
    issuing_authority: z.string().optional(),
    status: z.string(),
    notes: z.string().optional(),
    acquisition_type: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditQualificationModalProps {
    qualification: QualificationRow;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EditQualificationModal({ qualification, open, onOpenChange }: EditQualificationModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [additionalFiles, setAdditionalFiles] = useState<File[]>([]);
    const [certificateFiles, setCertificateFiles] = useState<File[]>([]);
    const [removeCertificate, setRemoveCertificate] = useState(false);
    const router = useRouter();
    const employeeId = qualification.employees?.id;
    const acquisitionTypeRaw = (qualification as { acquisition_type?: string | null }).acquisition_type ?? "";

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            acquired_date: qualification.acquired_date || "",
            expiry_date: qualification.expiry_date || "",
            certificate_number: qualification.certificate_number || "",
            issuing_authority: qualification.issuing_authority || "",
            status: qualification.status || "未着手",
            notes: qualification.notes || "",
            acquisition_type: acquisitionTypeRaw,
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
                acquisition_type: acquisitionTypeRaw,
            });
        }
    }, [open, qualification, form, acquisitionTypeRaw]);

    useEffect(() => {
        if (!open) {
            setCertificateFiles([]);
            setRemoveCertificate(false);
            setAdditionalFiles([]);
        }
    }, [open]);

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);

        const previousPath = qualification.certificate_url;
        let uploadedPath: string | null = null;

        try {
            let nextCertificateUrl: string | null | undefined = undefined;

            const certificateFile = certificateFiles[0] ?? null;
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
                    toast.error("証書画像のアップロードに失敗しました。");
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
                acquisition_type: values.acquisition_type || null,
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
                toast.error("更新に失敗しました。時間を置いて再度お試しください。");
                return;
            }

            if (nextCertificateUrl !== undefined && previousPath && previousPath !== nextCertificateUrl) {
                await supabase.storage.from("certificates").remove([previousPath]);
            }

            const isFireDefenseQualification = qualification.qualification_master?.name?.includes("消防設備士");
            const normalizedCertificateNumber = values.certificate_number?.trim() || null;
            if (nextCertificateUrl && isFireDefenseQualification && employeeId && normalizedCertificateNumber) {
                const { data: sameCertRows } = await supabase
                    .from("employee_qualifications")
                    .select("id, qualification_id")
                    .eq("employee_id", employeeId)
                    .eq("certificate_number", normalizedCertificateNumber)
                    .neq("id", qualification.id)
                    .is("deleted_at", null);

                if (sameCertRows && sameCertRows.length > 0) {
                    const qualificationIds = [...new Set(sameCertRows.map((row) => row.qualification_id).filter(Boolean))];
                    const { data: masters } = await supabase
                        .from("qualification_master")
                        .select("id, name")
                        .in("id", qualificationIds as string[]);
                    const fireDefenseMasterIds = new Set(
                        (masters || []).filter((m) => m.name?.includes("消防設備士")).map((m) => m.id)
                    );
                    const syncIds = sameCertRows
                        .filter((row) => row.qualification_id && fireDefenseMasterIds.has(row.qualification_id))
                        .map((row) => row.id);

                    if (syncIds.length > 0) {
                        await supabase
                            .from("employee_qualifications")
                            .update({ certificate_url: nextCertificateUrl, issuing_authority: values.issuing_authority?.trim() || null })
                            .in("id", syncIds);
                    }
                }
            }

            // Upload additional images into certificate_images
            if (additionalFiles.length > 0 && employeeId) {
                const uploadedExtras: string[] = [];
                for (const file of additionalFiles) {
                    const ext = file.name.split(".").pop();
                    const filePath = `${employeeId}/${crypto.randomUUID()}.${ext}`;
                    const { error: upErr } = await supabase.storage
                        .from("certificates")
                        .upload(filePath, file);
                    if (upErr) {
                        await supabase.storage.from("certificates").remove(uploadedExtras);
                        toast.error("追加画像のアップロードに失敗しました。");
                        return;
                    }
                    uploadedExtras.push(filePath);
                }

                if (uploadedExtras.length > 0) {
                    const { error: imgErr } = await supabase
                        .from("certificate_images")
                        .insert(
                            uploadedExtras.map((storage_path, i) => ({
                                qualification_id: qualification.id,
                                storage_path,
                                sort_order: 100 + i,
                            }))
                        );
                    if (imgErr) {
                        console.error("certificate_images insert failed:", imgErr);
                        toast.warning("画像は保存しましたが、資格への紐づけに失敗しました。");
                    }
                }
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
                                    <FormControl><DatePickerField value={field.value} onChange={field.onChange} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="expiry_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>有効期限</FormLabel>
                                    <FormControl><DatePickerField value={field.value} onChange={field.onChange} /></FormControl>
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

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="status" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>申込状況</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="未着手">未着手</SelectItem>
                                            <SelectItem value="申込済">申込済</SelectItem>
                                            <SelectItem value="受講済">受講済</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="acquisition_type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>取得区分</FormLabel>
                                    <Select
                                        onValueChange={(val: string | null) => field.onChange(val ?? "")}
                                        value={field.value || ""}
                                    >
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="未指定" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {ACQUISITION_TYPES.map((t) => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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

                        <div className="space-y-3 rounded-lg border border-border/60 p-4">
                            <p className="text-sm font-medium">証書画像（任意）</p>
                            <p className="text-xs text-muted-foreground">
                                スキャンした免状・証書を保存できます。差し替える場合は新しい画像を選択してください。
                            </p>
                            {qualification.certificate_url && !removeCertificate && certificateFiles.length === 0 ? (
                                <p className="text-xs text-muted-foreground">現在、証書画像が登録されています。</p>
                            ) : null}
                            <CertificateFilePicker files={certificateFiles} onFilesChange={(files) => {
                                setCertificateFiles(files.slice(0, 1));
                                if (files.length > 0) setRemoveCertificate(false);
                            }} multiple={false} />
                            {qualification.certificate_url && !removeCertificate && certificateFiles.length === 0 ? (
                                <Button type="button" variant="ghost" size="sm" onClick={() => setRemoveCertificate(true)}>
                                    登録画像を削除
                                </Button>
                            ) : null}
                            {qualification.certificate_url ? (
                                <label className="flex cursor-pointer items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={removeCertificate}
                                        onCheckedChange={(c) => {
                                            const on = c === true;
                                            setRemoveCertificate(on);
                                            if (on) {
                                                setCertificateFiles([]);
                                            }
                                        }}
                                    />
                                    <span>登録済みの証書画像を削除する</span>
                                </label>
                            ) : null}

                            <div className="border-t pt-3">
                                <p className="text-xs font-medium">追加の証書画像（複数選択可）</p>
                                <div className="mt-2">
                                    <CertificateFilePicker files={additionalFiles} onFilesChange={setAdditionalFiles} />
                                </div>
                            </div>
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
