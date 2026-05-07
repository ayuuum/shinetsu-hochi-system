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
    danger: {
        color: "text-blue-700",
        strong: "text-blue-700",
        icon: "bg-blue-700/10 text-blue-700",
        bg: "border border-border bg-card shadow-sm",
        subtle: "border border-border bg-card shadow-sm",
        badge: "border border-blue-700/50 bg-blue-700/10 text-blue-700 font-semibold",
        label: "期限切れ",
    },
    urgent: {
        color: "text-blue-600",
        strong: "text-blue-600",
        icon: "bg-blue-600/10 text-blue-600",
        bg: "border border-border bg-card shadow-sm",
        subtle: "border border-border bg-card shadow-sm",
        badge: "border border-blue-600/50 bg-blue-600/10 text-blue-600 font-semibold",
        label: "14日以内",
    },
    warning: {
        color: "text-blue-400",
        strong: "text-blue-400",
        icon: "bg-blue-400/10 text-blue-400",
        bg: "border border-border bg-card shadow-sm",
        subtle: "border border-border bg-card shadow-sm",
        badge: "border border-blue-400/50 bg-blue-400/10 text-blue-400 font-semibold",
        label: "30日以内",
    },
    info: {
        color: "text-muted-foreground",
        strong: "text-foreground",
        icon: "bg-secondary text-foreground",
        bg: "border border-border bg-card shadow-sm",
        subtle: "border border-border bg-card shadow-sm",
        badge: "border border-border bg-muted/50 text-muted-foreground font-medium",
        label: "60日以内",
    },
    ok: {
        color: "text-chart-2",
        strong: "text-chart-2",
        icon: "bg-chart-2/10 text-chart-2",
        bg: "border border-border bg-card shadow-sm",
        subtle: "border border-border bg-card shadow-sm",
        badge: "border border-chart-2/50 bg-chart-2/10 text-chart-2 font-semibold",
        label: "正常",
    },
} as const;
