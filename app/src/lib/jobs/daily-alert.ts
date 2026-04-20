import { Tables } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

export type QualificationAlertRow = Pick<
    Tables<"employee_qualifications">,
    "id" | "expiry_date" | "status" | "photo_renewal_date"
> & {
    employee_id: string | null;
    employees: Pick<Tables<"employees">, "name" | "branch"> | null;
    qualification_master: Pick<Tables<"qualification_master">, "name"> | null;
};

export type AlertCategory = "qualification_expiry" | "photo_renewal";

export type EmailAlert = {
    level: "info" | "warning" | "urgent" | "critical";
    category: AlertCategory;
    employeeName: string;
    branch: string | null;
    qualificationName: string;
    expiryDate: string;
    daysRemaining: number;
    status: string | null;
    // link back to the source row for alert_logs dedup
    targetId: string;
    employeeId: string | null;
};

export type DailyAlertJobResult = {
    totalAlerts: number;
    emailTargetCount: number;
    emailSent: boolean;
    emailConfigured: boolean;
    breakdown: {
        critical: number;
        urgent: number;
        warning: number;
        info: number;
    };
    suppressedCount: number;
};

function classifyLevel(days: number): EmailAlert["level"] | null {
    if (days > 60) return null;
    if (days < 0) return "critical";
    if (days <= 14) return "urgent";
    if (days <= 30) return "warning";
    return "info";
}

export function buildDailyAlerts(qualifications: QualificationAlertRow[], now = new Date()) {
    const alerts: EmailAlert[] = [];

    for (const q of qualifications) {
        const qualificationName = q.qualification_master?.name || "不明";
        const employeeName = q.employees?.name || "不明";
        const branch = q.employees?.branch || null;

        if (q.expiry_date) {
            const expiry = new Date(q.expiry_date);
            const days = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const level = classifyLevel(days);
            if (level) {
                alerts.push({
                    level,
                    category: "qualification_expiry",
                    employeeName,
                    branch,
                    qualificationName,
                    expiryDate: q.expiry_date,
                    daysRemaining: days,
                    status: q.status || null,
                    targetId: q.id,
                    employeeId: q.employee_id,
                });
            }
        }

        if (q.photo_renewal_date) {
            const renewal = new Date(q.photo_renewal_date);
            const days = Math.floor((renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const level = classifyLevel(days);
            if (level) {
                alerts.push({
                    level,
                    category: "photo_renewal",
                    employeeName,
                    branch,
                    qualificationName: `${qualificationName}（免状写真更新）`,
                    expiryDate: q.photo_renewal_date,
                    daysRemaining: days,
                    status: q.status || null,
                    targetId: q.id,
                    employeeId: q.employee_id,
                });
            }
        }
    }

    const emailAlerts = alerts.filter(
        (alert) => alert.level === "critical" || alert.level === "urgent" || alert.level === "warning"
    );

    return {
        alerts,
        emailAlerts,
        breakdown: {
            critical: alerts.filter((alert) => alert.level === "critical").length,
            urgent: alerts.filter((alert) => alert.level === "urgent").length,
            warning: alerts.filter((alert) => alert.level === "warning").length,
            info: alerts.filter((alert) => alert.level === "info").length,
        },
    };
}

const DEDUP_WINDOW_HOURS = 20;

function alertKey(alert: EmailAlert): string {
    return `${alert.category}|${alert.targetId}|${alert.level}`;
}

async function filterByDedup(
    supabase: SupabaseClient<Database>,
    alerts: EmailAlert[]
): Promise<{ fresh: EmailAlert[]; suppressed: number }> {
    if (alerts.length === 0) return { fresh: [], suppressed: 0 };

    const since = new Date(Date.now() - DEDUP_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const targetIds = Array.from(new Set(alerts.map((a) => a.targetId)));

    const { data: recent, error } = await supabase
        .from("alert_logs")
        .select("category, target_id, alert_level, created_at")
        .in("target_id", targetIds)
        .gte("created_at", since);

    if (error) {
        console.error("alert_logs dedup lookup failed, will send without dedup:", error);
        return { fresh: alerts, suppressed: 0 };
    }

    const recentKeys = new Set(
        (recent ?? []).map(
            (r) => `${r.category}|${r.target_id}|${r.alert_level}`
        )
    );

    // CRITICAL はPRD上「日次メール」なので重複抑止せずに毎日送る
    const fresh = alerts.filter((a) => {
        if (a.level === "critical") return true;
        return !recentKeys.has(alertKey(a));
    });

    return { fresh, suppressed: alerts.length - fresh.length };
}

async function recordAlertLogs(
    supabase: SupabaseClient<Database>,
    alerts: EmailAlert[]
): Promise<void> {
    if (alerts.length === 0) return;
    const rows = alerts.map((a) => ({
        category: a.category,
        target_id: a.targetId,
        target_name: a.qualificationName,
        alert_level: a.level,
        expiry_date: a.expiryDate,
        employee_id: a.employeeId,
    }));
    const { error } = await supabase.from("alert_logs").insert(rows);
    if (error) {
        console.error("alert_logs insert failed:", error);
    }
}

export async function executeDailyAlertJob(
    supabase: SupabaseClient<Database>
): Promise<DailyAlertJobResult> {
    const { data: qualifications, error } = await supabase
        .from("employee_qualifications")
        .select(`
            id,
            employee_id,
            expiry_date,
            photo_renewal_date,
            status,
            employees!inner(name, branch),
            qualification_master(name)
        `)
        .is("employees.deleted_at", null)
        .or("expiry_date.not.is.null,photo_renewal_date.not.is.null");

    if (error) {
        throw error;
    }

    const { alerts, emailAlerts, breakdown } = buildDailyAlerts(
        (qualifications || []) as unknown as QualificationAlertRow[]
    );

    const { fresh: dedupedEmailAlerts, suppressed } = await filterByDedup(supabase, emailAlerts);

    const gasConfigured = !!process.env.GOOGLE_APPS_SCRIPT_URL;
    const resendConfigured = !!(process.env.RESEND_API_KEY && process.env.ALERT_EMAIL_TO);
    const emailConfigured = gasConfigured || resendConfigured;
    let emailSent = false;

    if (dedupedEmailAlerts.length > 0 && emailConfigured) {
        const criticalCount = dedupedEmailAlerts.filter((alert) => alert.level === "critical").length;
        const subject = criticalCount > 0
            ? `【要対応】資格期限切れ ${criticalCount}件 + 期限間近 ${dedupedEmailAlerts.length - criticalCount}件`
            : `【確認】資格期限間近 ${dedupedEmailAlerts.length}件`;
        const html = buildDailyAlertEmailHtml(dedupedEmailAlerts);

        if (gasConfigured) {
            const response = await fetch(process.env.GOOGLE_APPS_SCRIPT_URL!, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    to: process.env.ALERT_EMAIL_TO?.split(",").map((value) => value.trim()) ?? [],
                    subject,
                    html,
                    alerts: dedupedEmailAlerts,
                }),
            });
            emailSent = response.ok;
        } else if (resendConfigured) {
            const response = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                },
                body: JSON.stringify({
                    from: "株式会社信越報知 社員・資格管理 <noreply@resend.dev>",
                    to: process.env.ALERT_EMAIL_TO!.split(",").map((value) => value.trim()),
                    subject,
                    html,
                }),
            });

            emailSent = response.ok;
        }

        if (emailSent) {
            await recordAlertLogs(supabase, dedupedEmailAlerts);
        }
    }

    return {
        totalAlerts: alerts.length,
        emailTargetCount: dedupedEmailAlerts.length,
        emailSent,
        emailConfigured,
        breakdown,
        suppressedCount: suppressed,
    };
}

