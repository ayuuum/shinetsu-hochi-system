"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthSnapshot } from "@/lib/auth-server";
import { createSupabaseServer } from "@/lib/supabase-server";
import { Json } from "@/types/supabase";
import {
    buildEmployeeImportValues,
    type EmployeeImportPreviewRow,
    type EmployeeImportSourceRow,
    validateEmployeeImportValues,
} from "@/lib/imports/employee-import";
import { toEmployeeInsert } from "@/lib/validation/employee";
import { executeDailyAlertJob } from "@/lib/jobs/daily-alert";

type ErrorResult = { success: false; error: string };

type ImportPreviewSummary = {
    total: number;
    valid: number;
    invalid: number;
    duplicateInFile: number;
    duplicateInDb: number;
};

type ImportPreviewResult =
    | {
        success: true;
        rows: EmployeeImportPreviewRow[];
        summary: ImportPreviewSummary;
    }
    | ErrorResult;

type ImportCommitResult =
    | {
        success: true;
        inserted: number;
        failed: number;
        skipped: number;
        runId: string | null;
    }
    | ErrorResult;

type DailyAlertRunResult =
    | {
        success: true;
        runId: string | null;
        totalAlerts: number;
        emailTargetCount: number;
        emailSent: boolean;
    }
    | ErrorResult;

async function requireAdminOrHr() {
    const { user, role } = await getAuthSnapshot();

    if (!user || (role !== "admin" && role !== "hr")) {
        return { ok: false as const, error: "この操作を実行する権限がありません。" };
    }

    return { ok: true as const, user };
}

function getUniqueZodMessages(error: z.ZodError) {
    return [...new Set(error.issues.map((issue) => issue.message))];
}

async function analyzeEmployeeImportRows(sourceRows: EmployeeImportSourceRow[]) {
    const cappedRows = sourceRows.slice(0, 1500);
    const preparedRows = cappedRows.map((sourceRow, index) => ({
        row: index + 2,
        sourceRow,
        values: buildEmployeeImportValues(sourceRow),
    }));

    const duplicateCounts = new Map<string, number>();
    for (const preparedRow of preparedRows) {
        if (!preparedRow.values.employee_number) continue;
        duplicateCounts.set(
            preparedRow.values.employee_number,
            (duplicateCounts.get(preparedRow.values.employee_number) || 0) + 1
        );
    }

    const employeeNumbers = [...new Set(
        preparedRows
            .map((preparedRow) => preparedRow.values.employee_number)
            .filter((value) => !!value)
    )];

    const existingNumbers = new Set<string>();
    if (employeeNumbers.length > 0) {
        const supabase = await createSupabaseServer();
        const { data, error } = await supabase
            .from("employees")
            .select("employee_number")
            .in("employee_number", employeeNumbers)
            .is("deleted_at", null);

        if (error) {
            throw error;
        }

        for (const row of data || []) {
            if (row.employee_number) {
                existingNumbers.add(row.employee_number);
            }
        }
    }

    let duplicateInFile = 0;
    let duplicateInDb = 0;

    const rows: EmployeeImportPreviewRow[] = preparedRows.map((preparedRow) => {
        const parsed = validateEmployeeImportValues(preparedRow.values);
        const errors = parsed.success ? [] : getUniqueZodMessages(parsed.error);

        if (
            preparedRow.values.employee_number &&
            (duplicateCounts.get(preparedRow.values.employee_number) || 0) > 1
        ) {
            duplicateInFile += 1;
            errors.push("社員番号がファイル内で重複しています");
        }

        if (
            preparedRow.values.employee_number &&
            existingNumbers.has(preparedRow.values.employee_number)
        ) {
            duplicateInDb += 1;
            errors.push("この社員番号は既に登録されています");
        }

        const uniqueErrors = [...new Set(errors)];

        return {
            row: preparedRow.row,
            employeeNumber: preparedRow.values.employee_number,
            name: preparedRow.values.name,
            valid: uniqueErrors.length === 0,
            errors: uniqueErrors,
            values: uniqueErrors.length === 0 ? preparedRow.values : null,
        };
    });

    const summary: ImportPreviewSummary = {
        total: sourceRows.length,
        valid: rows.filter((row) => row.valid).length,
        invalid: rows.filter((row) => !row.valid).length,
        duplicateInFile,
        duplicateInDb,
    };

    return {
        rows,
        summary,
        truncated: sourceRows.length > cappedRows.length,
    };
}

