"use client";

import { Search, Command } from "lucide-react";
import { cn } from "@/lib/utils";

export const OPEN_COMMAND_SEARCH_EVENT = "app:open-command-search";

export function SearchTrigger({ className }: { className?: string }) {
    const handleClick = () => {
        document.dispatchEvent(new CustomEvent(OPEN_COMMAND_SEARCH_EVENT));
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            aria-label="検索を開く"
            className={cn(
                "group relative flex min-h-11 w-full items-center justify-between overflow-hidden rounded-[12px] border border-border bg-card px-4 py-2.5 text-left shadow-sm [touch-action:manipulation] transition-[border-color,background-color,box-shadow] duration-200 hover:border-primary/20 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                className
            )}
        >
            <div className="flex min-w-0 items-center gap-2">
                <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
                <span className="truncate text-[15px] text-muted-foreground transition-colors group-hover:text-foreground">
                    社員・資格・工事・車両・画面を検索…
                </span>
            </div>
            <div className="ml-3 hidden shrink-0 items-center gap-1 rounded bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:flex border border-border/50">
                <Command aria-hidden="true" className="h-3 w-3" />
                <span>K</span>
            </div>
        </button>
    );
}
