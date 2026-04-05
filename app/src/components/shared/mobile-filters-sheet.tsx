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
    activeCount = 0,
    onClearAll,
    children,
    className,
}: {
    title: string;
    description?: string;
    activeCount?: number;
    onClearAll?: () => void;
    children: ReactNode;
    className?: string;
}) {
    return (
        <Sheet>
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
                    絞り込み
                </span>
                {activeCount > 0 ? (
                    <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-[11px]">
                        {activeCount}件適用中
                    </Badge>
                ) : (
                    <span className="text-xs text-muted-foreground">条件なし</span>
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
                <div className="space-y-4 overflow-y-auto px-4 pb-5">
                    {children}
                    {onClearAll && activeCount > 0 ? (
                        <Button type="button" variant="ghost" className="w-full" onClick={onClearAll}>
                            条件をクリア
                        </Button>
                    ) : null}
                </div>
            </SheetContent>
        </Sheet>
    );
}