export async function previewEmployeeImportAction(
    sourceRows: EmployeeImportSourceRow[]
): Promise<ImportPreviewResult> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    if (sourceRows.length === 0) {
        return { success: false, error: "インポート対象の行がありません。" };
    }

    try {
        const analysis = await analyzeEmployeeImportRows(sourceRows);
        if (analysis.truncated) {
            return {
                success: false,
                error: "一度に処理できるのは 1,500 行までです。ファイルを分割してください。",
            };
        }

        return {
            success: true,
            rows: analysis.rows,
            summary: analysis.summary,
        };
    } catch (error) {
        console.error("Failed to preview employee import:", error);
        return { success: false, error: "インポート内容の検証に失敗しました。" };
    }
}

export async function runEmployeeImportAction({
    sourceRows,
    fileName,
}: {
    sourceRows: EmployeeImportSourceRow[];
    fileName?: string;
}): Promise<ImportCommitResult> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    if (sourceRows.length === 0) {
        return { success: false, error: "インポート対象の行がありません。" };
    }

    const supabase = await createSupabaseServer();
    let importRunId: string | null = null;

    try {
        const analysis = await analyzeEmployeeImportRows(sourceRows);
        if (analysis.truncated) {
            return {
                success: false,
                error: "一度に処理できるのは 1,500 行までです。ファイルを分割してください。",
            };
        }

        const validRows = analysis.rows.filter((row) => row.valid && row.values);
        const skipped = analysis.rows.length - validRows.length;
        const initialStatus = validRows.length > 0 ? "running" : "failed";
        const initialSummary = validRows.length > 0
            ? "社員データをインポート中"
            : "有効なインポート対象がありません";

        const { data: importRun, error: importRunError } = await supabase
            .from("import_runs")
            .insert([{
                import_kind: "employees",
                source_file_name: fileName || null,
                status: initialStatus,
                total_rows: analysis.summary.total,
                valid_rows: analysis.summary.valid,
                failed_rows: 0,
                skipped_rows: skipped,
                inserted_rows: 0,
                initiated_by: auth.user.id,
                initiated_email: auth.user.email,
                summary: initialSummary,
                error_rows: analysis.rows
                    .filter((row) => !row.valid)
                    .slice(0, 50)
                    .map((row) => ({
                        row: row.row,
                        employee_number: row.employeeNumber,
                        name: row.name,
                        errors: row.errors,
                    })) as Json,
                finished_at: validRows.length > 0 ? null : new Date().toISOString(),
            }])
            .select("id")
            .single();

        if (importRunError) {
            console.error("Failed to create import run:", importRunError);
            return { success: false, error: "インポート履歴の作成に失敗しました。" };
        }
        importRunId = importRun.id;

        if (validRows.length === 0) {
            revalidatePath("/import");
            revalidatePath("/operations-log");
            return {
                success: false,
                error: "有効なインポート対象がありません。",
            };
        }

        let inserted = 0;
        const failedRows: Array<{ row: number; employee_number: string; name: string; error: string }> = [];
        const BATCH_SIZE = 50;

        for (let index = 0; index < validRows.length; index += BATCH_SIZE) {
            const batch = validRows.slice(index, index + BATCH_SIZE);
            const payload = batch.map((row) => toEmployeeInsert(row.values!));
            const { error } = await supabase
                .from("employees")
                .insert(payload)
                .select("id");

            if (!error) {
                inserted += batch.length;
                continue;
            }

            console.error("Batch employee import failed, retrying row by row:", error);

            for (const row of batch) {
                const { error: rowError } = await supabase
                    .from("employees")
                    .insert([toEmployeeInsert(row.values!)])
                    .select("id")
                    .single();

                if (rowError) {
                    failedRows.push({
                        row: row.row,
                        employee_number: row.employeeNumber,
                        name: row.name,
                        error: rowError.message,
                    });
                } else {
                    inserted += 1;
                }
            }
        }

        const failed = failedRows.length;
        const finalStatus = inserted > 0 ? "completed" : "failed";
        const finalSummary = `${inserted}件登録 / ${failed}件失敗 / ${skipped}件スキップ`;

        const { error: updateRunError } = await supabase
            .from("import_runs")
            .update({
                status: finalStatus,
                inserted_rows: inserted,
                failed_rows: failed,
                skipped_rows: skipped,
                summary: finalSummary,
                error_rows: [
                    ...analysis.rows
                        .filter((row) => !row.valid)
                        .slice(0, 50)
                        .map((row) => ({
                            row: row.row,
                            employee_number: row.employeeNumber,
                            name: row.name,
                            errors: row.errors,
                        })),
                    ...failedRows.slice(0, 50).map((row) => ({
                        row: row.row,
                        employee_number: row.employee_number,
                        name: row.name,
                        errors: [row.error],
                    })),
                ] as Json,
                finished_at: new Date().toISOString(),
            })
            .eq("id", importRun.id);

        if (updateRunError) {
            console.error("Failed to finalize import run:", updateRunError);
        }

        revalidatePath("/");
        revalidatePath("/employees");
        revalidatePath("/import");
        revalidatePath("/operations-log");

        return {
            success: true,
            inserted,
            failed,
            skipped,
            runId: importRun.id,
        };
    } catch (error) {
        console.error("Failed to import employees:", error);
        if (importRunId) {
            const message = error instanceof Error ? error.message : "社員インポートに失敗しました。";
            const { error: updateRunError } = await supabase
                .from("import_runs")
                .update({
                    status: "failed",
                    summary: message,
                    finished_at: new Date().toISOString(),
                })
                .eq("id", importRunId);

            if (updateRunError) {
                console.error("Failed to mark import run as failed:", updateRunError);
            }
        }
        return { success: false, error: "社員インポートに失敗しました。" };
    }
}

