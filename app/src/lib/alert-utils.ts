import { differenceInDays } from "date-fns";

export type AlertLevel = "danger" | "urgent" | "warning" | "info" | "ok";

/**
 * 期限日からアラートレベルを判定
 * - danger: 期限切れ (days < 0)
 * - urgent: 14日以内
 * - warning: 30日以内
 * - info: 60日以内
 * - ok: 60日超 or 期限なし
 */
export function getAlertLevel(expiryDate: string | null, now: Date = new Date()): AlertLevel {
    if (!expiryDate) return "ok";
    const days = differenceInDays(new Date(expiryDate), now);
    if (days < 0) return "danger";
    if (days <= 14) return "urgent";
    if (days <= 30) return "warning";
    if (days <= 60) return "info";
    return "ok";
}

export function getDaysRemaining(expiryDate: string, now: Date = new Date()): number {
    return differenceInDays(new Date(expiryDate), now);
}

export const alertStyles = {
    danger: { color: "text-red-600", bg: "bg-red-50 border-red-200", badge: "bg-red-100 text-red-700", label: "期限切れ" },
    urgent: { color: "text-orange-600", bg: "bg-orange-50 border-orange-200", badge: "bg-orange-100 text-orange-700", label: "14日以内" },
    warning: { color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", badge: "bg-yellow-100 text-yellow-700", label: "30日以内" },
    info: { color: "text-blue-600", bg: "bg-blue-50 border-blue-200", badge: "bg-blue-100 text-blue-700", label: "60日以内" },
    ok: { color: "text-green-600", bg: "bg-green-50 border-green-200", badge: "bg-green-100 text-green-700", label: "正常" },
} as const;
