"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Tables } from "@/types/supabase";
import {
    previewEmployeeImportAction,
    runEmployeeImportAction,
} from "@/app/actions/admin-ops-actions";
import { type EmployeeImportPreviewRow, type EmployeeImportSourceRow } from "@/lib/imports/employee-import";
import {
    CheckCircle,
    Download,
    FileSpreadsheet,
    History,
    Loader2,
    RefreshCcw,
    Upload,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";

type ImportRunRow = Pick<
    Tables<"import_runs">,
    "id" | "source_file_name" | "status" | "summary" | "inserted_rows" | "failed_rows" | "skipped_rows" | "created_at"
>;

type ImportPreviewSummary = {
    total: number;
    valid: number;
    invalid: number;
    duplicateInFile: number;
    duplicateInDb: number;
};

const COLUMN_MAP: Record<string, string> = {
    "社員番号": "employee_number",
    "氏名": "name",
    "フリガナ": "name_kana",
    "生年月日": "birth_date",
    "性別": "gender",
    "電話番号": "phone_number",
    "メール": "email",
    "住所": "address",
    "入社日": "hire_date",
    "拠点": "branch",
    "雇用形態": "employment_type",
    "職種": "job_title",
    "役職": "position",
    "雇用保険番号": "emp_insurance_no",
    "保険証番号": "health_insurance_no",
    "厚生年金番号": "pension_no",
    "employee_number": "employee_number",
    "name": "name",
    "name_kana": "name_kana",
    "birth_date": "birth_date",
    "gender": "gender",
    "phone_number": "phone_number",
    "email": "email",
    "address": "address",
    "hire_date": "hire_date",
    "branch": "branch",
    "employment_type": "employment_type",
    "job_title": "job_title",
    "position": "position",
    "emp_insurance_no": "emp_insurance_no",
    "health_insurance_no": "health_insurance_no",
    "pension_no": "pension_no",
};

const TEMPLATE_HEADERS = [
    "社員番号",
    "氏名",
    "フリガナ",
    "生年月日",
    "性別",
    "電話番号",
    "メール",
    "住所",
    "入社日",
    "拠点",
    "雇用形態",
    "職種",
    "役職",
    "雇用保険番号",
    "保険証番号",
    "厚生年金番号",
];

const TEMPLATE_SAMPLE_ROW = [
    "SH-001",
    "山田 太郎",
    "ヤマダ タロウ",
    "1985-04-01",
    "男性",
    "090-1234-5678",
    "yamada@example.com",
    "長野県松本市...",
    "2020-04-01",
    "本社",
    "正社員",
    "技術職",
    "主任",
    "",
    "",
    "",
];

function cleanCSVValue(value: string) {
    return value.trim().replace(/\ufeff/g, "");
}

function parseCSV(text: string): EmployeeImportSourceRow[] {
    const records: string[][] = [];
    let currentValue = "";
    let currentRecord: string[] = [];
    let inQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];

        if (char === "\"") {
            if (inQuotes && text[index + 1] === "\"") {
                currentValue += "\"";
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === "," && !inQuotes) {
            currentRecord.push(cleanCSVValue(currentValue));
            currentValue = "";
            continue;
        }

        if ((char === "\n" || char === "\r") && !inQuotes) {
            if (char === "\r" && text[index + 1] === "\n") {
                index += 1;
            }

            currentRecord.push(cleanCSVValue(currentValue));
            currentValue = "";

            if (currentRecord.some((cell) => cell.length > 0)) {
                records.push(currentRecord);
            }

            currentRecord = [];
            continue;
        }

        currentValue += char;
    }

    if (currentValue.length > 0 || currentRecord.length > 0) {
        currentRecord.push(cleanCSVValue(currentValue));
        if (currentRecord.some((cell) => cell.length > 0)) {
            records.push(currentRecord);
        }
    }

    if (records.length === 0) {
        return [];
    }

    const [headers, ...dataRows] = records;

    return dataRows.map((values) => {
        const row: EmployeeImportSourceRow = {};
        headers.forEach((header, index) => {
            const mapped = COLUMN_MAP[cleanCSVValue(header)] || cleanCSVValue(header);
            row[mapped] = values[index] || "";
        });
        return row;
    });
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat("ja-JP", {
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function getRunBadge(status: ImportRunRow["status"]) {
    if (status === "completed") {
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">完了</Badge>;
    }
    if (status === "failed") {
        return <Badge variant="destructive">失敗</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">実行中</Badge>;
}

function escapeCsvValue(value: string) {
    return `"${value.replace(/"/g, "\"\"")}"`;
}

export default function ImportPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [sourceRows, setSourceRows] = useState<EmployeeImportSourceRow[]>([]);
    const [previewRows, setPreviewRows] = useState<EmployeeImportPreviewRow[]>([]);
    const [previewSummary, setPreviewSummary] = useState<ImportPreviewSummary | null>(null);
    const [recentRuns, setRecentRuns] = useState<ImportRunRow[]>([]);
    const [importing, setImporting] = useState(false);
    const [validating, setValidating] = useState(false);
    const [loadingRuns, setLoadingRuns] = useState(false);
    const [importResult, setImportResult] = useState<{ inserted: number; failed: number; skipped: number } | null>(null);
    const { isAdminOrHr, loading } = useAuth();

    const loadRecentRuns = useCallback(async () => {
        setLoadingRuns(true);
        const { data, error } = await supabase
            .from("import_runs")
            .select("id, source_file_name, status, summary, inserted_rows, failed_rows, skipped_rows, created_at")
            .eq("import_kind", "employees")
            .order("created_at", { ascending: false })
            .limit(6);

        setLoadingRuns(false);

        if (error) {
            console.error("Failed to load import runs:", error);
            return;
        }

        setRecentRuns((data || []) as ImportRunRow[]);
    }, []);

    useEffect(() => {
        if (!isAdminOrHr) {
            return;
        }

        void loadRecentRuns();
    }, [isAdminOrHr, loadRecentRuns]);

    const resetImport = useCallback(() => {
        setFile(null);
        setSourceRows([]);
        setPreviewRows([]);
        setPreviewSummary(null);
        setImportResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, []);

    const processFile = useCallback(async (nextFile: File) => {
        setValidating(true);
        setImportResult(null);
        setPreviewRows([]);
        setPreviewSummary(null);
        setSourceRows([]);

        try {
            const text = await nextFile.text();
            const rows = parseCSV(text);

            if (rows.length === 0) {
                toast.error("データが見つかりません。ヘッダー行とデータ行を確認してください。");
                return;
            }

            const result = await previewEmployeeImportAction(rows);
            if (!result.success) {
                toast.error(result.error);
                return;
            }

            setSourceRows(rows);
            setPreviewRows(result.rows);
            setPreviewSummary(result.summary);
        } catch (error) {
            console.error("Failed to parse import file:", error);
            toast.error("CSVの解析に失敗しました。ファイル形式を確認してください。");
        } finally {
            setValidating(false);
        }
    }, []);

    const handleDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        const nextFile = event.dataTransfer.files[0];
        if (!nextFile || (!nextFile.name.endsWith(".csv") && !nextFile.name.endsWith(".txt"))) {
            resetImport();
            toast.error("CSVファイルを選択してください。");
            return;
        }

        setFile(nextFile);
        void processFile(nextFile);
    }, [processFile, resetImport]);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextFile = event.target.files?.[0];
        if (!nextFile) {
            return;
        }

        setFile(nextFile);
        void processFile(nextFile);
    };

    const handleImport = async () => {
        if (sourceRows.length === 0) {
            return;
        }

        setImporting(true);
        const result = await runEmployeeImportAction({
            sourceRows,
            fileName: file?.name,
        });
        setImporting(false);

        if (!result.success) {
            toast.error(result.error);
            await loadRecentRuns();
            return;
        }

        setImportResult({
            inserted: result.inserted,
            failed: result.failed,
            skipped: result.skipped,
        });
        toast.success(`${result.inserted}件の社員データを登録しました。`);
        await loadRecentRuns();
        router.refresh();
    };

    const downloadTemplateCsv = useCallback(() => {
        const csv = [
            TEMPLATE_HEADERS.map(escapeCsvValue).join(","),
            TEMPLATE_SAMPLE_ROW.map(escapeCsvValue).join(","),
        ].join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "employee-import-template.csv";
        anchor.click();
        URL.revokeObjectURL(url);
    }, []);

    const downloadErrorCsv = useCallback(() => {
        const invalidRows = previewRows.filter((row) => !row.valid);
        if (invalidRows.length === 0) {
            return;
        }

        const csv = [
            ["行番号", "社員番号", "氏名", "エラー内容"].join(","),
            ...invalidRows.map((row) => [
                row.row,
                `"${row.employeeNumber.replace(/"/g, "\"\"")}"`,
                `"${row.name.replace(/"/g, "\"\"")}"`,
                `"${row.errors.join(" / ").replace(/"/g, "\"\"")}"`,
            ].join(",")),
        ].join("\n");

        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "employee-import-errors.csv";
        anchor.click();
        URL.revokeObjectURL(url);
    }, [previewRows]);

    if (loading) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
                権限を確認中...
            </div>
        );
    }

    if (!isAdminOrHr) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">データインポート</h1>
                    <p className="mt-2 text-muted-foreground">CSVファイルから社員データを一括登録します。</p>
                </div>
                <Card>
                    <CardContent className="space-y-4 pt-6">
                        <p className="text-sm text-muted-foreground">
                            この画面は管理者または人事のみ利用できます。
                        </p>
                        <Button variant="outline" onClick={() => router.push("/employees")}>
                            社員一覧へ戻る
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">データインポート</h1>
                    <p className="mt-2 text-muted-foreground">
                        1) CSVをアップロード → 2) 自動チェック（必須項目・日付形式・社員番号重複）→ 3) 問題なければ一括登録、の流れで進みます。
                    </p>
                </div>
                <Button variant="outline" render={<Link href="/operations-log" />}>
                    <History className="mr-2 h-4 w-4" />
                    運用履歴を見る
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        ファイルアップロード
                    </CardTitle>
                    <CardDescription>
                        ExcelからCSV形式で保存したファイルを取り込みます。UTF-8 のCSVを選択すると、サーバー側で「必須項目」「日付形式」「社員番号の重複」を自動チェックします。
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50/80 p-4 text-sm text-blue-950 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="font-semibold">社員CSVテンプレートを使って移行してください</p>
                            <p className="mt-1 text-blue-900/80">
                                Excelファイルを直接取り込むのではなく、必要な列をそろえてCSVとして保存してからアップロードします。
                            </p>
                        </div>
                        <Button type="button" variant="outline" onClick={downloadTemplateCsv} className="shrink-0 bg-white">
                            <Download className="mr-2 h-4 w-4" />
                            テンプレートCSV
                        </Button>
                    </div>

                    <div
                        onDrop={handleDrop}
                        onDragOver={(event) => event.preventDefault()}
                        className="cursor-pointer rounded-2xl border-2 border-dashed border-border/70 px-6 py-12 text-center transition-colors hover:border-primary/50"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {validating ? (
                            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-muted-foreground" />
                        ) : (
                            <Upload className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                        )}
                        <p className="text-sm text-muted-foreground">
                            {validating ? "CSVを検証中..." : "ドラッグ&ドロップ または クリックしてファイルを選択"}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                            一度に処理できるのは 1,500 行までです
                        </p>
                        {file && <p className="mt-3 text-sm font-medium">{file.name}</p>}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.txt"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">必須: 社員番号 / 氏名 / フリガナ / 生年月日 / 入社日 / 拠点</Badge>
                        <Badge variant="outline">重複チェック: 社員番号（既存・CSV内）</Badge>
                        <Badge variant="outline">日付形式: YYYY-MM-DD または YYYY/M/D</Badge>
                        <Badge variant="outline">最大: 1,500行 / 回</Badge>
                    </div>
                </CardContent>
            </Card>

            {previewSummary && (
                <Card>
                    <CardHeader>
                        <CardTitle>事前チェック結果</CardTitle>
                        <CardDescription>
                            {previewSummary.total}行中 {previewSummary.valid}行が登録OK、{previewSummary.invalid}行にエラーがあります。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-4">
                            <div className="rounded-2xl border border-border/60 bg-background/75 p-4">
                                <p className="text-xs text-muted-foreground">登録OK</p>
                                <p className="mt-2 text-2xl font-semibold">{previewSummary.valid}</p>
                            </div>
                            <div className="rounded-2xl border border-border/60 bg-background/75 p-4">
                                <p className="text-xs text-muted-foreground">エラー</p>
                                <p className="mt-2 text-2xl font-semibold">{previewSummary.invalid}</p>
                            </div>
                            <div className="rounded-2xl border border-border/60 bg-background/75 p-4">
                                <p className="text-xs text-muted-foreground">ファイル内で重複</p>
                                <p className="mt-2 text-2xl font-semibold">{previewSummary.duplicateInFile}</p>
                            </div>
                            <div className="rounded-2xl border border-border/60 bg-background/75 p-4">
                                <p className="text-xs text-muted-foreground">既に登録済み</p>
                                <p className="mt-2 text-2xl font-semibold">{previewSummary.duplicateInDb}</p>
                            </div>
                        </div>

                        <div className="max-h-[420px] space-y-2 overflow-y-auto">
                            {previewRows.map((row) => (
                                <div
                                    key={row.row}
                                    className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
                                        row.valid
                                            ? "border-emerald-200 bg-emerald-50/80"
                                            : "border-rose-200 bg-rose-50/80"
                                    }`}
                                >
                                    {row.valid ? (
                                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                    ) : (
                                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium">
                                            {row.row}行目: {row.name || "(氏名未入力)"} {row.employeeNumber ? `(${row.employeeNumber})` : ""}
                                        </p>
                                        {!row.valid && (
                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                {row.errors.map((errorMessage) => (
                                                    <Badge key={`${row.row}-${errorMessage}`} variant="destructive" className="text-[10px]">
                                                        {errorMessage}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Button
                                onClick={handleImport}
                                disabled={importing || validating || previewSummary.valid === 0}
                                className="flex-1"
                            >
                                {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {previewSummary.invalid > 0
                                    ? `エラーなし行のみ登録（${previewSummary.valid}件）`
                                    : `${previewSummary.valid}件をインポート`}
                            </Button>
                            {previewSummary.invalid > 0 && (
                                <Button variant="outline" onClick={downloadErrorCsv}>
                                    <Download className="mr-2 h-4 w-4" />
                                    エラーCSVを出力
                                </Button>
                            )}
                            <Button variant="outline" onClick={resetImport}>
                                <RefreshCcw className="mr-2 h-4 w-4" />
                                別ファイルを選ぶ
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {importResult && (
                <Card>
                    <CardContent className="space-y-4 pt-6 text-center">
                        <CheckCircle className="mx-auto h-12 w-12 text-emerald-600" />
                        <div>
                            <p className="text-xl font-semibold">{importResult.inserted}件の社員データを登録しました</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                失敗 {importResult.failed}件 / スキップ {importResult.skipped}件
                            </p>
                        </div>
                        <div className="flex flex-col justify-center gap-3 sm:flex-row">
                            <Button variant="outline" onClick={resetImport}>
                                別のファイルをインポート
                            </Button>
                            <Button render={<Link href="/employees" />}>
                                社員一覧を確認
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>直近のインポート履歴</CardTitle>
                        <CardDescription>
                            実行結果と失敗件数をこの画面でも確認できます。
                        </CardDescription>
                    </div>
                    {loadingRuns && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </CardHeader>
                <CardContent className="space-y-3">
                    {recentRuns.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
                            まだインポート履歴はありません。
                        </div>
                    ) : (
                        recentRuns.map((run) => (
                            <div
                                key={run.id}
                                className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3 md:flex-row md:items-center md:justify-between"
                            >
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-medium">{run.source_file_name || "ファイル名なし"}</p>
                                        {getRunBadge(run.status)}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {run.summary || `${run.inserted_rows}件登録 / ${run.failed_rows}件失敗 / ${run.skipped_rows}件スキップ`}
                                    </p>
                                </div>
                                <p className="text-xs text-muted-foreground">{formatDateTime(run.created_at)}</p>
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
