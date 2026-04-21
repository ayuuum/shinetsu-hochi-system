"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    titleAs?: "h1" | "h2";
    className?: string;
    contentClassName?: string;
    actionsClassName?: string;
};

// Standard page header layout for long Japanese titles/descriptions.
export function PageHeader({
    title,
    description,
    actions,
    titleAs = "h1",
    className,
    contentClassName,
    actionsClassName,
}: PageHeaderProps) {
    const TitleTag = titleAs;

    return (
        <div className={cn("flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", className)}>
            <div className={cn("min-w-0 flex-1", contentClassName)}>
                <TitleTag className="text-3xl font-bold leading-tight tracking-tight text-balance">{title}</TitleTag>
                {description ? (
                    <p className="mt-2 max-w-prose text-muted-foreground">{description}</p>
                ) : null}
            </div>
            {actions ? (
                <div className={cn("flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center", actionsClassName)}>
                    {actions}
                </div>
            ) : null}
        </div>
    );
}
