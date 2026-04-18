"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MobileList({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn("space-y-3 md:hidden", className)}>{children}</div>;
}

export function MobileListCard({
    href,
    title,
    subtitle,
    eyebrow,
    children,
    footer,
    className,
}: {
    href?: string;
    title: ReactNode;
    subtitle?: ReactNode;
    eyebrow?: ReactNode;
    children?: ReactNode;
    footer?: ReactNode;
    className?: string;
}) {
    const header = (
        <CardHeader className="pb-3">
            {eyebrow ? <div className="text-xs font-medium tracking-[0.06em] text-muted-foreground uppercase">{eyebrow}</div> : null}
            <CardTitle className="text-base leading-snug">{title}</CardTitle>
            {subtitle ? <p className="text-[15px] text-muted-foreground">{subtitle}</p> : null}
        </CardHeader>
    );

    return (
        <Card size="sm" className={cn("overflow-hidden rounded-[22px] border-border/70 bg-card/98 shadow-[0_1px_2px_rgba(38,42,46,0.035),0_12px_28px_rgba(38,42,46,0.05)]", className)}>
            {href ? (
                <Link href={href} className="block rounded-[22px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
                    {header}
                </Link>
            ) : (
                header
            )}
            {children ? <CardContent className="space-y-3 pt-0">{children}</CardContent> : null}
            {footer ? <CardFooter className="flex-wrap gap-2 border-t border-border/50 bg-muted/20">{footer}</CardFooter> : null}
        </Card>
    );
}

export function MobileDataGrid({ children }: { children: ReactNode }) {
    return <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>;
}

export function MobileDataItem({
    label,
    value,
    valueClassName,
    className,
}: {
    label: string;
    value: ReactNode;
    valueClassName?: string;
    className?: string;
}) {
    return (
        <div className={cn("space-y-1", className)}>
            <p className="text-xs font-medium tracking-[0.04em] text-muted-foreground uppercase">{label}</p>
            <div className={cn("text-sm font-medium leading-snug text-foreground", valueClassName)}>{value}</div>
        </div>
    );
}
