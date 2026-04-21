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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Award, Loader2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Tables } from "@/types/supabase";
import { calculateFireDefenseExpiry, calculateGeneralExpiry } from "@/lib/qualification-logic";
import { format } from "date-fns";

const ACQUISITION_TYPES = ["試験", "講習", "実務経験"] as const;

const formSchema = z.object({
    qualification_id: z.string().min(1, "資格を選択してください"),
    acquired_date: z.string().min(1, "取得日は必須です"),
    expiry_date: z.string().optional(),
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
                    toast.error("証書画像のアップロードに失敗しました: " + uploadError.message);
                    return;
                }
                uploadedPaths.push(filePath);
            }

            const primaryPath = uploadedPaths[0] ?? null;

            const { data: insertedQualification, error } = await supabase
                .from("employee_qualifications")
                .insert([
                    {
                        employee_id: employeeId,
                        qualification_id: values.qualification_id,
                        acquired_date: values.acquired_date,
                        expiry_date: values.expiry_date || null,
                        acquisition_type: values.acquisition_type ?? null,
                        certificate_url: primaryPath,
                    },
                ])
                .select("id")
                .single();

            if (error || !insertedQualification) {
                if (uploadedPaths.length) {
                    await supabase.storage.from("certificates").remove(uploadedPaths);
                }
                toast.error("登録に失敗しました: " + (error?.message ?? "unknown"));
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
                    toast.warning("資格は登録しましたが、証書画像の関連付けに失敗しました。");
                }
            }

            toast.success("資格を登録しました");

            if (continuous) {
                form.reset({
                    qualification_id: "",
                    acquired_date: values.acquired_date,
                    expiry_date: "",
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
                                        <Input
                                            type="date"
                                            {...field}
                                            onChange={(e) => {
                                                field.onChange(e);
                                                recalculateExpiry({ acquiredDate: e.target.value });
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
                                        <Input type="date" {...field} />
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

                        <div>
                            <label className="text-sm font-medium">証書画像（複数選択可・任意）</label>
                            <div className="mt-1.5">
                                <label className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors text-sm text-muted-foreground">
                                    <Upload className="h-4 w-4" />
                                    {certificateFiles.length > 0
                                        ? `${certificateFiles.length}枚を選択中`
                                        : "画像を選択..."}
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        multiple
                                        className="hidden"
                                        onChange={(e) => setCertificateFiles(Array.from(e.target.files ?? []))}
                                    />
                                </label>
                                {certificateFiles.length > 0 && (
                                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                                        {certificateFiles.map((f, i) => (
                                            <li key={`${f.name}-${i}`} className="truncate">• {f.name}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
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
