"use client";

import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { alertStyles } from "@/lib/alert-utils";
import { cn } from "@/lib/utils";

type StatusBannerVariant = "success" | "error" | "info";

const variantConfig = {
    success: {
        icon: CheckCircle2,
        className: alertStyles.ok.banner,
    },
    error: {
        icon: AlertCircle,
        className: alertStyles.danger.banner,
    },
    info: {
        icon: Info,
        className: alertStyles.info.banner,
    },
} as const;

type StatusBannerProps = {
    variant: StatusBannerVariant;
    title: ReactNode;
    description?: ReactNode;
    className?: string;
};

export function StatusBanner({ variant, title, description, className }: StatusBannerProps) {
    const config = variantConfig[variant];
    const Icon = config.icon;

    return (
        <div
            role={variant === "error" ? "alert" : "status"}
            aria-live={variant === "error" ? "polite" : undefined}
            className={cn("flex items-start gap-2.5 rounded-lg p-3 text-sm", config.className, className)}
        >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <div className="min-w-0 space-y-1">
                <p className="font-semibold leading-snug">{title}</p>
                {description ? (
                    <p className="text-[13px] leading-relaxed opacity-90">{description}</p>
                ) : null}
            </div>
        </div>
    );
}
