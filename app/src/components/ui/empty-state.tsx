"use client";

import { type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateAction {
    label: string;
    onClick: () => void;
    variant?: "default" | "outline" | "ghost";
}

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: EmptyStateAction;
    secondaryAction?: EmptyStateAction;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    secondaryAction,
    className = "",
}: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center gap-3 py-12 text-center ${className}`}>
            {Icon && (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                </div>
            )}
            <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                {description && (
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
                )}
            </div>
            {(action || secondaryAction) && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                    {action && (
                        <Button size="sm" variant={action.variant ?? "default"} onClick={action.onClick}>
                            {action.label}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button size="sm" variant={secondaryAction.variant ?? "outline"} onClick={secondaryAction.onClick}>
                            {secondaryAction.label}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
