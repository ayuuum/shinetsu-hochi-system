"use client";

import {
    LayoutDashboard,
    Users,
    ScrollText,
    Truck,
    Settings,
    Wine,
    ClipboardCheck,
    Upload,
    LogOut,
} from "lucide-react";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarRail,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

const menuItems = [
    { title: "ダッシュボード", icon: LayoutDashboard, url: "/" },
    { title: "社員一覧", icon: Users, url: "/employees" },
    { title: "資格・講習管理", icon: ScrollText, url: "/qualifications" },
    { title: "車両・備品", icon: Truck, url: "/vehicles" },
    { title: "点検スケジュール", icon: ClipboardCheck, url: "/inspections" },
    { title: "アルコールチェック", icon: Wine, url: "/alcohol-checks" },
    { title: "データインポート", icon: Upload, url: "/import" },
];

export function AppSidebar() {
    const pathname = usePathname();
    const { user, role, signOut } = useAuth();

    const displayName = user?.email?.split("@")[0] || "ユーザー";
    const roleLabel = role === "admin" ? "管理者" : role === "hr" ? "人事" : role === "technician" ? "技術者" : "";

    return (
        <Sidebar collapsible="icon" className="border-r border-border bg-sidebar">
            <SidebarHeader className="h-16 flex items-center justify-center border-b border-border/50 p-2">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" className="pointer-events-none">
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                <span className="font-bold text-xs">信</span>
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight ml-1">
                                <span className="truncate font-bold text-lg tracking-wider">信越報知</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="py-2">
                <SidebarMenu>
                    {menuItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                render={<Link href={item.url} />}
                                isActive={pathname === item.url}
                                tooltip={item.title}
                                className="transition-all duration-200"
                            >
                                <item.icon className="w-4 h-4" />
                                <span>{item.title}</span>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-border/50">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="ログアウト" onClick={signOut}>
                            <LogOut className="w-4 h-4" />
                            <span>ログアウト</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <div className="mt-4 flex items-center gap-3 px-2 group-data-[collapsible=icon]:hidden">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-xs overflow-hidden">
                        <p className="font-bold truncate">{displayName}</p>
                        <p className="text-muted-foreground italic">{roleLabel}</p>
                    </div>
                </div>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
