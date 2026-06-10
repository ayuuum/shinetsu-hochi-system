"use client";

import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Tables } from "@/types/supabase";
import { UnsavedChangesDialog } from "@/components/shared/unsaved-changes-dialog";
import { updateEmployeeAction, recordEmployeeCheckupAction } from "@/app/actions/admin-record-actions";
import {
    employeeUpdateSchema,
    toEmployeeUpdateFormValues,
    type EmployeeUpdateValues,
} from "@/lib/validation/employee";
import { supabase } from "@/lib/supabase";

type LatestCheckup = {
    check_date: string | null;
    blood_pressure_systolic: number | null;
    blood_pressure_diastolic: number | null;
} | null;

interface EditEmployeeModalProps {
    employee: Tables<"employees">;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    latestCheckup?: LatestCheckup;
}

function checkupFormValues(latestCheckup: LatestCheckup) {
    return {
        checkupDate: latestCheckup?.check_date ?? "",
        bpSystolic: latestCheckup?.blood_pressure_systolic != null ? String(latestCheckup.blood_pressure_systolic) : "",
        bpDiastolic: latestCheckup?.blood_pressure_diastolic != null ? String(latestCheckup.blood_pressure_diastolic) : "",
    };
}

export function EditEmployeeModal({ employee, open, onOpenChange, onSuccess, latestCheckup = null }: EditEmployeeModalProps) {
    const [discardOpen, setDiscardOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [checkup, setCheckup] = useState(() => checkupFormValues(latestCheckup));
    const isPartner = employee.person_type === "partner";

    const form = useForm<EmployeeUpdateValues>({
        resolver: zodResolver(employeeUpdateSchema),
        defaultValues: toEmployeeUpdateFormValues(employee),
    });
    const { isDirty } = form.formState;

    useEffect(() => {
        if (open) {
            form.reset(toEmployeeUpdateFormValues(employee));
        }
    }, [open, employee, form]);

    // モーダルが開いた瞬間に、直近の健診値でローカル state を初期化する
    // （描画中に調整する React 推奨パターン: 不要な再レンダリングを避ける）
    const [wasOpen, setWasOpen] = useState(open);
    if (open && !wasOpen) {
        setWasOpen(true);
        setCheckup(checkupFormValues(latestCheckup));
    } else if (!open && wasOpen) {
        setWasOpen(false);
    }

    const initialCheckup = checkupFormValues(latestCheckup);
    const checkupDirty =
        checkup.checkupDate !== initialCheckup.checkupDate ||
        checkup.bpSystolic !== initialCheckup.bpSystolic ||
        checkup.bpDiastolic !== initialCheckup.bpDiastolic;

    const handleOpenChange = (nextOpen: boolean) => {
        if (nextOpen) {
            onOpenChange(true);
            return;
        }

        if (isSubmitting) return;

        if (isDirty || checkupDirty) {
            setDiscardOpen(true);
            return;
        }

        form.reset(toEmployeeUpdateFormValues(employee));
        onOpenChange(false);
    };

    const handleDiscard = () => {
        form.reset(toEmployeeUpdateFormValues(employee));
        setPhotoFile(null);
        setCheckup(checkupFormValues(latestCheckup));
        setDiscardOpen(false);
        onOpenChange(false);
    };

    async function onSubmit(values: EmployeeUpdateValues) {
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

        const result = await updateEmployeeAction(employee.id, values);
        setIsSubmitting(false);

        if (!result.success) {
            if (uploadedPhotoPath) {
                await supabase.storage.from("certificates").remove([uploadedPhotoPath]);
            }
            if (result.fieldErrors) {
                for (const [field, message] of Object.entries(result.fieldErrors)) {
                    if (!message) continue;
                    form.setError(field as keyof EmployeeUpdateValues, { type: "server", message });
                }
            }
            toast.error(result.error);
            return;
        }

        // 直近の受診日・血圧が入力・変更されていれば健康診断記録として保存する（社員のみ）
        const initialCheckup = checkupFormValues(latestCheckup);
        const checkupChanged =
            checkup.checkupDate !== initialCheckup.checkupDate ||
            checkup.bpSystolic !== initialCheckup.bpSystolic ||
            checkup.bpDiastolic !== initialCheckup.bpDiastolic;
        if (!isPartner && checkup.checkupDate.trim() && checkupChanged) {
            const checkupResult = await recordEmployeeCheckupAction(employee.id, {
                check_date: checkup.checkupDate.trim(),
                blood_pressure_systolic: checkup.bpSystolic,
                blood_pressure_diastolic: checkup.bpDiastolic,
            });
            if (!checkupResult.success) {
                toast.error(checkupResult.error || "受診日・血圧の保存に失敗しました");
            }
        }

        toast.success(isPartner ? "協力会社情報を更新しました" : "社員情報を更新しました");
        if (uploadedPhotoPath && employee.photo_url && employee.photo_url !== uploadedPhotoPath) {
            await supabase.storage.from("certificates").remove([employee.photo_url]);
        }
        form.reset(values);
        setPhotoFile(null);
        onOpenChange(false);
        onSuccess?.();
    }

    return (
        <>
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isPartner ? "協力会社情報の編集" : "社員情報の編集"}</DialogTitle>
                    <DialogDescription>{employee.name}（{employee.employee_number}）</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="employee_number" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{isPartner ? "管理番号 *" : "社員番号 *"}</FormLabel>
                                <FormControl><Input autoComplete="off" spellCheck={false} {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {isPartner ? (
                            <FormField control={form.control} name="partner_company" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>会社名</FormLabel>
                                    <FormControl><Input placeholder="株式会社〇〇設備" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        ) : null}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isPartner ? "表示名 *" : "氏名 *"}</FormLabel>
                                    <FormControl><Input autoComplete="name" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="name_kana" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isPartner ? "表示名カナ *" : "フリガナ *"}</FormLabel>
                                    <FormControl><Input autoComplete="off" spellCheck={false} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {isPartner ? (
                            <FormField control={form.control} name="partner_contact_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>担当者名</FormLabel>
                                    <FormControl><Input autoComplete="name" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        ) : null}

                        {!isPartner ? (
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="birth_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>生年月日 *</FormLabel>
                                    <FormControl><DatePickerField value={field.value} onChange={field.onChange} /></FormControl>
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
                        ) : null}

                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="phone_number" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>電話番号</FormLabel>
                                    <FormControl><Input type="tel" inputMode="tel" autoComplete="tel" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>メール</FormLabel>
                                    <FormControl><Input type="email" autoComplete="email" spellCheck={false} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem>
                                <FormLabel>住所</FormLabel>
                                <FormControl><Input autoComplete="street-address" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        {!isPartner ? (
                        <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
                            <p className="text-sm font-medium">直近の健康診断（任意）</p>
                            <p className="text-xs text-muted-foreground">
                                受診日を入力すると健康診断記録として保存され、基本情報の「個人・連絡先」に表示されます。
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                                <FormItem>
                                    <FormLabel>受診日</FormLabel>
                                    <FormControl>
                                        <DatePickerField
                                            value={checkup.checkupDate}
                                            onChange={(value) => setCheckup((prev) => ({ ...prev, checkupDate: value ?? "" }))}
                                        />
                                    </FormControl>
                                </FormItem>
                                <FormItem>
                                    <FormLabel>血圧（最高）</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="300"
                                            inputMode="numeric"
                                            placeholder="120"
                                            value={checkup.bpSystolic}
                                            onChange={(e) => setCheckup((prev) => ({ ...prev, bpSystolic: e.target.value }))}
                                        />
                                    </FormControl>
                                </FormItem>
                                <FormItem>
                                    <FormLabel>血圧（最低）</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="0"
                                            max="300"
                                            inputMode="numeric"
                                            placeholder="80"
                                            value={checkup.bpDiastolic}
                                            onChange={(e) => setCheckup((prev) => ({ ...prev, bpDiastolic: e.target.value }))}
                                        />
                                    </FormControl>
                                </FormItem>
                            </div>
                        </div>
                        ) : null}

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
                                新しい画像を選ぶと差し替え保存します。
                            </p>
                        </FormItem>

                        <div className="grid grid-cols-3 gap-4">
                            <FormField control={form.control} name="hire_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{isPartner ? "取引開始日" : "入社日"}</FormLabel>
                                    <FormControl><DatePickerField value={field.value} onChange={field.onChange} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="termination_date" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>退職日</FormLabel>
                                    <FormControl><DatePickerField value={field.value} onChange={field.onChange} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="branch" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>拠点</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
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

                        {!isPartner ? (
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
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        ) : null}

                        {!isPartner ? (
                        <FormField control={form.control} name="position" render={({ field }) => (
                            <FormItem>
                                <FormLabel>役職</FormLabel>
                                <FormControl><Input placeholder="主任、課長 等" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        ) : (
                            <FormField control={form.control} name="partner_notes" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>備考</FormLabel>
                                    <FormControl><Input placeholder="契約範囲・注意事項など" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}

                        {!isPartner ? (
                        <div className="grid grid-cols-3 gap-4">
                            <FormField control={form.control} name="emp_insurance_no" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>雇用保険番号</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="health_insurance_no" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>健康保険番号</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="pension_no" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>年金番号</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        ) : null}

                        {/* 経験年数（基準日時点の値を保存し、4月1日基準で自動加算） */}
                        <div className="space-y-1.5">
                            <div className="grid grid-cols-3 gap-4">
                                <FormField control={form.control} name="experience_years" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>経験年数（年）</FormLabel>
                                        <FormControl><Input type="number" min="0" step="1" inputMode="numeric" placeholder="10" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="experience_months" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>経験年数（月）</FormLabel>
                                        <FormControl><Input type="number" min="0" max="11" step="1" inputMode="numeric" placeholder="0" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="experience_base_date" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>基準日</FormLabel>
                                        <FormControl><DatePickerField value={field.value} onChange={field.onChange} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                基準日（通常は当年度の4月1日）時点の経験年数を入力すると、以降は自動で加算して表示されます。
                            </p>
                        </div>

                        {/* 加入している社会保険 */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="health_insurance_type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>加入している健康保険（名称）</FormLabel>
                                    <FormControl><Input placeholder="例: 全国健康保険協会" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="emp_insurance_enrolled" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>雇用保険 加入の有無</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="true">加入</SelectItem>
                                            <SelectItem value="false">未加入</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="pension_enrolled" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>年金 加入の有無</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="選択" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="true">加入</SelectItem>
                                            <SelectItem value="false">未加入</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="pension_type" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>加入している年金（名称）</FormLabel>
                                    <FormControl><Input placeholder="例: 厚生年金" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>キャンセル</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                保存する
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
