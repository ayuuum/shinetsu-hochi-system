"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { DatePickerField } from "@/components/shared/date-picker-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Award, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Tables } from "@/types/supabase";
import { calculateFireDefenseExpiry, calculateGeneralExpiry } from "@/lib/qualification-logic";
import { format } from "date-fns";
import { CertificateFilePicker } from "@/components/shared/certificate-file-picker";

const ACQUISITION_TYPES = ["試験", "講習", "実務経験"] as const;

const formSchema = z.object({
    qualification_id: z.string().min(1, "資格を選択してください"),
    acquired_date: z.string().min(1, "取得日は必須です"),
    expiry_date: z.string().optional(),
    certificate_number: z.string().optional(),
    issuing_authority: z.string().optional(),
    is_initial: z.boolean(),
    acquisition_type: z.enum(ACQUISITION_TYPES).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddQualificationModalProps {
    employeeId: string;
    onSuccess?: () => void;
}

export function AddQualificationModal({ employeeId, onSuccess }: AddQualificationModalProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [masters, setMasters] = useState<Tables<"qualification_master">[]>([]);
    const [loadingMasters, setLoadingMasters] = useState(false);
    const [mastersError, setMastersError] = useState<string | null>(null);
    const [certificateFiles, setCertificateFiles] = useState<File[]>([]);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            qualification_id: "",
            acquired_date: "",
            expiry_date: "",
            certificate_number: "",
            issuing_authority: "",
            is_initial: false,
            acquisition_type: undefined,
        },
    });
    const qualificationOptions = masters.map((master) => ({
        value: master.id,
        label: `[${master.category}] ${master.name}`,
    }));

    const fetchMasters = useCallback(async () => {
        setLoadingMasters(true);
        setMastersError(null);

        try {
            const { data, error } = await supabase
                .from("qualification_master")
                .select("*")
                .order("category", { ascending: true });

            if (error) {
                throw error;
            }

            setMasters(data || []);
        } catch (error) {
            console.error("Failed to load qualification masters:", error);
            setMasters([]);
            setMastersError("資格マスタの取得に失敗しました。");
        } finally {
            setLoadingMasters(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            void fetchMasters();
        }
    }, [fetchMasters, open]);

    // 自動期限計算（資格・日付・初回フラグのいずれが変わっても再計算）
    const recalculateExpiry = (overrides?: { qualificationId?: string; acquiredDate?: string; isInitial?: boolean }) => {
        const qId = overrides?.qualificationId ?? form.getValues("qualification_id");
        const dateStr = overrides?.acquiredDate ?? form.getValues("acquired_date");
        const isInitial = overrides?.isInitial ?? form.getValues("is_initial");
        const selectedQ = masters.find(m => m.id === qId);

        if (!selectedQ || !dateStr) return;

        let expiry: Date | null = null;
        if (selectedQ.name.includes("消防設備士")) {
            expiry = calculateFireDefenseExpiry(dateStr, isInitial);
        } else if (selectedQ.renewal_rule) {
            const interval = parseInt(selectedQ.renewal_rule);
            if (!isNaN(interval)) {
                expiry = calculateGeneralExpiry(dateStr, interval);
            }
        }

        form.setValue("expiry_date", expiry ? format(expiry, "yyyy-MM-dd") : "");
    };

    async function submitData(values: FormValues, continuous: boolean) {
        setIsSubmitting(true);

        const uploadedPaths: string[] = [];

        try {
            for (const file of certificateFiles) {
                const ext = file.name.split(".").pop();
                const filePath = `${employeeId}/${crypto.randomUUID()}.${ext}`;
                const { error: uploadError } = await supabase.storage
                    .from("certificates")
                    .upload(filePath, file);

                if (uploadError) {
                    await supabase.storage.from("certificates").remove(uploadedPaths);
                    toast.error("証書画像のアップロードに失敗しました。");
                    return;
                }
                uploadedPaths.push(filePath);
            }

            const primaryPath = uploadedPaths[0] ?? null;
            const normalizedCertificateNumber = values.certificate_number?.trim() || null;

            const { data: insertedQualification, error } = await supabase
                .from("employee_qualifications")
                .insert([
                    {
                        employee_id: employeeId,
                        qualification_id: values.qualification_id,
                        acquired_date: values.acquired_date,
                        expiry_date: values.expiry_date || null,
                        acquisition_type: values.acquisition_type ?? null,
                        certificate_number: normalizedCertificateNumber,
                        issuing_authority: values.issuing_authority?.trim() || null,
                        certificate_url: primaryPath,
                    },
                ])
                .select("id")
                .single();

            if (error || !insertedQualification) {
                if (uploadedPaths.length) {
                    await supabase.storage.from("certificates").remove(uploadedPaths);
                }
                toast.error("登録に失敗しました。時間を置いて再度お試しください。");
                return;
            }

            if (uploadedPaths.length > 0) {
                const imageRows = uploadedPaths.map((storage_path, sort_order) => ({
                    qualification_id: insertedQualification.id,
                    storage_path,
                    sort_order,
                }));
                const { error: imageError } = await supabase
                    .from("certificate_images")
                    .insert(imageRows);
                if (imageError) {
                    console.error("certificate_images insert failed:", imageError);
                    toast.warning("資格は登録しましたが、証書画像の保存に失敗しました。");
                }
            }

            // 同一免状（同じ社員 × 同じ免状番号）の他資格にも、登録した証書を反映する
            if (primaryPath && normalizedCertificateNumber) {
                const { data: sameCertRows } = await supabase
                    .from("employee_qualifications")
                    .select("id")
                    .eq("employee_id", employeeId)
                    .eq("certificate_number", normalizedCertificateNumber)
                    .neq("id", insertedQualification.id)
                    .is("deleted_at", null);

                if (sameCertRows && sameCertRows.length > 0) {
                    await supabase
                        .from("employee_qualifications")
                        .update({ certificate_url: primaryPath, issuing_authority: values.issuing_authority?.trim() || null })
                        .in("id", sameCertRows.map((row) => row.id));
                    toast.success(`同じ免状番号の資格 ${sameCertRows.length}件にも証書を反映しました`);
                }
            }

            toast.success("資格を登録しました");

            if (continuous) {
                form.reset({
                    qualification_id: "",
                    acquired_date: values.acquired_date,
                    expiry_date: "",
                    certificate_number: "",
                    issuing_authority: "",
                    is_initial: false,
                    acquisition_type: undefined,
                });
                setCertificateFiles([]);
                onSuccess?.();
            } else {
                setOpen(false);
                form.reset();
                setCertificateFiles([]);
                onSuccess?.();
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleOpenChange = (nextOpen: boolean) => {
        setOpen(nextOpen);
        if (!nextOpen) {
            form.reset();
            setCertificateFiles([]);
            setMastersError(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={<Button size="sm"><Plus className="mr-1 h-3.5 w-3.5" />資格追加</Button>}
            />
            <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        保有資格・免状の追加
                    </DialogTitle>
                    <DialogDescription>
                        取得した資格と期限を入力してください。消防設備士の場合は4/1起算で算出されます。
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit((v) => submitData(v, false))} className="space-y-4">
                        {mastersError && (
                            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                                <p>{mastersError}</p>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={() => void fetchMasters()}
                                >
                                    再読み込み
                                </Button>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="qualification_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>資格名</FormLabel>
                                    <Select
                                        items={qualificationOptions}
                                        onValueChange={(val) => {
                                            if (val) {
                                                field.onChange(val);
                                                recalculateExpiry({ qualificationId: val });
                                            }
                                        }}
                                        value={field.value}
                                        disabled={loadingMasters || !!mastersError || masters.length === 0}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="min-h-11 h-auto w-full items-start py-2.5 [&_[data-slot=select-value]]:line-clamp-none [&_[data-slot=select-value]]:whitespace-normal">
                                                <SelectValue
                                                    className="whitespace-normal break-words leading-5"
                                                    placeholder={loadingMasters ? "資格マスタを読み込み中..." : "資格を選択"}
                                                />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="min-w-[32rem] max-w-[36rem]">
                                            {loadingMasters ? (
                                                <SelectItem value="loading" disabled>読み込み中...</SelectItem>
                                            ) : masters.length === 0 ? (
                                                <SelectItem value="empty" disabled>資格マスタがありません</SelectItem>
                                            ) : (
                                                masters.map(m => (
                                                    <SelectItem
                                                        key={m.id}
                                                        value={m.id}
                                                        className="items-start py-2 [&_[data-slot=select-item-text]]:whitespace-normal"
                                                    >
                                                        [{m.category}] {m.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <div className="flex items-center space-x-2 bg-muted/50 p-2 rounded-lg">
                            <FormField
                                control={form.control}
                                name="is_initial"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={(val) => {
                                                    field.onChange(!!val);
                                                    recalculateExpiry({ isInitial: !!val });
                                                }}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>初回取得 (消防設備士2年以内)</FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="acquired_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>取得日 (交付日 / 前回講習日)</FormLabel>
                                    <FormControl>
                                        <DatePickerField
                                            value={field.value}
                                            onChange={(value) => {
                                                field.onChange(value);
                                                recalculateExpiry({ acquiredDate: value });
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="expiry_date"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>次回講習期限 / 有効期限 (自動算出)</FormLabel>
                                    <FormControl>
                                        <DatePickerField value={field.value} onChange={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="acquisition_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>取得区分（任意）</FormLabel>
                                    <Select
                                        onValueChange={(val: string | null) => field.onChange(val ?? undefined)}
                                        value={field.value ?? ""}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="試験 / 講習 / 実務経験" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {ACQUISITION_TYPES.map((t) => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="certificate_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>証明書番号（任意）</FormLabel>
                                        <FormControl>
                                            <Input placeholder="例: 第12345号" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="issuing_authority"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>交付機関（任意）</FormLabel>
                                        <FormControl>
                                            <Input placeholder="例: 長野県知事" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium">証書画像（複数選択可・任意）</label>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                同じ免状番号を入力した場合、登録した証書は同じ社員の同一免状資格（消防設備士・危険物取扱者など）にも反映されます。
                            </p>
                            <div className="mt-1.5">
                                <CertificateFilePicker files={certificateFiles} onFilesChange={setCertificateFiles} />
                            </div>
                            {certificateFiles.length > 0 ? (
                                <p className="mt-2 text-xs font-medium text-primary">
                                    {certificateFiles.length}件の証書を選択中
                                </p>
                            ) : null}
                        </div>

                        <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={form.handleSubmit((v) => submitData(v, true))} 
                                disabled={isSubmitting || loadingMasters || !!mastersError || masters.length === 0} 
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                保存して続けて追加
                            </Button>
                            <Button type="submit" disabled={isSubmitting || loadingMasters || !!mastersError || masters.length === 0}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                保存して閉じる
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
