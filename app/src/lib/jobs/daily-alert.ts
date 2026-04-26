import { Tables } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

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

    const { alerts, breakdown } = buildDailyAlerts(
        (qualifications || []) as unknown as QualificationAlertRow[]
    );

    return {
        totalAlerts: alerts.length,
        emailTargetCount: 0,
        emailSent: false,
        emailConfigured: false,
        breakdown,
        suppressedCount: 0,
    };
}
