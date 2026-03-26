"use client";

import { useState, useEffect } from "react";
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

const formSchema = z.object({
    qualification_id: z.string().min(1, "資格を選択してください"),
    acquired_date: z.string().min(1, "取得日は必須です"),
    expiry_date: z.string().optional(),
    is_initial: z.boolean(),
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
    const [certificateFile, setCertificateFile] = useState<File | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            qualification_id: "",
            acquired_date: "",
            expiry_date: "",
            is_initial: false,
        },
    });

    useEffect(() => {
        if (open) {
            fetchMasters();
        }
    }, [open]);

    const fetchMasters = async () => {
        const { data } = await supabase
            .from("qualification_master")
            .select("*")
            .order("category", { ascending: true });
        if (data) setMasters(data);
    };

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

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);

        let certificateUrl: string | null = null;

        // Upload certificate image if provided
        if (certificateFile) {
            const ext = certificateFile.name.split(".").pop();
            const filePath = `${employeeId}/${crypto.randomUUID()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from("certificates")
                .upload(filePath, certificateFile);

            if (uploadError) {
                toast.error("証書画像のアップロードに失敗しました: " + uploadError.message);
                setIsSubmitting(false);
                return;
            }

            // Store the file path (not a public URL since bucket is private)
            certificateUrl = filePath;
        }

        const { error } = await supabase.from("employee_qualifications").insert([
            {
                employee_id: employeeId,
                qualification_id: values.qualification_id,
                acquired_date: values.acquired_date,
                expiry_date: values.expiry_date || null,
                certificate_url: certificateUrl,
            },
        ]);

        setIsSubmitting(false);

        if (error) {
            toast.error("登録に失敗しました: " + error.message);
        } else {
            setOpen(false);
            form.reset();
            setCertificateFile(null);
            if (onSuccess) onSuccess();
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={<Button size="sm"><Plus className="mr-1 h-3.5 w-3.5" />資格追加</Button>}
            />
            <DialogContent className="sm:max-w-[425px]">
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
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="qualification_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>資格名</FormLabel>
                                    <Select onValueChange={(val) => { if (val) { field.onChange(val); recalculateExpiry({ qualificationId: val }); } }} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="資格を選択" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {masters.map(m => (
                                                <SelectItem key={m.id} value={m.id}>
                                                    [{m.category}] {m.name}
                                                </SelectItem>
                                            ))}
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
                                                onCheckedChange={(val) => { field.onChange(val); recalculateExpiry({ isInitial: !!val }); }}
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

                        <div>
                            <label className="text-sm font-medium">証書画像（任意）</label>
                            <div className="mt-1.5">
                                <label className="flex items-center gap-2 px-3 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors text-sm text-muted-foreground">
                                    <Upload className="h-4 w-4" />
                                    {certificateFile ? certificateFile.name : "画像を選択..."}
                                    <input
                                        type="file"
                                        accept="image/*,.pdf"
                                        className="hidden"
                                        onChange={(e) => setCertificateFile(e.target.files?.[0] || null)}
                                    />
                                </label>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting} className="w-full">
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
