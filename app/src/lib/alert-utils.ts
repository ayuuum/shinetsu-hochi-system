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

/** ホバー時のみ表示する副次操作（モバイルでは常時表示） */
export const hoverRevealActionsClassName =
    "opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100";

export const alertStyles = {
    danger: {
        color: "text-destructive",
        strong: "text-destructive",
        icon: "bg-destructive/10 text-destructive",
        bg: "border border-destructive/30 bg-destructive/5 shadow-sm",
        subtle: "border border-destructive/20 bg-destructive/5",
        badge: "border border-destructive/40 bg-destructive/10 text-destructive font-semibold",
        banner: "border border-destructive/25 bg-destructive/10 text-destructive",
        label: "期限切れ",
    },
    urgent: {
        color: "text-amber-700 dark:text-amber-400",
        strong: "text-amber-700 dark:text-amber-400",
        icon: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
        bg: "border border-amber-300/50 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20 shadow-sm",
        subtle: "border border-amber-200/60 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/15",
        badge: "border border-amber-400/50 bg-amber-100 text-amber-800 font-semibold dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
        banner: "border border-amber-300/40 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300",
        label: "14日以内",
    },
    warning: {
        color: "text-yellow-700 dark:text-yellow-400",
        strong: "text-yellow-700 dark:text-yellow-400",
        icon: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400",
        bg: "border border-yellow-300/50 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20 shadow-sm",
        subtle: "border border-yellow-200/60 bg-yellow-50/80 dark:border-yellow-900/50 dark:bg-yellow-950/15",
        badge: "border border-yellow-400/50 bg-yellow-100 text-yellow-800 font-semibold dark:border-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300",
        banner: "border border-yellow-300/40 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-300",
        label: "30日以内",
    },
    info: {
        color: "text-muted-foreground",
        strong: "text-foreground",
        icon: "bg-secondary text-foreground",
        bg: "border border-border bg-card shadow-sm",
        subtle: "border border-border bg-card shadow-sm",
        badge: "border border-border bg-muted/50 text-muted-foreground font-medium",
        banner: "border border-border bg-muted/40 text-foreground",
        label: "60日以内",
    },
    ok: {
        color: "text-chart-2",
        strong: "text-chart-2",
        icon: "bg-chart-2/10 text-chart-2",
        bg: "border border-border bg-card shadow-sm",
        subtle: "border border-border bg-card shadow-sm",
        badge: "border border-chart-2/50 bg-chart-2/10 text-chart-2 font-semibold",
        banner: "border border-chart-2/30 bg-chart-2/10 text-chart-2",
        label: "正常",
    },
} as const;
