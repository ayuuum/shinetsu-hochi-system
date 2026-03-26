"use client";

import { useState } from "react";
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
import { UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const formSchema = z.object({
    employee_number: z.string().min(1, "社員番号は必須です"),
    name: z.string().min(1, "氏名は必須です"),
    name_kana: z.string().min(1, "フリガナは必須です"),
    birth_date: z.string().min(1, "生年月日は必須です"),
    gender: z.string().optional(),
    phone_number: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
    hire_date: z.string().min(1, "入社日は必須です"),
    branch: z.string().min(1, "拠点を選択してください"),
    employment_type: z.string().optional(),
    job_title: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddEmployeeModal() {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            employee_number: "",
            name: "",
            name_kana: "",
            birth_date: "",
            gender: "",
            phone_number: "",
            email: "",
            address: "",
            hire_date: new Date().toISOString().split("T")[0],
            branch: "",
            employment_type: "",
            job_title: "",
        },
    });

    async function onSubmit(values: FormValues) {
        setIsSubmitting(true);

        // 社員番号重複チェック
        const { data: existing } = await supabase
            .from("employees")
            .select("id")
            .eq("employee_number", values.employee_number)
            .maybeSingle();

        if (existing) {
            setIsSubmitting(false);
            toast.error("この社員番号は既に使用されています。");
            return;
        }

        const { error } = await supabase.from("employees").insert([{
            employee_number: values.employee_number,
            name: values.name,
            name_kana: values.name_kana,
            birth_date: values.birth_date,
            gender: values.gender || null,
            phone_number: values.phone_number || null,
            email: values.email || null,
            address: values.address || null,
            hire_date: values.hire_date,
            branch: values.branch,
            employment_type: values.employment_type || null,
            job_title: values.job_title || null,
        }]);

        setIsSubmitting(false);

        if (error) {
            console.error(error);
            toast.error("登録に失敗しました: " + error.message);
        } else {
            setOpen(false);
            form.reset();
            router.refresh();
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={<Button><UserPlus className="mr-2 h-4 w-4" />社員登録</Button>}
            />
            <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>新規社員登録</DialogTitle>
                    <DialogDescription>従業員の基本情報を入力して保存してください。</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* 社員番号 */}
                        <FormField control={form.control} name="employee_number" render={({ field }) => (
                            <FormItem>
                                <FormLabel>社員番号 *</FormLabel>
                                <FormControl><Input placeholder="SH-001" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* 氏名・フリガナ */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>氏名 *</FormLabel>
                                    <FormControl><Input placeholder="山田 太郎" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="name_kana" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>フリガナ *</FormLabel>
                                    <FormControl><Input placeholder="ヤマダ タロウ" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* 生年月日・性別 */}
                        <div className="grid grid-cols-2 gap-4">
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

                        {/* 連絡先 */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="phone_number" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>電話番号</FormLabel>
                                    <FormControl><Input placeholder="090-1234-5678" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>メール</FormLabel>
                                    <FormControl><Input type="email" placeholder="yamada@example.com" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {/* 住所 */}
                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem>
                                <FormLabel>住所</FormLabel>
                                <FormControl><Input placeholder="長野県松本市..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {/* 雇用情報 */}
                        <div className="grid grid-cols-2 gap-4">
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

                        <div className="grid grid-cols-2 gap-4">
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

                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting} className="w-full">
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
