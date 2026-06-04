"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getTodayInTokyo } from "@/lib/date";
import { useAuth } from "@/hooks/use-auth";

const ALERT_KEY = "shinetsu-hochi-qual-alert-date";
const NOTIF_PROMPT_KEY = "shinetsu-hochi-notif-prompted";

export function QualificationAlerts() {
    const { isAdminOrHr } = useAuth();
    const hasRun = useRef(false);
    const router = useRouter();

    useEffect(() => {
        if (!("Notification" in window)) return;
        if (Notification.permission !== "default") return;
        if (sessionStorage.getItem(NOTIF_PROMPT_KEY)) return;
        sessionStorage.setItem(NOTIF_PROMPT_KEY, "1");

        const timer = setTimeout(() => {
            toast("デスクトップ通知を有効にしますか？", {
                description: "資格の期限切れアラートをブラウザ通知でお知らせします",
                action: {
                    label: "有効にする",
                    onClick: () => {
                        void Notification.requestPermission().then((permission) => {
                            if (permission === "granted") {
                                toast.success("通知を有効にしました");
                            }
                        });
                    },
                },
                duration: 15000,
            });
        }, 8000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isAdminOrHr || hasRun.current) return;
        hasRun.current = true;

        const today = getTodayInTokyo();
        if (localStorage.getItem(ALERT_KEY) === today) return;

        const in14Days = new Date();
        in14Days.setDate(in14Days.getDate() + 14);
        const in14DaysStr = in14Days.toISOString().split("T")[0];

        const check = async () => {
            try {
                const [{ count: expiredCount }, { count: urgentCount }] = await Promise.all([
                    supabase
                        .from("employee_qualifications")
                        .select("id", { count: "exact", head: true })
                        .not("expiry_date", "is", null)
                        .lt("expiry_date", today),
                    supabase
                        .from("employee_qualifications")
                        .select("id", { count: "exact", head: true })
                        .not("expiry_date", "is", null)
                        .gte("expiry_date", today)
                        .lte("expiry_date", in14DaysStr),
                ]);

                if ((expiredCount ?? 0) > 0) {
                    toast.warning(`${expiredCount}件の資格が期限切れです`, {
                        description: "資格一覧から対応状況を確認してください",
                        action: {
                            label: "確認する",
                            onClick: () => router.push("/qualifications?level=danger"),
                        },
                        duration: 12000,
                    });
                }

                if ((urgentCount ?? 0) > 0) {
                    toast.warning(`${urgentCount}件の資格が14日以内に期限切れになります`, {
                        description: "早めの更新手続きをご確認ください",
                        action: {
                            label: "確認する",
                            onClick: () => router.push("/qualifications?level=urgent"),
                        },
                        duration: 10000,
                    });
                }

                if (Notification.permission === "granted") {
                    const parts: string[] = [];
                    if ((expiredCount ?? 0) > 0) parts.push(`期限切れ ${expiredCount}件`);
                    if ((urgentCount ?? 0) > 0) parts.push(`14日以内 ${urgentCount}件`);
                    if (parts.length > 0) {
                        new Notification("信越報知 - 資格期限アラート", {
                            body: parts.join(" / "),
                            icon: "/favicon.ico",
                        });
                    }
                }

                localStorage.setItem(ALERT_KEY, today);
            } catch {
                // Non-critical — silently fail
            }
        };

        const timer = setTimeout(() => { void check(); }, 4000);
        return () => clearTimeout(timer);
    }, [isAdminOrHr, router]);

    return null;
}