export async function runDailyAlertJobAction(): Promise<DailyAlertRunResult> {
    const auth = await requireAdminOrHr();
    if (!auth.ok) {
        return { success: false, error: auth.error };
    }

    const supabase = await createSupabaseServer();

    try {
        const { data: jobRun, error: createJobRunError } = await supabase
            .from("job_runs")
            .insert([{
                job_key: "daily-alert",
                job_label: "資格期限アラート",
                trigger_type: "manual",
                triggered_by: auth.user.id,
                triggered_email: auth.user.email,
                status: "running",
            }])
            .select("id")
            .single();

        if (createJobRunError) {
            console.error("Failed to create job run:", createJobRunError);
            return { success: false, error: "ジョブ履歴の作成に失敗しました。" };
        }

        try {
            const result = await executeDailyAlertJob(supabase);

            const { error: updateJobRunError } = await supabase
                .from("job_runs")
                .update({
                    status: "completed",
                    total_items: result.totalAlerts,
                    processed_items: result.emailTargetCount,
                    metrics: result as Json,
                    finished_at: new Date().toISOString(),
                })
                .eq("id", jobRun.id);

            if (updateJobRunError) {
                console.error("Failed to finalize job run:", updateJobRunError);
            }

            revalidatePath("/operations-log");

            return {
                success: true,
                runId: jobRun.id,
                totalAlerts: result.totalAlerts,
                emailTargetCount: result.emailTargetCount,
                emailSent: result.emailSent,
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : "日次通知ジョブの実行に失敗しました。";

            const { error: updateJobRunError } = await supabase
                .from("job_runs")
                .update({
                    status: "failed",
                    error_message: message,
                    finished_at: new Date().toISOString(),
                })
                .eq("id", jobRun.id);

            if (updateJobRunError) {
                console.error("Failed to mark job run as failed:", updateJobRunError);
            }

            return { success: false, error: message };
        }
    } catch (error) {
        console.error("Failed to execute daily alert job:", error);
        return { success: false, error: "日次通知ジョブの実行に失敗しました。" };
    }
}
