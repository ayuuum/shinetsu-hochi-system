// 日次アラートチェック Edge Function
// 毎朝7:00にcronで実行 → 期限間近の資格をチェック → メール送信
//
// 環境変数:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (自動設定)
//   ALERT_EMAIL_TO: 通知先メールアドレス（カンマ区切りで複数可）
//   RESEND_API_KEY: Resend APIキー（メール送信用）

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALERT_THRESHOLDS = [
    { level: "CRITICAL", days: 0, label: "期限切れ" },
    { level: "URGENT", days: 14, label: "14日以内" },
    { level: "WARNING", days: 30, label: "30日以内" },
    { level: "INFO", days: 60, label: "60日以内" },
] as const;

type AlertItem = {
    level: string;
    employeeName: string;
    branch: string | null;
    qualificationName: string;
    expiryDate: string;
    daysRemaining: number;
    status: string | null;
};

Deno.serve(async (req) => {
    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        // 期限付き資格を全取得
        const { data: qualifications, error } = await supabase
            .from("employee_qualifications")
            .select(`
                *,
                employees(name, branch),
                qualification_master(name)
            `)
            .not("expiry_date", "is", null)
            .order("expiry_date", { ascending: true });

        if (error) throw error;

        const now = new Date();
        const alerts: AlertItem[] = [];

        for (const q of qualifications || []) {
            const expiry = new Date(q.expiry_date);
            const diffMs = expiry.getTime() - now.getTime();
            const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            // 60日以内のみ対象
            if (daysRemaining > 60) continue;

            let level = "INFO";
            if (daysRemaining < 0) level = "CRITICAL";
            else if (daysRemaining <= 14) level = "URGENT";
            else if (daysRemaining <= 30) level = "WARNING";

            alerts.push({
                level,
                employeeName: q.employees?.name || "不明",
                branch: q.employees?.branch || null,
                qualificationName: q.qualification_master?.name || "不明",
                expiryDate: q.expiry_date,
                daysRemaining,
                status: q.status,
            });
        }

        // メール送信対象: WARNING以上（30日以内）
        const emailAlerts = alerts.filter(
            (a) => a.level === "CRITICAL" || a.level === "URGENT" || a.level === "WARNING"
        );

        if (emailAlerts.length > 0) {
            const emailTo = Deno.env.get("ALERT_EMAIL_TO");
            const resendKey = Deno.env.get("RESEND_API_KEY");

            if (emailTo && resendKey) {
                const criticalCount = emailAlerts.filter((a) => a.level === "CRITICAL").length;
                const urgentCount = emailAlerts.filter((a) => a.level === "URGENT").length;
                const warningCount = emailAlerts.filter((a) => a.level === "WARNING").length;

                const subject = criticalCount > 0
                    ? `【要対応】資格期限切れ ${criticalCount}件 + 期限間近 ${urgentCount + warningCount}件`
                    : `【確認】資格期限間近 ${urgentCount + warningCount}件`;

                const body = buildEmailBody(emailAlerts);

                await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${resendKey}`,
                    },
                    body: JSON.stringify({
                        from: "株式会社信越報知 社員・資格管理 <noreply@resend.dev>",
                        to: emailTo.split(",").map((e: string) => e.trim()),
                        subject,
                        html: body,
                    }),
                });
            }
        }

        // alert_logsに記録
        for (const alert of alerts) {
            await supabase.from("alert_logs").upsert(
                {
                    category: "資格",
                    alert_level: alert.level.toLowerCase(),
                    target_name: `${alert.employeeName} - ${alert.qualificationName}`,
                    expiry_date: alert.expiryDate,
                    is_resolved: false,
                },
                { onConflict: "target_name,expiry_date", ignoreDuplicates: true }
            );
        }

        return new Response(
            JSON.stringify({
                ok: true,
                total_alerts: alerts.length,
                email_sent: emailAlerts.length > 0,
                breakdown: {
                    critical: alerts.filter((a) => a.level === "CRITICAL").length,
                    urgent: alerts.filter((a) => a.level === "URGENT").length,
                    warning: alerts.filter((a) => a.level === "WARNING").length,
                    info: alerts.filter((a) => a.level === "INFO").length,
                },
            }),
            { headers: { "Content-Type": "application/json" } }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({ ok: false, error: String(err) }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
});

function buildEmailBody(alerts: AlertItem[]): string {
    const rows = alerts
        .map((a) => {
            const levelColor =
                a.level === "CRITICAL" ? "#dc2626"
                : a.level === "URGENT" ? "#ea580c"
                : "#ca8a04";
            const levelLabel =
                a.level === "CRITICAL"
                    ? `${Math.abs(a.daysRemaining)}日超過`
                    : `残${a.daysRemaining}日`;
            return `
                <tr>
                    <td style="padding:8px;border-bottom:1px solid #e5e7eb;">
                        <span style="color:${levelColor};font-weight:bold;">${levelLabel}</span>
                    </td>
                    <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${a.employeeName}${a.branch ? ` (${a.branch})` : ""}</td>
                    <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${a.qualificationName}</td>
                    <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${a.expiryDate}</td>
                    <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${a.status || "未着手"}</td>
                </tr>`;
        })
        .join("");

    return `
        <div style="font-family:'Noto Sans JP',sans-serif;max-width:700px;margin:0 auto;">
            <h2 style="color:#111;">資格期限アラート</h2>
            <p>以下の資格・講習の期限が近づいています。</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <thead>
                    <tr style="background:#f9fafb;">
                        <th style="padding:8px;text-align:left;border-bottom:2px solid #e5e7eb;">状態</th>
                        <th style="padding:8px;text-align:left;border-bottom:2px solid #e5e7eb;">社員名</th>
                        <th style="padding:8px;text-align:left;border-bottom:2px solid #e5e7eb;">資格名</th>
                        <th style="padding:8px;text-align:left;border-bottom:2px solid #e5e7eb;">期限日</th>
                        <th style="padding:8px;text-align:left;border-bottom:2px solid #e5e7eb;">申込状況</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
            <p style="margin-top:16px;font-size:12px;color:#6b7280;">
                このメールは株式会社信越報知の社員・資格管理システムから自動送信されています。
            </p>
        </div>
    `;
}
