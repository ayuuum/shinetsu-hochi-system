"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ActiveFilterItem = {
    key: string;
    label: string;
    onRemove: () => void;
};

export function ActiveFilters({
    items,
    onClearAll,
    className,
}: {
    items: ActiveFilterItem[];
    onClearAll?: () => void;
    className?: string;
}) {
    if (items.length === 0) {
        return null;
    }

    return (
        <div className={cn("flex flex-wrap items-center gap-2.5 rounded-[20px] border border-border/60 bg-muted/25 p-3.5", className)}>
            <span className="text-sm font-medium text-muted-foreground">適用中の条件</span>
            {items.map((item) => (
                <button
                    key={item.key}
                    type="button"
                    onClick={item.onRemove}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border/70 bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                    <span>{item.label}</span>
                    <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
            ))}
            {onClearAll && (
                <Button type="button" variant="ghost" size="sm" className="ml-auto" onClick={onClearAll}>
                    条件をクリア
                </Button>
            )}
        </div>
    );
}
