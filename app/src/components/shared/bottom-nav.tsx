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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/40 pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-around h-16 px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.url}
                            href={item.url}
                            prefetch={false}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-full transition-all",
                                isActive && "bg-primary/10"
                            )}>
                                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className="text-[10px] font-medium leading-none">{item.title}</span>
                        </Link>
                    );
                })}

                {/* More / Menu Toggle */}
                <button
                    onClick={toggleSidebar}
                    className="flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors text-muted-foreground hover:text-foreground"
                >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full transition-all">
                        <Menu className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <span className="text-[10px] font-medium leading-none">メニュー</span>
                </button>
            </div>
        </nav>
    );
}
