import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { addDays, format, isBefore, startOfDay } from "date-fns";

// 環境変数からSlack Webhook URLを取得
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export async function GET() {
    return handleNotify();
}

export async function POST() {
    return handleNotify();
}

async function handleNotify() {
    try {
        if (!SLACK_WEBHOOK_URL) {
            return NextResponse.json(
                { success: false, error: "SLACK_WEBHOOK_URL is not configured in .env.local" },
                { status: 500 }
            );
        }

        const today = startOfDay(new Date());
        const thresholdDate = addDays(today, 30); // 30日以内

        const { data: expiring, error } = await supabase
            .from("employee_qualifications")
            .select(`
                id,
                expiry_date,
                employee_id,
                qualification_id,
                employees (name, employee_number),
                qualification_master (name)
            `)
            .not("expiry_date", "is", null)
            .lte("expiry_date", format(thresholdDate, 'yyyy-MM-dd'))
            .order("expiry_date", { ascending: true });

        if (error) throw error;

        if (!expiring || expiring.length === 0) {
            return NextResponse.json({ success: true, message: "30日以内に期限が切れる資格はありません。" });
        }

        const total = expiring.length;
        const blocks = [
            {
                type: "header",
                text: {
                    type: "plain_text",
                    text: `⚠️ 資格期限切れ警告 (${total}件)`,
                    emoji: true
                }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*30日以内* に期限が切れる、または既に切れている資格が *${total}件* あります。該当社員の更新・講習手配を行ってください。`
                }
            },
            {
                type: "divider"
            }
        ];

        let listText = "";
        expiring.forEach((item: any) => {
            const expDate = new Date(item.expiry_date);
            const isExpired = isBefore(expDate, today);
            const statusIcon = isExpired ? "🔴 [超過]" : "🟡 [間近]";
            const empName = item.employees?.name || "不明";
            const qName = item.qualification_master?.name || "不明";
            listText += `${statusIcon} *${empName}* - ${qName} (期限: ${format(expDate, 'yyyy/MM/dd')})\n`;
        });

        blocks.push({
            type: "section",
            text: {
                type: "mrkdwn",
                text: listText.slice(0, 2900) // Slack 制限対策
            }
        });

        const payload = {
            blocks,
            text: `資格期限切れ警告: ${total}件の対象があります`
        };

        const slackResponse = await fetch(SLACK_WEBHOOK_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!slackResponse.ok) {
            throw new Error(`Slack API responded with status ${slackResponse.status}`);
        }

        return NextResponse.json({ success: true, notifiedCount: total });
    } catch (error: any) {
        console.error("Notify Expirations Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
