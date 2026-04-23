import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { LazyCommandSearch } from "@/components/lazy-command-search";
import { DashboardHeader } from "@/components/dashboard-header";
import { BottomNav } from "@/components/shared/bottom-nav";
import { AuthProvider } from "@/hooks/use-auth";
import { getFastAuthSnapshot } from "@/lib/auth-server";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const auth = await getFastAuthSnapshot();

    // `src/proxy.ts`（Next.js 16）で未認証は /login へ — レイアウトではセッションを供給するのみ
    return (
        <AuthProvider
            initialUser={auth.user}
            initialRole={auth.role}
            initialLinkedEmployeeId={auth.linkedEmployeeId}
        >
            <SidebarProvider>
                <AppSidebar />
                <main className="flex flex-1 flex-col min-w-0 overflow-x-hidden bg-muted/40 print:bg-white pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
                    <DashboardHeader />
                    <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4 md:px-8 md:pb-12 md:pt-6 print:p-0 print:overflow-visible">
                        <div className="max-w-7xl mx-auto print:max-w-none">
                            {children}
                        </div>
                    </div>
                </main>
                <LazyCommandSearch />
                <BottomNav />
            </SidebarProvider>
        </AuthProvider>
    );
}
