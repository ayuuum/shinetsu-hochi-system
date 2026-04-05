import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase-env";
import { createSupabaseAdmin } from "@/lib/supabase-admin";
import { executeDailyAlertJob } from "@/lib/jobs/daily-alert";
import { Database, Json } from "@/types/supabase";

// Vercel Cron: 毎朝7:00 JST (= 22:00 UTC前日)
// vercel.json に cron 設定が必要

export async function GET(request: Request) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createSupabaseAdmin();
    const { url, anonKey } = getSupabaseEnv();
    const runtimeClient = adminClient || createClient<Database>(url, anonKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    let jobRunId: string | null = null;

    if (adminClient) {
        const { data, error } = await adminClient
            .from("job_runs")
            .insert([{
                job_key: "daily-alert",
                job_label: "資格期限アラート",
                trigger_type: "cron",
                status: "running",
            }])
            .select("id")
            .single();

        if (error) {
            console.error("Failed to create cron job run:", error);
        } else {
            jobRunId = data.id;
        }
    }

    try {
        const result = await executeDailyAlertJob(runtimeClient);

        if (adminClient && jobRunId) {
            const { error } = await adminClient
                .from("job_runs")
                .update({
                    status: "completed",
                    total_items: result.totalAlerts,
                    processed_items: result.emailTargetCount,
                    metrics: result as Json,
                    finished_at: new Date().toISOString(),
                })
                .eq("id", jobRunId);

            if (error) {
                console.error("Failed to finalize cron job run:", error);
            }
        }

        return NextResponse.json({
            ok: true,
            totalAlerts: result.totalAlerts,
            emailTargetCount: result.emailTargetCount,
            emailSent: result.emailSent,
            emailConfigured: result.emailConfigured,
            breakdown: result.breakdown,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "資格期限アラートの実行に失敗しました。";

        if (adminClient && jobRunId) {
            const { error: updateError } = await adminClient
                .from("job_runs")
                .update({
                    status: "failed",
                    error_message: message,
                    finished_at: new Date().toISOString(),
                })
                .eq("id", jobRunId);

            if (updateError) {
                console.error("Failed to mark cron job run as failed:", updateError);
            }
        }

        return NextResponse.json({ error: message }, { status: 500 });
    }
}
