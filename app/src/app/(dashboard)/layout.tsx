import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { LazyCommandSearch } from "@/components/lazy-command-search";
import { DashboardHeader } from "@/components/dashboard-header";
import { AuthProvider } from "@/hooks/use-auth";
import { getAuthSnapshot } from "@/lib/auth-server";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const auth = await getAuthSnapshot();

    // middleware already handles auth redirect — no need to block rendering here
    return (
        <AuthProvider initialUser={auth.user} initialRole={auth.role}>
            <SidebarProvider>
                <AppSidebar />
                <main className="flex flex-1 flex-col min-w-0 overflow-x-hidden bg-[radial-gradient(circle_at_top,rgba(49,78,110,0.07),transparent_30%),linear-gradient(180deg,rgba(250,251,253,0.97),rgba(243,246,249,1))]">
                    <DashboardHeader />
                    <div className="flex-1 overflow-y-auto px-4 pb-8 pt-4 md:px-8 md:pb-12 md:pt-6">
                        <div className="max-w-7xl mx-auto">
                            {children}
                        </div>
                    </div>
                </main>
                <LazyCommandSearch />
            </SidebarProvider>
        </AuthProvider>
    );
}
