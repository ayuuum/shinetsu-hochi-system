"use client";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";
import { SearchTrigger } from "@/components/search-trigger";
import { findAppNavItem, getAppNavSectionMeta } from "@/lib/app-navigation";
import { useAuth } from "@/hooks/use-auth";
import { usePathname } from "next/navigation";
import { PanelLeftIcon } from "lucide-react";

const headerDateFormatter = new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
});

export function DashboardHeader() {
    const pathname = usePathname();
    const { state, toggleSidebar, isMobile } = useSidebar();
    const { role, linkedEmployeeId } = useAuth();
    const activeItem = findAppNavItem(pathname, { role, linkedEmployeeId });
    const section = getAppNavSectionMeta(activeItem.section);
    const sidebarActionLabel = isMobile ? "メニュー" : state === "expanded" ? "サイドバーを閉じる" : "サイドバーを開く";

    return (
        <header className="sticky top-0 z-20 border-b border-border/40 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 print:hidden">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-3 md:px-6">
                <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        aria-label={sidebarActionLabel}
                        onClick={toggleSidebar}
                        className="hidden shrink-0 -ml-1 items-center gap-1.5 px-2 text-foreground/70 hover:bg-muted hover:text-foreground md:flex"
                    >
                        <PanelLeftIcon className="h-4 w-4" />
                        <span className="hidden text-xs font-medium lg:inline">
                            {state === "expanded" ? "閉じる" : "開く"}
                        </span>
                    </Button>
                    
                    <div className="hidden min-w-0 items-center gap-2 text-sm md:flex">
                        <span className="min-w-0 truncate text-muted-foreground/70 text-xs tracking-wide">
                            {section.title}
                        </span>
                        <span aria-hidden="true" className="text-border shrink-0">/</span>
                        <span className="min-w-0 truncate font-medium text-foreground">
                            {activeItem.title}
                        </span>
                        <span aria-hidden="true" className="text-border/60 shrink-0 hidden lg:inline">•</span>
                        <span className="hidden whitespace-nowrap text-muted-foreground/70 text-xs lg:inline">
                            {headerDateFormatter.format(new Date())}
                        </span>
                    </div>
                </div>

                <div className="w-[120px] shrink-0 sm:w-[160px] md:w-[200px] lg:w-[240px]">
                    <SearchTrigger className="w-full" />
                </div>
            </div>
        </header>
    );
}
