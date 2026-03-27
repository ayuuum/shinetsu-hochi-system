import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Bell } from "lucide-react";
import { SearchTrigger } from "@/components/search-trigger";
import { LazyCommandSearch } from "@/components/lazy-command-search";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // middleware already handles auth redirect — no need to block rendering here
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
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
            <LazyCommandSearch />
        </SidebarProvider>
    );
}
