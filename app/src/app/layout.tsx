import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Search, Bell, Command } from "lucide-react";
import { Input } from "@/components/ui/input";

const noto = Noto_Sans_JP({ subsets: ["latin"], weight: ["400", "700"] });

export const metadata: Metadata = {
    title: "信越報知 社員・資格管理システム",
    description: "消防・電気設備のプロフェッショナル管理ツール",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja">
            <body className={noto.className}>
                <SidebarProvider>
                    <AppSidebar />
                    <main className="flex-1 flex flex-col min-w-0">
                        <header className="h-16 flex items-center justify-between px-6 bg-background/80 backdrop-blur-md sticky top-0 z-20 border-b border-border/50">
                            <div className="flex items-center gap-4 flex-1 max-w-xl">
                                <SidebarTrigger className="-ml-1" />
                                <div className="relative w-full group">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                    <Input
                                        placeholder="「消防設備士 期限」などで検索..."
                                        className="pl-10 h-10 bg-card border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary transition-all rounded-xl w-full max-w-md"
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-1 text-[10px] font-medium text-muted-foreground/50 border border-border/50 rounded px-1.5 bg-background/50">
                                        <Command className="w-2.5 h-2.5" />
                                        <span>K</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
                                    <Bell className="w-5 h-5 text-muted-foreground" />
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-[10px] font-bold text-white flex items-center justify-center rounded-full ring-2 ring-background animate-in zoom-in">1</span>
                                </div>
                                <button className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors px-3 py-1.5 rounded-lg border border-transparent">
                                    ログアウト
                                </button>
                            </div>
                        </header>
                        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
                            <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
                                {children}
                            </div>
                        </div>
                    </main>
                </SidebarProvider>
            </body>
        </html>
    );
}
