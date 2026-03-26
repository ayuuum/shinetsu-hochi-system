import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Vercel Cron: 毎朝7:00 JST (= 22:00 UTC前日)
// vercel.json に cron 設定が必要

export async function GET(request: Request) {
    // Cron secret で保護
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return []; },
                setAll() {},
            },
        }
    );

    const { data: qualifications } = await supabase
        .from("employee_qualifications")
        .select(`
            *,
            employees(name, branch),
            qualification_master(name)
        `)
        .not("expiry_date", "is", null)
        .order("expiry_date", { ascending: true });

    const now = new Date();
    const alerts: any[] = [];

    for (const q of qualifications || []) {
        const expiry = new Date(q.expiry_date!);
        const days = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (days > 60) continue;

        let level = "info";
        if (days < 0) level = "critical";
        else if (days <= 14) level = "urgent";
        else if (days <= 30) level = "warning";

        alerts.push({
            level,
            employeeName: (q.employees as any)?.name || "不明",
            branch: (q.employees as any)?.branch || null,
            qualificationName: (q.qualification_master as any)?.name || "不明",
            expiryDate: q.expiry_date,
            daysRemaining: days,
            status: q.status,
        });
    }

    // WARNING以上をメール送信
    const emailAlerts = alerts.filter(
        (a) => a.level === "critical" || a.level === "urgent" || a.level === "warning"
    );

    let emailSent = false;
    if (emailAlerts.length > 0 && process.env.RESEND_API_KEY && process.env.ALERT_EMAIL_TO) {
        const criticalCount = emailAlerts.filter((a) => a.level === "critical").length;
        const subject = criticalCount > 0
            ? `【要対応】資格期限切れ ${criticalCount}件 + 期限間近 ${emailAlerts.length - criticalCount}件`
            : `【確認】資格期限間近 ${emailAlerts.length}件`;

        const html = buildEmailHtml(emailAlerts);

        const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: "信越報知 管理システム <noreply@resend.dev>",
                to: process.env.ALERT_EMAIL_TO.split(",").map((e) => e.trim()),
                subject,
                html,
            }),
        });
        emailSent = res.ok;
    }

    return NextResponse.json({
        ok: true,
        totalAlerts: alerts.length,
        emailSent,
        breakdown: {
            critical: alerts.filter((a) => a.level === "critical").length,
            urgent: alerts.filter((a) => a.level === "urgent").length,
            warning: alerts.filter((a) => a.level === "warning").length,
            info: alerts.filter((a) => a.level === "info").length,
        },
    });
}

function buildEmailHtml(alerts: any[]): string {
    const rows = alerts
        .map((a) => {
            const color = a.level === "critical" ? "#dc2626" : a.level === "urgent" ? "#ea580c" : "#ca8a04";
            const label = a.daysRemaining < 0 ? `${Math.abs(a.daysRemaining)}日超過` : `残${a.daysRemaining}日`;
            return `<tr>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb"><span style="color:${color};font-weight:bold">${label}</span></td>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb">${a.employeeName}${a.branch ? ` (${a.branch})` : ""}</td>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb">${a.qualificationName}</td>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb">${a.expiryDate}</td>
                <td style="padding:8px;border-bottom:1px solid #e5e7eb">${a.status || "未着手"}</td>
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
        <p style="margin-top:16px;font-size:12px;color:#6b7280">このメールは信越報知 管理システムから自動送信されています。</p>
    </div>`;
}
