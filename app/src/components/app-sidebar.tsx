"use client";

import {
    LogOut,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarRail,
    SidebarSeparator,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useIntentPrefetch } from "@/hooks/use-intent-prefetch";
import { getGroupedAppNavigation, isAppNavActive } from "@/lib/app-navigation";
import { cn } from "@/lib/utils";

export function AppSidebar() {
    const pathname = usePathname();
    const { user, role, signOut, isAdminOrHr, linkedEmployeeId } = useAuth();
    const { getIntentPrefetchProps } = useIntentPrefetch();

    const displayName = user?.email?.split("@")[0] || "ユーザー";
    const roleLabel = role === "admin" ? "管理者" : role === "hr" ? "人事" : role === "technician" ? "技術者" : "";
    const navigationSections = getGroupedAppNavigation(isAdminOrHr, role, linkedEmployeeId);

    return (
        <Sidebar collapsible="icon" className="border-r border-sidebar-border/60 bg-sidebar print:hidden">
            <SidebarHeader className="px-4 py-5">
                <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
                    <BrandLogo
                        priority
                        className="w-[170px] max-w-full group-data-[collapsible=icon]:hidden"
                    />
                    <BrandLogo
                        variant="mark"
                        className="hidden h-9 w-9 group-data-[collapsible=icon]:block"
                    />
                </div>
            </SidebarHeader>
            <SidebarContent className="py-4">
                {navigationSections.map((section, index) => (
                    <div key={section.id} className="px-3">
                        {index > 0 && <SidebarSeparator className="my-4 bg-sidebar-border/50" />}
                        <SidebarGroup className="p-0">
                            <SidebarGroupLabel className="px-2.5 mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/45">
                                {section.title}
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu className="gap-1">
                                    {section.items.map((item) => {
                                        const isActive = isAppNavActive(pathname, item.url, isAdminOrHr, role, linkedEmployeeId);
                                        return (
                                            <SidebarMenuItem key={item.title}>
                                                <SidebarMenuButton
                                                    render={<Link href={item.url} {...getIntentPrefetchProps(item.url)} />}
                                                    isActive={isActive}
                                                    tooltip={item.title}
                                                    className={cn(
                                                        "relative rounded-lg px-2.5 py-2 transition-all duration-200",
                                                        isActive
                                                            ? "bg-primary/10 text-primary font-medium before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[3px] before:rounded-full before:bg-primary"
                                                            : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                                    )}
                                                >
                                                    <item.icon className={cn("w-[18px] h-[18px]", isActive && "text-primary")} />
                                                    <span>{item.title}</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </div>
                ))}
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-sidebar-border/40">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton 
                            tooltip="ログアウト" 
                            onClick={signOut}
                            className="rounded-lg px-2.5 py-2 text-sidebar-foreground/75 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                        >
                            <LogOut className="w-[18px] h-[18px]" />
                            <span>ログアウト</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <div className="mt-4 px-2.5 group-data-[collapsible=icon]:hidden">
                    <p className="truncate text-sm font-medium text-sidebar-foreground">{displayName}</p>
                    <p className="mt-1 truncate text-xs text-sidebar-foreground/50">{roleLabel}</p>
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
