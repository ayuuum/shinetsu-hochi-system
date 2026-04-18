"use client";

import { ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function MobileFiltersSheet({
    title,
    description,
    summary,
    activeCount = 0,
    onClearAll,
    footer,
    children,
    className,
    open,
    onOpenChange,
}: {
    title: string;
    description?: string;
    summary?: string;
    activeCount?: number;
    onClearAll?: () => void;
    footer?: ReactNode;
    children: ReactNode;
    className?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetTrigger
                render={
                    <Button
                        type="button"
                        variant="outline"
                        className={cn(
                            "h-11 w-full justify-between rounded-[16px] border-border/60 bg-background px-4 text-sm md:hidden",
                            className
                        )}
                    />
                }
            >
                <span className="inline-flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span className="flex flex-col items-start leading-none">
                        <span>絞り込み</span>
                        <span className="mt-1 text-[11px] font-normal text-muted-foreground">
                            {summary || "条件を選択"}
                        </span>
                    </span>
                </span>
                {activeCount > 0 ? (
                    <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[11px]">
                        {activeCount}件適用中
                    </Badge>
                ) : (
                    <span className="text-xs text-muted-foreground">未設定</span>
                )}
            </SheetTrigger>
            <SheetContent
                side="bottom"
                className="max-h-[85vh] rounded-t-[28px] border-x-0 border-b-0 p-0"
            >
                <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-border/70" />
                <SheetHeader className="space-y-1 px-4 pb-3 pt-4">
                    <SheetTitle>{title}</SheetTitle>
                    {description ? <SheetDescription>{description}</SheetDescription> : null}
                </SheetHeader>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-5">
                    {children}
                </div>
                {(footer || (onClearAll && activeCount > 0)) ? (
                    <div className="border-t bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/85">
                        <div className="flex flex-col gap-3">
                            {onClearAll && activeCount > 0 ? (
                                <Button type="button" variant="ghost" className="w-full" onClick={onClearAll}>
                                    条件をクリア
                                </Button>
                            ) : null}
                            {footer}
                        </div>
                    </div>
                ) : null}
            </SheetContent>
        </Sheet>
    );
}
