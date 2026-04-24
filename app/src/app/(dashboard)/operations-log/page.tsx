import Link from "next/link";
import { Activity, ArrowUpRight, FileSpreadsheet, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ManualDailyAlertButton } from "@/components/operations/manual-daily-alert-button";
import { getFastAuthSnapshot } from "@/lib/auth-server";
import { getSupabaseServiceEnv } from "@/lib/supabase-env";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Tables } from "@/types/supabase";

type ImportRunRow = Pick<
    Tables<"import_runs">,
    "id" | "source_file_name" | "status" | "summary" | "inserted_rows" | "failed_rows" | "skipped_rows" | "created_at" | "finished_at"
>;

type JobRunRow = Pick<
    Tables<"job_runs">,
    "id" | "job_key" | "job_label" | "trigger_type" | "status" | "total_items" | "processed_items" | "error_message" | "started_at" | "finished_at" | "triggered_email"
>;

function formatDateTime(value: string | null) {
    if (!value) {
        return "-";
    }

    return new Intl.DateTimeFormat("ja-JP", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function renderStatusBadge(status: "running" | "completed" | "failed") {
    if (status === "completed") {
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">完了</Badge>;
    }
    if (status === "failed") {
        return <Badge variant="destructive">失敗</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">実行中</Badge>;
}

export default async function OperationsLogPage() {
    const auth = await getFastAuthSnapshot();

    if (!auth.user || (auth.role !== "admin" && auth.role !== "hr")) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">運用履歴</h1>
                    <p className="mt-2 text-muted-foreground">インポートや自動通知の実行履歴を確認します。</p>
                </div>
                <Card>
                    <CardContent className="space-y-4 pt-6">
                        <p className="text-sm text-muted-foreground">
                            この画面は管理者または人事のみ利用できます。
                        </p>
                        <Button variant="outline" render={<Link href="/" />}>
                            ダッシュボードへ戻る
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const supabase = await createSupabaseServer();
    const hasServiceRole = !!getSupabaseServiceEnv();
    const [importRunsResult, jobRunsResult] = await Promise.all([
        supabase
            .from("import_runs")
            .select("id, source_file_name, status, summary, inserted_rows, failed_rows, skipped_rows, created_at, finished_at")
            .order("created_at", { ascending: false })
            .limit(20),
        supabase
            .from("job_runs")
            .select("id, job_key, job_label, trigger_type, status, total_items, processed_items, error_message, started_at, finished_at, triggered_email")
            .order("started_at", { ascending: false })
            .limit(20),
    ]);

    const importRuns = (importRunsResult.data || []) as ImportRunRow[];
    const jobRuns = (jobRunsResult.data || []) as JobRunRow[];
    const latestImport = importRuns[0] || null;
    const latestJob = jobRuns[0] || null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">運用履歴</h1>
                    <p className="mt-2 text-muted-foreground">
                        インポート結果と自動通知の実行状況をまとめて確認します。
                    </p>
                </div>
                <ManualDailyAlertButton />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-border/60">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                            最新インポート
                        </CardTitle>
                        <CardDescription>直近の社員インポート結果</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {latestImport ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium">{latestImport.source_file_name || "ファイル名なし"}</p>
                                    {renderStatusBadge(latestImport.status as "running" | "completed" | "failed")}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {latestImport.summary || `${latestImport.inserted_rows}件登録 / ${latestImport.failed_rows}件失敗`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDateTime(latestImport.created_at)}
                                </p>
                                <Button variant="outline" size="sm" render={<Link href="/import" />}>
                                    インポート画面へ
                                </Button>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">まだインポート履歴はありません。</p>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border/60">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                            最新の自動通知
                        </CardTitle>
                        <CardDescription>資格期限アラートの実行結果</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {latestJob ? (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium">{latestJob.job_label}</p>
                                    {renderStatusBadge(latestJob.status as "running" | "completed" | "failed")}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {latestJob.status === "failed"
                                        ? latestJob.error_message || "自動通知の実行に失敗しました"
                                        : `対象 ${latestJob.total_items}名 / 通知送信 ${latestJob.processed_items}名`}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDateTime(latestJob.started_at)}
                                </p>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">まだ自動通知の履歴はありません。</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {!hasServiceRole && (
                <Card className="border-blue-200 bg-blue-50/80">
                    <CardHeader>
                        <CardTitle className="text-base">自動通知の履歴記録が設定されていません</CardTitle>
                        <CardDescription className="text-blue-900/80">
                            サーバーの認証キーが未設定のため、自動実行分の履歴が保存されません。
                            この画面からの手動実行ログは保存されます。
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}

            <Card className="border-border/60">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                        インポート履歴
                    </CardTitle>
                    <CardDescription>直近 20 件の社員インポート結果</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {importRuns.length === 0 ? (
                        <p className="text-sm text-muted-foreground">まだインポート履歴はありません。</p>
                    ) : (
                        importRuns.map((run) => (
                            <div
                                key={run.id}
                                className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/75 px-4 py-3 md:flex-row md:items-center md:justify-between"
                            >
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-medium">{run.source_file_name || "ファイル名なし"}</p>
                                        {renderStatusBadge(run.status as "running" | "completed" | "failed")}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {run.summary || `${run.inserted_rows}件登録 / ${run.failed_rows}件失敗 / ${run.skipped_rows}件スキップ`}
                                    </p>
                                </div>
                                <div className="text-right text-xs text-muted-foreground">
                                    <p>{formatDateTime(run.created_at)}</p>
                                    <p>終了 {formatDateTime(run.finished_at)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            <Card className="border-border/60">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        自動通知の実行履歴
                    </CardTitle>
                    <CardDescription>直近 20 件の自動通知実行結果</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {jobRuns.length === 0 ? (
                        <p className="text-sm text-muted-foreground">まだ実行履歴はありません。</p>
                    ) : (
                        jobRuns.map((run) => (
                            <div
                                key={run.id}
                                className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/75 px-4 py-3 md:flex-row md:items-center md:justify-between"
                            >
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-medium">{run.job_label}</p>
                                        {renderStatusBadge(run.status as "running" | "completed" | "failed")}
                                        <Badge variant="outline">{run.trigger_type === "manual" ? "手動" : "自動"}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {run.status === "failed"
                                            ? run.error_message || "自動通知の実行に失敗しました"
                                            : `対象 ${run.total_items}名 / 通知送信 ${run.processed_items}名`}
                                    </p>
                                    {run.triggered_email && (
                                        <p className="text-xs text-muted-foreground">{run.triggered_email}</p>
                                    )}
                                </div>
                                <div className="text-right text-xs text-muted-foreground">
                                    <p>{formatDateTime(run.started_at)}</p>
                                    <p>終了 {formatDateTime(run.finished_at)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button variant="ghost" render={<Link href="/import" />}>
                    インポート画面へ戻る
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
