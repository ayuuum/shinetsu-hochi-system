"use client";

import { ReactNode } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function RecordActionsMenu({
    label,
    children,
}: {
    label: string;
    children: ReactNode;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={(
                    <Button
                        type="button"
                        variant="ghost"
                        className="h-11 w-11 rounded-full border border-border/60 bg-background/90 p-0 shadow-sm hover:bg-muted"
                        aria-label={`${label}の操作を開く`}
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                )}
            />
            <DropdownMenuContent align="end" className="w-40">
                {children}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
