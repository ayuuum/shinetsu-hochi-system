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
        color: "text-destructive",
        strong: "text-destructive",
        icon: "bg-destructive/10 text-destructive",
        bg: "border border-border bg-card shadow-sm",
        subtle: "border border-border bg-card shadow-sm",
        badge: "border border-destructive/30 bg-transparent text-destructive font-medium",
        label: "期限切れ",
    },
    urgent: {
        color: "text-chart-5",
        strong: "text-chart-5",
        icon: "bg-chart-5/10 text-chart-5",
        bg: "border border-border bg-card shadow-sm",
        subtle: "border border-border bg-card shadow-sm",
        badge: "border border-chart-5/30 bg-transparent text-chart-5 font-medium",
        label: "14日以内",
    },
    warning: {
        color: "text-chart-3",
        strong: "text-chart-3",
        icon: "bg-chart-3/10 text-chart-3",
        bg: "border border-border bg-card shadow-sm",
        subtle: "border border-border bg-card shadow-sm",
        badge: "border border-chart-3/30 bg-transparent text-chart-3 font-medium",
        label: "30日以内",
    },
    info: {
        color: "text-muted-foreground",
        strong: "text-foreground",
        icon: "bg-secondary text-foreground",
        bg: "border border-border bg-card shadow-sm",
        subtle: "border border-border bg-card shadow-sm",
        badge: "border border-border bg-transparent text-muted-foreground font-medium",
        label: "60日以内",
    },
    ok: {
        color: "text-chart-2",
        strong: "text-chart-2",
        icon: "bg-chart-2/10 text-chart-2",
        bg: "border border-border bg-card shadow-sm",
        subtle: "border border-border bg-card shadow-sm",
        badge: "border border-chart-2/30 bg-transparent text-chart-2 font-medium",
        label: "正常",
    },
} as const;
