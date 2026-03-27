"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type ParsedRow = Record<string, string>;
type ValidationResult = {
    row: number;
    data: ParsedRow;
    errors: string[];
    valid: boolean;
};

const REQUIRED_FIELDS = ["employee_number", "name", "name_kana", "birth_date"];
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
    "血液型": "blood_type",
    // English column names
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
    "blood_type": "blood_type",
};

function cleanCSVValue(value: string) {
    return value.trim().replace(/\ufeff/g, "");
}

function parseCSV(text: string): { headers: string[]; rows: ParsedRow[] } {
    const records: string[][] = [];
    let currentValue = "";
    let currentRecord: string[] = [];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (char === "\"") {
            if (inQuotes && text[i + 1] === "\"") {
                currentValue += "\"";
                i++;
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
            if (char === "\r" && text[i + 1] === "\n") {
                i++;
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

    if (records.length === 0) return { headers: [], rows: [] };

    const [rawHeaders, ...dataRows] = records;
    const headers = rawHeaders.map((header) => cleanCSVValue(header));
    const rows: ParsedRow[] = [];

    for (const values of dataRows) {
        const row: ParsedRow = {};
        headers.forEach((h, idx) => {
            const mapped = COLUMN_MAP[h] || h;
            row[mapped] = values[idx] || "";
        });
        rows.push(row);
    }

    return { headers, rows };
}

function validateRow(row: ParsedRow, index: number): ValidationResult {
    const errors: string[] = [];

    for (const field of REQUIRED_FIELDS) {
        if (!row[field] || !row[field].trim()) {
            const label = Object.entries(COLUMN_MAP).find(([, v]) => v === field)?.[0] || field;
            errors.push(`${label}が未入力`);
        }
    }

    if (row.birth_date && !/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(row.birth_date)) {
        errors.push("生年月日の形式が不正（YYYY-MM-DD）");
    }

    if (row.email && row.email.trim() && !row.email.includes("@")) {
        errors.push("メールアドレスの形式が不正");
    }

    return { row: index + 2, data: row, errors, valid: errors.length === 0 };
}

export default function ImportPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [results, setResults] = useState<ValidationResult[] | null>(null);
    const [importing, setImporting] = useState(false);
    const [validating, setValidating] = useState(false);
    const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

    const processFile = useCallback(async (f: File) => {
        setValidating(true);
        setImportResult(null);
        setResults(null);

        try {
            const text = await f.text();
            const { rows } = parseCSV(text);

            if (rows.length === 0) {
                toast.error("データが見つかりません");
                return;
            }

            const validated = rows.map((row, i) => validateRow(row, i));
            setResults(validated);
        } catch (error) {
            console.error("Failed to parse import file:", error);
            toast.error("CSVの解析に失敗しました。ファイル形式を確認してください。");
            setResults(null);
        } finally {
            setValidating(false);
        }
    }, []);

    const resetImport = useCallback(() => {
        setFile(null);
        setResults(null);
        setImportResult(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f && (f.name.endsWith(".csv") || f.name.endsWith(".txt"))) {
            setFile(f);
            void processFile(f);
        } else {
            resetImport();
            toast.error("CSVファイルを選択してください");
        }
    }, [processFile, resetImport]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
            void processFile(f);
        }
    };

    const handleImport = async (skipErrors: boolean) => {
        if (!results) return;

        const toImport = skipErrors ? results.filter(r => r.valid) : results;
        if (toImport.some(r => !r.valid) && !skipErrors) {
            toast.error("エラー行があります。「エラー行をスキップしてインポート」を使用してください。");
            return;
        }

        setImporting(true);
        let success = 0;
        let failed = 0;

        for (const item of toImport) {
            if (!item.valid) continue;
            const d = item.data;
            const { error } = await supabase.from("employees").insert([{
                employee_number: d.employee_number,
                name: d.name,
                name_kana: d.name_kana,
                birth_date: d.birth_date.replace(/\//g, "-"),
                gender: d.gender || null,
                phone_number: d.phone_number || null,
                email: d.email || null,
                address: d.address || null,
                hire_date: d.hire_date?.replace(/\//g, "-") || null,
                branch: d.branch || null,
                employment_type: d.employment_type || null,
                job_title: d.job_title || null,
                blood_type: d.blood_type || null,
            }]);

            if (error) {
                failed++;
                console.error(`Row ${item.row}:`, error.message);
            } else {
                success++;
            }
        }

        setImporting(false);
        setImportResult({ success, failed });

        if (failed === 0) {
            toast.success(`${success}名の社員を登録しました`);
        } else {
            toast.error(`${success}名登録、${failed}名失敗`);
        }
    };

    const validCount = results?.filter(r => r.valid).length || 0;
    const errorCount = results?.filter(r => !r.valid).length || 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">データインポート</h1>
                <p className="text-muted-foreground mt-2">CSVファイルから社員データを一括登録します。</p>
            </div>

            {!importResult && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileSpreadsheet className="h-5 w-5" />
                            ファイルアップロード
                        </CardTitle>
                        <CardDescription>
                            CSVファイル（カンマ区切り、UTF-8）をアップロードしてください。
                            ヘッダー行に「社員番号, 氏名, フリガナ, 生年月日」が必須です。
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            className="border-2 border-dashed rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {validating ? (
                                <Loader2 className="mx-auto h-10 w-10 text-muted-foreground mb-4 animate-spin" />
                            ) : (
                                <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                            )}
                            <p className="text-sm text-muted-foreground">
                                {validating ? "CSVを検証中..." : "ドラッグ&ドロップ または クリックしてファイルを選択"}
                            </p>
                            {file && <p className="mt-2 text-sm font-medium">{file.name}</p>}
                            <input
                                id="file-input"
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.txt"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {results && !importResult && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>バリデーション結果</CardTitle>
                            <CardDescription>
                                {results.length}行中 {validCount}行OK、{errorCount}行エラー
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-[400px] overflow-y-auto space-y-2">
                                {results.map((r) => (
                                    <div
                                        key={r.row}
                                        className={`flex items-start gap-3 p-3 rounded-lg text-sm ${r.valid ? "bg-green-50" : "bg-red-50"}`}
                                    >
                                        {r.valid
                                            ? <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                            : <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                                        }
                                        <div className="flex-1 min-w-0">
                                            <span className="font-medium">
                                                {r.row}行目: {r.data.name || "(名前なし)"} ({r.data.employee_number || "番号なし"})
                                            </span>
                                            {!r.valid && (
                                                <div className="mt-1 text-red-600">
                                                    {r.errors.map((err, i) => (
                                                        <span key={i} className="mr-2">
                                                            <Badge variant="destructive" className="text-[10px]">{err}</Badge>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex flex-col sm:flex-row gap-4">
                        {errorCount === 0 ? (
                            <Button onClick={() => handleImport(false)} disabled={importing || validating || validCount === 0} className="flex-1">
                                {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {validCount}名をインポート
                            </Button>
                        ) : (
                            <>
                                <Button onClick={() => handleImport(true)} disabled={importing || validating || validCount === 0} className="flex-1">
                                    {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    エラー行をスキップして {validCount}名をインポート
                                </Button>
                                <Button variant="outline" onClick={resetImport}>
                                    修正して再アップロード
                                </Button>
                            </>
                        )}
                    </div>
                </>
            )}

            {importResult && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                            <div>
                                <p className="text-xl font-bold">{importResult.success}名の社員を登録しました</p>
                                {importResult.failed > 0 && (
                                    <p className="text-sm text-red-600 mt-1">{importResult.failed}名は登録に失敗しました</p>
                                )}
                            </div>
                            <div className="flex gap-4 justify-center">
                                <Button onClick={resetImport} variant="outline">
                                    別のファイルをインポート
                                </Button>
                                <Button onClick={() => router.push("/employees")}>
                                    社員一覧を確認
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
