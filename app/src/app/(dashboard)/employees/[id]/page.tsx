"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
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
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ja } from "date-fns/locale";
import { AddQualificationModal } from "@/components/employees/add-qualification-modal";
import { EditEmployeeModal } from "@/components/employees/edit-employee-modal";
import { AddConstructionModal } from "@/components/employees/add-construction-modal";
import { DeleteConfirmDialog } from "@/components/shared/delete-confirm-dialog";

type EmployeeQualification = Tables<"employee_qualifications"> & {
    qualification_master: Tables<"qualification_master"> | null;
};

type EmployeeDetail = Tables<"employees"> & {
    employee_qualifications: EmployeeQualification[];
    employee_family: Tables<"employee_family">[];
    construction_records: Tables<"construction_records">[];
    health_checks: Tables<"health_checks">[];
};

function getExpiryBadge(expiryDate: string | null) {
    if (!expiryDate) return null;
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return <Badge variant="destructive">{Math.abs(days)}日超過</Badge>;
    if (days <= 14) return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">残{days}日</Badge>;
    if (days <= 30) return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">残{days}日</Badge>;
    if (days <= 60) return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">残{days}日</Badge>;
    return <Badge variant="secondary" className="bg-green-100 text-green-600 hover:bg-green-100">有効</Badge>;
}

