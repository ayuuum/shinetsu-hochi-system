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
                <div className="flex min-w-0 items-center gap-2 md:gap-4">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={sidebarActionLabel}
                        onClick={toggleSidebar}
                        className="hidden md:flex shrink-0 -ml-2 text-foreground/70 hover:text-foreground hover:bg-muted"
                    >
                        <PanelLeftIcon className="h-5 w-5" />
                    </Button>
                    
                    <div className="hidden sm:flex items-center gap-2 text-sm font-medium tracking-wide min-w-0">
                        <span className="text-muted-foreground whitespace-nowrap shrink-0">
                            {section.title}
                        </span>
                        <span aria-hidden="true" className="text-border/60 shrink-0">•</span>
                        <span className="text-muted-foreground/80 whitespace-nowrap shrink-0">
                            {headerDateFormatter.format(new Date())}
                        </span>
                    </div>
                </div>

                <div className="w-[160px] sm:w-[200px] md:w-[260px] shrink-0">
                    <SearchTrigger className="w-full" />
                </div>
            </div>
        </header>
    );
}
