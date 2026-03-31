import { createSupabaseServer } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Calendar, Building2, FileText, GraduationCap } from "lucide-react";
import { AddTrainingModal } from "@/components/qualifications/add-training-modal";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function QualificationDetailPage({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createSupabaseServer();

    const { data: qualification, error } = await supabase
        .from("employee_qualifications")
        .select(`
            *,
            employees(id, name, branch),
            qualification_master(name, category, has_expiry, renewal_rule)
        `)
        .eq("id", id)
        .single();

    if (error || !qualification) {
        notFound();
    }

    // Fetch training history - handle case where table may not exist
    let trainingHistory: {
        id: string;
        training_date: string;
        training_type: string;
        provider: string | null;
        certificate_number: string | null;
        next_due_date: string | null;
        notes: string | null;
        created_at: string | null;
    }[] = [];
    let trainingTableExists = true;

    try {
        const { data, error: trainingError } = await supabase
            .from("training_history")
            .select("*")
            .eq("employee_qualification_id", id)
            .order("training_date", { ascending: false });

        if (trainingError) {
            // Table likely doesn't exist yet
            trainingTableExists = false;
        } else {
            trainingHistory = data || [];
        }
    } catch {
        // training_history table may not exist yet
        trainingTableExists = false;
    }

    const statusBadgeClass = (status: string | null) => {
        switch (status) {
            case "更新済み": return "bg-green-100 text-green-700 hover:bg-green-100";
            case "受講予定": return "bg-blue-100 text-blue-700 hover:bg-blue-100";
            case "申込中": return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100";
            default: return "bg-gray-100 text-gray-700 hover:bg-gray-100";
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" render={<Link href="/qualifications" />}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {qualification.qualification_master?.name || "資格詳細"}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {qualification.employees?.name || "-"} / {qualification.employees?.branch || "-"}
                    </p>
                </div>
            </div>

            {/* Qualification Details */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <FileText className="h-5 w-5" />
                            資格情報
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground">資格名</p>
                                <p className="font-medium">{qualification.qualification_master?.name || "-"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">カテゴリ</p>
                                <Badge variant="outline">{qualification.qualification_master?.category || "-"}</Badge>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground">証明書番号</p>
                                <p className="font-medium">{qualification.certificate_number || "-"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">交付機関</p>
                                <p className="font-medium">{qualification.issuing_authority || "-"}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">申込状況</p>
                            <Badge variant="secondary" className={statusBadgeClass(qualification.status)}>
                                {qualification.status || "未着手"}
                            </Badge>
                        </div>
                        {qualification.notes && (
                            <div>
                                <p className="text-xs text-muted-foreground">備考</p>
                                <p className="text-sm">{qualification.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="h-5 w-5" />
                            期限情報
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground">取得日</p>
                                <p className="font-medium">{qualification.acquired_date || "-"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">有効期限</p>
                                <p className="font-medium">{qualification.expiry_date || "期限なし"}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground">写真書換期限</p>
                                <p className="font-medium">{qualification.photo_renewal_date || "-"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">更新期限あり</p>
                                <p className="font-medium">
                                    {qualification.qualification_master?.has_expiry ? "はい" : "いいえ"}
                                </p>
                            </div>
                        </div>
                        {qualification.qualification_master?.renewal_rule && (
                            <div>
                                <p className="text-xs text-muted-foreground">更新ルール</p>
                                <p className="text-sm">{qualification.qualification_master.renewal_rule}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Training History */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <GraduationCap className="h-5 w-5" />
                        講習履歴
                    </CardTitle>
                    <AddTrainingModal employeeQualificationId={id} />
                </CardHeader>
                <CardContent>
                    {!trainingTableExists ? (
                        <div className="flex items-center justify-center h-24 text-muted-foreground">
                            <Building2 className="mr-2 h-4 w-4" />
                            講習履歴テーブルが未作成です。マイグレーションを実行してください。
                        </div>
                    ) : trainingHistory.length === 0 ? (
                        <div className="flex items-center justify-center h-24 text-muted-foreground">
                            講習履歴がありません。
                        </div>
                    ) : (
                        <div className="border rounded-xl overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead>受講日</TableHead>
                                        <TableHead>種別</TableHead>
                                        <TableHead>実施機関</TableHead>
                                        <TableHead>修了証番号</TableHead>
                                        <TableHead>次回期限</TableHead>
                                        <TableHead>備考</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {trainingHistory.map((t) => (
                                        <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-medium">{t.training_date}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{t.training_type}</Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">{t.provider || "-"}</TableCell>
                                            <TableCell className="text-sm">{t.certificate_number || "-"}</TableCell>
                                            <TableCell className="text-sm">{t.next_due_date || "-"}</TableCell>
                                            <TableCell className="text-sm">{t.notes || "-"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
