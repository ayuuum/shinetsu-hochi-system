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
        <div className={cn("flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between", className)}>
            <div className={cn("min-w-0 flex-1", contentClassName)}>
                <TitleTag className="text-2xl font-bold leading-tight tracking-tight text-balance md:text-3xl">{title}</TitleTag>
                {description ? (
                    <p className="mt-2.5 max-w-prose text-sm text-muted-foreground leading-relaxed md:text-base">{description}</p>
                ) : null}
            </div>
            {actions ? (
                <div className={cn("flex shrink-0 flex-col gap-2.5 sm:flex-row sm:items-center", actionsClassName)}>
                    {actions}
                </div>
            ) : null}
        </div>
    );
}
