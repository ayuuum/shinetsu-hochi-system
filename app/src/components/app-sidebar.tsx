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

export function AppSidebar() {
    const pathname = usePathname();
    const { user, role, signOut, isAdminOrHr, linkedEmployeeId } = useAuth();
    const { getIntentPrefetchProps } = useIntentPrefetch();

    const displayName = user?.email?.split("@")[0] || "ユーザー";
    const roleLabel = role === "admin" ? "管理者" : role === "hr" ? "人事" : role === "technician" ? "技術者" : "";
    const navigationSections = getGroupedAppNavigation(isAdminOrHr, role, linkedEmployeeId);

    return (
        <Sidebar collapsible="icon" className="border-r border-border bg-sidebar print:hidden">
            <SidebarHeader className="px-4 py-4">
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
            <SidebarContent className="py-3">
                {navigationSections.map((section, index) => (
                    <div key={section.id} className="px-3">
                        {index > 0 && <SidebarSeparator className="my-3" />}
                        <SidebarGroup className="p-0">
                            <SidebarGroupLabel className="px-2 mb-1 text-xs font-medium tracking-[0.08em] text-sidebar-foreground/52">
                                {section.title}
                            </SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {section.items.map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                render={<Link href={item.url} {...getIntentPrefetchProps(item.url)} />}
                                                isActive={isAppNavActive(pathname, item.url, isAdminOrHr, role, linkedEmployeeId)}
                                                tooltip={item.title}
                                                className="transition-[background-color,color,box-shadow] duration-200"
                                            >
                                                <item.icon className="w-4 h-4" />
                                                <span>{item.title}</span>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </div>
                ))}
            </SidebarContent>
            <SidebarFooter className="p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="ログアウト" onClick={signOut}>
                            <LogOut className="w-4 h-4" />
                            <span>ログアウト</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <div className="mt-3 px-2 text-sm group-data-[collapsible=icon]:hidden">
                    <p className="truncate font-medium text-foreground/88">{displayName}</p>
                    <p className="mt-0.5 truncate text-muted-foreground">{roleLabel}</p>
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
