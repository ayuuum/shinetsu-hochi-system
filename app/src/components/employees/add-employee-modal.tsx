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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus, Loader2, User, Phone, Briefcase, Plus } from "lucide-react";
import { getTodayInTokyo } from "@/lib/date";
import { toast } from "sonner";
import { UnsavedChangesDialog } from "@/components/shared/unsaved-changes-dialog";
import { createEmployeeAction } from "@/app/actions/admin-record-actions";
import { employeeCreateSchema, type EmployeeCreateValues } from "@/lib/validation/employee";
import { supabase } from "@/lib/supabase";

function createDefaultValues(): EmployeeCreateValues {
    return {
        employee_number: "",
        name: "",
        name_kana: "",
        birth_date: "",
        gender: "",
        phone_number: "",
        email: "",
        address: "",
        hire_date: getTodayInTokyo(),
        branch: "",
        employment_type: "",
        job_title: "",
        photo_url: "",
    };
}

export function AddEmployeeModal() {
    const [open, setOpen] = useState(false);
    const [discardOpen, setDiscardOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const router = useRouter();

    const form = useForm<EmployeeCreateValues>({
        resolver: zodResolver(employeeCreateSchema),
        defaultValues: createDefaultValues(),
    });
    const { isDirty } = form.formState;

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            setOpen(true);
            return;
        }

        if (isSubmitting) return;

        if (isDirty) {
            setDiscardOpen(true);
            return;
        }

        form.reset(createDefaultValues());
        setOpen(false);
    };

    const handleDiscard = () => {
        form.reset(createDefaultValues());
        setPhotoFile(null);
        setDiscardOpen(false);
        setOpen(false);
    };

    async function submitData(values: EmployeeCreateValues, continuous: boolean) {
        setIsSubmitting(true);
        let uploadedPhotoPath: string | null = null;

        if (photoFile) {
            const ext = photoFile.name.split(".").pop();
            const filePath = `employee-photos/${crypto.randomUUID()}.${ext}`;
            const { error: uploadError } = await supabase.storage
                .from("certificates")
                .upload(filePath, photoFile);

            if (uploadError) {
                setIsSubmitting(false);
                toast.error(`顔写真のアップロードに失敗しました: ${uploadError.message}`);
                return;
            }

            uploadedPhotoPath = filePath;
            values.photo_url = filePath;
        }

        const result = await createEmployeeAction(values);
        setIsSubmitting(false);

        if (!result.success) {
            if (uploadedPhotoPath) {
                await supabase.storage.from("certificates").remove([uploadedPhotoPath]);
            }
            if (result.fieldErrors) {
                for (const [field, message] of Object.entries(result.fieldErrors)) {
                    if (!message) continue;
                    form.setError(field as keyof EmployeeCreateValues, { type: "server", message });
                }
            }
            toast.error(result.error);
            return;
        }

        toast.success("社員を登録しました");
        if (continuous) {
            form.reset(createDefaultValues());
            setPhotoFile(null);
        } else {
            setOpen(false);
            form.reset(createDefaultValues());
            setPhotoFile(null);
        }
        router.refresh();
    }

    return (
        <>
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={<Button><UserPlus className="mr-2 h-4 w-4" />社員登録</Button>}
            />
            <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl">
                <DialogHeader className="pb-4">
                    <DialogTitle className="text-2xl font-bold tracking-tight">新規社員登録</DialogTitle>
                    <DialogDescription className="text-muted-foreground">従業員の基本情報と雇用詳細を入力して保存してください。</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit((v) => submitData(v, false))} className="space-y-6">
                        
                        {/* 基本情報 */}
                        <div className="space-y-4 rounded-xl border border-border/40 bg-card/60 p-5 shadow-sm">
                            <div className="flex items-center space-x-2 text-sm font-semibold text-primary">
                                <User className="h-4 w-4" />
                                <span>基本情報</span>
                            </div>
                            
                            <FormField control={form.control} name="employee_number" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>社員番号 *</FormLabel>
                                    <FormControl><Input placeholder="SH-001" autoComplete="off" spellCheck={false} className="max-w-[200px]" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField control={form.control} name="name" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>氏名 *</FormLabel>
                                        <FormControl><Input placeholder="山田 太郎" autoComplete="name" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="name_kana" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>フリガナ *</FormLabel>
                                        <FormControl><Input placeholder="ヤマダ タロウ" autoComplete="off" spellCheck={false} {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField control={form.control} name="birth_date" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>生年月日 *</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="gender" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>性別</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="男性">男性</SelectItem>
                                                <SelectItem value="女性">女性</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <FormItem>
                                <FormLabel>顔写真</FormLabel>
                                <FormControl>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)}
                                    />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">
                                    JPG / PNG を登録できます。証書と同じストレージに保存します。
                                </p>
                            </FormItem>
                        </div>

                        {/* 連絡先 */}
                        <div className="space-y-4 rounded-xl border border-border/40 bg-card/60 p-5 shadow-sm">
                            <div className="flex items-center space-x-2 text-sm font-semibold text-primary">
                                <Phone className="h-4 w-4" />
                                <span>連絡先</span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField control={form.control} name="phone_number" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>電話番号</FormLabel>
                                        <FormControl><Input type="tel" inputMode="tel" autoComplete="tel" placeholder="090-1234-5678" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="email" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>メール</FormLabel>
                                        <FormControl><Input type="email" autoComplete="email" spellCheck={false} placeholder="yamada@example.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <FormField control={form.control} name="address" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>住所</FormLabel>
                                    <FormControl><Input autoComplete="street-address" placeholder="長野県松本市…" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* 雇用情報 */}
                        <div className="space-y-4 rounded-xl border border-border/40 bg-card/60 p-5 shadow-sm">
                            <div className="flex items-center space-x-2 text-sm font-semibold text-primary">
                                <Briefcase className="h-4 w-4" />
                                <span>雇用情報</span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField control={form.control} name="hire_date" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>入社日 *</FormLabel>
                                        <FormControl><Input type="date" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="branch" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>拠点 *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="拠点を選択" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="本社">本社</SelectItem>
                                                <SelectItem value="塩尻">塩尻営業所</SelectItem>
                                                <SelectItem value="白馬">白馬営業所</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField control={form.control} name="employment_type" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>雇用形態</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="正社員">正社員</SelectItem>
                                                <SelectItem value="契約社員">契約社員</SelectItem>
                                                <SelectItem value="パート">パート</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="job_title" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>職種</FormLabel>
                                        <FormControl><Input placeholder="主任技術者" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>

                        <DialogFooter className="pt-4 flex flex-col sm:flex-row gap-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={form.handleSubmit((v) => submitData(v, true))} 
                                disabled={isSubmitting} 
                            >
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                保存して続けて追加
                            </Button>
                            <Button type="submit" disabled={isSubmitting} className="shadow-md shadow-primary/20">
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                保存して閉じる
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
        <UnsavedChangesDialog open={discardOpen} onOpenChange={setDiscardOpen} onDiscard={handleDiscard} />
        </>
    );
}
