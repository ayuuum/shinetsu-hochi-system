import { Tables } from "@/types/supabase";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

type QualificationAlertRow = Pick<Tables<"employee_qualifications">, "expiry_date" | "status"> & {
    employees: Pick<Tables<"employees">, "name" | "branch"> | null;
    qualification_master: Pick<Tables<"qualification_master">, "name"> | null;
};

type EmailAlert = {
    level: "info" | "warning" | "urgent" | "critical";
    employeeName: string;
    branch: string | null;
    qualificationName: string;
    expiryDate: string;
    daysRemaining: number;
    status: string | null;
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
};

export async function executeDailyAlertJob(
    supabase: SupabaseClient<Database>
): Promise<DailyAlertJobResult> {
    const { data: qualifications, error } = await supabase
        .from("employee_qualifications")
        .select(`
            *,
            employees!inner(name, branch),
            qualification_master(name)
        `)
        .is("employees.deleted_at", null)
        .not("expiry_date", "is", null)
        .order("expiry_date", { ascending: true });

    if (error) {
        throw error;
    }

    const now = new Date();
    const alerts: EmailAlert[] = [];

    for (const q of (qualifications || []) as QualificationAlertRow[]) {
        if (!q.expiry_date) continue;
        const expiry = new Date(q.expiry_date);
        const days = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (days > 60) continue;

        let level: EmailAlert["level"] = "info";
        if (days < 0) level = "critical";
        else if (days <= 14) level = "urgent";
        else if (days <= 30) level = "warning";

        alerts.push({
            level,
            employeeName: q.employees?.name || "不明",
            branch: q.employees?.branch || null,
            qualificationName: q.qualification_master?.name || "不明",
            expiryDate: q.expiry_date,
            daysRemaining: days,
            status: q.status || null,
        });
    }

    const emailAlerts = alerts.filter(
        (alert) => alert.level === "critical" || alert.level === "urgent" || alert.level === "warning"
    );

    const emailConfigured = !!(process.env.RESEND_API_KEY && process.env.ALERT_EMAIL_TO);
    let emailSent = false;

    if (emailAlerts.length > 0 && emailConfigured) {
        const criticalCount = emailAlerts.filter((alert) => alert.level === "critical").length;
        const subject = criticalCount > 0
            ? `【要対応】資格期限切れ ${criticalCount}件 + 期限間近 ${emailAlerts.length - criticalCount}件`
            : `【確認】資格期限間近 ${emailAlerts.length}件`;

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
                html: buildDailyAlertEmailHtml(emailAlerts),
            }),
        });

        emailSent = response.ok;
    }

    return {
        totalAlerts: alerts.length,
        emailTargetCount: emailAlerts.length,
        emailSent,
        emailConfigured,
        breakdown: {
            critical: alerts.filter((alert) => alert.level === "critical").length,
            urgent: alerts.filter((alert) => alert.level === "urgent").length,
            warning: alerts.filter((alert) => alert.level === "warning").length,
            info: alerts.filter((alert) => alert.level === "info").length,
        },
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