function buildDailyAlertEmailHtml(alerts: EmailAlert[]): string {
    const rows = alerts
        .map((alert) => {
            const color = alert.level === "critical" ? "#dc2626" : alert.level === "urgent" ? "#ea580c" : "#ca8a04";
            const label = alert.daysRemaining < 0 ? `${Math.abs(alert.daysRemaining)}日超過` : `残${alert.daysRemaining}日`;
            return `<tr>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb"><span style="color:${color};font-weight:bold">${label}</span></td>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb">${alert.employeeName}${alert.branch ? ` (${alert.branch})` : ""}</td>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb">${alert.qualificationName}</td>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb">${alert.expiryDate}</td>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb">${alert.status || "未着手"}</td>
            </tr>`;
        })
        .join("");

    return `<div style="font-family:'Noto Sans JP',sans-serif;max-width:700px;margin:0 auto">
        <h2 style="color:#111">資格期限アラート</h2>
        <p>以下の資格・講習の期限が近づいています。</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead><tr style="background:#f9fafb">
                <th style="padding:8px;text-align:left;border-bottom:2px solid #e5e7eb">状態</th>
                <th style="padding:8px;text-align:left;border-bottom:2px solid #e5e7eb">社員名</th>
                <th style="padding:8px;text-align:left;border-bottom:2px solid #e5e7eb">資格名</th>
                <th style="padding:8px;text-align:left;border-bottom:2px solid #e5e7eb">期限日</th>
                <th style="padding:8px;text-align:left;border-bottom:2px solid #e5e7eb">申込状況</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table>
        <p style="margin-top:16px;font-size:12px;color:#6b7280">このメールは株式会社信越報知の社員・資格管理システムから自動送信されています。</p>
    </div>`;
}
