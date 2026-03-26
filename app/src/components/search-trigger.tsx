"use client";

import { Search, Command } from "lucide-react";

export function SearchTrigger() {
    const handleClick = () => {
        // Dispatch Cmd+K to open command palette
        document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "k", metaKey: true })
        );
    };

    return (
        <button
            onClick={handleClick}
            className="relative w-full group flex items-center"
        >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <div className="pl-10 h-10 bg-card border-none shadow-sm rounded-xl w-full max-w-md flex items-center text-sm text-muted-foreground cursor-pointer hover:bg-accent transition-colors">
                社員名・資格名で検索...
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 text-[10px] font-medium text-muted-foreground/50 border border-border/50 rounded px-1.5 bg-background/50">
                <Command className="w-2.5 h-2.5" />
                <span>K</span>
            </div>
        </button>
    );
}
