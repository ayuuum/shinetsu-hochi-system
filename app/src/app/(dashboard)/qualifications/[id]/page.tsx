import { createSupabaseServer } from "@/lib/supabase-server";
import { getFastAuthSnapshot } from "@/lib/auth-server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, FileImage } from "lucide-react";
import { AddTrainingModal } from "@/components/qualifications/add-training-modal";
import { alertStyles } from "@/lib/alert-utils";

interface PageProps {
    params: Promise<{ id: string }>;
}

function DetailField({ label, value, tone = "default" }: { label: string; value: ReactNode; tone?: "default" | "muted" }) {
    return (
        <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <div className={tone === "muted" ? "text-sm text-muted-foreground" : "text-base font-medium text-foreground"}>
                {value}
            </div>
        </div>
    );
}

export default async function QualificationDetailPage({ params }: PageProps) {
    const { id } = await params;
    const auth = await getFastAuthSnapshot();
    const supabase = await createSupabaseServer();

    const { data: qualification, error } = await supabase
        .from("employee_qualifications")
        .select(`
            *,
            employees!inner(id, name, branch),
            qualification_master(name, category, has_expiry, renewal_rule)
        `)
        .eq("id", id)
        .is("employees.deleted_at", null)
        .single();

    if (error || !qualification) {
        notFound();
    }

    const qualEmployeeId = qualification.employee_id as string | null;
    if (auth.role === "technician") {
        if (!auth.linkedEmployeeId || qualEmployeeId !== auth.linkedEmployeeId) {
            redirect(auth.linkedEmployeeId ? `/employees/${auth.linkedEmployeeId}` : "/me");
        }
    }

    const { data: certificateImageRows } = await supabase
        .from("certificate_images")
        .select("id, storage_path, caption, sort_order")
        .eq("qualification_id", id)
        .order("sort_order", { ascending: true });

    const certificateImages: { id: string; url: string; caption: string | null }[] = [];
    for (const row of certificateImageRows ?? []) {
        const { data: signed } = await supabase.storage
            .from("certificates")
            .createSignedUrl(row.storage_path, 3600);
        if (signed?.signedUrl) {
            certificateImages.push({
                id: row.id,
                url: signed.signedUrl,
                caption: row.caption,
            });
        }
    }

    // Fallback: legacy single certificate_url, only show if no certificate_images rows exist
    if (certificateImages.length === 0 && qualification.certificate_url) {
        const { data: signed } = await supabase.storage
            .from("certificates")
            .createSignedUrl(qualification.certificate_url, 3600);
        if (signed?.signedUrl) {
            certificateImages.push({
                id: "legacy",
                url: signed.signedUrl,
                caption: null,
            });
        }
    }

    const canManage = auth.role === "admin" || auth.role === "hr";

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
    let trainingHistoryError: string | null = null;

    try {
        const { data, error: trainingError } = await supabase
            .from("training_history")
            .select("*")
            .eq("employee_qualification_id", id)
            .order("training_date", { ascending: false });

        if (trainingError) {
            if (trainingError.code === "42P01") {
                trainingTableExists = false;
            } else {
                trainingHistoryError = "講習履歴を取得できませんでした。時間を置いて再度お試しください。";
            }
        } else {
            trainingHistory = data || [];
        }
    } catch {
        trainingHistoryError = "講習履歴を取得できませんでした。時間を置いて再度お試しください。";
    }

    const statusBadgeClass = (status: string | null) => {
        switch (status) {
            case "更新済み": return alertStyles.ok.badge;
            case "受講予定": return alertStyles.info.badge;
            case "申込中": return alertStyles.warning.badge;
            default: return "bg-muted text-muted-foreground hover:bg-muted";
        }
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-200">
            <div className="space-y-3">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-fit rounded-full px-2.5 text-muted-foreground"
                    render={<Link href="/qualifications" />}
                >
                    <ArrowLeft className="mr-1.5 h-4 w-4" />
                    資格一覧へ戻る
                </Button>
                <div className="space-y-1.5">
                    <h1 className="text-[2rem] font-semibold tracking-[-0.04em] text-balance md:text-[2.5rem]">
                        {qualification.qualification_master?.name || "資格詳細"}
                    </h1>
                    <p className="text-sm text-muted-foreground md:text-base">
                        {qualification.employees?.name || "-"}
                        <span className="mx-2 text-border">/</span>
                        {qualification.employees?.branch || "-"}
                    </p>
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <Card className="border-border/55">
                    <CardHeader className="border-b border-border/45 pb-4">
                        <CardTitle className="text-base font-semibold">
                            資格情報
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-5 pt-1 sm:grid-cols-2">
                        <DetailField
                            label="資格名"
                            value={qualification.qualification_master?.name || "-"}
                        />
                        <DetailField
                            label="カテゴリ"
                            value={qualification.qualification_master?.category || "-"}
                        />
                        <DetailField
                            label="証明書番号"
                            value={qualification.certificate_number || "-"}
                        />
                        <DetailField
                            label="交付機関"
                            value={qualification.issuing_authority || "-"}
                        />
                        <DetailField
                            label="申込状況"
                            value={
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(qualification.status)}`}>
                                    {qualification.status || "未着手"}
                                </span>
                            }
                            tone="muted"
                        />
                        <DetailField
                            label="取得区分"
                            value={qualification.acquisition_type || "-"}
                        />
                        {qualification.notes && (
                            <div className="sm:col-span-2">
                                <DetailField
                                    label="備考"
                                    value={qualification.notes}
                                    tone="muted"
                                />
                            </div>
                        )}
                        {certificateImages.length > 0 ? (
                            <div className="sm:col-span-2">
                                <DetailField
                                    label={`証書画像（${certificateImages.length}枚）`}
                                    value={
                                        <ul className="space-y-1.5">
                                            {certificateImages.map((img, idx) => (
                                                <li key={img.id}>
                                                    <a
                                                        href={img.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                                                    >
                                                        <FileImage className="h-4 w-4 shrink-0" />
                                                        {img.caption || `証書画像 ${idx + 1}`}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    }
                                />
                            </div>
                        ) : null}
                    </CardContent>
                </Card>

                <Card className="border-border/55">
                    <CardHeader className="border-b border-border/45 pb-4">
                        <CardTitle className="text-base font-semibold">
                            期限情報
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-5 pt-1 sm:grid-cols-2">
                        <DetailField
                            label="取得日"
                            value={qualification.acquired_date || "-"}
                        />
                        <DetailField
                            label="有効期限"
                            value={qualification.expiry_date || "期限なし"}
                        />
                        <DetailField
                            label="写真書換期限"
                            value={qualification.photo_renewal_date || "-"}
                        />
                        <DetailField
                            label="更新期限あり"
                            value={qualification.qualification_master?.has_expiry ? "はい" : "いいえ"}
                        />
                        {qualification.qualification_master?.renewal_rule && (
                            <div className="sm:col-span-2">
                                <DetailField
                                    label="更新ルール"
                                    value={qualification.qualification_master.renewal_rule}
                                    tone="muted"
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card className="border-border/55">
                <CardHeader className="flex flex-row items-center justify-between border-b border-border/45 pb-4">
                    <CardTitle className="text-base font-semibold">
                        講習履歴
                    </CardTitle>
                    {canManage && trainingTableExists && !trainingHistoryError && (
                        <AddTrainingModal employeeQualificationId={id} />
                    )}
                </CardHeader>
                <CardContent className="pt-1">
                    {trainingHistoryError ? (
                        <div className="flex min-h-28 items-center justify-center rounded-[16px] bg-muted/25 px-4 text-center text-sm text-muted-foreground">
                            {trainingHistoryError}
                        </div>
                    ) : !trainingTableExists ? (
                        <div className="flex min-h-28 items-center justify-center rounded-[16px] bg-muted/25 px-4 text-center text-sm text-muted-foreground">
                            講習履歴テーブルが未作成です。マイグレーションを実行してください。
                        </div>
                    ) : trainingHistory.length === 0 ? (
                        <div className="flex min-h-28 items-center justify-center rounded-[16px] bg-muted/25 px-4 text-center text-sm text-muted-foreground">
                            講習履歴がありません。
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-[16px] border border-border/55">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/25">
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
                                        <TableRow key={t.id} className="hover:bg-muted/20">
                                            <TableCell className="font-medium">{t.training_date}</TableCell>
                                            <TableCell className="text-sm">{t.training_type}</TableCell>
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
