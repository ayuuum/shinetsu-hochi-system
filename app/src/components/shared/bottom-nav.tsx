"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, BriefcaseBusiness, Beer, Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const ADMIN_NAV_ITEMS = [
    {
        title: "ホーム",
        url: "/",
        icon: LayoutDashboard,
    },
    {
        title: "社員",
        url: "/employees",
        icon: Users,
    },
    {
        title: "施工",
        url: "/projects",
        icon: BriefcaseBusiness,
    },
];

const TECHNICIAN_NAV_ITEMS = [
    {
        title: "ホーム",
        url: "/",
        icon: LayoutDashboard,
    },
    {
        title: "アルコール",
        url: "/alcohol-checks",
        icon: Beer,
    },
];

export function BottomNav() {
    const pathname = usePathname();
    const { toggleSidebar } = useSidebar();
    const { role } = useAuth();

    const navItems = role === "technician" ? TECHNICIAN_NAV_ITEMS : ADMIN_NAV_ITEMS;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/98 backdrop-blur-lg border-t border-border/20 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_3px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-around h-[60px] px-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.url}
                            href={item.url}
                            prefetch={false}
                            className={cn(
                                "relative flex flex-col items-center justify-center w-full h-full py-1.5 transition-all duration-200",
                                isActive ? "text-primary" : "text-muted-foreground/70 active:text-foreground"
                            )}
                        >
                            <div className={cn(
                                "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
                                isActive && "bg-primary/10 scale-105"
                            )}>
                                <Icon className={cn("w-5 h-5 transition-transform", isActive && "scale-110")} strokeWidth={isActive ? 2.5 : 1.75} />
                            </div>
                            <span className={cn(
                                "text-[10px] leading-none mt-0.5 transition-all",
                                isActive ? "font-semibold" : "font-medium"
                            )}>{item.title}</span>
                            {isActive && (
                                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                            )}
                        </Link>
                    );
                })}

                {/* More / Menu Toggle */}
                <button
                    onClick={toggleSidebar}
                    className="flex flex-col items-center justify-center w-full h-full py-1.5 transition-all duration-200 text-muted-foreground/70 active:text-foreground"
                >
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl transition-all">
                        <Menu className="w-5 h-5" strokeWidth={1.75} />
                    </div>
                    <span className="text-[10px] font-medium leading-none mt-0.5">メニュー</span>
                </button>
            </div>
        </nav>
    );
}
