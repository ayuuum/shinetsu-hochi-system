import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

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
                <div className="flex min-h-screen bg-background text-foreground">
                    {/* シンプルなナビゲーション（後でSidebarコンポーネントに置き換え可能） */}
                    <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
                        <div className="p-6 border-b border-border">
                            <h1 className="text-xl font-bold text-primary">信越報知</h1>
                            <p className="text-xs text-muted-foreground mt-1">Management System</p>
                        </div>
                        <nav className="flex-1 p-4 space-y-2">
                            <a href="#" className="block px-4 py-2 rounded-md bg-primary/10 text-primary font-bold">ダッシュボード</a>
                            <a href="#" className="block px-4 py-2 rounded-md hover:bg-muted transition-colors">社員一覧</a>
                            <a href="#" className="block px-4 py-2 rounded-md hover:bg-muted transition-colors">資格・講習管理</a>
                            <a href="#" className="block px-4 py-2 rounded-md hover:bg-muted transition-colors">車両・備品</a>
                        </nav>
                        <div className="p-4 border-t border-border">
                            <div className="flex items-center gap-3 px-2 py-1">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">I</div>
                                <div className="text-sm">
                                    <p className="font-bold">飯沼 様</p>
                                    <p className="text-xs text-muted-foreground italic">Admin</p>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <main className="flex-1 flex flex-col">
                        <header className="h-16 border-b border-border flex items-center justify-between px-8 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
                            <h2 className="text-sm font-bold opacity-70 italic">株式会社信越報知 システム</h2>
                            <div className="flex items-center gap-4">
                                <span className="text-xs bg-destructive text-white px-2 py-0.5 rounded-full animate-pulse">緊急 1件</span>
                                <button className="text-sm border border-primary text-primary px-4 py-1.5 rounded-md hover:bg-primary hover:text-white transition-all">
                                    ログアウト
                                </button>
                            </div>
                        </header>
                        <div className="flex-1 p-8">
                            {children}
                        </div>
                    </main>
                </div>
            </body>
        </html>
    );
}
