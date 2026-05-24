import { Tables } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

export type QualificationAlertRow = Pick<
    Tables<"employee_qualifications">,
    "id" | "expiry_date" | "status" | "photo_renewal_date"
> & {
    employee_id: string | null;
    employees: Pick<Tables<"employees">, "name" | "branch" | "email" | "person_type" | "partner_company"> | null;
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
    recipientEmail: string | null;
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
        const employeeName = q.employees?.person_type === "partner"
            ? q.employees.partner_company || q.employees.name || "不明"
            : q.employees?.name || "不明";
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
                    recipientEmail: q.employees?.email || null,
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
                    recipientEmail: q.employees?.email || null,
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

async function sendResendEmail({
    to,
    subject,
    text,
}: {
    to: string[];
    subject: string;
    text: string;
}) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.QUALIFICATION_ALERT_FROM || process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !from || to.length === 0) {
        return { configured: false, sent: false };
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from,
            to,
            subject,
            text,
        }),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Resend email failed: ${response.status} ${body}`);
    }

    return { configured: true, sent: true };
}

function getAlertLevelLabel(level: EmailAlert["level"]) {
    if (level === "critical") return "期限切れ";
    if (level === "urgent") return "14日以内";
    if (level === "warning") return "30日以内";
    return "60日以内";
}

function buildAlertEmailText(alerts: EmailAlert[]) {
    const lines = [
        "資格の有効期限が近づいている、または期限切れの記録があります。",
        "",
        ...alerts.map((alert) => [
            `対象: ${alert.employeeName}`,
            `資格: ${alert.qualificationName}`,
            `期限: ${alert.expiryDate}`,
            `状態: ${getAlertLevelLabel(alert.level)}（残り${alert.daysRemaining}日）`,
            "",
        ].join("\n")),
    ];

    return lines.join("\n");
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
            employees!inner(name, branch, email, person_type, partner_company),
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

    const today = new Date().toISOString().slice(0, 10);
    const { data: existingLogs } = emailAlerts.length > 0
        ? await supabase
            .from("alert_logs")
            .select("target_id, category, alert_level, created_at")
            .in("target_id", emailAlerts.map((alert) => alert.targetId))
            .gte("created_at", `${today}T00:00:00.000Z`)
        : { data: [] };

    const existingKeys = new Set(
        (existingLogs || []).map((log) => `${log.target_id}:${log.category}:${log.alert_level}:${today}`)
    );
    const unsuppressedEmailAlerts = emailAlerts.filter(
        (alert) => !existingKeys.has(`${alert.targetId}:${alert.category}:${alert.level}:${today}`)
    );
    const suppressedCount = emailAlerts.length - unsuppressedEmailAlerts.length;

    const fallbackEmails = (process.env.QUALIFICATION_ALERT_FALLBACK_EMAILS || "")
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);
    const directAlerts = unsuppressedEmailAlerts.filter((alert) => !!alert.recipientEmail);
    const fallbackAlerts = unsuppressedEmailAlerts.filter((alert) => !alert.recipientEmail);
    let emailConfigured = !!process.env.RESEND_API_KEY && !!(process.env.QUALIFICATION_ALERT_FROM || process.env.RESEND_FROM_EMAIL);
    let emailSent = false;

    if (directAlerts.length > 0) {
        const alertsByRecipient = new Map<string, EmailAlert[]>();
        for (const alert of directAlerts) {
            const recipient = alert.recipientEmail!;
            alertsByRecipient.set(recipient, [...(alertsByRecipient.get(recipient) || []), alert]);
        }

        for (const [recipient, recipientAlerts] of alertsByRecipient) {
            const result = await sendResendEmail({
                to: [recipient],
                subject: "資格期限のお知らせ",
                text: buildAlertEmailText(recipientAlerts),
            });
            emailConfigured = result.configured;
            emailSent = emailSent || result.sent;
        }
    }

    if (fallbackAlerts.length > 0 && fallbackEmails.length > 0) {
        const result = await sendResendEmail({
            to: fallbackEmails,
            subject: "資格期限のお知らせ（管理者確認）",
            text: buildAlertEmailText(fallbackAlerts),
        });
        emailConfigured = result.configured;
        emailSent = emailSent || result.sent;
    }

    if (unsuppressedEmailAlerts.length > 0 && (emailSent || !emailConfigured)) {
        await supabase.from("alert_logs").insert(
            unsuppressedEmailAlerts.map((alert) => ({
                category: alert.category,
                employee_id: alert.employeeId,
                target_id: alert.targetId,
                target_name: alert.qualificationName,
                expiry_date: alert.expiryDate,
                alert_level: alert.level,
                is_resolved: false,
            }))
        );
    }

    return {
        totalAlerts: alerts.length,
        emailTargetCount: unsuppressedEmailAlerts.length,
        emailSent,
        emailConfigured,
        breakdown,
        suppressedCount,
    };
}
