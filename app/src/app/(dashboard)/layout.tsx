"use client";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Bell } from "lucide-react";
import { SearchTrigger } from "@/components/search-trigger";
import { CommandSearch } from "@/components/command-search";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                <p className="text-sm text-muted-foreground">読み込み中...</p>
            </div>
        );
    }

    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="flex-1 flex flex-col min-w-0">
                <header className="h-14 md:h-16 flex items-center justify-between px-3 md:px-6 bg-transparent sticky top-0 z-20">
                    <div className="flex items-center gap-2 md:gap-4 flex-1 max-w-xl">
                        <SidebarTrigger className="-ml-1" />
                        <SearchTrigger />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
                            <Bell className="w-5 h-5 text-muted-foreground" />
                        </div>
                    </div>
                </header>
                <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {children}
                    </div>
                </div>
            </main>
            <CommandSearch />
        </SidebarProvider>
    );
}
