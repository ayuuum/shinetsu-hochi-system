"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Tables } from "@/types/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    User,
    Award,
    HardHat,
    Heart,
    Users,
    ArrowLeft,
    Calendar,
    MapPin,
    Plus,
    Pencil,
    Trash2,
    FileImage,
    Shield,
    Printer,
    Laptop,
    AlertTriangle,
    BookOpen,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { differenceInDays } from "date-fns";
import { AddQualificationModal } from "@/components/employees/add-qualification-modal";
import { EditEmployeeModal } from "@/components/employees/edit-employee-modal";
import { AddConstructionModal } from "@/components/employees/add-construction-modal";
import { AddLifeInsuranceModal } from "@/components/employees/add-life-insurance-modal";
import { AddDamageInsuranceModal } from "@/components/employees/add-damage-insurance-modal";
import { AddItAccountModal } from "@/components/employees/add-it-account-modal";
import { AddFamilyModal } from "@/components/employees/add-family-modal";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";
import { useAuth } from "@/hooks/use-auth";
import { alertStyles } from "@/lib/alert-utils";
import {
    deleteEmployeeAction,
    deleteProjectAction,
    deleteLifeInsuranceAction,
    deleteDamageInsuranceAction,
    deleteItAccountAction,
    deleteQualificationAction,
    deleteExamHistoryAction,
    deleteSeminarRecordAction,
} from "@/app/actions/admin-record-actions";
import { AddExamHistoryModal } from "@/components/employees/add-exam-history-modal";
import { AddSeminarModal } from "@/components/employees/add-seminar-modal";
import { formatDisplayDate } from "@/lib/date";
import { RecordActionsMenu } from "@/components/shared/record-actions-menu";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { getHealthCheckResultLabel } from "@/lib/display-labels";

type EmployeeQualification = Tables<"employee_qualifications"> & {
    qualification_master: Tables<"qualification_master"> | null;
};

export type EmployeeDetail = Tables<"employees"> & {
    employee_qualifications: EmployeeQualification[];
    deleted_qualifications: EmployeeQualification[];
    employee_family: Tables<"employee_family">[];
    construction_records: Tables<"construction_records">[];
    health_checks: Tables<"health_checks">[];
    employee_life_insurances: Tables<"employee_life_insurances">[];
    employee_damage_insurances: Tables<"employee_damage_insurances">[];
    employee_it_accounts: Tables<"employee_it_accounts">[];
    exam_history: Tables<"qualification_exam_history">[];
    seminar_records: Tables<"seminar_records">[];
};

export type EmployeeDetailTab =
    | "basic"
    | "insurance"
    | "it"
    | "qualifications"
    | "construction"
    | "family"
    | "health"
    | "seminars";

function getExpiryBadge(expiryDate: string | null) {
    if (!expiryDate) return null;
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return <Badge variant="secondary" className={alertStyles.danger.badge}>{Math.abs(days)}日超過</Badge>;
    if (days <= 14) return <Badge variant="secondary" className={alertStyles.urgent.badge}>残{days}日</Badge>;
    if (days <= 30) return <Badge variant="secondary" className={alertStyles.warning.badge}>残{days}日</Badge>;
    if (days <= 60) return <Badge variant="secondary" className={alertStyles.info.badge}>残{days}日</Badge>;
    return <Badge variant="secondary" className={alertStyles.ok.badge}>有効</Badge>;
}

function DetailItem({ label, value }: { label: string; value: string | null | number }) {
    return (
        <div className="grid grid-cols-3 border-b border-border/40 py-2.5 last:border-0 even:bg-muted/30 -mx-6 px-6">
            <span className="text-muted-foreground text-sm">{label}</span>
            <span className="col-span-2 font-medium text-sm">{value || "-"}</span>
        </div>
    );
}

function maskedEmploymentValue(isTechnicianSelf: boolean, value: string | null | number) {
    if (!isTechnicianSelf) return value;
    return "—";
}