export default function EmployeeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deletingQualId, setDeletingQualId] = useState<string | null>(null);
    const [deletingConstructionId, setDeletingConstructionId] = useState<string | null>(null);
    const [certUrls, setCertUrls] = useState<Record<string, string>>({});

    const handleDeleteQualification = async (qualId: string) => {
        const { error } = await supabase.from("employee_qualifications").delete().eq("id", qualId);
        if (error) {
            toast.error("削除に失敗しました: " + error.message);
        } else {
            toast.success("資格情報を削除しました");
            fetchEmployeeDetail();
        }
        setDeletingQualId(null);
    };

    const handleDeleteConstruction = async (recordId: string) => {
        const { error } = await supabase.from("construction_records").delete().eq("id", recordId);
        if (error) {
            toast.error("削除に失敗しました: " + error.message);
        } else {
            toast.success("施工実績を削除しました");
            fetchEmployeeDetail();
        }
        setDeletingConstructionId(null);
    };

    useEffect(() => {
        if (params.id) fetchEmployeeDetail();
    }, [params.id]);

    const fetchEmployeeDetail = async () => {
        setLoading(true);
        const id = params.id as string;

        // construction_records と health_checks はテーブルが存在しない可能性に備え個別取得
        const { data: empData } = await supabase
            .from("employees")
            .select(`
                *,
                employee_qualifications(*, qualification_master(*)),
                employee_family(*)
            `)
            .eq("id", id)
            .single();

        if (empData) {
            // construction_records
            const { data: constructionData } = await supabase
                .from("construction_records")
                .select("*")
                .eq("employee_id", id)
                .order("construction_date", { ascending: false });

            // health_checks
            const { data: healthData } = await supabase
                .from("health_checks")
                .select("*")
                .eq("employee_id", id)
                .order("check_date", { ascending: false });

            const employeeDetail = {
                ...empData,
                construction_records: constructionData || [],
                health_checks: healthData || [],
            } as EmployeeDetail;
            setEmployee(employeeDetail);

            // Fetch signed URLs for certificate images
            const qualsWithCert = empData.employee_qualifications?.filter(
                (q: EmployeeQualification) => q.certificate_url
            ) || [];
            if (qualsWithCert.length > 0) {
                const urls: Record<string, string> = {};
                for (const q of qualsWithCert) {
                    const { data } = await supabase.storage
                        .from("certificates")
                        .createSignedUrl(q.certificate_url!, 3600);
                    if (data?.signedUrl) urls[q.id] = data.signedUrl;
                }
                setCertUrls(urls);
            }
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        setDeleting(true);
        const { error } = await supabase
            .from("employees")
            .delete()
            .eq("id", employee!.id);

        setDeleting(false);
        if (error) {
            toast.error("削除に失敗しました: " + error.message);
        } else {
            router.push("/employees");
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">読み込み中...</div>;
    }

    if (!employee) {
        return <div className="text-center py-20 text-muted-foreground">社員が見つかりませんでした。</div>;
    }

    const DetailItem = ({ label, value }: { label: string; value: string | null | number }) => (
        <div className="grid grid-cols-3 border-b border-border/50 py-3 last:border-0">
            <span className="text-muted-foreground text-sm">{label}</span>
            <span className="col-span-2 font-medium text-sm">{value || "-"}</span>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Button variant="ghost" onClick={() => router.back()} className="w-fit -ml-2 text-muted-foreground">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    一覧へ戻る
                </Button>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-inner">
                            <User className="h-10 w-10" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">{employee.name}</h1>
                                <Badge variant="outline" className="bg-primary/5">{employee.branch}</Badge>
                                {employee.termination_date && <Badge variant="destructive">退職済</Badge>}
                            </div>
                            <p className="text-muted-foreground font-medium">{employee.name_kana} | {employee.employee_number}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{employee.address || "住所未登録"}</span>
                                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{employee.hire_date ? `入社: ${format(new Date(employee.hire_date), "yyyy年MM月dd日", { locale: ja })}` : "入社日未登録"}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setEditOpen(true)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            編集する
                        </Button>
                        <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            削除
                        </Button>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            <EditEmployeeModal
                employee={employee}
                open={editOpen}
                onOpenChange={setEditOpen}
                onSuccess={fetchEmployeeDetail}
            />

            {/* Delete Confirmation */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>社員の削除</DialogTitle>
                        <DialogDescription>
                            {employee.name}（{employee.employee_number}）を削除します。この操作は取り消せません。関連する資格・施工実績・家族情報もすべて削除されます。
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>キャンセル</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? "削除中..." : "削除する"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Main Content Tabs */}
            <Tabs defaultValue="basic" className="w-full">
                <TabsList className="flex w-full h-12 bg-muted/30 p-1 rounded-xl overflow-x-auto">
                    <TabsTrigger value="basic" className="flex-shrink-0 rounded-lg data-[state=active]:shadow-sm"><User className="mr-1.5 h-4 w-4" />基本情報</TabsTrigger>
                    <TabsTrigger value="qualifications" className="flex-shrink-0 rounded-lg data-[state=active]:shadow-sm"><Award className="mr-1.5 h-4 w-4" />保有資格</TabsTrigger>
                    <TabsTrigger value="construction" className="flex-shrink-0 rounded-lg data-[state=active]:shadow-sm"><HardHat className="mr-1.5 h-4 w-4" />施工実績</TabsTrigger>
                    <TabsTrigger value="family" className="flex-shrink-0 rounded-lg data-[state=active]:shadow-sm"><Users className="mr-1.5 h-4 w-4" />家族</TabsTrigger>
                    <TabsTrigger value="health" className="flex-shrink-0 rounded-lg data-[state=active]:shadow-sm"><Heart className="mr-1.5 h-4 w-4" />健康診断</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="mt-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="shadow-sm border-border/50">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2"><User className="h-5 w-5 text-primary" />個人・連絡先</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-0">
                                <DetailItem label="生年月日" value={employee.birth_date} />
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
                                <DetailItem label="雇用形態" value={employee.employment_type} />
                                <DetailItem label="入社年月日" value={employee.hire_date} />
                                <DetailItem label="退職日" value={employee.termination_date} />
                                <DetailItem label="健康保険番号" value={employee.health_insurance_no} />
                                <DetailItem label="年金番号" value={employee.pension_no} />
                                <DetailItem label="雇用保険番号" value={employee.emp_insurance_no} />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="qualifications" className="mt-6 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">保有資格一覧</h3>
                        <AddQualificationModal employeeId={employee.id} onSuccess={fetchEmployeeDetail} />
                    </div>
                    {employee.employee_qualifications.length === 0 ? (
                        <Card className="bg-muted/10 border-dashed"><CardContent className="py-10 text-center text-muted-foreground text-sm">資格情報が登録されていません。</CardContent></Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {employee.employee_qualifications.map((eq) => (
                                <Card key={eq.id} className="shadow-sm hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <Badge className="w-fit">{eq.qualification_master?.category || "一般"}</Badge>
                                            <div className="flex items-center gap-1">
                                                {getExpiryBadge(eq.expiry_date)}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                                    onClick={() => setDeletingQualId(eq.id)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardTitle className="text-base">{eq.qualification_master?.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="text-sm space-y-1">
                                        <div className="flex justify-between"><span className="text-muted-foreground">免状番号</span><span>{eq.certificate_number || "-"}</span></div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">取得日</span><span>{eq.acquired_date || "-"}</span></div>
                                        <div className="flex justify-between font-bold">
                                            <span className="text-muted-foreground">有効期限</span>
                                            <span className={eq.expiry_date && new Date(eq.expiry_date) < new Date() ? "text-destructive" : ""}>
                                                {eq.expiry_date || "期限なし"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between"><span className="text-muted-foreground">ステータス</span><span>{eq.status || "未着手"}</span></div>
                                        {certUrls[eq.id] && (
                                            <a href={certUrls[eq.id]} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline">
                                                <FileImage className="h-3.5 w-3.5" />
                                                証書画像を表示
                                            </a>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="construction" className="mt-6">
                    <Card className="shadow-sm border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-lg">施工実績履歴</CardTitle>
                            <AddConstructionModal employeeId={employee.id} onSuccess={fetchEmployeeDetail} />
                        </CardHeader>
                        <CardContent>
                            {employee.construction_records.length === 0 ? (
                                <p className="text-center py-10 text-muted-foreground text-sm">施工実績がありません。</p>
                            ) : (
                                <div className="space-y-4">
                                    {employee.construction_records.map((res) => (
                                        <div key={res.id} className="flex flex-col border-b last:border-0 pb-4 last:pb-0">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-bold">{res.construction_name}</h4>
                                                    {res.category && <Badge variant="outline" className="mt-1">{res.category}</Badge>}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">{res.construction_date}</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                                        onClick={() => setDeletingConstructionId(res.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                役割: {res.role || "未登録"} | 場所: {res.location || "未登録"}
                                            </p>
                                            {res.notes && <p className="text-xs text-muted-foreground mt-1 italic">{res.notes}</p>}
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
                        <Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" />家族追加</Button>
                    </div>
                    {employee.employee_family.length === 0 ? (
                        <Card className="bg-muted/10 border-dashed"><CardContent className="py-10 text-center text-muted-foreground text-sm">家族情報が登録されていません。</CardContent></Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {employee.employee_family.map((fam) => (
                                <Card key={fam.id} className="shadow-sm">
                                    <CardContent className="p-4 flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold">{fam.name}</span>
                                                <Badge variant="secondary" className="text-[10px] h-4 px-1">{fam.relationship}</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">{fam.birth_date || "不明"} 生まれ</p>
                                        </div>
                                        {fam.is_emergency_contact && <Badge className="bg-red-100 text-red-600 hover:bg-red-100 border-red-200">緊急連絡先</Badge>}
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
                            <Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" />受診記録追加</Button>
                        </CardHeader>
                        <CardContent>
                            {employee.health_checks.length === 0 ? (
                                <p className="text-center py-10 text-muted-foreground text-sm">受診記録がありません。</p>
                            ) : (
                                <div className="space-y-6">
                                    {employee.health_checks.map((hc) => (
                                        <div key={hc.id} className="relative pl-6 border-l-2 border-primary/20 last:border-l-transparent">
                                            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-4 border-background" />
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="text-xs font-bold text-primary">{hc.check_date} 実施</span>
                                                    <h4 className="font-bold">{hc.hospital_name || "健診機関未登録"}</h4>
                                                </div>
                                                <Badge variant={hc.is_normal ? "outline" : "destructive"}>
                                                    {hc.is_normal ? "異常なし" : "要再検査"}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-2 bg-muted/30 p-2 rounded">{hc.notes || "特記事項なし"}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Qualification Delete Dialog */}
            <DeleteConfirmDialog
                open={!!deletingQualId}
                onOpenChange={(open) => !open && setDeletingQualId(null)}
                title="資格情報の削除"
                description="この資格情報を削除します。この操作は取り消せません。"
                onConfirm={() => handleDeleteQualification(deletingQualId!)}
            />

            {/* Construction Delete Dialog */}
            <DeleteConfirmDialog
                open={!!deletingConstructionId}
                onOpenChange={(open) => !open && setDeletingConstructionId(null)}
                title="施工実績の削除"
                description="この施工実績を削除します。この操作は取り消せません。"
                onConfirm={() => handleDeleteConstruction(deletingConstructionId!)}
            />
        </div>
    );
}