export function EmployeeDetailClient({
    employee,
    certUrls,
    initialTab,
    photoUrl,
}: {
    employee: EmployeeDetail;
    certUrls: Record<string, string>;
    initialTab: EmployeeDetailTab;
    photoUrl: string | null;
}) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<EmployeeDetailTab>(initialTab);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletingQualId, setDeletingQualId] = useState<string | null>(null);
    const [deletingConstructionId, setDeletingConstructionId] = useState<string | null>(null);
    const [deletingLifeInsuranceId, setDeletingLifeInsuranceId] = useState<string | null>(null);
    const [deletingDamageInsuranceId, setDeletingDamageInsuranceId] = useState<string | null>(null);
    const [deletingItAccountId, setDeletingItAccountId] = useState<string | null>(null);
    const [deletingExamHistoryId, setDeletingExamHistoryId] = useState<string | null>(null);
    const [deletingSeminarId, setDeletingSeminarId] = useState<string | null>(null);
    const [showDeletedQuals, setShowDeletedQuals] = useState(false);
    const { isAdmin, isAdminOrHr, role, linkedEmployeeId } = useAuth();
    const isTechnicianSelf = role === "technician" && linkedEmployeeId === employee.id;

    const today = new Date();
    const housingAllowanceEnd = employee.hire_date
        ? new Date(new Date(employee.hire_date).setFullYear(new Date(employee.hire_date).getFullYear() + 5))
        : null;
    const housingDaysLeft = housingAllowanceEnd ? differenceInDays(housingAllowanceEnd, today) : null;
    const housingAlertActive = housingDaysLeft !== null && housingDaysLeft <= 31;

    const hasFamilyAllowance = employee.employee_family.some(f => {
        if (!f.birth_date || !f.is_dependent) return false;
        return differenceInDays(today, new Date(f.birth_date)) / 365.25 <= 18;
    });

    const handleBack = () => {
        if (isTechnicianSelf) {
            router.push("/me");
            return;
        }

        if (typeof window !== "undefined" && document.referrer.startsWith(window.location.origin)) {
            router.back();
            return;
        }

        router.push("/employees");
    };

    const handleTabChange = (tab: EmployeeDetailTab) => {
        setActiveTab(tab);
    };

    const handleDeleteLifeInsurance = async (insuranceId: string) => {
        if (!isAdminOrHr) return;
        const result = await deleteLifeInsuranceAction(insuranceId);
        if (result.success) {
            toast.success("削除しました");
            setDeletingLifeInsuranceId(null);
            router.refresh();
        } else {
            toast.error(result.error);
        }
    };

    const handleDeleteDamageInsurance = async (insuranceId: string) => {
        if (!isAdminOrHr) return;
        const result = await deleteDamageInsuranceAction(insuranceId);
        if (result.success) {
            toast.success("削除しました");
            setDeletingDamageInsuranceId(null);
            router.refresh();
        } else {
            toast.error(result.error);
        }
    };

    const handleDeleteItAccount = async (accountId: string) => {
        if (!isAdminOrHr) return;
        const result = await deleteItAccountAction(accountId);
        if (result.success) {
            toast.success("削除しました");
            setDeletingItAccountId(null);
            router.refresh();
        } else {
            toast.error(result.error);
        }
    };

    const handleDeleteExamHistory = async (id: string) => {
        if (!isAdminOrHr) return;
        const result = await deleteExamHistoryAction(id);
        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("受験履歴を削除しました");
            router.refresh();
        }
        setDeletingExamHistoryId(null);
    };

    const handleDeleteSeminar = async (id: string) => {
        if (!isAdminOrHr) return;
        const result = await deleteSeminarRecordAction(id);
        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("セミナー履歴を削除しました");
            router.refresh();
        }
        setDeletingSeminarId(null);
    };

    const handleDeleteQualification = async (qualificationId: string) => {
        if (!isAdminOrHr) return;
        const result = await deleteQualificationAction(qualificationId);
        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("資格情報を削除しました");
            router.refresh();
        }
        setDeletingQualId(null);
    };

    const handleDeleteConstruction = async (recordId: string) => {
        if (!isAdminOrHr) return;

        const result = await deleteProjectAction(recordId);

        if (!result.success) {
            toast.error(result.error);
        } else {
            toast.success("施工実績を削除しました");
            router.refresh();
        }

        setDeletingConstructionId(null);
    };

    const handleDeleteEmployee = async () => {
        if (!isAdminOrHr) return;

        setDeleting(true);
        const result = await deleteEmployeeAction(employee.id);
        setDeleting(false);

        if (!result.success) {
            toast.error(result.error);
            return;
        }

        router.push("/employees");
        router.refresh();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-200 pb-10">
            <div className="flex flex-col gap-4">
                <Button variant="ghost" onClick={handleBack} className="w-fit -ml-2 text-muted-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {isTechnicianSelf ? "マイページへ戻る" : "一覧へ戻る"}
                </Button>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                            {photoUrl ? (
                                <Image
                                    src={photoUrl}
                                    alt={`${employee.name} の顔写真`}
                                    width={80}
                                    height={80}
                                    className="h-20 w-20 rounded-2xl object-cover"
                                />
                            ) : (
                                <User className="h-10 w-10" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">{employee.name}</h1>
                                <Badge variant="secondary">{employee.branch || "支店未設定"}</Badge>
                                {employee.termination_date && <Badge variant="destructive">退職済</Badge>}
                                {isAdminOrHr && hasFamilyAllowance && <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">家族手当あり</Badge>}
                            </div>
                            <p className="text-muted-foreground font-medium">{employee.name_kana} | {employee.employee_number}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{employee.address || "住所未登録"}</span>
                                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{employee.hire_date ? `入社: ${formatDisplayDate(employee.hire_date)}` : "入社日未登録"}</span>
                            </div>
                        </div>
                    </div>
                    {isAdminOrHr && (
                        <div className="flex shrink-0 gap-2">
                            <Button variant="outline" onClick={() => setEditOpen(true)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                編集する
                            </Button>
                            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                削除
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {isAdminOrHr && housingAlertActive && (
                <div className="mx-6 mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                        {housingDaysLeft! <= 0
                            ? `家賃補助の支給期間（入社5年）が終了しました。`
                            : `家賃補助の支給期間が残り${housingDaysLeft}日で終了します（${formatDisplayDate(housingAllowanceEnd!.toISOString().split("T")[0])}まで）。`}
                    </span>
                </div>
            )}

            {isAdminOrHr && (
                <EditEmployeeModal
                    employee={employee}
                    open={editOpen}
                    onOpenChange={setEditOpen}
                    onSuccess={() => router.refresh()}
                />
            )}

            {isAdminOrHr && (
                <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>社員の削除</DialogTitle>
                            <DialogDescription>
                                {employee.name}（{employee.employee_number}）を一覧から非表示にします。関連する施工実績、健康診断、アルコール記録も運用画面から除外され、監査履歴は保持されます。
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteOpen(false)}>キャンセル</Button>
                            <Button variant="destructive" onClick={handleDeleteEmployee} disabled={deleting}>
                                {deleting ? "削除中..." : "削除する"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as EmployeeDetailTab)} className="w-full">
                <div className="overflow-x-auto -mx-1 px-1">
                    <TabsList variant="line" className="inline-flex min-w-full h-auto border-b border-border/50 gap-0 pb-0 rounded-none">
                        <TabsTrigger value="basic" className="flex-shrink-0 px-4 py-2.5 text-sm gap-1.5"><User className="h-3.5 w-3.5" />基本情報</TabsTrigger>
                        {isAdmin && (
                            <TabsTrigger value="insurance" className="flex-shrink-0 px-4 py-2.5 text-sm gap-1.5"><Shield className="h-3.5 w-3.5" />保険情報</TabsTrigger>
                        )}
                        {isAdminOrHr && (
                            <TabsTrigger value="it" className="flex-shrink-0 px-4 py-2.5 text-sm gap-1.5">
                                <Laptop className="h-3.5 w-3.5" />
                                IT・ライセンス
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="qualifications" className="flex-shrink-0 px-4 py-2.5 text-sm gap-1.5"><Award className="h-3.5 w-3.5" />保有資格</TabsTrigger>
                        <TabsTrigger value="construction" className="flex-shrink-0 px-4 py-2.5 text-sm gap-1.5"><HardHat className="h-3.5 w-3.5" />施工実績</TabsTrigger>
                        <TabsTrigger value="family" className="flex-shrink-0 px-4 py-2.5 text-sm gap-1.5"><Users className="h-3.5 w-3.5" />家族</TabsTrigger>
                        <TabsTrigger value="health" className="flex-shrink-0 px-4 py-2.5 text-sm gap-1.5"><Heart className="h-3.5 w-3.5" />健康診断</TabsTrigger>
                        <TabsTrigger value="seminars" className="flex-shrink-0 px-4 py-2.5 text-sm gap-1.5"><BookOpen className="h-3.5 w-3.5" />受験・セミナー</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="basic" className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="shadow-sm border-border/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" />個人・連絡先</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-0">
                                <DetailItem label="生年月日" value={formatDisplayDate(employee.birth_date)} />
                                <DetailItem label="性別" value={employee.gender} />
                                <DetailItem label="電話番号" value={employee.phone_number} />
                                <DetailItem label="メール" value={employee.email} />
                                <DetailItem label="住所" value={employee.address} />
                                <DetailItem label="血液型" value={employee.blood_type} />
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm border-border/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" />雇用・保険</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-0">
                                <DetailItem label="役職" value={employee.position} />
                                <DetailItem label="職種" value={employee.job_title} />
                                <DetailItem label="雇用形態" value={maskedEmploymentValue(isTechnicianSelf, employee.employment_type)} />
                                <DetailItem label="入社年月日" value={formatDisplayDate(employee.hire_date)} />
                                <DetailItem label="退職日" value={formatDisplayDate(employee.termination_date)} />
                                <DetailItem label="健康保険番号" value={maskedEmploymentValue(isTechnicianSelf, employee.health_insurance_no)} />
                                <DetailItem label="年金番号" value={maskedEmploymentValue(isTechnicianSelf, employee.pension_no)} />
                                <DetailItem label="雇用保険番号" value={maskedEmploymentValue(isTechnicianSelf, employee.emp_insurance_no)} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {isAdmin && (
                <TabsContent value="insurance" className="mt-6 space-y-4 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">法人契約保険・個人保険記録</h3>
                        {isAdminOrHr && (
                            <div className="flex gap-2">
                                <AddLifeInsuranceModal employeeId={employee.id} onSuccess={() => router.refresh()} />
                                <AddDamageInsuranceModal employeeId={employee.id} onSuccess={() => router.refresh()} />
                            </div>
                        )}
                    </div>
                    
                    {(!employee.employee_life_insurances?.length && !employee.employee_damage_insurances?.length) ? (
                        <Card className="bg-muted/10 border-dashed"><CardContent className="py-10 text-center text-muted-foreground text-sm">保険情報が登録されていません。</CardContent></Card>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {employee.employee_life_insurances?.map((insurance) => (
                                <Card key={insurance.id} className="shadow-sm border-border/50 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/80" />
                                    <CardHeader className="pb-3 pl-6">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">法人生命保険</Badge>
                                            {isAdminOrHr && (
                                                <div className="flex items-center gap-2">
                                                    <AddLifeInsuranceModal employeeId={employee.id} existingRecord={insurance} onSuccess={() => router.refresh()} />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeletingLifeInsuranceId(insurance.id)}
                                                        className="h-10 w-10 rounded-full p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        aria-label={`${insurance.insurance_name}を削除`}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <CardTitle className="text-xl mt-2">{insurance.insurance_name}</CardTitle>
                                        <p className="text-sm font-medium text-muted-foreground mt-1">{insurance.insurance_company} {insurance.agency ? `| ${insurance.agency}` : ""}</p>
                                    </CardHeader>
                                    <CardContent className="space-y-0 pl-6">
                                        <DetailItem label="加入日" value={formatDisplayDate(insurance.start_date)} />
                                        <DetailItem label="満期日" value={formatDisplayDate(insurance.maturity_date)} />
                                        <div className="grid grid-cols-3 border-b border-border/50 py-3 last:border-0 bg-primary/5 -mx-6 px-6 relative mt-2">
                                            <span className="text-primary font-bold text-sm flex items-center">返戻金ピーク日</span>
                                            <span className="col-span-2 font-bold text-sm text-primary flex items-center tabular-nums">{formatDisplayDate(insurance.peak_date, "未設定")}</span>
                                        </div>
                                        {insurance.notes && (
                                            <div className="mt-4 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                                {insurance.notes}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}

                            {employee.employee_damage_insurances?.map((insurance) => (
                                <Card key={insurance.id} className="shadow-sm border-border/50 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-muted-foreground/40" />
                                    <CardHeader className="pb-3 pl-6">
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="bg-muted text-muted-foreground border-border">{insurance.insurance_type || "損害保険"}</Badge>
                                            {isAdminOrHr && (
                                                <div className="flex items-center gap-2">
                                                    <AddDamageInsuranceModal employeeId={employee.id} existingRecord={insurance} onSuccess={() => router.refresh()} />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeletingDamageInsuranceId(insurance.id)}
                                                        className="h-10 w-10 rounded-full p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        aria-label={`${insurance.insurance_name}を削除`}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                        <CardTitle className="text-xl mt-2">{insurance.insurance_name}</CardTitle>
                                        <p className="text-sm font-medium text-muted-foreground mt-1">{insurance.insurance_company} {insurance.agency ? `| ${insurance.agency}` : ""}</p>
                                    </CardHeader>
                                    <CardContent className="space-y-0 pl-6">
                                        <DetailItem label="更新日(更改日)" value={formatDisplayDate(insurance.renewal_date)} />
                                        {insurance.coverage_details && (
                                            <div className="mt-3 text-sm text-foreground">
                                                <span className="text-muted-foreground block text-xs mb-1">補償内容</span>
                                                <div className="whitespace-pre-wrap leading-relaxed">{insurance.coverage_details}</div>
                                            </div>
                                        )}
                                        {insurance.notes && (
                                            <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground whitespace-pre-wrap">
                                                {insurance.notes}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
                )}

                {isAdminOrHr && (
                    <TabsContent value="it" className="mt-6 space-y-4 animate-in fade-in duration-300">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                            <div>
                                <h3 className="text-lg font-bold">IT・ソフトウェア利用情報</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Microsoft 365 や Canon ImageWARE など、PC入替時に必要なログインID・契約メモを登録します（総務・管理者のみ表示）。
                                </p>
                            </div>
                            <AddItAccountModal employeeId={employee.id} onSuccess={() => router.refresh()} />
                        </div>
                        {employee.employee_it_accounts.length === 0 ? (
                            <Card className="bg-muted/10 border-dashed">
                                <CardContent className="py-10 text-center text-muted-foreground text-sm">
                                    IT利用情報が登録されていません。
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {employee.employee_it_accounts.map((row) => (
                                    <Card key={row.id} className="shadow-sm border-border/50 relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/60" />
                                        <CardHeader className="pb-3 pl-6">
                                            <div className="flex items-center justify-between gap-2">
                                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 w-fit">
                                                    表示順 {row.sort_order}
                                                </Badge>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <AddItAccountModal
                                                        employeeId={employee.id}
                                                        existingRecord={row}
                                                        onSuccess={() => router.refresh()}
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeletingItAccountId(row.id)}
                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <CardTitle className="text-xl mt-2">{row.service_name}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-0 pl-6">
                                            <DetailItem label="ログインID / メール" value={row.login_id} />
                                            {row.notes ? (
                                                <div className="mt-3 pt-3 border-t border-border/50 text-sm text-muted-foreground whitespace-pre-wrap">
                                                    {row.notes}
                                                </div>
                                            ) : null}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                )}

                <TabsContent value="qualifications" className="mt-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <h3 className="text-lg font-bold">保有資格一覧</h3>
                        <div className="flex flex-wrap items-center gap-2">
                            {employee.employee_qualifications.some((q) => q.certificate_url) ? (
                                <Button size="sm" variant="outline" render={<Link href={`/employees/${employee.id}/certificates/print`} />}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    提出用シート（A4）
                                </Button>
                            ) : null}
                            {isAdminOrHr && <AddQualificationModal employeeId={employee.id} onSuccess={() => router.refresh()} />}
                        </div>
                    </div>
                    {employee.employee_qualifications.length === 0 ? (
                        <Card className="bg-muted/10 border-dashed"><CardContent className="py-10 text-center text-muted-foreground text-sm">資格情報が登録されていません。</CardContent></Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {employee.employee_qualifications.map((qualification) => (
                                <Card key={qualification.id} className="shadow-sm">
                                    <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <Badge className="w-fit">{qualification.qualification_master?.category || "一般"}</Badge>
                                                <div className="flex items-center gap-1">
                                                    {getExpiryBadge(qualification.expiry_date)}
                                                    {isAdminOrHr && (
                                                        <RecordActionsMenu label={qualification.qualification_master?.name || "資格"}>
                                                            <DropdownMenuItem variant="destructive" onClick={() => setDeletingQualId(qualification.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                                削除
                                                            </DropdownMenuItem>
                                                        </RecordActionsMenu>
                                                )}
                                                </div>
                                            </div>
                                        <CardTitle className="text-base">
                                            <Link href={`/qualifications/${qualification.id}`} className="hover:text-primary hover:underline">
                                                {qualification.qualification_master?.name}
                                            </Link>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-1">
                                        <div className="flex justify-between"><span className="text-muted-foreground">免状番号</span><span>{qualification.certificate_number || "-"}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">取得日</span><span className="tabular-nums">{formatDisplayDate(qualification.acquired_date)}</span></div>
                                        <div className="flex justify-between font-bold">
                                            <span className="text-muted-foreground">有効期限</span>
                                            <span className={`tabular-nums ${qualification.expiry_date && new Date(qualification.expiry_date) < new Date() ? "text-destructive" : ""}`}>
                                                {formatDisplayDate(qualification.expiry_date, "期限なし")}
                                            </span>
                                        </div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">ステータス</span><span>{qualification.status || "未着手"}</span></div>
                                        {certUrls[qualification.id] && (
                                            <a href={certUrls[qualification.id]} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
                                                <FileImage className="h-3.5 w-3.5" />
                                                証書画像を表示
                                            </a>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {isAdminOrHr && employee.deleted_qualifications.length > 0 && (
                        <div className="mt-6">
                            <button
                                onClick={() => setShowDeletedQuals(!showDeletedQuals)}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showDeletedQuals ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                削除済み資格（{employee.deleted_qualifications.length}件）
                            </button>
                            {showDeletedQuals && (
                                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                                    {employee.deleted_qualifications.map((qualification) => (
                                        <Card key={qualification.id} className="shadow-sm border-dashed">
                                            <CardHeader className="pb-2">
                                                <div className="flex items-center justify-between">
                                                    <Badge variant="outline" className="w-fit">{qualification.qualification_master?.category || "一般"}</Badge>
                                                    <Badge variant="secondary" className="text-xs">削除済</Badge>
                                                </div>
                                                <CardTitle className="text-base text-muted-foreground">
                                                    {qualification.qualification_master?.name}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="text-sm space-y-1">
                                                <div className="flex justify-between"><span className="text-muted-foreground">免状番号</span><span>{qualification.certificate_number || "-"}</span></div>
                                                <div className="flex justify-between"><span className="text-muted-foreground">取得日</span><span className="tabular-nums">{formatDisplayDate(qualification.acquired_date)}</span></div>
                                                <div className="flex justify-between"><span className="text-muted-foreground">削除日</span><span className="tabular-nums">{formatDisplayDate(qualification.deleted_at?.split("T")[0] ?? null)}</span></div>
                                                {certUrls[qualification.id] && (
                                                    <a href={certUrls[qualification.id]} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
                                                        <FileImage className="h-3.5 w-3.5" />
                                                        証書画像を表示
                                                    </a>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="construction" className="mt-6">
                    <Card className="shadow-sm border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">施工実績履歴</CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                                {employee.construction_records.length > 0 ? (
                                    <>
                                        <Button size="sm" variant="outline" render={<Link href={`/api/export/career-history?employeeId=${employee.id}&format=excel`} />}>
                                            Excel出力
                                        </Button>
                                        <Button size="sm" variant="outline" render={<Link href={`/employees/${employee.id}/career-history/print`} target="_blank" />}>
                                            PDF出力
                                        </Button>
                                    </>
                                ) : null}
                                {isAdminOrHr && <AddConstructionModal employeeId={employee.id} onSuccess={() => router.refresh()} />}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {employee.construction_records.length === 0 ? (
                                <p className="text-center py-10 text-muted-foreground text-sm">施工実績がありません。</p>
                            ) : (
                                <div className="space-y-4">
                                    {employee.construction_records.map((record) => (
                                        <div key={record.id} className="flex flex-col border-b last:border-0 pb-4 last:pb-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold">{record.construction_name}</h4>
                                                    {record.category && <Badge variant="outline" className="mt-1">{record.category}</Badge>}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground tabular-nums">{formatDisplayDate(record.construction_date)}</span>
                                                    {isAdminOrHr && (
                                                        <RecordActionsMenu label={record.construction_name}>
                                                            <DropdownMenuItem variant="destructive" onClick={() => setDeletingConstructionId(record.id)}>
                                                                <Trash2 className="h-4 w-4" />
                                                                削除
                                                            </DropdownMenuItem>
                                                        </RecordActionsMenu>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                役割: {record.role || "未登録"} | 場所: {record.location || "未登録"}
                                            </p>
                                            {record.notes && <p className="text-xs text-muted-foreground mt-1 italic">{record.notes}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="family" className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">家族・緊急連絡先</h3>
                        {isAdminOrHr ? <AddFamilyModal employeeId={employee.id} onSuccess={() => router.refresh()} /> : null}
                    </div>
                    {employee.employee_family.length === 0 ? (
                        <Card className="bg-muted/10 border-dashed">
                            <CardContent className="py-10 text-center text-muted-foreground text-sm">
                                家族情報が登録されていません。
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {employee.employee_family.map((family) => (
                                <Card key={family.id} className="shadow-sm">
                                    <CardContent className="p-4 flex justify-between items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">{family.name}</span>
                                                <Badge variant="secondary" className="text-[10px] h-4 px-1">{family.relationship}</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 tabular-nums">{formatDisplayDate(family.birth_date, "不明")} 生まれ</p>
                                            <p className="text-xs text-muted-foreground mt-1">{family.phone_number || "電話番号未登録"}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {family.is_emergency_contact && (
                                                <Badge className={`${alertStyles.danger.badge} border-red-200/70`}>
                                                    緊急連絡先
                                                </Badge>
                                            )}
                                            {isAdminOrHr ? (
                                                <AddFamilyModal employeeId={employee.id} existingRecord={family} onSuccess={() => router.refresh()} />
                                            ) : null}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="health" className="mt-6">
                    <Card className="shadow-sm border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-bold">健康診断記録</CardTitle>
                            <Button
                                size="sm"
                                variant="outline"
                                render={<Link href={`/health-checks?q=${encodeURIComponent(employee.name)}`} />}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                健康診断台帳で追加
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {employee.health_checks.length === 0 ? (
                                <div className="py-10 text-center text-muted-foreground text-sm space-y-3">
                                    <p>受診記録がありません。</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        render={<Link href={`/health-checks?q=${encodeURIComponent(employee.name)}`} />}
                                    >
                                        健康診断台帳を開く
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {employee.health_checks.map((healthCheck) => (
                                        <div key={healthCheck.id} className="relative pl-6 border-l-2 border-primary/20 last:border-l-transparent">
                                            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-4 border-background" />
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-xs font-bold text-primary tabular-nums">{formatDisplayDate(healthCheck.check_date)} 実施</span>
                                                    <h4 className="font-bold">{healthCheck.hospital_name || "健診機関未登録"}</h4>
                                                </div>
                                                <Badge variant={healthCheck.is_normal == null ? "secondary" : healthCheck.is_normal ? "outline" : "destructive"}>
                                                    {getHealthCheckResultLabel(healthCheck.is_normal)}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-2 bg-muted/30 p-2 rounded">{healthCheck.notes || "特記事項なし"}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="seminars" className="mt-6 space-y-6">
                    {/* Exam history */}
                    <Card className="shadow-sm border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">受験履歴</CardTitle>
                            {isAdminOrHr && <AddExamHistoryModal employeeId={employee.id} onSuccess={() => router.refresh()} />}
                        </CardHeader>
                        <CardContent>
                            {employee.exam_history.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground text-sm">受験記録がありません。</p>
                            ) : (
                                <div className="space-y-2">
                                    {employee.exam_history.map((record) => (
                                        <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-0">
                                            <div>
                                                <p className="font-medium text-sm">{record.qualification_name || "（資格名未記入）"}</p>
                                                <p className="text-xs text-muted-foreground tabular-nums">{formatDisplayDate(record.exam_date)}</p>
                                                {record.notes && <p className="text-xs text-muted-foreground mt-0.5">{record.notes}</p>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={record.result === "合格" ? "outline" : "secondary"} className={record.result === "合格" ? "text-green-700 border-green-200 bg-green-50" : "text-destructive bg-destructive/10"}>
                                                    {record.result}
                                                </Badge>
                                                {isAdminOrHr && (
                                                    <Button variant="ghost" size="sm" onClick={() => setDeletingExamHistoryId(record.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Seminar records */}
                    <Card className="shadow-sm border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">セミナー受講履歴</CardTitle>
                            {isAdminOrHr && <AddSeminarModal employeeId={employee.id} onSuccess={() => router.refresh()} />}
                        </CardHeader>
                        <CardContent>
                            {employee.seminar_records.length === 0 ? (
                                <p className="text-center py-8 text-muted-foreground text-sm">セミナー受講記録がありません。</p>
                            ) : (
                                <div className="space-y-2">
                                    {employee.seminar_records.map((record) => (
                                        <div key={record.id} className="flex items-start justify-between py-2 border-b last:border-0">
                                            <div>
                                                <p className="font-medium text-sm">{record.seminar_name}</p>
                                                <p className="text-xs text-muted-foreground tabular-nums">
                                                    {formatDisplayDate(record.held_date)}
                                                    {record.hours ? ` | ${record.hours}時間` : ""}
                                                    {record.organizer ? ` | ${record.organizer}` : ""}
                                                </p>
                                                {record.notes && <p className="text-xs text-muted-foreground mt-0.5">{record.notes}</p>}
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                {record.photo_url && (
                                                    <a href={record.photo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                                                        <FileImage className="h-3.5 w-3.5" />
                                                        写真
                                                    </a>
                                                )}
                                                {isAdminOrHr && (
                                                    <Button variant="ghost" size="sm" onClick={() => setDeletingSeminarId(record.id)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {isAdminOrHr && (
                <DeleteConfirmDialog
                    open={!!deletingQualId}
                    onOpenChange={(open) => !open && setDeletingQualId(null)}
                    title="資格情報の削除"
                    description="この資格情報を完全に削除します。資格台帳と社員詳細から消え、復元はできません。監査履歴は保持されます。"
                    onConfirm={() => handleDeleteQualification(deletingQualId!)}
                />
            )}

            {isAdminOrHr && (
                <DeleteConfirmDialog
                    open={!!deletingConstructionId}
                    onOpenChange={(open) => !open && setDeletingConstructionId(null)}
                    title="施工実績の削除"
                    description="この施工実績を一覧から非表示にします。監査履歴は保持され、後から確認できます。"
                    onConfirm={() => handleDeleteConstruction(deletingConstructionId!)}
                />
            )}

            {isAdminOrHr && (
                <DeleteConfirmDialog
                    open={!!deletingLifeInsuranceId}
                    onOpenChange={(open) => !open && setDeletingLifeInsuranceId(null)}
                    title="生命保険記録の削除"
                    description="この生命保険記録を完全に削除します。保険一覧から消え、復元はできません。監査履歴は保持されます。"
                    onConfirm={() => handleDeleteLifeInsurance(deletingLifeInsuranceId!)}
                />
            )}

            {isAdminOrHr && (
                <DeleteConfirmDialog
                    open={!!deletingDamageInsuranceId}
                    onOpenChange={(open) => !open && setDeletingDamageInsuranceId(null)}
                    title="損害保険記録の削除"
                    description="この損害保険記録を完全に削除します。保険一覧から消え、復元はできません。監査履歴は保持されます。"
                    onConfirm={() => handleDeleteDamageInsurance(deletingDamageInsuranceId!)}
                />
            )}

            {isAdminOrHr && (
                <DeleteConfirmDialog
                    open={!!deletingItAccountId}
                    onOpenChange={(open) => !open && setDeletingItAccountId(null)}
                    title="IT利用情報の削除"
                    description="このIT利用情報を完全に削除します。一覧から消え、復元はできません。監査履歴は保持されます。"
                    onConfirm={() => handleDeleteItAccount(deletingItAccountId!)}
                />
            )}

            {isAdminOrHr && (
                <DeleteConfirmDialog
                    open={!!deletingExamHistoryId}
                    onOpenChange={(open) => !open && setDeletingExamHistoryId(null)}
                    title="受験履歴の削除"
                    description="この受験履歴を完全に削除します。復元はできません。"
                    onConfirm={() => handleDeleteExamHistory(deletingExamHistoryId!)}
                />
            )}

            {isAdminOrHr && (
                <DeleteConfirmDialog
                    open={!!deletingSeminarId}
                    onOpenChange={(open) => !open && setDeletingSeminarId(null)}
                    title="セミナー履歴の削除"
                    description="このセミナー受講履歴を完全に削除します。復元はできません。"
                    onConfirm={() => handleDeleteSeminar(deletingSeminarId!)}
                />
            )}
        </div>
    );
}
